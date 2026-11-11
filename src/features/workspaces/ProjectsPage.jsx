import { useEffect, useRef, useState } from "react";
import ActionButton from "../../components/ActionButton";
import Icon from "../../components/Icon";
import { PORTFOLIO_SAMPLE, PROJECT_AREAS, PROJECTS } from "../../data/projects";
import "./projects.css";

const salesMonths = [
  { label: "Ene", sales: 8200 },
  { label: "Feb", sales: 7400 },
  { label: "Mar", sales: 6100 },
];
const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const inventoryRoutes = [
  ["GET", "/productos"],
  ["POST", "/productos"],
  ["PATCH", "/productos/{id}/stock"],
];
const campaignPosts = [
  ["Lun", "Anuncio"],
  ["Mié", "Demo"],
  ["Vie", "Aviso final"],
];

function SalesPreview() {
  const maximum = Math.max(...salesMonths.map(({ sales }) => sales));
  return (
    <div className="project-preview-board">
      <div className="project-preview-title"><Icon name="clipboard-list" size={15} /> Ventas del trimestre</div>
      <div className="project-sales-chart">
        {salesMonths.map(({ label, sales }) => (
          <div className="project-sales-column" key={label}>
            <div className="project-sales-track">
              <span className="project-sales-bar" style={{ height: `${sales / maximum * 100}%` }} title={usd.format(sales)} />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectPreview({ area }) {
  return (
    <div className={`project-preview project-preview-${area}`} aria-hidden="true">
      {area === "data" && <SalesPreview />}
      {area === "software" && (
        <div className="project-preview-board project-api-board">
          <div className="project-preview-title"><Icon name="terminal" size={15} /> Servicio de inventario</div>
          <ul>{inventoryRoutes.map(([method, path]) => (
            <li key={method}><strong>{method}</strong><code>{path}</code></li>
          ))}</ul>
        </div>
      )}
      {area === "communication" && (
        <div className="project-preview-board">
          <div className="project-preview-title"><Icon name="clipboard-list" size={15} /> Semana de lanzamiento</div>
          <div className="project-campaign-grid">{campaignPosts.map(([day, post]) => (
            <div key={day}><span>{day}</span><strong>{post}</strong></div>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function ProjectArea({ project }) {
  const area = PROJECT_AREAS[project.area];
  return <span className="project-area"><Icon name={area.icon} size={15} />{area.label}</span>;
}

function ProjectCard({ project, onOpen }) {
  return (
    <article className="project-card">
      <ProjectPreview area={project.area} />
      <div className="project-card-body">
        <ProjectArea project={project} />
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <p className="project-card-deliverables">{project.deliverables.map(({ name }) => name).join(" · ")}</p>
        <button className="button secondary" type="button" onClick={onOpen} aria-label={`Ver proyecto ${project.title}`}>
          Ver proyecto <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </article>
  );
}

function ProjectFiles({ project }) {
  return (
    <aside className="project-panel project-files">
      <h2>Entregables</h2>
      <ul className="project-file-list">
        {project.deliverables.map(({ name, path }) => (
          <li key={path}><Icon name="file" size={17} /><div><strong>{name}</strong><code>{path}</code></div></li>
        ))}
      </ul>
      <details className="project-export">
        <summary><Icon name="code" size={17} />Vista de exportación a GitHub</summary>
        <div>
          <p>Repositorio de ejemplo <code>{project.id}</code></p>
          <ul aria-label="Archivos del repositorio">
            <li><code>README.md</code></li>
            {project.deliverables.map(({ path }) => <li key={path}><code>{path}</code></li>)}
          </ul>
        </div>
      </details>
    </aside>
  );
}

function ProjectDetail({ project, drafts, onDraftChange, onBack, headingRef }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stageHeadingRef = useRef(null);
  const focusStage = useRef(false);
  const stage = project.stages[stageIndex];

  useEffect(() => {
    if (!focusStage.current) return;
    focusStage.current = false;
    stageHeadingRef.current?.focus();
  }, [stageIndex]);

  function goToNextStage() {
    focusStage.current = true;
    setStageIndex(stageIndex + 1);
  }

  return (
    <>
      <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={onBack}>Volver a proyectos</ActionButton>
      <header className="projects-detail-heading">
        <ProjectArea project={project} />
        <h1 tabIndex={-1} ref={headingRef}>{project.title}</h1>
        <p>{project.brief}</p>
      </header>
      <div className="project-workspace">
        <nav className="project-panel project-stage-nav" aria-label="Etapas del proyecto">
          <h2>Etapas</h2>
          <ol>
            {project.stages.map(({ title }, index) => (
              <li key={title}>
                <button type="button" aria-current={index === stageIndex ? "step" : undefined} onClick={() => setStageIndex(index)}>
                  <span aria-hidden="true">{index + 1}</span>{title}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <section className="project-panel project-stage" aria-labelledby="project-stage-title">
          <h2 id="project-stage-title" tabIndex={-1} ref={stageHeadingRef}>{stage.title}</h2>
          <p>{stage.description}</p>
          <ul className="plain-list">{stage.tasks.map(task => <li key={task}>{task}</li>)}</ul>
          <label className="project-draft-label" htmlFor="project-draft">Borrador temporal</label>
          <textarea id="project-draft" rows={5} value={drafts[stageIndex] ?? ""}
            placeholder="Anota cómo abordarías esta etapa…"
            onChange={event => onDraftChange(stageIndex, event.target.value)} />
          <details className="project-ai" key={stage.title}>
            <summary><Icon name="sparkles" size={17} />Ver ejemplo de apoyo de IA</summary>
            <p>{stage.hint}</p>
          </details>
          {stageIndex < project.stages.length - 1 && (
            <div className="project-stage-actions">
              <ActionButton variant="secondary" icon="arrow-right" onClick={goToNextStage}>Siguiente etapa</ActionButton>
            </div>
          )}
        </section>
        <ProjectFiles project={project} />
      </div>
    </>
  );
}

function ProjectPortfolio({ profileName, onBack, headingRef }) {
  const sample = PROJECTS.find(project => project.id === PORTFOLIO_SAMPLE.projectId);
  return (
    <>
      <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={onBack}>Volver a proyectos</ActionButton>
      <header className="projects-detail-heading project-portfolio-heading">
        <div className="project-portfolio-mark"><Icon name="briefcase" size={24} /></div>
        <div>
          <h1 tabIndex={-1} ref={headingRef}>Mi portafolio</h1>
          <p>Vista de muestra para empresas · {profileName}</p>
        </div>
      </header>
      <div className="project-portfolio-layout">
        <article className="project-panel project-portfolio-result">
          <ProjectArea project={sample} />
          <h2>{sample.title}</h2>
          <p>{PORTFOLIO_SAMPLE.summary}</p>
          <div className="project-portfolio-evidence">
            <div>
              <h3>Resultado</h3>
              <p>{PORTFOLIO_SAMPLE.outcome}</p>
            </div>
            <ProjectPreview area={sample.area} />
          </div>
          <div className="project-portfolio-notes">
            <section><h3>Mi contribución</h3><p>{PORTFOLIO_SAMPLE.contribution}</p></section>
            <section><h3>Apoyo de la IA</h3><p>{PORTFOLIO_SAMPLE.aiUse}</p></section>
          </div>
        </article>
        <ProjectFiles project={sample} />
      </div>
    </>
  );
}

export default function ProjectsPage({ profileName }) {
  const [view, setView] = useState({ kind: "catalog" });
  const [area, setArea] = useState("all");
  const [drafts, setDrafts] = useState({});
  const headingRef = useRef(null);
  const focusHeading = useRef(false);
  const visibleProjects = area === "all" ? PROJECTS : PROJECTS.filter(project => project.area === area);

  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [view]);

  function show(next) {
    focusHeading.current = true;
    setView(next);
  }

  const backToCatalog = () => show({ kind: "catalog" });
  const project = view.project;

  return (
    <div className="projects-page">
      {view.kind === "catalog" && (
        <>
          <header className="projects-hero">
            <div>
              <h1 tabIndex={-1} ref={headingRef}>Proyectos</h1>
              <p>Desarrolla un proyecto por etapas y prepara entregables para tu portafolio.</p>
            </div>
            <button type="button" className="project-portfolio-shortcut" onClick={() => show({ kind: "portfolio" })}>
              <span className="project-portfolio-mark"><Icon name="briefcase" size={22} /></span>
              <span><strong>Mi portafolio</strong><small>Ver una entrega de muestra</small></span>
              <Icon name="arrow-right" size={19} />
            </button>
          </header>
          <section aria-labelledby="project-catalog-title">
            <div className="project-catalog-toolbar">
              <h2 id="project-catalog-title">Proyectos por área</h2>
              <div className="project-filters" role="group" aria-label="Filtrar proyectos por área">
                {[["all", "Todas"], ...Object.entries(PROJECT_AREAS).map(([id, item]) => [id, item.filter])].map(([id, label]) => (
                  <button type="button" key={id} aria-pressed={area === id} onClick={() => setArea(id)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="project-grid">
              {visibleProjects.map(item => (
                <ProjectCard key={item.id} project={item} onOpen={() => show({ kind: "project", project: item })} />
              ))}
            </div>
          </section>
        </>
      )}
      {view.kind === "project" && <ProjectDetail key={project.id} project={project} drafts={drafts[project.id] ?? {}}
        headingRef={headingRef} onBack={backToCatalog} onDraftChange={(stageIndex, text) => setDrafts(current => ({
          ...current, [project.id]: { ...current[project.id], [stageIndex]: text },
        }))} />}
      {view.kind === "portfolio" && <ProjectPortfolio profileName={profileName} onBack={backToCatalog} headingRef={headingRef} />}
    </div>
  );
}
