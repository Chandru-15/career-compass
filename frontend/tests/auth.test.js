import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readDemoSession,
  startDemoSession,
  endDemoSession,
} from "../services/demoSession.js";
test("demo ignores stale MSAL, remains stable on reload, and stays signed out until restarted", () => {
  const values = new Map([["msal.account", "old teammate session"]]);
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const user = readDemoSession(storage);
  assert.equal(user.email, "demo@careercompass.local");
  assert.deepEqual(readDemoSession(storage), user);
  endDemoSession(storage);
  assert.equal(readDemoSession(storage), null);
  assert.equal(readDemoSession(storage), null);
  assert.deepEqual(startDemoSession(storage), user);
  assert.deepEqual(readDemoSession(storage), user);
});
