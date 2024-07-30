import EFSM from "./efsm";
const assert = require("node:assert");

import test from "node:test";

test("resolvePath", () => {
  const efsm = new EFSM<
    "initial",
    { stA: number },
    { type: "e1"; a: number },
    { initial: [] }
  >(
    "initial",
    {
      initial: [],
    },
    { stA: 4 }
  );

  assert.strictEqual(efsm.resolvePath(true), true);
  assert.strictEqual(efsm.resolvePath(false), false);
  assert.strictEqual(efsm.resolvePath(-33), -33);
  assert.strictEqual(efsm.resolvePath("$event.a", { type: "e1", a: 45 }), 45);
  assert.strictEqual(efsm.resolvePath("$state.stA", { type: "e1", a: 45 }), 4);
});

test("evaluateGuard", () => {
  const efsm = new EFSM("initial", {
    initial: [],
  });

  assert.strictEqual(efsm.evaluateGuard(true, { type: "any" }), true);
  assert.strictEqual(efsm.evaluateGuard(false, { type: "any" }), false);
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: [1, 2],
        predicate: "<",
      },
      { type: "any" }
    ),
    true,
    "1 < 2 = true"
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: [1, 2],
        predicate: ">",
      },
      { type: "any" }
    ),
    false
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: [1, 2],
        predicate: "=",
      },
      { type: "any" }
    ),
    false
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: [2, 1],
        predicate: ">",
      },
      { type: "any" }
    ),
    true
  );
});

test("evaluateGuard with value paths", () => {
  const efsm = new EFSM<
    "initial",
    { stA: number },
    { type: "e1"; a: number },
    { initial: [] }
  >(
    "initial",
    {
      initial: [],
    },
    { stA: 4 }
  );

  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: ["$state.stA", 2],
        predicate: "<",
      },
      { type: "e1", a: 1 }
    ),
    false
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: ["$state.stA", 5],
        predicate: "<",
      },
      { type: "e1", a: 1 }
    ),
    true
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: ["$state.stA", "$event.a"],
        predicate: "<",
      },
      { type: "e1", a: 1 }
    ),
    false
  );
  assert.strictEqual(
    efsm.evaluateGuard(
      {
        operands: ["$state.stA", "$event.a"],
        predicate: "<",
      },
      { type: "e1", a: 6 }
    ),
    true
  );
});

test("getTransitionsForStateAndEvent", () => {
  const efsm = new EFSM<
    "initial" | "createdUnverified",
    { stA: number },
    { type: "CreateAccount"; a: number },
    { initial: any[]; createdUnverified: any[] }
  >(
    "initial",
    {
      initial: [
        {
          eventType: "CreateAccount",
          guard: true,
          to: "createdUnverified",
        },
      ],
      createdUnverified: [],
    },
    { stA: 4 }
  );

  assert.deepEqual(
    efsm.getTransitionsForStateAndEvent("initial", {
      type: "CreateAccount",
      a: 1,
    }),
    [
      {
        eventType: "CreateAccount",
        guard: true,
        to: "createdUnverified",
      },
    ]
  );
  assert.deepEqual(
    efsm.getTransitionsForStateAndEvent("createdUnverified", {
      type: "CreateAccount",
      a: 1,
    }),
    []
  );
});

test("processEvent", () => {
  const efsm = new EFSM<
    "initial" | "createdUnverified",
    { stA: number },
    { type: "CreateAccount" } | { type: "Unknown" },
    { initial: any[]; createdUnverified: any[] }
  >(
    "initial",
    {
      initial: [
        {
          eventType: "CreateAccount",
          guard: true,
          to: "createdUnverified",
        },
      ],
      createdUnverified: [],
    },
    { stA: 4 }
  );

  assert.strictEqual(efsm.toJSON().state, "initial");

  try {
    efsm.processEvent({
      type: "Unknown",
    });
  } catch {}

  assert.strictEqual(efsm.toJSON().state, "initial");

  efsm.processEvent({
    type: "CreateAccount",
  });

  assert.strictEqual(efsm.toJSON().state, "createdUnverified");

  try {
    efsm.processEvent({
      type: "CreateAccount",
    });
  } catch {}

  assert.strictEqual(efsm.toJSON().state, "createdUnverified");
});
