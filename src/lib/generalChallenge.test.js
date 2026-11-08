import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialGeneralDraft,
  GENERAL_CLAIMS,
} from "../data/scenario.js";
import { evaluateGeneralReview } from "./generalChallenge.js";

test("general review identifies supported and unsupported AI claims without executing code", () => {
  const draft = createInitialGeneralDraft();
  draft.testing.observations = GENERAL_CLAIMS.map(({ id, expected }) => ({
    claimId: id,
    classification: expected,
    evidence: "Lo contrasté con las notas originales y el acuerdo registrado.",
  }));
  draft.testing.omission = "Falta validar acceso móvil y revisar capacidad de soporte.";

  const result = evaluateGeneralReview(draft.testing);

  assert.equal(result.results.length, 5);
  assert.equal(result.failed.length, 0);
  assert.equal(result.passed.length, 5);
});

test("general review flags incorrect classifications and missing source context", () => {
  const draft = createInitialGeneralDraft();
  draft.testing.observations = GENERAL_CLAIMS.map(({ id }) => ({
    claimId: id,
    classification: "supported",
    evidence: "El documento lo dice.",
  }));
  draft.testing.omission = "Se olvidó una condición.";

  const result = evaluateGeneralReview(draft.testing);

  assert.ok(result.failed.some((item) => item.id === "pilot-date"));
  assert.ok(result.failed.some((item) => item.id === "omission"));
});
