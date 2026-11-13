import { getChallengeProgress, latestCompletedRecord } from "./lib/challengeProgress";
import { canCompleteChallenge } from "./lib/completion";
import { useEffect, useState } from "react";
import { MAYRA_CHALLENGE } from "./data/mayra";
import MayraChallengePage from "./features/MayraChallengePage";
import AppHeader from "./components/AppHeader";
import ExitChallengeDialog from "./components/ExitChallengeDialog";
import StatusNotice from "./components/StatusNotice";
import {
  CHALLENGE,
  createInitialDraft,
  createInitialGeneralDraft,
  GENERAL_CHALLENGE,
} from "./data/scenario";
import ChallengesPage from "./features/ChallengesPage";
import GeneralReportPage from "./features/GeneralReportPage";
import GeneralVerificationPage from "./features/GeneralVerificationPage";
import IndividualWorkspacePage from "./features/workspaces/IndividualWorkspacePage";
import PracticeChallengePage from "./features/PracticeChallengePage";
import ProjectsPage from "./features/workspaces/ProjectsPage";
import ReportPage from "./features/ReportPage";
import TestingPage from "./features/TestingPage";
import { evaluateGeneralReview } from "./lib/generalChallenge";
import { verdictLabel } from "./lib/simulation";
import { loadWorksimState, saveWorksimState } from "./lib/storage";
import { recordActivity } from "./lib/activityStreak";
import { getWorkspace } from "./data/workspaces";
import { BANK_PROJECTS } from "./data/bankProjects";
import { PROJECTS } from "./data/projects";
import { getProjectProgress } from "./lib/projects";
import { exercises, PRACTICE_CHALLENGE, PRACTICE_CLOSING_STEP, PRACTICE_STEPS, scoreDetection } from "./practica/cases.mjs";
import { attemptResultLabel, canCompletePractice, createPracticeDraft, getPracticeStep, practiceTotals } from "./practica/state.mjs";

const THEME_STORAGE_KEY = "worksim-theme";
const workspace = getWorkspace("individual");

