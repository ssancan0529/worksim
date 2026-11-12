import { PROJECTS } from "../data/projects.js";

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
      ? evaluateProjectSubmission(project, submittedAnswers)
      : null;
    return [project.id, {
      answers,
      submittedAnswers,
      submittedAt,
      evaluation,
    }];
  }));
}

export function evaluateProjectSubmission(project, answers) {
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
    ? projectState.evaluation || evaluateProjectSubmission(project, submittedAnswers)
    : null;
  const submissionIsCurrent = Boolean(
    evaluation && sameAnswers(answers, submittedAnswers, project.stages.length),
  );
  const hasActivity = Object.values(answers).some((answer) => answer.trim()) || Boolean(projectState.submittedAt);
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
