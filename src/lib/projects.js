import { PROJECTS } from "../data/projects.js";
import { PROJECT_RUBRICS, RUBRIC_VERSION, INVENTORY_CASES } from "../data/projectRubrics.js";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function normalizeAnswers(value, stageCount) {
  const answers = isRecord(value) ? value : {};
  return Object.fromEntries(
    Array.from({ length: stageCount }, (_, index) => [
      index,
      typeof answers[index] === "string" ? answers[index] : "",
    ]),
  );
}

export function normalizeProjectWork(value) {
  const saved = isRecord(value) ? value : {};
  return Object.fromEntries(PROJECTS.map((project) => {
    const projectState = isRecord(saved[project.id]) ? saved[project.id] : {};
    const answers = normalizeAnswers(projectState.answers, project.stages.length);
    const submittedAt = typeof projectState.submittedAt === "string" ? projectState.submittedAt : null;
    const submittedAnswers = submittedAt
      ? normalizeAnswers(projectState.submittedAnswers, project.stages.length)
      : null;
    const evaluation = submittedAnswers
      ? isRecord(projectState.evaluation) && Array.isArray(projectState.evaluation.criteria)
        ? projectState.evaluation
        : { ...evaluateLegacySubmission(project, submittedAnswers), version: 1 }
      : null;
    return [project.id, {
      answers,
      submittedAnswers,
      submittedAt,
      evaluation,
      evidence: normalizeEvidence(project, projectState.evidence),
      submittedEvidence: normalizeEvidence(project, projectState.submittedEvidence),
      inventoryCode: typeof projectState.inventoryCode === "string" ? projectState.inventoryCode : "",
      submittedInventoryCode: typeof projectState.submittedInventoryCode === "string" ? projectState.submittedInventoryCode : "",
      inventoryRun: isRecord(projectState.inventoryRun) ? projectState.inventoryRun : null,
      submissions: Array.isArray(projectState.submissions) ? projectState.submissions.filter(isRecord) : [],
    }];
  }));
}

function evaluateLegacySubmission(project, answers) {
  const normalizedAnswers = normalizeAnswers(answers, project.stages.length);
  const criteria = project.criteria.map((criterion) => {
    const answer = ` ${normalizeText(normalizedAnswers[criterion.stageIndex])} `;
    const requirements = criterion.requirements.map((requirement) => {
      const matched = requirement.terms.some((term) => (
        answer.includes(` ${normalizeText(term)} `)
      ));
      return { label: requirement.label, passed: matched };
    });
    return {
      id: criterion.id,
      title: criterion.title,
      stageIndex: criterion.stageIndex,
      passed: requirements.every((requirement) => requirement.passed),
      requirements,
    };
  });
  return {
    criteria,
    passed: criteria.length > 0 && criteria.every((criterion) => criterion.passed),
  };
}

function sameAnswers(first, second, stageCount) {
  const normalizedFirst = normalizeAnswers(first, stageCount);
  const normalizedSecond = normalizeAnswers(second, stageCount);
  return Object.keys(normalizedFirst).every((key) => normalizedFirst[key] === normalizedSecond[key]);
}

export function getProjectProgress(project, projectState = {}) {
  const answers = normalizeAnswers(projectState.answers, project.stages.length);
  const submittedAnswers = projectState.submittedAt
    ? normalizeAnswers(projectState.submittedAnswers, project.stages.length)
    : null;
  const evaluation = submittedAnswers
    ? projectState.evaluation || { ...evaluateLegacySubmission(project, submittedAnswers), version: 1 }
    : null;
  const submissionIsCurrent = Boolean(
    evaluation && sameAnswers(answers, submittedAnswers, project.stages.length)
      && JSON.stringify(normalizeEvidence(project, projectState.evidence)) === JSON.stringify(normalizeEvidence(project, projectState.submittedEvidence))
      && (projectState.inventoryCode || "") === (projectState.submittedInventoryCode || ""),
  );
  const hasActivity = Object.values(answers).some((answer) => answer.trim())
    || Object.values(normalizeEvidence(project, projectState.evidence)).some((value) => String(value).trim())
    || Boolean(projectState.inventoryCode?.trim()) || Boolean(projectState.submittedAt);
  const completed = Boolean(evaluation?.passed && submissionIsCurrent);
  const needsImprovement = Boolean(evaluation && submissionIsCurrent && !evaluation.passed);

  return {
    completed,
    inProgress: hasActivity && !completed,
    needsImprovement,
    submissionIsCurrent,
    evaluation,
    submittedAt: projectState.submittedAt || null,
  };
}

