import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialDraft,
  createInitialGeneralDraft,
  ORIGINAL_CODE,
} from "../data/scenario.js";
import { getReportFeedback, getUnlockedStep, simulateTests } from "./simulation.js";

test("the prepared AI proposal exposes its missing city filter and late ordering", () => {
  const results = Object.fromEntries(
    simulateTests(ORIGINAL_CODE).map((result) => [result.id, result.passed]),
  );

  assert.equal(results.adoption, true);
  assert.equal(results.species, true);
  assert.equal(results.city, false);
  assert.equal(results.ordering, false);
  assert.equal(results["pagination-validation"], false);
});

test("the heuristic recognizes a proposal that addresses the tested requirements", () => {
  const correctedCode = `def list_pets(species=None, city=None, limit=10, offset=0):
    if not isinstance(limit, int) or limit < 0:
        raise ValueError()
    query = db.query(Pet).filter(Pet.is_adopted == False)
    if species:
        query = query.filter(Pet.species == species)
    if city:
        query = query.filter(Pet.city == city)
    return query.order_by(Pet.urgency_level.desc(), Pet.id.asc()).offset(offset).limit(limit).all()`;

  assert.ok(simulateTests(correctedCode).every((result) => result.passed));
});

test("workflow stages unlock only after their prerequisite evidence is recorded", () => {
  const draft = createInitialDraft();
  assert.equal(getUnlockedStep(draft), 0);

  draft.started = true;
  assert.equal(getUnlockedStep(draft), 1);
  draft.briefingRead = true;
  assert.equal(getUnlockedStep(draft), 2);
  draft.analysis.saved = true;
  assert.equal(getUnlockedStep(draft), 3);
  draft.investigation.reviewed = true;
  assert.equal(getUnlockedStep(draft), 4);

  draft.testing.ran = true;
  draft.testing.verdict = "refactor";
  assert.equal(getUnlockedStep(draft), 4);
  draft.testing.rationale = "Dos comprobaciones fallan en la propuesta.";
  assert.equal(getUnlockedStep(draft), 5);
});

test("the general challenge unlocks verification, decision and report in sequence", () => {
  const draft = createInitialGeneralDraft();
  assert.equal(getUnlockedStep(draft), 0);

  draft.started = true;
  assert.equal(getUnlockedStep(draft), 1);
  draft.briefingRead = true;
  assert.equal(getUnlockedStep(draft), 2);
  draft.analysis.saved = true;
  assert.equal(getUnlockedStep(draft), 3);
  draft.investigation.reviewed = true;
  assert.equal(getUnlockedStep(draft), 4);
  draft.testing.ran = true;
  assert.equal(getUnlockedStep(draft), 5);
  draft.testing.verdict = "modify";
  draft.testing.rationale = "El resumen incorpora acuerdos no confirmados.";
  assert.equal(getUnlockedStep(draft), 6);
});

test("the report recommendations use the recorded test and investigation evidence", () => {
  const draft = createInitialDraft();
  draft.testing.ran = true;
  draft.testing.results = simulateTests(ORIGINAL_CODE);
  draft.investigation.hypotheses[1] = true;

  const feedback = getReportFeedback(draft);
  assert.ok(feedback.failed.some((result) => result.id === "city"));
  assert.ok(feedback.recommendations.some((item) => item.includes("combinar filtros")));
  assert.ok(feedback.recommendations.some((item) => item.includes("1 hipótesis")));
  assert.ok(feedback.recommendations.some((item) => item.includes("justificación")));
});
