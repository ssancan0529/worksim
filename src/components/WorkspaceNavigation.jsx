import Icon from "./Icon";

export default function WorkspaceNavigation({ workspace, activeSection, onNavigate }) {
  return (
    <nav className="workspace-nav" aria-label={`Secciones de ${workspace.label}`}>
      {workspace.sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`workspace-nav-item ${activeSection === section.id ? "active" : ""}`}
          aria-current={activeSection === section.id ? "page" : undefined}
          onClick={() => onNavigate(section.id)}
        >
          <Icon name={section.icon} size={15} />
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  );
}
