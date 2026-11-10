import { useEffect, useState } from "react";
import AppHeader from "./components/AppHeader";
import StatusNotice from "./components/StatusNotice";
import {
  CHALLENGE,
  createInitialDraft,
  createInitialGeneralDraft,
  GENERAL_CHALLENGE,
  GENERAL_STEPS,
  ORIGINAL_CODE,
  STEPS,
} from "./data/scenario";
import AnalysisPage from "./features/AnalysisPage";
import BriefingPage from "./features/BriefingPage";
import ChallengesPage from "./features/ChallengesPage";
import GeneralAnalysisPage from "./features/GeneralAnalysisPage";
import GeneralBriefingPage from "./features/GeneralBriefingPage";
import GeneralDecisionPage from "./features/GeneralDecisionPage";
import GeneralInvestigationPage from "./features/GeneralInvestigationPage";
import GeneralReportPage from "./features/GeneralReportPage";
import GeneralVerificationPage from "./features/GeneralVerificationPage";
import IndividualWorkspacePage from "./features/workspaces/IndividualWorkspacePage";
import InvestigationPage from "./features/InvestigationPage";
import ReportPage from "./features/ReportPage";
import TestingPage from "./features/TestingPage";
import { evaluateGeneralReview } from "./lib/generalChallenge";
import { getUnlockedStep, simulateTests, verdictLabel } from "./lib/simulation";
import { loadWorksimState, saveWorksimState } from "./lib/storage";
import { getWorkspace } from "./data/workspaces";

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
  return challengeId === GENERAL_CHALLENGE.id
    ? createInitialGeneralDraft()
    : createInitialDraft();
}

function getChallenge(challengeId) {
  return challengeId === GENERAL_CHALLENGE.id ? GENERAL_CHALLENGE : CHALLENGE;
}

function createHistoryRecord(challenge, draft) {
  const completedAt = draft.completedAt || new Date().toISOString();
  return {
    id: `${challenge.id}-${Date.now()}`,
    challengeId: challenge.id,
    title: challenge.title,
    ticket: challenge.ticket,
    completedAt,
    verdict: verdictLabel(draft.testing.verdict),
    passed: draft.testing.results.filter((result) => result.passed).length,
    total: draft.testing.results.length,
    draft: { ...draft, completedAt },
  };
}

