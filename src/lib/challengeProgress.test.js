import assert from "node:assert/strict";
import test from "node:test";
import { getChallengeProgress, latestCompletedRecord } from "./challengeProgress.js";
import { loadWorksimState, saveWorksimState } from "./storage.js";

test("the production report remains completed after a draft reset and reload", () => {
  const previous = globalThis.window;
  const data = new Map();
  globalThis.window = { localStorage: { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) } };
  try {
    const completedAt = "2026-11-13T03:00:00.000Z";
    const state = loadWorksimState();
    const record = { id: "saved", challengeId: "eng-842", ticket: "ENG-842", completedAt,
      draft: { ...state.drafts["eng-842"], completedAt } };
    saveWorksimState({ ...state, history: [record] });
    const restored = loadWorksimState();
    const latest = latestCompletedRecord(restored.history, "eng-842", "ENG-842");
    assert.equal(latest.draft.completedAt, completedAt);
    assert.deepEqual(getChallengeProgress(restored.drafts["eng-842"], latest), { completed: true, inProgress: false });
    assert.deepEqual(getChallengeProgress({ started: true }, latest), { completed: true, inProgress: true });
    assert.equal(latestCompletedRecord([{ ticket: "ENG-842", completedAt }], "eng-842", "ENG-842").completedAt, completedAt);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
