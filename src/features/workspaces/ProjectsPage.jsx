import { useEffect, useId, useRef, useState } from "react";
import ActionButton from "../../components/ActionButton";
import ExperienceCard from "../../components/ExperienceCard";
import Icon from "../../components/Icon";
import { AREA_BY_ID, AREAS } from "../../data/areas";
import { BANK_PROJECTS } from "../../data/bankProjects";
import ReviewPrompt from "../../components/ReviewPrompt";
import { PORTFOLIO_SAMPLE, PROJECTS } from "../../data/projects";
import { evaluateProjectSubmission, getProjectProgress, isNewAcceptedSubmission } from "../../lib/projects";
import "./projects.css";
import ProjectEvidence from "../projects/ProjectEvidence";
import { EVALUATION_LABELS, normalizeEvidence } from "../../lib/projects";

const salesMonths = [
  { label: "Ene", sales: 8200 },
  { label: "Feb", sales: 7400 },
  { label: "Mar", sales: 6100 },
];
const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const inventoryRoutes = [["GET", "/movimientos/{id}"], ["POST", "/movimientos"]];
const campaignPosts = [
  ["Lun", "Anuncio"],
  ["Mié", "Demo"],
  ["Vie", "Aviso final"],
];

function SalesPreview() {
  const maximum = Math.max(...salesMonths.map(({ sales }) => sales));
  return (
    <div className="project-preview-board">
      <div className="project-preview-title"><Icon name="clipboard-list" size={15} /> Transacciones liquidadas</div>
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
          <div className="project-preview-title"><Icon name="terminal" size={15} /> Registro de movimientos</div>
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
  const area = AREA_BY_ID[project.area];
  return <span className="project-area"><Icon name={area.icon} size={15} />{area.label}</span>;
}

function ProjectStatus({ progress }) {
  if (progress.completed) return <span className="project-status complete">Validación objetiva cumplida</span>;
  if (progress.needsImprovement) return <span className="project-status needs-improvement">Necesita mejoras</span>;
  if (progress.inProgress) return <span className="project-status in-progress">En curso</span>;
  return <span className="project-status">Sin iniciar</span>;
}

function ProjectCard({ project, progress, onOpen }) {
  return (
    <ExperienceCard
      className="project-card"
      visual={<ProjectPreview area={project.area} />}
      area={AREA_BY_ID[project.area].label}
      areaIcon={AREA_BY_ID[project.area].icon}
      title={project.title}
      description={project.description}
      difficulty={project.difficulty}
      duration={project.duration}
      tags={project.tags}
      status={<ProjectStatus progress={progress} />}
      actions={
        <button className="button secondary" type="button" onClick={onOpen} aria-label={`Ver proyecto ${project.title}`}>
          Ver proyecto <Icon name="arrow-right" size={16} />
        </button>
      }
    />
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

function ProjectValidation({ progress }) {
  const titleId = useId();
  if (!progress.evaluation) {
    return (
      <div className="project-validation" aria-live="polite">
        <h3>Validación de la entrega</h3>
        <p>Aún no has entregado este proyecto. Al final de las etapas podrás validar tu trabajo con criterios específicos de esta área.</p>
      </div>
    );
  }

  return (
    <section className="project-validation" aria-live="polite" aria-labelledby={titleId}>
      <div className="project-validation-heading">
        <h3 id={titleId}>Resultado de la última entrega</h3>
        <ProjectStatus progress={progress} />
      </div>
      <p>
        {progress.submissionIsCurrent
          ? progress.evaluation.passed
            ? "Se cumplieron las comprobaciones objetivas. La explicación y los entregables abiertos requieren revisión cualitativa."
            : "Revisa los criterios pendientes, ajusta tus respuestas y vuelve a entregar."
          : "Hay cambios posteriores a esta entrega. Revisa la retroalimentación y vuelve a entregar para validar la versión actual."}
      </p>
      <ul className="project-validation-list">
        {progress.evaluation.criteria.map((criterion) => (
          <li key={criterion.id}>
            <div className="project-validation-criterion">
              <strong>{criterion.title}</strong>
              <span className={criterion.passed ? "criterion-passed" : "criterion-pending"}>
                {EVALUATION_LABELS[criterion.status] || (criterion.passed ? "Cumplido" : "Necesita mejoras")}
              </span>
            </div>
            <ul>
              {criterion.requirements.map((requirement) => (
                <li key={requirement.label} className={requirement.passed ? "criterion-passed" : "criterion-pending"}>
                  {requirement.passed ? "Cumplido · " : "Por revisar · "}{requirement.label}
                  {requirement.feedback && <p>{requirement.feedback}</p>}
                </li>
              ))}
            </ul>
            {criterion.review && <p>{criterion.review}</p>}
          </li>
        ))}
      </ul>
      <p className="project-validation-note">
        {progress.evaluation.version >= 2 ? progress.evaluation.review : "Evaluación histórica por palabras clave. Conserva su resultado original. Vuelve a entregar con la nueva evidencia para aplicar la rúbrica actual."}
      </p>
    </section>
  );
}

function ProjectDetail({ project, work, onWorkChange, onBack, onValidActivity, headingRef }) {
  const [stageIndex, setStageIndex] = useState(0);
  const stageHeadingRef = useRef(null);
  const focusStage = useRef(false);
  const stage = project.stages[stageIndex];
  const drafts = work.answers || {};
  const progress = getProjectProgress(project, work);
  const review = project.bank && drafts[stageIndex]?.trim()
    ? evaluateProjectSubmission(project, drafts, work.evidence, work.inventoryRun, work.inventoryCode)
      .criteria[stageIndex].requirements.find(item => !item.passed)
    : null;

  useEffect(() => {
    if (!focusStage.current) return;
    focusStage.current = false;
    stageHeadingRef.current?.focus();
  }, [stageIndex]);

  function goToStage(index) {
    if (index === stageIndex) return;
    focusStage.current = true;
    setStageIndex(index);
  }

  function submitProject() {
    const submittedAnswers = { ...drafts };
    const evaluation = evaluateProjectSubmission(project, submittedAnswers, work.evidence, work.inventoryRun, work.inventoryCode);
    onWorkChange({
      ...work,
      submittedAnswers,
      submittedAt: new Date().toISOString(),
      evaluation,
      submittedEvidence: normalizeEvidence(project, work.evidence),
      submittedInventoryCode: work.inventoryCode || "",
      submissions: [...(work.submissions || []), ...(work.submittedAt ? [{
        submittedAt: work.submittedAt, submittedAnswers: work.submittedAnswers,
        submittedEvidence: work.submittedEvidence, submittedInventoryCode: work.submittedInventoryCode,
        evaluation: work.evaluation,
      }] : [])],
    });
    if (isNewAcceptedSubmission(project, work, evaluation)) onValidActivity();
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
                <button type="button" aria-current={index === stageIndex ? "step" : undefined} onClick={() => goToStage(index)}>
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
          <ProjectEvidence key={stageIndex} project={project} stageIndex={stageIndex} work={work} onWorkChange={onWorkChange} />
          <label className="project-draft-label" htmlFor="project-draft">Tu trabajo en esta etapa</label>
          <textarea id="project-draft" rows={5} value={drafts[stageIndex] ?? ""}
            placeholder="Anota cómo abordarías esta etapa…"
            onChange={event => onWorkChange({
              ...work,
              answers: { ...drafts, [stageIndex]: event.target.value },
            })} />
          <p className="project-draft-note">Se guarda automáticamente en este navegador.</p>
          {project.bank ? (drafts[stageIndex]?.trim() && <ReviewPrompt
            question={review ? `¿Qué dato o prueba usarías para verificar «${review.label}»?` : stage.hint}
            hint={review ? (review.hint || stage.hint) : undefined} />) :
          <details className="project-ai" key={stage.title}>
            <summary><Icon name="sparkles" size={17} />Ver ejemplo de apoyo de IA</summary>
            <p>{stage.hint}</p>
          </details>}
          <ProjectValidation progress={progress} />
          {work.submissions?.length > 0 && <details className="project-reference">
            <summary>Entregas anteriores ({work.submissions.length})</summary>
            {work.submissions.map((submission, index) => <details key={index}>
              <summary>{new Date(submission.submittedAt).toLocaleString("es")} · Rúbrica {submission.evaluation?.version || 1}</summary>
              {project.stages.map((item, i) => <section key={i}><h3>{item.title}</h3><p>{submission.submittedAnswers?.[i] || "Sin explicación"}</p></section>)}
              <pre>{JSON.stringify(submission.submittedEvidence || {}, null, 2)}</pre>
              {submission.submittedInventoryCode && <pre>{submission.submittedInventoryCode}</pre>}
              <ProjectValidation progress={{ evaluation: submission.evaluation, submissionIsCurrent: true }} />
            </details>)}
          </details>}
          <div className="project-stage-actions">
            {stageIndex > 0 && (
              <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={() => goToStage(stageIndex - 1)}>
                Etapa anterior
              </ActionButton>
            )}
            {stageIndex < project.stages.length - 1
              ? <ActionButton icon="arrow-right" onClick={() => goToStage(stageIndex + 1)}>Siguiente etapa</ActionButton>
              : <ActionButton icon="check" onClick={submitProject}>
                  {progress.evaluation ? "Volver a entregar para validar" : "Entregar proyecto para validar"}
                </ActionButton>}
          </div>
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

export default function ProjectsPage({ profileName, projectWork, bankProjectWork, onProjectWorkChange, onValidActivity }) {
  const [view, setView] = useState({ kind: "catalog" });
  const [area, setArea] = useState("all");
  const headingRef = useRef(null);
  const focusHeading = useRef(false);
  const visibleProjects = area === "all" ? BANK_PROJECTS : BANK_PROJECTS.filter(project => project.area === area);

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
                {[["all", "Todas"], ...AREAS.map(({ id, filter }) => [id, filter])].map(([id, label]) => (
                  <button type="button" key={id} aria-pressed={area === id} onClick={() => setArea(id)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="project-grid">
              {visibleProjects.map(item => (
                <ProjectCard key={item.id} project={item} progress={getProjectProgress(item, bankProjectWork[item.id])}
                  onOpen={() => show({ kind: "project", project: item })} />
              ))}
            </div>
          </section>
        </>
      )}
      {view.kind === "project" && <>
        {project.bank && (() => {
          const legacy = PROJECTS.find(item => item.id === project.id);
          const progress = getProjectProgress(legacy, projectWork[project.id]);
          return (progress.inProgress || progress.completed) && (
            <ActionButton variant="secondary" onClick={() => show({ kind: "project", project: legacy })}>
              Abrir mi trabajo anterior · {legacy.title}
            </ActionButton>
          );
        })()}
        <ProjectDetail key={`${project.id}-${Boolean(project.bank)}`} project={project}
          work={(project.bank ? bankProjectWork : projectWork)[project.id]} headingRef={headingRef}
          onBack={project.bank ? backToCatalog : () => show({ kind: "project", project: BANK_PROJECTS.find(item => item.id === project.id) })}
          onValidActivity={onValidActivity} onWorkChange={update => onProjectWorkChange(project.id, update, project.bank)} />
      </>}
      {view.kind === "portfolio" && <ProjectPortfolio profileName={profileName} onBack={backToCatalog} headingRef={headingRef} />}
    </div>
  );
}
