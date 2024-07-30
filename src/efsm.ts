import { getter, setter } from "./utils";
type ValuePath = `$state.${string}` | `$event.${string}` | number | boolean;

type Guard =
  | true
  | false
  | {
      operands: ValuePath[];
      predicate: "=" | "<" | ">";
    };
type Action = {
  updateField: `$state.${string}`;
  action: "subtract" | "add" | "set";
  source: `$state.${string}` | `$event.${string}` | number | boolean;
};

type BaseTransition<Event extends { type: string }, State extends string> = {
  to: State;
  eventType: Event["type"];
  guard: Guard;
  actions?: Action[];
};

class EFSM<
  State extends string,
  StateVariables extends Record<string, any>,
  Event extends { type: string },
  Transitions extends Record<State, BaseTransition<Event, State>[]>
> {
  private stateVariables: StateVariables;
  private currentState: State;
  private transitionSet: Transitions;
  private predicateFunctions: Record<
    string,
    (operands: ValuePath[]) => boolean
  >;
  private updateFunctions: Record<
    string,
    (incoming: any, existing: any) => void
  >;
  private states: Set<State>;

  constructor(
    startState: State,
    transitionSet: Transitions,
    initialStateVariables = {} as StateVariables
  ) {
    this.currentState = startState;
    this.transitionSet = transitionSet;
    this.stateVariables = initialStateVariables;
    this.states = new Set(Object.keys(initialStateVariables) as State[]);

    this.predicateFunctions = {
      ">": (operands) => operands.length > 1 && operands[0] > operands[1],
      "<": (operands) => operands.length > 1 && operands[0] < operands[1],
      "=": (operands) =>
        operands.length > 1 &&
        operands.every((operand) => operand === operands[0]),
    };

    this.updateFunctions = {
      subtract: (incoming, existing) => existing - incoming,
      add: (incoming, existing) => existing + incoming,
      set: (incoming) => incoming,
    };
  }

  processEvent(event: Event) {
    const currentState = this.getCurrentState();
    const transitionsForState = this.getTransitionsForStateAndEvent(
      currentState,
      event
    );

    if (transitionsForState.length === 0) {
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
    const actions = transition.actions ?? [];

    this.currentState = nextState;

    for (const action of actions) {
      this.executeAction(action, event);
    }
  }

  executeAction(action: Action, event: Event) {
    if (typeof this.updateFunctions[action.action] !== "function") {
      throw new Error(
        `Unknown action ${action.action}. Only know ${Object.keys(
          this.updateFunctions
        ).join(", ")}`
      );
    }
    const incoming = this.resolvePath(action.source, event);
    const existing = this.resolvePath(action.updateField, event);

    const updateValue = this.updateFunctions[action.action](incoming, existing);

    setter(
      this.stateVariables,
      action.updateField.replace("$state.", ""),
      updateValue
    );
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

  toJSON() {
    return {
      state: this.currentState,
      stateVariables: this.stateVariables,
    };
  }

  fromJSON(data: { state: State; stateVariables: StateVariables }) {
    this.currentState = data.state;
    this.stateVariables = { ...data.stateVariables };
  }
}

export default EFSM;
