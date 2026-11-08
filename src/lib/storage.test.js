import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDraft } from "./storage.js";

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
