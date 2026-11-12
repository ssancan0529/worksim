import { STEPS } from "../data/scenario";
import Icon from "./Icon";
import WorkspaceNavigation from "./WorkspaceNavigation";

function Navigation({ steps, activeStep, maxUnlockedStep, onNavigate, mobile = false }) {
  return (
    <nav
      className={mobile ? "mobile-step-nav" : "step-nav"}
      aria-label="Etapas del desafío"
    >
      {steps.slice(1).map((step, position) => {
        const index = position + 1;
        const locked = index > maxUnlockedStep;
        const current = activeStep === index;
        return (
          <div className={mobile ? "mobile-step-item" : "step-nav-item"} key={step.path}>
            {!mobile && index > 1 && <span className="nav-dash" aria-hidden="true">—</span>}
            <button
              className={
                mobile
                  ? `mobile-nav-step ${current ? "active" : ""}`
                  : `nav-step ${current ? "active" : ""}`
              }
              onClick={() => onNavigate(index)}
              aria-current={current ? "step" : undefined}
              aria-label={`${index}. ${step.label}${locked ? " (bloqueado)" : ""}`}
              disabled={locked}
            >
              {mobile ? (
                <>{index}. {step.label}</>
              ) : (
                <>
                  <span className="nav-number">{index < maxUnlockedStep ? <Icon name="check" size={12} /> : index}</span>
                  <span>{step.label}</span>
                </>
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export default function AppHeader({
  activeStep,
  maxUnlockedStep,
  onNavigate,
  onBrandClick,
  onExitChallenge,
  completed,
  theme = "light",
  onThemeChange,
  workspace,
  workspaceSection,
  onWorkspaceSectionChange,
  showStageNavigation = true,
  steps = STEPS,
  profileName = "Alejandro Mora",
  profileRole = "Backend Jr",
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button
          className="brand"
          onClick={onBrandClick}
          aria-label={activeStep > 0
            ? completed ? "Volver al Explorador" : "Salir del desafío"
            : `Ir al inicio de ${workspace.label}`}
        >
          <span className="brand-name">WORKSIM</span>
        </button>
        {activeStep > 0 && showStageNavigation && (
          <Navigation
            steps={steps}
            activeStep={activeStep}
            maxUnlockedStep={maxUnlockedStep}
            onNavigate={onNavigate}
          />
        )}
        <div className="header-actions">
        {activeStep > 0 && !completed && (
          <button type="button" className="challenge-exit-button" onClick={onExitChallenge}>
            <Icon name="arrow-left" size={16} />
            Salir del Desafío
          </button>
        )}
        {activeStep > 0 && completed && (
          <button type="button" className="challenge-return-button" onClick={onBrandClick}>
            <Icon name="arrow-left" size={16} />
            Volver al Explorador
          </button>
        )}
        <div className="header-theme" role="group" aria-label="Tema de apariencia">
          <button type="button" className="theme-icon-button" aria-label="Tema claro"
            aria-pressed={theme === "light"} onClick={() => onThemeChange("light")}>
            <Icon name="sun" size={18} />
          </button>
          <button type="button" className="theme-icon-button" aria-label="Tema oscuro"
            aria-pressed={theme === "dark"} onClick={() => onThemeChange("dark")}>
            <Icon name="moon" size={18} />
          </button>
        </div>
        <div className="user-status">
          <span className={`status-dot ${activeStep > 0 && completed ? "done" : ""}`} />
          <span className="status-label">
            {activeStep === 0 ? "Demostración" : completed ? "Práctica completada" : "Desafío activo"}
          </span>
          <div className="user-profile">
            <div className="user-copy"><strong>{profileName}</strong><span>{profileRole}</span></div>
            <span className="avatar"><Icon name="user" size={17} /></span>
          </div>
        </div>
        </div>
      </div>
      {activeStep === 0 ? (
        <WorkspaceNavigation
          workspace={workspace}
          activeSection={workspaceSection}
          onNavigate={onWorkspaceSectionChange}
        />
      ) : showStageNavigation ? (
        <Navigation
          steps={steps}
          mobile
          activeStep={activeStep}
          maxUnlockedStep={maxUnlockedStep}
          onNavigate={onNavigate}
        />
      ) : null}
    </header>
  );
}
