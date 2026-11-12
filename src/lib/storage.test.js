import assert from "node:assert/strict";
import test from "node:test";
import { loadWorksimState, normalizeDraft, saveWorksimState } from "./storage.js";
import { CHALLENGE, STORAGE_KEY } from "../data/scenario.js";
import { PRACTICE_CLOSING_STEP } from "../practica/cases.mjs";
import { attemptResultLabel, canCompletePractice, getPracticeStep, practiceTotals } from "../practica/state.mjs";

test("daily activity streak persists in local storage and old state defaults safely", () => {
  const previousWindow = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: key => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  try {
    saveWorksimState({
      drafts: {},
      activeChallengeId: CHALLENGE.id,
      history: [],
      projectWork: {},
      activityStreak: { current: 3, lastActiveDate: "2026-11-12" },
    });
    assert.deepEqual(loadWorksimState().activityStreak, {
      current: 3,
      lastActiveDate: "2026-11-12",
    });
    values.set(STORAGE_KEY, JSON.stringify({ drafts: {}, history: [] }));
    assert.deepEqual(loadWorksimState().activityStreak, { current: 0, lastActiveDate: null });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test("legacy challenge drafts keep their technical default and workspace", () => {
  const draft = normalizeDraft({ testing: { code: "print('legacy')" } });

  assert.equal(draft.kind, "technical");
  assert.equal(draft.testing.code, "print('legacy')");
  assert.deepEqual(draft.testing.observations, []);
});

test("general drafts preserve claim observations without adding code requirements", () => {
  const draft = normalizeDraft({
    kind: "general",
    testing: {
      code: "",
      observations: [{ claimId: "budget", classification: "supported", evidence: "Nota 1" }],
      omission: "Revisar el acceso móvil.",
    },
  });

  assert.equal(draft.kind, "general");
  assert.equal(draft.testing.code, "");
  assert.deepEqual(draft.testing.observations.slice(0, 1), [
    { claimId: "budget", classification: "supported", evidence: "Nota 1" },
  ]);
  assert.equal(draft.testing.observations.length, 4);
  assert.equal(draft.testing.omission, "Revisar el acceso móvil.");
});

test("incomplete general drafts restore all required observation slots", () => {
  const draft = normalizeDraft({ kind: "general", testing: { observations: [] } });

  assert.equal(draft.testing.observations.length, 4);
  assert.deepEqual(
    draft.testing.observations.map((observation) => observation.claimId),
    ["budget", "pilot-date", "paula-commitment", "risks"],
  );
});

test("junior practice only unlocks stages after successful execution and a posterior confidence answer", () => {
  const comparison = { user: { passed: 4, total: 4 }, ai: { passed: 2, total: 4 } };
  const successfulPreview = { passed: 0, total: 4, error: null, checks: [] };
  const draft = normalizeDraft({
    kind: "practice", started: true, before: 3,
    attempts: {
      transfers: { code: "SELECT * FROM transacciones;", executedCode: "SELECT * FROM transacciones;", preview: { ...successfulPreview, passed: 1 } },
      support: { code: "SELECT 1;", executedCode: "SELECT 1;", preview: successfulPreview },
    },
  });
  assert.equal(draft.attempts.transfers.code, "SELECT * FROM transacciones;");
  assert.equal(getPracticeStep(draft), 4);
  assert.equal(canCompletePractice(draft), false);
  draft.attempts.withdrawal.code = "def retirar(saldo, monto):";
  assert.equal(getPracticeStep(draft), 4);
  draft.attempts.withdrawal.executedCode = draft.attempts.withdrawal.code;
  draft.attempts.withdrawal.preview = { passed: 4, total: 4, error: null, checks: [] };
  assert.equal(getPracticeStep(draft), PRACTICE_CLOSING_STEP);
  draft.attempts.withdrawal.comparison = comparison;
  assert.deepEqual(practiceTotals(draft), { passed: 5, total: 12 });
  assert.equal(canCompletePractice(draft), false);
  assert.equal(canCompletePractice({ ...draft, after: 4 }), true);
});

test("unexecuted and failed attempts remain locked after reload until they execute successfully", () => {
  const draft = normalizeDraft({
    kind: "practice", started: true, before: 2,
    attempts: {
      transfers: { code: "SELECT" },
      support: { code: "SELECT FROM solicitudes", preview: { error: "Error de sintaxis", passed: 0, total: 4 } },
      withdrawal: { code: "def retirar(saldo, monto):" },
    },
  });
  assert.equal(getPracticeStep(draft), 2);
  assert.equal(canCompletePractice(draft), false);
  assert.equal(canCompletePractice({ ...draft, after: 3 }), false);
  assert.equal(attemptResultLabel(draft.attempts.transfers), "Intento registrado · sin ejecutar");
  assert.equal(attemptResultLabel(draft.attempts.support), "Intento registrado · con errores de ejecución");
  assert.equal(attemptResultLabel(draft.attempts.withdrawal), "Intento registrado · sin ejecutar");
  assert.deepEqual(practiceTotals(draft), { passed: 0, total: 4 });

  draft.attempts.transfers.executedCode = draft.attempts.transfers.code;
  draft.attempts.transfers.preview = { passed: 0, total: 4, error: null, checks: [] };
  assert.equal(getPracticeStep(draft), 3);
  draft.attempts.support.executedCode = draft.attempts.support.code;
  draft.attempts.support.preview = { passed: 0, total: 4, error: null, checks: [] };
  assert.equal(getPracticeStep(draft), 4);
  draft.attempts.withdrawal.executedCode = draft.attempts.withdrawal.code;
  draft.attempts.withdrawal.preview = { passed: 0, total: 5, error: null, checks: [] };
  assert.equal(getPracticeStep(draft), PRACTICE_CLOSING_STEP);
  assert.equal(canCompletePractice({ ...draft, after: 3 }), true);

  draft.attempts.transfers.code = " \n ";
  assert.equal(getPracticeStep(draft), 2);
  assert.equal(canCompletePractice({ ...draft, after: 3 }), false);
});
