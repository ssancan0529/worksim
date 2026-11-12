import { confidenceIsValid, exercises, PRACTICE_CLOSING_STEP } from "./cases.mjs";

const isObject = value => Boolean(value && typeof value === "object" && !Array.isArray(value));
const string = value => typeof value === "string" ? value : "";
const rating = value => confidenceIsValid(value) ? value : null;

function newAttempt() {
  return {
    code: "", initialCode: null, prediction: "", notes: "", lines: [], none: false,
    executedCode: null, preview: null, comparison: null, predictionLocked: false, runs: [],
  };
}

export function createPracticeDraft(started = false) {
  return {
    kind: "practice", started, id: started ? crypto.randomUUID() : "",
    startedAt: started ? new Date().toISOString() : null,
    before: null, after: null, feel: "", note: "", completedAt: null,
    attempts: Object.fromEntries(exercises.map(({ id }) => [id, newAttempt()])),
  };
}

export function normalizePracticeDraft(raw) {
  const draft = createPracticeDraft(raw.started === true);
  const saved = isObject(raw.attempts) ? raw.attempts : {};
  for (const { id } of exercises) {
    const attempt = saved[id];
    if (!isObject(attempt)) continue;
    draft.attempts[id] = {
      ...newAttempt(),
      code: string(attempt.code),
      initialCode: typeof attempt.initialCode === "string" ? attempt.initialCode : null,
      prediction: string(attempt.prediction),
      notes: string(attempt.notes),
      lines: Array.isArray(attempt.lines) ? attempt.lines.filter(Number.isInteger) : [],
      none: attempt.none === true,
      executedCode: typeof attempt.executedCode === "string" ? attempt.executedCode : null,
      preview: isObject(attempt.preview) ? attempt.preview : null,
      comparison: isObject(attempt.comparison?.user) && isObject(attempt.comparison?.ai)
        ? attempt.comparison : null,
      predictionLocked: attempt.predictionLocked === true,
      runs: Array.isArray(attempt.runs) ? attempt.runs.filter(isObject) : [],
    };
  }
  return {
    ...draft, id: string(raw.id) || draft.id,
    startedAt: string(raw.startedAt) || draft.startedAt,
    before: rating(raw.before), after: rating(raw.after), feel: string(raw.feel), note: string(raw.note),
    completedAt: string(raw.completedAt) || null,
  };
}

export function getAttemptResult(attempt) {
  return attempt.preview ?? attempt.comparison?.user ?? null;
}

export function canAdvanceExercise(attempt) {
  return Boolean(
    isObject(attempt)
    && string(attempt.code).trim()
    && attempt.executedCode === attempt.code
    && isObject(attempt.preview)
    && !attempt.preview.error
    && Array.isArray(attempt.preview.checks),
  );
}

export function attemptResultLabel(attempt) {
  const result = getAttemptResult(attempt);
  if (!result) return "Intento registrado · sin ejecutar";
  if (result.error) return "Intento registrado · con errores de ejecución";
  return `${result.passed} de ${result.total} criterios cumplidos`;
}

export function getPracticeStep(draft) {
  if (!draft.started) return 0;
  if (draft.completedAt) return PRACTICE_CLOSING_STEP;
  if (!confidenceIsValid(draft.before)) return 1;
  const pending = exercises.findIndex(exercise => !canAdvanceExercise(draft.attempts[exercise.id]));
  return pending === -1 ? PRACTICE_CLOSING_STEP : pending + 2;
}

export function canCompletePractice(draft) {
  return getPracticeStep(draft) === PRACTICE_CLOSING_STEP && confidenceIsValid(draft.after);
}

export function practiceTotals(draft) {
  return exercises.reduce((totals, { id }) => {
    const result = getAttemptResult(draft.attempts[id]);
    return {
      passed: totals.passed + (result?.passed ?? 0),
      total: totals.total + (result?.total ?? 0),
    };
  }, { passed: 0, total: 0 });
}

export function readPreviousPractice() {
  try {
    const draft = JSON.parse(localStorage.getItem("worksim-banco-test-draft-v1"));
    const records = JSON.parse(localStorage.getItem("worksim-banco-test-records-v1"));
    return { draft: isObject(draft) ? draft : null, records: Array.isArray(records) ? records.filter(isObject) : [] };
  } catch {
    return { draft: null, records: [] };
  }
}
