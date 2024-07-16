import { getter } from "./utils";
type ValuePath = `$state.${string}` | `$event.${string}` | number | boolean;

type Guard =
  | true
  | false
  | {
      operands: ValuePath[];
      predicate: "=" | "<" | ">";
    };
type Action = {
  updateField: string;
  action?: "subtract" | "add" | "set";
  source: `$state.${string}` | `$event.${string}` | string | number | boolean;
};

type BaseTransition<Event extends { type: string }, State extends string> = {
  to: State;
  eventType: Event["type"];
  guard: Guard;
  actions: Action[];
};

class EFSM<
  State extends string,
  StateVariables extends Record<string, any>,
  Event extends { type: string },
  Transitions extends Record<State, BaseTransition<Event, State>[]>
> {
  private states: State[];
  private stateVariables: StateVariables;
  private currentState: State;
  private transitionSet: Transitions;
  private predicateFunctions: Record<
    string,
    (operands: ValuePath[]) => boolean
  >;

  constructor(startState: State, transitionSet: Transitions) {
    this.currentState = startState;
    this.transitionSet = transitionSet;

    this.predicateFunctions = {
      ">": (operands) => operands.length > 1 && operands[0] > operands[1],
      "<": (operands) => operands.length > 1 && operands[0] < operands[1],
      "=": (operands) =>
        operands.length > 1 &&
        operands.every((operand) => operand === operands[0]),
    };
  }

  processEvent(event: Event) {
    const currentState = this.getCurrentState();
    const transitionsForState = this.getTransitionsForStateAndEvent(
      currentState,
      event
    );

    if (!transitionsForState) {
      throw new Error(
        `No transition found for event "${event.type}" in state "${currentState}"`
      );
    }

    const transition = transitionsForState.find((transition) =>
      this.evaluateGuard(transition.guard, event)
    );

    if (!transition) {
      throw new Error(`No transition matched the guard`);
    }

    const nextState = transition.to;
    const action = transition.action;
  }

  resolvePath(path: ValuePath, event?: Event) {
    if (typeof path === "boolean" || typeof path === "number") {
      return path;
    }

    let actualPath = path.replace(/^(\$state|\$event)\./, "");
    let obj: Event | StateVariables = this.stateVariables;

    if (path.startsWith("$event.")) {
      if (!event) throw new Error("missing event for path: " + path);
      obj = event;
    }

    return getter(obj, actualPath);
  }

  getCurrentState() {
    return this.currentState;
  }

  evaluateGuard(guard: Guard, event: Event): boolean {
    if (typeof guard === "boolean") {
      return guard;
    }

    if (!(guard.predicate in this.predicateFunctions)) {
      throw new Error(`Missing predicate definition for "${guard.predicate}" `);
    }

    const resolvedOperands = guard.operands.map((operand) =>
      this.resolvePath(operand, event)
    );

    return this.predicateFunctions[guard.predicate](resolvedOperands);
  }

  getTransitionsForStateAndEvent(state: State, event: Event) {
    return this.transitionSet[state].filter(
      (transition) => transition.eventType === event.type
    );
  }
}
