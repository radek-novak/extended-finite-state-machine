import assert from "node:assert";
import test from "node:test";
import EFSM from "../efsm";

const events = {
  createAccount: (overdraft = false) => ({
    id: Math.floor(Math.random() * 1000000),
    type: "CreateAccount",
    verified: false,
    overdraft,
    balance: 0,
  }),
  verifyAccount: (id: number) => ({
    type: "VerifyAccount",
    id,
  }),
  increaseBalance: (id: number, amount: number) => ({
    type: "IncreaseBalance",
    amount,
    id,
  }),
  decreaseBalance: (id: number, amount: number) => ({
    type: "DecreaseBalance",
    amount,
    id,
  }),
  zeroBalance: (id: number) => ({
    type: "ZeroBalance",
    id,
  }),
};

const transitionSet = {
  initial: [
    {
      eventType: "CreateAccount",
      guard: true,
      to: "createdUnverified",
      // actions: [],
    },
  ],
  createdUnverified: [
    {
      eventType: "VerifyAccount",
      guard: true,
      to: "active",
      actions: [
        {
          updateField: "verified",
          source: true,
          action: "set",
        },
      ],
    },
  ],
  active: [
    {
      eventType: "ZeroBalance",
      guard: true,
      to: "active",
      actions: [
        {
          updateField: "$state.balance",
          source: 0,
          action: "set",
        },
      ],
    },
    {
      eventType: "IncreaseBalance",
      guard: true,
      to: "active",
      actions: [
        {
          updateField: "$state.balance",
          source: "$event.amount",
          action: "add",
        },
      ],
    },
    {
      eventType: "DecreaseBalance",
      guard: {
        operands: ["$state.balance", "$event.amount"],
        predicate: ">",
      },

      to: "active",
      actions: [
        {
          updateField: "$state.balance",
          source: "$event.amount",
          action: "subtract",
        },
      ],
    },
  ],
};

test("scenario: bank", () => {
  const efsm = new EFSM<
    "initial" | "createdUnverified",
    { balance: number },
    ReturnType<(typeof events)[keyof typeof events]>,
    { initial: any[]; createdUnverified: any[] }
  >("initial", transitionSet, { balance: 0 });

  assert.strictEqual(efsm.toJSON().state, "initial");

  const account = events.createAccount(true);

  efsm.processEvent(account);

  assert.strictEqual(efsm.toJSON().state, "createdUnverified");

  efsm.processEvent(events.verifyAccount(account.id));

  assert.strictEqual(efsm.toJSON().state, "active");

  efsm.processEvent(events.increaseBalance(account.id, 10));

  assert.strictEqual(efsm.toJSON().stateVariables.balance, 10);

  efsm.processEvent(events.increaseBalance(account.id, 5));

  assert.strictEqual(efsm.toJSON().stateVariables.balance, 15);

  efsm.processEvent(events.decreaseBalance(account.id, 2));

  assert.strictEqual(efsm.toJSON().stateVariables.balance, 13);

  efsm.processEvent(events.zeroBalance(account.id));

  assert.strictEqual(efsm.toJSON().stateVariables.balance, 0);
});
