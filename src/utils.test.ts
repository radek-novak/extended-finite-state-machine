import { getter } from "./utils";
import { setter } from "./utils";
const assert = require("node:assert");

const test = require("node:test");

test("getter", () => {
  assert.strictEqual(getter({ a: 1 }, "a"), 1);
  assert.strictEqual(getter({ a: { b: 2, a: 1 } }, "a.b"), 2);
  assert.strictEqual(getter({ a: { b: 2, a: 1 } }, "a.a"), 1);
  assert.strictEqual(getter({ a: { b: 2, c: { d: 11 } } }, "a.c.d"), 11);
});

test("setter", () => {
  let obj: any = {};
  setter(obj, "a", 1);
  assert.strictEqual(obj.a, 1);

  obj = { a: { b: 2, a: 1 } };
  setter(obj, "a.b", 3);
  assert.strictEqual(obj.a.b, 3);

  obj = { a: { b: 2, a: 1 } };
  setter(obj, "a.a", 5);
  assert.strictEqual(obj.a.a, 5);

  obj = { a: { b: 2, c: { d: 11 } } };
  setter(obj, "a.c.d", 22);
  assert.strictEqual(obj.a.c.d, 22);

  obj = {};
  setter(obj, "x.y.z", 42);
  assert.deepStrictEqual(obj, { x: { y: { z: 42 } } });
});