export const EVALUATION_LABELS = {
  correct: "Completo y correcto", partial: "Parcialmente correcto",
  incorrect: "Incorrecto", insufficient: "Insuficiente o sin evidencia",
};

export function normalizeEvidence(project, value) {
  const saved = isRecord(value) ? value : {};
  return Object.fromEntries(PROJECT_RUBRICS[project.id].stages.flat().map(field => [
    field.id, typeof saved[field.id] === "string" || typeof saved[field.id] === "number" ? saved[field.id] : "",
  ]));
}

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string" || !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value.trim())) return NaN;
  return Number(value.trim().replace(",", "."));
}

function checkField(field, evidence) {
  const value = evidence[field.id];
  const missing = value === "" || value === undefined || value === null;
  let passed = false;
  if (!missing) {
    if (field.type === "select") {
      passed = Array.isArray(field.expected) ? field.expected.includes(value) : value === field.expected;
    } else {
      const actual = numeric(value);
      if (field.id === "budget") passed = actual > 0 && actual <= field.expected;
      else if (["announcement", "demonstration", "reminder"].includes(field.id)) {
        const days = ["announcement", "demonstration", "reminder"].map(key => numeric(evidence[key]));
        passed = days.every(day => Number.isInteger(day) && day >= 1 && day <= 7)
          && days[0] < days[1] && days[1] < days[2];
      } else passed = Math.abs(actual - field.expected) <= field.tolerance;
    }
  }
  return { label: field.label, passed, status: missing ? "insufficient" : passed ? "correct" : "incorrect",
    feedback: missing ? `Falta esta evidencia. ${field.help}` : passed ? "La evidencia coincide con las condiciones del encargo." : `Revisa tu respuesta. ${field.help}` };
}

function classify(requirements) {
  if (requirements.every(item => item.passed)) return "correct";
  if (requirements.every(item => item.status === "insufficient")) return "insufficient";
  if (requirements.some(item => item.passed)) return "partial";
  return requirements.some(item => item.status === "incorrect") ? "incorrect" : "insufficient";
}

export function evaluateProjectSubmission(project, answers, evidence = {}, inventoryRun = null, inventoryCode = "") {
  const rubric = PROJECT_RUBRICS[project.id];
  const normalized = normalizeAnswers(answers, project.stages.length);
  const criteria = project.criteria.map((criterion, stageIndex) => {
    let requirements = rubric.stages[stageIndex].map(field => checkField(field, evidence));
    if (project.id === "api-de-inventario" && stageIndex === 1) {
      const current = inventoryCode.trim() && inventoryRun?.code === inventoryCode;
      requirements = INVENTORY_CASES.map((sample, index) => {
        const actual = current ? inventoryRun.results?.[index] : null;
        const passed = Boolean(actual && !actual.error && actual.result?.aceptado === sample.expected.aceptado
          && actual.result?.stock === sample.expected.stock);
        return { label: sample.name, passed, status: !actual ? "insufficient" : passed ? "correct" : "incorrect",
          feedback: !actual ? "Ejecuta las pruebas de la función actual para obtener evidencia."
            : passed ? "El resultado coincide con el contrato."
            : `Entrada ${JSON.stringify({stock: sample.stock, cantidad: sample.cantidad, operacion: sample.operacion})}. Esperado ${JSON.stringify(sample.expected)}. Obtenido ${actual.error || JSON.stringify(actual.result)}.` };
      });
    }
    const status = classify(requirements);
    return { id: criterion.id, title: criterion.title, stageIndex,
      status, passed: status === "correct", requirements,
      review: normalized[stageIndex].trim() ? "Requiere revisión cualitativa de la explicación y sus evidencias." : "Falta la explicación de esta etapa. Añade tu razonamiento y cómo se reproduce el trabajo.",
      hasExplanation: Boolean(normalized[stageIndex].trim()),
    };
  });
  return { version: RUBRIC_VERSION, criteria, status: classify(criteria.map(item => ({...item, status: item.status}))),
    passed: criteria.every(item => item.passed && item.hasExplanation),
    requiresReview: true, review: rubric.review };
}
