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
      actions: {
        updateField: "verified",
        source: true,
      },
    },
  ],
  active: [
    {
      eventType: "ZeroBalance",
      guard: true,
      to: "active",
      actions: {
        updateField: "$state.balance",
        source: 0,
        action: "set",
      },
    },
    {
      eventType: "IncreaseBalance",
      guard: true,
      to: "active",
      actions: {
        updateField: "$state.balance",
        source: "$event.amount",
        action: "add",
      },
    },
    {
      eventType: "DecreaseBalance",
      guard: [
        {
          left: "$state.balance",
          right: "$event.amount",
          predicate: "<",
        },
        {
          left: "$state.overdraft",
          right: true,
          predicate: "=",
        },
      ],
      to: "active",
      actions: {
        updateField: "$state.balance",
        source: "$event.amount",
        action: "subtract",
      },
    },
  ],
};
