import { getter } from "./utils";
const assert = require("node:assert");

const test = require("node:test");

test("getter", () => {
  assert.strictEqual(getter({ a: 1 }, "a"), 1);
  assert.strictEqual(getter({ a: { b: 2, a: 1 } }, "a.b"), 2);
  assert.strictEqual(getter({ a: { b: 2, a: 1 } }, "a.a"), 1);
  assert.strictEqual(getter({ a: { b: 2, c: { d: 11 } } }, "a.c.d"), 11);
});
