import { useEffect, useState } from "react";
import { MAYRA_CHALLENGE } from "./data/mayra";
import MayraChallengePage from "./features/MayraChallengePage";
import AppHeader from "./components/AppHeader";
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
import ReportPage from "./features/ReportPage";
import TestingPage from "./features/TestingPage";
import { evaluateGeneralReview } from "./lib/generalChallenge";
import { simulateTests, verdictLabel } from "./lib/simulation";
import { loadWorksimState, saveWorksimState } from "./lib/storage";
import { getWorkspace } from "./data/workspaces";
import { exercises, PRACTICE_CHALLENGE, PRACTICE_CLOSING_STEP, PRACTICE_STEPS, scoreDetection } from "./practica/cases.mjs";
import { canCompletePractice, createPracticeDraft, getAttemptResult, getPracticeStep, practiceTotals } from "./practica/state.mjs";

const THEME_STORAGE_KEY = "worksim-theme";
const workspace = getWorkspace("individual");

function loadThemePreference() {
  try {
    const preference = window.localStorage.getItem(THEME_STORAGE_KEY);
    return ["auto", "light", "dark"].includes(preference) ? preference : "auto";
  } catch {
    return "auto";
  }
}

function createDraftForChallenge(challengeId) {
  if (challengeId === PRACTICE_CHALLENGE.id) return createPracticeDraft();
  if (challengeId === GENERAL_CHALLENGE.id) return createInitialGeneralDraft();
  const draft = createInitialDraft();
  draft.testing.code = "";
  if (challengeId === MAYRA_CHALLENGE.id) {
    draft.kind = "sql";
    draft.testing.rows = [];
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
  const [workspaceSection, setWorkspaceSection] = useState(workspace.defaultSection);
  const [activeChallengeId, setActiveChallengeId] = useState(() => (
    [CHALLENGE.id, GENERAL_CHALLENGE.id, MAYRA_CHALLENGE.id, PRACTICE_CHALLENGE.id].includes(initialState.activeChallengeId)
      ? initialState.activeChallengeId
      : CHALLENGE.id
  ));
  const [activeStep, setActiveStep] = useState(initialState.activeStep);
  const [notice, setNotice] = useState(
    initialState.error ? { message: initialState.error, variant: "warning" } : null,
  );
  const [theme, setTheme] = useState(loadThemePreference);
  const activeChallenge = getChallenge(activeChallengeId);
  const isGeneral = activeChallengeId === GENERAL_CHALLENGE.id;
  const isMayra = activeChallengeId === MAYRA_CHALLENGE.id;
  const isPractice = activeChallengeId === PRACTICE_CHALLENGE.id;
  const steps = stepsForChallenge(activeChallengeId);
  const draft = drafts[activeChallengeId] || createDraftForChallenge(activeChallengeId);
  const maxUnlockedStep = isPractice ? getPracticeStep(draft) : draft.completedAt ? 2 : 1;

  const setDraft = (update) => {
    const challengeId = activeChallengeId;
    setDrafts((current) => {
      const currentDraft = current[challengeId] || createDraftForChallenge(challengeId);
      const nextDraft = typeof update === "function" ? update(currentDraft) : update;
      return { ...current, [challengeId]: nextDraft };
    });
  };

  useEffect(() => {
    try {
      saveWorksimState({ drafts, activeChallengeId, history });
    } catch {
      setNotice({
        message: "No se pudieron guardar los cambios en este navegador.",
        variant: "error",
      });
    }
  }, [drafts, activeChallengeId, history]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const practiceInUrl = url.searchParams.get("desafio") === PRACTICE_CHALLENGE.id;
    const showingPractice = isPractice && activeStep > 0;
    if (showingPractice === practiceInUrl) return;
    if (showingPractice) {
      url.searchParams.set("desafio", PRACTICE_CHALLENGE.id);
      url.hash = "";
    } else {
      url.searchParams.delete("desafio");
    }
    window.history.replaceState(window.history.state, "", url);
  }, [isPractice, activeStep]);

  useEffect(() => {
    const root = document.documentElement;
    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const selectedTheme = theme === "auto"
        ? themeMedia.matches ? "dark" : "light"
        : theme;
      root.dataset.theme = selectedTheme;
      root.style.colorScheme = selectedTheme;
    };
    const handleSystemThemeChange = () => {
      if (theme === "auto") applyTheme();
    };

    applyTheme();
    if (theme === "auto") themeMedia.addEventListener("change", handleSystemThemeChange);
    return () => themeMedia.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const changeTheme = (preference) => {
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
      if (isPractice) {
        leavePractice();
        return;
      }
      moveTo(0);
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
      if (key === "code") {
        return {
          ...current,
          testing: {
            ...current.testing,
            code: value,
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
        verdict: "",
        rationale: "",
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
        verdict: "",
        rationale: "",
      },
    }));
  };

  const runTests = () => {
    setDraft((current) => {
      const results = simulateTests(current.testing.code);
      return {
        ...current,
        testing: {
          ...current.testing,
          ran: true,
          results,
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

  const saveGeneralVerification = () => {
    setDraft((current) => {
      const results = evaluateGeneralReview(current.testing).results;
      return {
        ...current,
        testing: {
          ...current.testing,
          ran: true,
          results,
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
    const completedAt = new Date().toISOString();
    const completedDraft = { ...draft, completedAt };
    setDraft(completedDraft);
    setHistory((current) => [createHistoryRecord(activeChallenge, completedDraft), ...current]);
    moveTo(steps.length - 1);
  };

  const leavePractice = () => {
    if (!draft.completedAt && getPracticeStep(draft) === PRACTICE_CLOSING_STEP) {
      if (!canCompletePractice(draft)) {
        moveTo(PRACTICE_CLOSING_STEP);
        setNotice({ message: "Responde la pregunta de seguridad para volver al portal.", variant: "info" });
        return;
      }
      const completedDraft = { ...draft, completedAt: new Date().toISOString() };
      const record = createHistoryRecord(activeChallenge, completedDraft);
      setDraft(completedDraft);
      setHistory(current => [record, ...current.filter(item => item.id !== record.id)]);
    }
    moveTo(0);
  };

  const updateReflection = (key, value) => {
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
          const user = getAttemptResult(attempt);
          const ai = attempt.comparison?.ai;
          const comparison = ai ? ` · IA ${ai.passed}/${ai.total}` : "";
          return `${exercise.title} · Mi código ${user.passed}/${user.total}${comparison}`;
        }),
        `Hallazgos de Python: ${audit.hits} de ${audit.total}`,
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
        `Pruebas con señal compatible: ${draft.testing.results.filter((item) => item.passed).length}/${draft.testing.results.length}`,
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
        : "Prototipo educativo; las comprobaciones del sandbox son simuladas.",
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
    setDraft(createDraftForChallenge(activeChallengeId));
    moveTo(0);
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
    const selectedDraft = drafts[challengeId];
    if (!selectedDraft?.completedAt) {
      setNotice({ message: "No hay un informe completado para este desafío.", variant: "info" });
      return;
    }
    setActiveChallengeId(challengeId);
    moveTo(stepsForChallenge(challengeId).length - 1);
  };

  const progress = Object.fromEntries(
    Object.entries(drafts).map(([challengeId, challengeDraft]) => [
      challengeId,
      {
        completed: Boolean(challengeDraft.completedAt),
        inProgress: challengeDraft.started && !challengeDraft.completedAt,
      },
    ]),
  );

  const currentPage = () => {
    if (isPractice && activeStep > 0) {
      return <PracticeChallengePage
        step={activeStep}
        draft={draft}
        onUpdate={setDraft}
        onNext={() => moveTo(activeStep + 1)}
        onBack={() => moveTo(activeStep - 1)}
        onHome={leavePractice}
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
        onHome={() => moveTo(0)}
        onExport={exportEvidence}
      />;
    }
    switch (activeStep) {
      case 0:
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
            history={history}
            onOpenReport={openReportFor}
          />
        );
      case 1:
        return isGeneral
          ? <GeneralVerificationPage draft={draft} onUpdate={setDraft}
              onObservationChange={updateGeneralObservation} onOmissionChange={updateGeneralOmission}
              onVerify={saveGeneralVerification} onDecisionChange={updateTesting}
              onBack={() => moveTo(0)} onFinish={finishChallenge} />
          : <TestingPage testing={draft.testing} onChange={updateTesting} onRun={runTests}
              onBack={() => moveTo(0)} onContinue={finishChallenge} />;
      case 2: {
        const Report = isGeneral ? GeneralReportPage : ReportPage;
        return <Report draft={draft} history={history} onReflectionChange={updateReflection}
          onBack={() => moveTo(1)} onRestart={returnToChallenges} onCopy={copySummary} onExport={exportEvidence} />;
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
        onBrandClick={goToWorkspaceHome}
        completed={Boolean(draft.completedAt)}
        theme={theme}
        onThemeChange={changeTheme}
        workspace={workspace}
        workspaceSection={workspaceSection}
        onWorkspaceSectionChange={changeWorkspaceSection}
        steps={steps}
        profileName={activeStep > 0 && (isGeneral || isMayra || isPractice) ? "Participante" : workspace.profileName}
        profileRole={activeStep > 0 ? activeChallenge.role : workspace.profileRole}
      />
      <main className={activeStep > 0 ? "page-shell practice-page" : "page-shell"}>
        <div className="page-content">{currentPage()}</div>
      </main>
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
