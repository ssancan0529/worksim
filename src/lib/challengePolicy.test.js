import assert from "node:assert/strict";
import test from "node:test";
import {
  clearChallengeViolation,
  markChallengeViolation,
  readChallengeViolation,
} from "./challengePolicy.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test("challenge violations persist until explicitly cleared", () => {
  const storage = createStorage();
  const violation = { challengeId: "practice-sql-python", deadline: 1_800_000_000_000 };

  assert.equal(markChallengeViolation(violation.challengeId, violation.deadline, storage), true);
  assert.deepEqual(readChallengeViolation(storage), violation);
  assert.equal(clearChallengeViolation(storage), true);
  assert.equal(readChallengeViolation(storage), null);
});

test("challenge policy storage failures are reported to the caller", () => {
  const storage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };

  assert.equal(readChallengeViolation(storage), null);
  assert.equal(markChallengeViolation("challenge", Date.now(), storage), false);
  assert.equal(clearChallengeViolation(storage), false);
});