function loadThemePreference() {
  try {
    const preference = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (preference === "light" || preference === "dark") return preference;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function createDraftForChallenge(challengeId) {
  if (challengeId === PRACTICE_CHALLENGE.id) return createPracticeDraft();
  if (challengeId === GENERAL_CHALLENGE.id) {
    const draft = createInitialGeneralDraft();
    draft.testing.bankMeeting = true;
    return draft;
  }
  const draft = createInitialDraft();
  draft.testing.code = "";
  if (challengeId === MAYRA_CHALLENGE.id) {
    draft.kind = "sql";
    draft.testing.rows = [];
  } else {
    draft.testing.bankOperations = true;
  }
  return draft;
}

function getChallenge(challengeId) {
  if (challengeId === PRACTICE_CHALLENGE.id) return PRACTICE_CHALLENGE;
  if (challengeId === MAYRA_CHALLENGE.id) return MAYRA_CHALLENGE;
  return challengeId === GENERAL_CHALLENGE.id ? GENERAL_CHALLENGE : CHALLENGE;
}

const GUIDED_STEPS = [
  { path: "desafios", label: "Desafíos" },
  { path: "practicar", label: "Ejercicio" },
  { path: "informe", label: "Informe" },
];

function stepsForChallenge(challengeId) {
  return challengeId === PRACTICE_CHALLENGE.id ? PRACTICE_STEPS : GUIDED_STEPS;
}

function createHistoryRecord(challenge, draft) {
  const completedAt = draft.completedAt || new Date().toISOString();
  if (challenge.id === PRACTICE_CHALLENGE.id) {
    return {
      id: draft.id, challengeId: challenge.id, title: challenge.title, ticket: challenge.ticket,
      completedAt, verdict: "Práctica completada", ...practiceTotals(draft), draft,
    };
  }
  return {
    id: `${challenge.id}-${Date.now()}`,
    challengeId: challenge.id,
    title: challenge.title,
    ticket: challenge.ticket,
    completedAt,
    verdict: challenge.id === MAYRA_CHALLENGE.id
      ? { accept: "Aceptar", modify: "Modificar", reject: "Rechazar" }[draft.testing.verdict]
      : verdictLabel(draft.testing.verdict),
    passed: draft.testing.results.filter((result) => result.passed).length,
    total: draft.testing.results.length,
    draft: { ...draft, completedAt },
  };
}

function initializeWorksim() {
  const state = loadWorksimState();
  const openPractice = new URLSearchParams(window.location.search).get("desafio") === PRACTICE_CHALLENGE.id;
  if (!openPractice) return { ...state, activeStep: 0 };
  const draft = state.drafts[PRACTICE_CHALLENGE.id]?.started
    ? state.drafts[PRACTICE_CHALLENGE.id] : createPracticeDraft(true);
  return {
    ...state,
    drafts: { ...state.drafts, [PRACTICE_CHALLENGE.id]: draft },
    activeChallengeId: PRACTICE_CHALLENGE.id,
    activeStep: getPracticeStep(draft),
  };
}

export default function App() {
  const [initialState] = useState(initializeWorksim);
  const [drafts, setDrafts] = useState(() => initialState.drafts || {
    [CHALLENGE.id]: initialState.draft || createInitialDraft(),
  });
  const [history, setHistory] = useState(initialState.history);
  const [projectWork, setProjectWork] = useState(initialState.projectWork);
  const [bankProjectWork, setBankProjectWork] = useState(initialState.bankProjectWork);
  const [activityStreak, setActivityStreak] = useState(initialState.activityStreak);
  const [workspaceSection, setWorkspaceSection] = useState(() => (
    initialState.activeStep === 0 && new URLSearchParams(window.location.search).get("seccion") === "proyectos"
      ? "projects"
      : workspace.defaultSection
  ));
  const [activeChallengeId, setActiveChallengeId] = useState(() => (
    [CHALLENGE.id, GENERAL_CHALLENGE.id, MAYRA_CHALLENGE.id, PRACTICE_CHALLENGE.id].includes(initialState.activeChallengeId)
      ? initialState.activeChallengeId
      : CHALLENGE.id
  ));
  const [reportRecord, setReportRecord] = useState(null);
  const [activeStep, setActiveStep] = useState(initialState.activeStep);
  const [notice, setNotice] = useState(
    initialState.error ? { message: initialState.error, variant: "warning" } : null,
  );
  const [exitConfirmationOpen, setExitConfirmationOpen] = useState(false);
  const projectProgress = Object.fromEntries(
    BANK_PROJECTS.map(project => {
      const current = getProjectProgress(project, bankProjectWork[project.id]);
      const previous = getProjectProgress(PROJECTS.find(item => item.id === project.id), projectWork[project.id]);
      return [project.id, { ...current, completed: current.completed || previous.completed,
        inProgress: current.inProgress || previous.inProgress }];
    }),
  );
  const [theme, setTheme] = useState(loadThemePreference);
  const recordValidActivity = () => setActivityStreak(current => recordActivity(current));
  const activeChallenge = getChallenge(activeChallengeId);
  const isGeneral = activeChallengeId === GENERAL_CHALLENGE.id;
  const isMayra = activeChallengeId === MAYRA_CHALLENGE.id;
  const isPractice = activeChallengeId === PRACTICE_CHALLENGE.id;
  const steps = stepsForChallenge(activeChallengeId);
  const draft = reportRecord?.draft || drafts[activeChallengeId] || createDraftForChallenge(activeChallengeId);
  const maxUnlockedStep = isPractice ? getPracticeStep(draft) : draft.completedAt ? 2 : 1;

  const setDraft = (update) => {
    const challengeId = activeChallengeId;
    setDrafts((current) => {
      const currentDraft = current[challengeId] || createDraftForChallenge(challengeId);
      const nextDraft = typeof update === "function" ? update(currentDraft) : update;
      return { ...current, [challengeId]: nextDraft };
    });
  };

  const exitPractice = () => {
    setWorkspaceSection("explorer");
    moveTo(0);
  };

  useEffect(() => {
    try {
      saveWorksimState({ drafts, activeChallengeId, history, projectWork, bankProjectWork, activityStreak });
    } catch {
      setNotice({
        message: "No se pudieron guardar los cambios en este navegador.",
        variant: "error",
      });
    }
  }, [drafts, activeChallengeId, history, projectWork, bankProjectWork, activityStreak]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const practiceInUrl = url.searchParams.get("desafio") === PRACTICE_CHALLENGE.id;
    const showingPractice = isPractice && activeStep > 0;
    const projectsInUrl = url.searchParams.get("seccion") === "proyectos";
    const showingProjects = activeStep === 0 && workspaceSection === "projects";
    if (showingPractice === practiceInUrl && showingProjects === projectsInUrl) return;
    if (showingPractice !== practiceInUrl) {
      if (showingPractice) {
        url.searchParams.set("desafio", PRACTICE_CHALLENGE.id);
        url.hash = "";
      } else {
        url.searchParams.delete("desafio");
      }
    }
    if (showingProjects !== projectsInUrl) {
      if (showingProjects) url.searchParams.set("seccion", "proyectos");
      else url.searchParams.delete("seccion");
    }
    window.history.replaceState(window.history.state, "", url);
  }, [isPractice, activeStep, workspaceSection]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const changeTheme = (preference) => {
    if (preference !== "light" && preference !== "dark") return;
    setTheme(preference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      setNotice({
        message: "El tema cambiará ahora, pero no se pudo guardar la preferencia en este navegador.",
        variant: "warning",
      });
    }
  };

  const changeWorkspaceSection = (sectionId) => {
    if (!workspace.sections.some((section) => section.id === sectionId)) return;
    setWorkspaceSection(sectionId);
    setNotice(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToWorkspaceHome = () => {
    if (activeStep > 0) {
      returnToChallenges();
      return;
    }
    setWorkspaceSection(workspace.defaultSection);
    setNotice(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const moveTo = (step) => {
    setActiveStep(step);
    setNotice(null);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navigate = (step) => {
    if (step > maxUnlockedStep) {
      setNotice({
        message: "Completa y guarda la etapa actual para desbloquear la siguiente.",
        variant: "info",
      });
      return;
    }
    moveTo(step);
  };

  const startChallenge = (challengeId = CHALLENGE.id) => {
    setReportRecord(null);
    const selectedDraft = drafts[challengeId] || createDraftForChallenge(challengeId);
    setActiveChallengeId(challengeId);
    if (selectedDraft.started && !selectedDraft.completedAt) {
      if (challengeId === PRACTICE_CHALLENGE.id) {
        moveTo(getPracticeStep(selectedDraft));
        return;
      }
      moveTo(1);
      return;
    }
    setDrafts((current) => ({
      ...current,
      [challengeId]: challengeId === PRACTICE_CHALLENGE.id
        ? createPracticeDraft(true) : { ...createDraftForChallenge(challengeId), started: true },
    }));
    moveTo(1);
  };

  const updateTesting = (key, value) => {
    setDraft((current) => {
      if (key === "code" || key === "parameters" || key === "invalidateRun") {
        return {
          ...current,
          testing: {
            ...current.testing,
            [key === "parameters" ? "parameters" : "code"]: key === "invalidateRun" ? current.testing.code : value,
            executedCode: null,
            petsReviewVersion: undefined,
            ran: false,
            results: [],
            verdict: "",
            rationale: "",
          },
        };
      }
      return {
        ...current,
        testing: { ...current.testing, [key]: value },
      };
    });
  };

  const updateGeneralObservation = (claimId, key, value) => {
    setDraft((current) => ({
      ...current,
      testing: {
        ...current.testing,
        observations: current.testing.observations.map((observation) => (
          observation.claimId === claimId ? { ...observation, [key]: value } : observation
        )),
        ran: false,
        results: [],
      },
    }));
  };

  const updateGeneralOmission = (value) => {
    setDraft((current) => ({
      ...current,
      testing: {
        ...current.testing,
        omission: value,
        ran: false,
        results: [],
      },
    }));
  };

  const savePetsReview = (code, results) => {
    setDraft((current) => {
      if (current.testing.code !== code) return current;
      return {
        ...current,
        testing: {
          ...current.testing,
          ran: true,
          executedCode: code,
          results,
          petsReviewVersion: 1,
          runs: [
            ...current.testing.runs,
            {
              at: new Date().toISOString(),
              passed: results.filter((result) => result.passed).length,
              total: results.length,
            },
          ],
        },
      };
    });
  };

  const finishChallenge = () => {
    if (draft.completedAt) {
      moveTo(steps.length - 1);
      return;
    }
    if (!canCompleteChallenge(draft)) {
      setNotice({ message: "Completa tu intento y justifica la decisión antes de finalizar.", variant: "info" });
      return;
    }
    const completedAt = new Date().toISOString();
    const completedDraft = { ...draft, completedAt,
      ...(isGeneral ? { testing: { ...draft.testing, ran: true,
        results: evaluateGeneralReview(draft.testing).results } } : {}),
    };
    setDraft(completedDraft);
    setHistory((current) => [createHistoryRecord(activeChallenge, completedDraft), ...current]);
    recordValidActivity();
    moveTo(steps.length - 1);
  };

  const finishPractice = () => {
    if (!canCompletePractice(draft)) {
      moveTo(PRACTICE_CLOSING_STEP);
      setNotice({ message: "Responde la pregunta de seguridad para finalizar la práctica.", variant: "info" });
      return;
    }
    if (draft.completedAt) {
      exitPractice();
      return;
    }
    const completedDraft = { ...draft, completedAt: new Date().toISOString() };
    const record = createHistoryRecord(activeChallenge, completedDraft);
    setDraft(completedDraft);
    setHistory(current => [record, ...current.filter(item => item.id !== record.id)]);
    recordValidActivity();
    exitPractice();
  };

  const updateReflection = (key, value) => {
    if (reportRecord) {
      const updateRecord = record => ({ ...record, draft: { ...record.draft,
        reflection: { ...record.draft.reflection, [key]: value } } });
      setReportRecord(updateRecord);
      setHistory(current => current.map(item => item.id === reportRecord.id ? updateRecord(item) : item));
      return;
    }
    setDraft((current) => ({
      ...current,
      reflection: { ...current.reflection, [key]: value },
    }));
  };

  const copySummary = async () => {
    const audit = isPractice ? scoreDetection(draft.attempts.withdrawal.lines) : null;
    const summary = (isPractice
      ? [
        "WORKSIM · Práctica de SQL y Python",
        `Seguridad antes y después: ${draft.before} → ${draft.after} de 5`,
        ...exercises.map(exercise => {
          const attempt = draft.attempts[exercise.id];
          const ai = attempt.comparison?.ai;
          const comparison = ai ? ` · IA ${ai.passed}/${ai.total}` : "";
          return `${exercise.title} · ${attemptResultLabel(attempt)}${comparison}`;
        }),
        `Hallazgos de Python: ${draft.attempts.withdrawal.comparison ? `${audit.hits} de ${audit.total}` : "Revisión opcional pendiente"}`,
        `Cómo me sentí: ${draft.feel || "—"}`,
        `Comentario: ${draft.note || "—"}`,
      ]
      : isGeneral
      ? [
        `WORKSIM · ${activeChallenge.ticket}`,
        `Decisión: ${verdictLabel(draft.testing.verdict)}`,
        `Comprobaciones coincidentes: ${draft.testing.results.filter((item) => item.passed).length}/${draft.testing.results.length}`,
        `Justificación: ${draft.testing.rationale || "Sin justificación"}`,
        `Información omitida: ${draft.testing.omission || "Sin respuesta"}`,
      ]
      : [
        `WORKSIM · ${activeChallenge.ticket}`,
        `Dictamen: ${verdictLabel(draft.testing.verdict)}`,
        `Comprobaciones cumplidas: ${draft.testing.results.filter((item) => item.passed).length}/${draft.testing.results.length}`,
        `Justificación: ${draft.testing.rationale || "Sin justificación"}`,
        `Punto ciego: ${draft.reflection.blindSpot || "Sin respuesta"}`,
        `Evidencia: ${draft.reflection.evidence || "Sin respuesta"}`,
        `Situación real: ${draft.reflection.realWorld || "Sin respuesta"}`,
      ]).join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setNotice({ message: "Resumen copiado al portapapeles.", variant: "success" });
    } catch {
      setNotice({
        message: "No se pudo copiar el resumen. Puedes seleccionar el texto del informe.",
        variant: "warning",
      });
    }
  };

  const exportEvidence = () => {
    const evidence = {
      challenge: activeChallenge,
      exportedAt: new Date().toISOString(),
      draft,
      disclaimer: isPractice
        ? "SQL y Python se ejecutaron en el navegador con datos ficticios."
        : isMayra
        ? "La consulta se ejecutó en SQLite con datos ficticios."
        : isGeneral
        ? "Prototipo educativo; la retroalimentación se calcula a partir de una simulación guiada."
        : "Adopta+ usa datos ficticios. La versión de evaluación se indica en el intento.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `worksim-${activeChallenge.ticket.toLowerCase()}-evidencia.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const returnToChallenges = () => {
    setReportRecord(null);
    setWorkspaceSection("explorer");
    moveTo(0);
  };

  const requestChallengeExit = () => setExitConfirmationOpen(true);

  const confirmChallengeExit = () => {
    setDrafts(current => ({
      ...current,
      [activeChallengeId]: createDraftForChallenge(activeChallengeId),
    }));
    setExitConfirmationOpen(false);
    setWorkspaceSection("explorer");
    moveTo(0);
  };

  const updateProjectWork = (projectId, update, bank) => {
    const setWork = bank ? setBankProjectWork : setProjectWork;
    setWork(current => {
      const currentProject = current[projectId] || { answers: {}, submittedAnswers: null, submittedAt: null };
      const nextProject = typeof update === "function" ? update(currentProject) : update;
      return { ...current, [projectId]: nextProject };
    });
  };

  const openReport = () => {
    if (!draft.completedAt) {
      setNotice({
        message: "Completa el desafío actual antes de abrir un informe.",
        variant: "info",
      });
      return;
    }
    moveTo(steps.length - 1);
  };

  const openReportFor = (challengeId) => {
    if (!challengeId) return;
    const selectedDraft = drafts[challengeId];
    const record = latestCompletedRecord(history, challengeId, getChallenge(challengeId).ticket);
    const archived = !selectedDraft?.completedAt && record?.draft?.completedAt ? record : null;
    if (!selectedDraft?.completedAt && !archived) {
      setNotice({ message: "No hay un informe completado para este desafío.", variant: "info" });
      return;
    }
    setReportRecord(archived);
    setActiveChallengeId(challengeId);
    moveTo(stepsForChallenge(challengeId).length - 1);
  };

  const progress = Object.fromEntries(
    [CHALLENGE, GENERAL_CHALLENGE, MAYRA_CHALLENGE, PRACTICE_CHALLENGE].map(challenge => [
      challenge.id,
      getChallengeProgress(drafts[challenge.id], latestCompletedRecord(history, challenge.id, challenge.ticket)),
    ]),
  );

  const currentPage = () => {
    if (isPractice && activeStep > 0) {
      return <PracticeChallengePage
        step={activeStep}
        draft={draft}
        onUpdate={setDraft}
        onNext={() => moveTo(activeStep + 1)}
        onBack={reportRecord ? returnToChallenges : () => moveTo(activeStep - 1)}
        onNavigate={navigate}
        onExit={returnToChallenges}
        onComplete={finishPractice}
        onExport={exportEvidence}
        onCopy={copySummary}
      />;
    }
    if (isMayra && activeStep > 0) {
      return <MayraChallengePage
        step={activeStep}
        draft={draft}
        onUpdate={setDraft}
        onBack={() => moveTo(0)}
        onFinish={finishChallenge}
        onHome={returnToChallenges}
        onExport={exportEvidence}
      />;
    }
    switch (activeStep) {
      case 0:
        if (workspaceSection === "projects") {
          return <ProjectsPage profileName={workspace.profileName} projectWork={projectWork} bankProjectWork={bankProjectWork}
            onProjectWorkChange={updateProjectWork} onValidActivity={recordValidActivity} />;
        }
        if (workspaceSection === "explorer") {
          return (
            <ChallengesPage
              history={history}
              progress={progress}
              canOpenCurrentReport={Boolean(
                draft.completedAt
                && history[0]?.completedAt === draft.completedAt
                && (!history[0]?.challengeId || history[0].challengeId === activeChallengeId),
              )}
              onStart={startChallenge}
              onOpenReport={openReport}
            />
          );
        }
        return (
          <IndividualWorkspacePage
            workspace={workspace}
            section={workspaceSection}
            progress={progress}
            projectProgress={projectProgress}
            activityStreak={activityStreak}
            history={history}
            onOpenReport={openReportFor}
          />
        );
      case 1:
        return isGeneral
          ? <GeneralVerificationPage draft={draft} onUpdate={setDraft}
              onObservationChange={updateGeneralObservation} onOmissionChange={updateGeneralOmission}
              onDecisionChange={updateTesting}
              onBack={() => moveTo(0)} onFinish={finishChallenge} />
          : <TestingPage testing={draft.testing} onChange={updateTesting} onRun={savePetsReview}
              onBack={() => moveTo(0)} onContinue={finishChallenge} />;
      case 2: {
        const Report = isGeneral ? GeneralReportPage : ReportPage;
        return <Report draft={draft} history={history} onReflectionChange={updateReflection}
          onBack={reportRecord ? undefined : () => moveTo(1)} onHome={returnToChallenges}
          onRestart={() => startChallenge(activeChallengeId)} onCopy={copySummary} onExport={exportEvidence} />;
      }
      default:
        return null;
    }
  };

  return (
    <>
      <AppHeader
        activeStep={activeStep}
        maxUnlockedStep={maxUnlockedStep}
        onNavigate={navigate}
        onBrandClick={activeStep > 0 && !draft.completedAt ? requestChallengeExit : goToWorkspaceHome}
        onExitChallenge={requestChallengeExit}
        completed={Boolean(draft.completedAt)}
        theme={theme}
        onThemeChange={changeTheme}
        workspace={workspace}
        workspaceSection={workspaceSection}
        onWorkspaceSectionChange={changeWorkspaceSection}
        steps={steps}
        showStageNavigation={activeStep === 0}
        profileName={activeStep > 0 && (isGeneral || isMayra || isPractice) ? "Participante" : workspace.profileName}
        profileRole={activeStep > 0 ? activeChallenge.role : workspace.profileRole}
      />
      <main className={activeStep > 0 ? "page-shell practice-page" : "page-shell"}>
        <div className="page-content">{currentPage()}</div>
      </main>
      {exitConfirmationOpen && activeStep > 0 && (
        <ExitChallengeDialog
          onCancel={() => setExitConfirmationOpen(false)}
          onConfirm={confirmChallengeExit}
        />
      )}
      {notice && <StatusNotice className="floating-notice" variant={notice.variant}>{notice.message}</StatusNotice>}
      <footer className="site-footer">
        <span>
          ENV_ID: #WS-SIM-PROD-01 · ESTADO: {activeStep === 0
            ? `ESPACIO ${workspace.label.toUpperCase()}`
            : draft.completedAt ? "PRÁCTICA COMPLETADA" : "PRÁCTICA EN CURSO"}
        </span>
        <span>WORKSIM · Proyecto i3lab · Practica con criterio. Crece con confianza.</span>
      </footer>
    </>
  );
}
