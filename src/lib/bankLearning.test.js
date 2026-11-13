import assert from "node:assert/strict";
import test from "node:test";
import { BANK_PROJECTS, BANK_TRANSACTIONS, MOVEMENT_CASES } from "../data/bankProjects.js";
import { BANK_MEETING_CLAIMS } from "../data/scenario.js";
import { evaluateGeneralReview } from "./generalChallenge.js";
import { evaluateProjectSubmission, normalizeBankProjectWork, normalizeProjectWork } from "./projects.js";
import { normalizeDraft } from "./storage.js";
import { canAdvanceExercise, createPracticeDraft, getPracticeStep } from "../practica/state.mjs";

test("a partial SQL run still advances once the learner records a reasoning note", () => {
  const draft = createPracticeDraft();
  draft.started = true;
  draft.before = 3;
  const attempt = draft.attempts.transfers;
  Object.assign(attempt, { code: "SELECT 1", executedCode: "SELECT 1", preview: { checks: [{ passed: false }] } });
  assert.equal(canAdvanceExercise(attempt), true);
  assert.equal(getPracticeStep(draft), 2);
  attempt.reasoning = "No obtuve transferencias. Revisaría el estado y el monto.";
  assert.equal(getPracticeStep(normalizeDraft(draft)), 3);
});

test("bank communication distinguishes a correct classification from a supported one", () => {
  const claim = BANK_MEETING_CLAIMS[1];
  const testing = { bankMeeting: true, observations: [{ claimId: claim.id, classification: claim.expected, sourceId: "1" }], omittedSources: [2] };
  const results = evaluateGeneralReview(testing).results;
  assert.equal(results[1].status, "Parcial");
  assert.equal(results.at(-1).status, "Parcial");
  testing.observations[0].sourceId = "2";
  testing.omittedSources.push(4);
  const restored = normalizeDraft({ kind: "general", testing }).testing;
  assert.equal(evaluateGeneralReview(restored).results[1].status, "Cumple");
  assert.equal(evaluateGeneralReview(restored).results.at(-1).passed, true);
});

test("bank project checks derive from the extract and old drafts retain original evidence", () => {
  const [project] = BANK_PROJECTS;
  const old = normalizeProjectWork({ [project.id]: { answers: { 0: "Análisis de tienda" }, evidence: { refund: -200 } } });
  assert.equal(old[project.id].evidence.refund, -200);
  const bank = normalizeBankProjectWork({ [project.id]: { evidence: { pending: 1 } } });
  assert.equal(bank[project.id].evidence.pending, 1);
  const unique = [...new Map(BANK_TRANSACTIONS.map(row => [row[0], row])).values()];
  const total = unique.filter(row => row[3] !== "pendiente").reduce((sum, row) => sum + row[4], 0);
  const evaluation = evaluateProjectSubmission(project, {}, { control: total });
  assert.equal(evaluation.version, 3);
  assert.equal(evaluation.criteria[2].requirements.find(item => item.label === "Total trimestral conciliado").passed, true);
});

test("bank movement evaluation rejects a changed ledger on a duplicate", () => {
  const project = BANK_PROJECTS[1];
  const code = "función";
  const results = MOVEMENT_CASES.map(item => ({ result: item.expected }));
  assert.equal(evaluateProjectSubmission(project, {}, {}, { code, results }, code).criteria[1].status, "correct");
  results[2] = { result: { accepted: false, ledger: [] } };
  assert.equal(evaluateProjectSubmission(project, {}, {}, { code, results }, code).criteria[1].status, "partial");
});
