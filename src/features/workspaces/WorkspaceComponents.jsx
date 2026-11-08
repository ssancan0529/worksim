import Icon from "../../components/Icon";
import PageIntro from "../../components/PageIntro";

export function WorkspaceFrame({ workspace, eyebrow, title, description, children }) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} description={description}>
        <div className="role-card workspace-role-card">
          <span className="role-icon"><Icon name="briefcase" /></span>
          <span><small>{workspace.audience}</small><strong>{workspace.mode}</strong></span>
        </div>
      </PageIntro>
      {children}
    </>
  );
}

export function WorkspaceMetric({ icon, label, value, detail }) {
  return (
    <article className="workspace-metric">
      <span className="workspace-metric-icon"><Icon name={icon} size={18} /></span>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="workspace-metric-detail">{detail}</span>
    </article>
  );
}

export function WorkspacePanel({ title, description, action, children, className = "" }) {
  return (
    <section className={`workspace-panel ${className}`.trim()}>
      <div className="workspace-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function WorkspaceStatus({ children, variant = "neutral" }) {
  return <span className={`workspace-status ${variant}`}>{children}</span>;
}

export function WorkspaceNotice({ icon = "info", children }) {
  return (
    <aside className="workspace-notice">
      <Icon name={icon} size={17} />
      <p>{children}</p>
    </aside>
  );
}

export function WorkspaceProgress({ label, value, detail }) {
  return (
    <div className="workspace-progress-row">
      <div><strong>{label}</strong><span>{detail}</span></div>
      <div className="workspace-progress-track" role="img" aria-label={`${label}: ${value}%`}>
        <span style={{ width: `${value}%` }} />
      </div>
      <strong className="workspace-progress-value">{value}%</strong>
    </div>
  );
}
