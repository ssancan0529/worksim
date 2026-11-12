import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDraft } from "./storage.js";
import { PRACTICE_CLOSING_STEP } from "../practica/cases.mjs";
import { attemptResultLabel, canCompletePractice, getPracticeStep, practiceTotals } from "../practica/state.mjs";

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

test("junior practice restores saved code and requires a posterior confidence answer", () => {
  const comparison = { user: { passed: 4, total: 4 }, ai: { passed: 2, total: 4 } };
  const draft = normalizeDraft({
    kind: "practice", started: true, before: 3,
    attempts: {
      transfers: { code: "SELECT * FROM transacciones;", preview: { passed: 1, total: 4, error: null } },
      support: { code: "SELECT 1;", preview: { passed: 0, total: 4, error: null } },
    },
  });
  assert.equal(draft.attempts.transfers.code, "SELECT * FROM transacciones;");
  assert.equal(getPracticeStep(draft), 4);
  assert.equal(canCompletePractice(draft), false);
  draft.attempts.withdrawal.code = "def retirar(saldo, monto):";
  assert.equal(getPracticeStep(draft), PRACTICE_CLOSING_STEP);
  draft.attempts.withdrawal.comparison = comparison;
  assert.deepEqual(practiceTotals(draft), { passed: 5, total: 12 });
  assert.equal(canCompletePractice(draft), false);
  assert.equal(canCompletePractice({ ...draft, after: 4 }), true);
});

test("minimal unexecuted and failed attempts survive reload and allow practice completion", () => {
  const draft = normalizeDraft({
    kind: "practice", started: true, before: 2,
    attempts: {
      transfers: { code: "SELECT" },
      support: { code: "SELECT FROM solicitudes", preview: { error: "Error de sintaxis", passed: 0, total: 4 } },
      withdrawal: { code: "def retirar(saldo, monto):" },
    },
  });
  assert.equal(getPracticeStep(draft), PRACTICE_CLOSING_STEP);
  assert.equal(canCompletePractice(draft), false);
  assert.equal(canCompletePractice({ ...draft, after: 3 }), true);
  assert.equal(attemptResultLabel(draft.attempts.transfers), "Intento registrado · sin ejecutar");
  assert.equal(attemptResultLabel(draft.attempts.support), "Intento registrado · con errores de ejecución");
  assert.equal(attemptResultLabel(draft.attempts.withdrawal), "Intento registrado · sin ejecutar");
  assert.deepEqual(practiceTotals(draft), { passed: 0, total: 4 });
  draft.attempts.transfers.code = " \n ";
  assert.equal(getPracticeStep(draft), 2);
  assert.equal(canCompletePractice({ ...draft, after: 3 }), false);
});
