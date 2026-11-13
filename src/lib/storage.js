import {
  CHALLENGE,
  createInitialDraft,
  createInitialGeneralDraft,
  GENERAL_CLAIMS,
  GENERAL_CHALLENGE,
  STORAGE_KEY,
} from "../data/scenario.js";
import { normalizePracticeDraft } from "../practica/state.mjs";
import { normalizeBankProjectWork, normalizeProjectWork } from "./projects.js";
import { normalizeActivityStreak } from "./activityStreak.js";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value : "";
}

export function normalizeDraft(value) {
  const raw = isRecord(value) ? value : {};
  if (raw.kind === "practice") return normalizePracticeDraft(raw);
  const analysis = isRecord(raw.analysis) ? raw.analysis : {};
  const investigation = isRecord(raw.investigation) ? raw.investigation : {};
  const testing = isRecord(raw.testing) ? raw.testing : {};
  const reflection = isRecord(raw.reflection) ? raw.reflection : {};
  const savedObservations = Array.isArray(testing.observations)
    ? testing.observations
      .filter(isRecord)
      .map((item) => ({
        claimId: text(item.claimId),
        classification: text(item.classification),
        evidence: text(item.evidence),
        ...(testing.bankMeeting ? { sourceId: text(item.sourceId) } : {}),
      }))
    : [];
  const observationById = new Map(savedObservations.map((item) => [item.claimId, item]));

  const kind = raw.kind === "general" || raw.kind === "sql" ? raw.kind : "technical";

  return {
    kind,
    started: raw.started === true,
    briefingRead: raw.briefingRead === true,
    analysis: {
      approach: text(analysis.approach),
      risks: text(analysis.risks),
      checks: text(analysis.checks),
      saved: analysis.saved === true,
    },
    investigation: {
      notes: text(investigation.notes),
      hypotheses: [0, 1, 2].map((index) => investigation.hypotheses?.[index] === true),
      reviewed: investigation.reviewed === true,
    },
    testing: {
      code: typeof testing.code === "string" ? testing.code : (kind === "technical" ? createInitialDraft().testing.code : ""),
      ran: testing.ran === true,
      executedCode: typeof testing.executedCode === "string" ? testing.executedCode : null,
      ...(kind === "technical" && testing.petsReviewVersion === 1 ? { petsReviewVersion: 1 } : {}),
      bankOperations: testing.bankOperations === true,
      plan: text(testing.plan),
      parameters: isRecord(testing.parameters) ? Object.fromEntries([...(testing.bankOperations ? ["kind", "status"] : ["species", "city"]), "limit", "offset"].map(key => [key, text(testing.parameters[key])])) : undefined,
      results: Array.isArray(testing.results) ? testing.results : [],
      verdict: text(testing.verdict),
      rationale: text(testing.rationale),
      runs: Array.isArray(testing.runs) ? testing.runs : [],
      observations: raw.kind === "general"
        ? GENERAL_CLAIMS.map(({ id }) => observationById.get(id) || {
          claimId: id,
          classification: "",
          evidence: "",
        })
        : savedObservations,
      omission: text(testing.omission),
      bankMeeting: testing.bankMeeting === true,
      omittedSources: Array.isArray(testing.omittedSources) ? testing.omittedSources.filter(id => Number.isInteger(id) && id >= 1 && id <= 5) : [],
      executiveSummary: text(testing.executiveSummary),
      objection: text(testing.objection),
      ...(kind === "sql" ? {
        auditExecutedCode: text(testing.auditExecutedCode),
        auditError: text(testing.auditError),
        rows: Array.isArray(testing.rows)
          ? testing.rows.filter((row) => Array.isArray(row) && row.length === 5
            && Number.isInteger(row[0]) && row.slice(1, 4).every((cell) => typeof cell === "string")
            && Number.isFinite(row[4]))
          : [],
      } : {}),
    },
    reflection: {
      blindSpot: text(reflection.blindSpot),
      evidence: text(reflection.evidence),
      realWorld: text(reflection.realWorld),
    },
    completedAt: text(raw.completedAt) || null,
  };
}

export function loadWorksimState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const legacyStored = stored || window.localStorage.getItem("worksim-react-prototype-v1");
    if (!legacyStored) {
      return {
        drafts: {
          [CHALLENGE.id]: createInitialDraft(),
          [GENERAL_CHALLENGE.id]: createInitialGeneralDraft(),
        },
        activeChallengeId: CHALLENGE.id,
        history: [],
        projectWork: normalizeProjectWork(),
        bankProjectWork: normalizeBankProjectWork(),
        activityStreak: normalizeActivityStreak(),
        error: "",
      };
    }

    const parsed = JSON.parse(legacyStored);
    const drafts = isRecord(parsed.drafts)
      ? Object.fromEntries(
        Object.entries(parsed.drafts)
          .filter(([, value]) => isRecord(value))
          .map(([id, value]) => [id, normalizeDraft(value)]),
      )
      : { [CHALLENGE.id]: normalizeDraft(parsed.draft) };
    if (!stored && parsed.completed) drafts[CHALLENGE.id].completedAt = new Date().toISOString();
    return {
      drafts,
      activeChallengeId: typeof parsed.activeChallengeId === "string"
        ? parsed.activeChallengeId
        : CHALLENGE.id,
      history: Array.isArray(parsed.history) ? parsed.history.filter(isRecord) : [],
      projectWork: normalizeProjectWork(parsed.projectWork),
      bankProjectWork: normalizeBankProjectWork(parsed.bankProjectWork),
      activityStreak: normalizeActivityStreak(parsed.activityStreak),
      error: "",
    };
  } catch {
    return {
      drafts: {
        [CHALLENGE.id]: createInitialDraft(),
        [GENERAL_CHALLENGE.id]: createInitialGeneralDraft(),
      },
      activeChallengeId: CHALLENGE.id,
      history: [],
      projectWork: normalizeProjectWork(),
      bankProjectWork: normalizeBankProjectWork(),
      activityStreak: normalizeActivityStreak(),
      error: "No se pudieron recuperar los datos guardados; inicia una nueva práctica.",
    };
  }
}

export function saveWorksimState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