export default function App() {
  const [initialState] = useState(loadWorksimState);
  const [drafts, setDrafts] = useState(() => initialState.drafts || {
    [CHALLENGE.id]: initialState.draft || createInitialDraft(),
  });
  const [history, setHistory] = useState(initialState.history);
  const [workspaceSection, setWorkspaceSection] = useState(workspace.defaultSection);
  const [activeChallengeId, setActiveChallengeId] = useState(() => (
    [CHALLENGE.id, GENERAL_CHALLENGE.id].includes(initialState.activeChallengeId)
      ? initialState.activeChallengeId
      : CHALLENGE.id
  ));
  const [activeStep, setActiveStep] = useState(0);
  const [notice, setNotice] = useState(
    initialState.error ? { message: initialState.error, variant: "warning" } : null,
  );
  const [theme, setTheme] = useState(loadThemePreference);
  const activeChallenge = getChallenge(activeChallengeId);
  const isGeneral = activeChallengeId === GENERAL_CHALLENGE.id;
  const steps = isGeneral ? GENERAL_STEPS : STEPS;
  const draft = drafts[activeChallengeId] || createDraftForChallenge(activeChallengeId);
  const maxUnlockedStep = getUnlockedStep(draft);

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
      const resumeAt = challengeId === GENERAL_CHALLENGE.id
        ? selectedDraft.testing.ran
          ? 5
          : selectedDraft.investigation.reviewed
            ? 4
            : selectedDraft.analysis.saved
              ? 3
              : selectedDraft.briefingRead
                ? 2
                : 1
        : selectedDraft.investigation.reviewed
          ? 4
          : selectedDraft.analysis.saved
            ? 3
            : selectedDraft.briefingRead
              ? 2
              : 1;
      moveTo(resumeAt);
      return;
    }
    setDrafts((current) => ({
      ...current,
      [challengeId]: { ...createDraftForChallenge(challengeId), started: true },
    }));
    moveTo(1);
  };

  const updateAnalysis = (key, value) => {
    setDraft((current) => ({
      ...current,
      analysis: { ...current.analysis, [key]: value, saved: false },
    }));
  };

  const saveAnalysis = () => {
    setDraft((current) => ({
      ...current,
      analysis: { ...current.analysis, saved: true },
    }));
    moveTo(3);
  };

  const readBriefing = () => {
    setDraft((current) => ({ ...current, briefingRead: true }));
    moveTo(2);
  };

  const updateInvestigation = (key, value, checked) => {
    setDraft((current) => {
      const investigation = { ...current.investigation, reviewed: false };
      if (key === "hypotheses") {
        const hypotheses = [...investigation.hypotheses];
        hypotheses[value] = checked;
        investigation.hypotheses = hypotheses;
      } else {
        investigation[key] = value;
      }
      return { ...current, investigation };
    });
  };

  const saveInvestigation = () => {
    setDraft((current) => ({
      ...current,
      investigation: { ...current.investigation, reviewed: true },
    }));
    moveTo(4);
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
    setNotice({ message: "Suite simulada completada.", variant: "success" });
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
    moveTo(5);
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

  const updateReflection = (key, value) => {
    setDraft((current) => ({
      ...current,
      reflection: { ...current.reflection, [key]: value },
    }));
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(ORIGINAL_CODE);
      setNotice({ message: "Propuesta copiada al portapapeles.", variant: "success" });
    } catch {
      setNotice({
        message: "No se pudo copiar el código. Selecciónalo para copiarlo manualmente.",
        variant: "warning",
      });
    }
  };

  const copySummary = async () => {
    const summary = (isGeneral
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
      disclaimer: isGeneral
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
    moveTo(challengeId === GENERAL_CHALLENGE.id ? GENERAL_STEPS.length - 1 : STEPS.length - 1);
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
          ? <GeneralBriefingPage onBack={() => moveTo(0)} onContinue={readBriefing} />
          : <BriefingPage onBack={() => moveTo(0)} onContinue={readBriefing} />;
      case 2:
        return isGeneral
          ? (
            <GeneralAnalysisPage
              analysis={draft.analysis}
              onChange={updateAnalysis}
              onBack={() => moveTo(1)}
              onContinue={saveAnalysis}
            />
          )
          : (
            <AnalysisPage
              analysis={draft.analysis}
              onChange={updateAnalysis}
              onBack={() => moveTo(1)}
              onContinue={saveAnalysis}
            />
          );
      case 3:
        return isGeneral
          ? (
            <GeneralInvestigationPage
              analysis={draft.analysis}
              onBack={() => moveTo(2)}
              onContinue={saveInvestigation}
            />
          )
          : (
            <InvestigationPage
              analysis={draft.analysis}
              investigation={draft.investigation}
              onChange={updateInvestigation}
              onCopyCode={copyCode}
              onBack={() => moveTo(2)}
              onContinue={saveInvestigation}
            />
          );
      case 4:
        return isGeneral
          ? (
            <GeneralVerificationPage
              testing={draft.testing}
              onObservationChange={updateGeneralObservation}
              onOmissionChange={updateGeneralOmission}
              onBack={() => moveTo(3)}
              onContinue={saveGeneralVerification}
            />
          )
          : (
            <TestingPage
              testing={draft.testing}
              onChange={updateTesting}
              onRun={runTests}
              onResetCode={() => updateTesting("code", ORIGINAL_CODE)}
              onBack={() => moveTo(3)}
              onContinue={finishChallenge}
            />
          );
      case 5:
        return isGeneral
          ? (
            <GeneralDecisionPage
              testing={draft.testing}
              onChange={updateTesting}
              onBack={() => moveTo(4)}
              onContinue={finishChallenge}
            />
          )
          : (
            <ReportPage
              draft={draft}
              history={history}
              onReflectionChange={updateReflection}
              onBack={() => moveTo(4)}
              onRestart={returnToChallenges}
              onCopy={copySummary}
              onExport={exportEvidence}
            />
          );
      case 6:
        return isGeneral
          ? (
            <GeneralReportPage
              draft={draft}
              history={history}
              onReflectionChange={updateReflection}
              onBack={() => moveTo(5)}
              onRestart={returnToChallenges}
              onCopy={copySummary}
              onExport={exportEvidence}
            />
          )
          : null;
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
        profileName={activeStep > 0 && isGeneral ? "Participante" : workspace.profileName}
        profileRole={activeStep > 0 ? activeChallenge.role : workspace.profileRole}
      />
      <main className="page-shell">
        <div className="page-content">{currentPage()}</div>
      </main>
      {notice && <StatusNotice className="floating-notice" variant={notice.variant}>{notice.message}</StatusNotice>}
      <footer className="site-footer">
        <span>
          ENV_ID: #WS-SIM-PROD-01 · ESTADO: {activeStep === 0
            ? `ESPACIO ${workspace.label.toUpperCase()}`
            : draft.completedAt ? "PRÁCTICA COMPLETADA" : "LISTO PARA INICIO"}
        </span>
        <span>WORKSIM · Proyecto i3lab · Practica con criterio. Crece con confianza.</span>
      </footer>
    </>
  );
}
