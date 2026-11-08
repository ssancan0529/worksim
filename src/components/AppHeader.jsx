import { STEPS } from "../data/scenario";
import { WORKSPACES } from "../data/workspaces";
import Icon from "./Icon";
import WorkspaceNavigation from "./WorkspaceNavigation";

function Navigation({ steps, activeStep, maxUnlockedStep, onNavigate, mobile = false }) {
  return (
    <nav
      className={mobile ? "mobile-step-nav" : "step-nav"}
      aria-label="Etapas del desafío"
    >
      {steps.map((step, index) => {
        const locked = index > maxUnlockedStep;
        const current = activeStep === index;
        return (
          <div className={mobile ? "mobile-step-item" : "step-nav-item"} key={step.path}>
            {!mobile && index > 0 && <span className="nav-dash" aria-hidden="true">—</span>}
            <button
              className={
                mobile
                  ? `mobile-nav-step ${current ? "active" : ""}`
                  : `nav-step ${current ? "active" : ""}`
              }
              onClick={() => onNavigate(index)}
              aria-current={current ? "step" : undefined}
              aria-label={`${index + 1}. ${step.label}${locked ? " (bloqueado)" : ""}`}
              disabled={locked}
            >
              {mobile ? (
                <>{index + 1}. {step.label}</>
              ) : (
                <>
                  <span className="nav-number">{index < maxUnlockedStep ? <Icon name="check" size={12} /> : index + 1}</span>
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
  completed,
  theme = "auto",
  onThemeChange,
  workspace,
  workspaceSection,
  onWorkspaceChange,
  onWorkspaceSectionChange,
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
          aria-label={`Ir al inicio de ${workspace.label}`}
        >
          <span className="brand-name">WORKSIM</span>
          <span className="brand-slash">/</span>
          <span className="brand-section">
            {activeStep > 0
              ? steps[activeStep].label
              : workspace.sections.find((section) => section.id === workspaceSection)?.label}
          </span>
        </button>
        {activeStep > 0 && (
          <Navigation
            steps={steps}
            activeStep={activeStep}
            maxUnlockedStep={maxUnlockedStep}
            onNavigate={onNavigate}
          />
        )}
        <label className="header-workspace">
          <span>Espacio</span>
          <select
            aria-label="Cambiar espacio de trabajo"
            value={workspace.id}
            onChange={(event) => onWorkspaceChange(event.target.value)}
          >
            {WORKSPACES.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="header-theme">
          <span>Tema</span>
          <select
            aria-label="Cambiar tema de apariencia"
            value={theme}
            onChange={(event) => onThemeChange(event.target.value)}
          >
            <option value="auto">Automático</option>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
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
      {activeStep === 0 ? (
        <WorkspaceNavigation
          workspace={workspace}
          activeSection={workspaceSection}
          onNavigate={onWorkspaceSectionChange}
        />
      ) : (
        <Navigation
          steps={steps}
          mobile
          activeStep={activeStep}
          maxUnlockedStep={maxUnlockedStep}
          onNavigate={onNavigate}
        />
      )}
    </header>
  );
}
