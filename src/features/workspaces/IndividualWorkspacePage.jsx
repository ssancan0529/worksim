import { AVAILABLE_CHALLENGES } from "../../data/catalog";
import {
  WorkspaceFrame,
  WorkspaceMetric,
  WorkspaceNotice,
  WorkspacePanel,
  WorkspaceStatus,
} from "./WorkspaceComponents";

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value))
    : "Fecha no disponible";
}

export default function IndividualWorkspacePage({
  workspace,
  section,
  progress,
  history,
  onOpenReport,
}) {
  const completedCount = Object.values(progress).filter((item) => item.completed).length;
  const inProgressCount = Object.values(progress).filter((item) => item.inProgress).length;
  const progressCount = Object.values(progress).filter((item) => item.completed || item.inProgress).length;
  const latestHistory = history.filter((record, index) => (
    history.findIndex((entry) => entry.challengeId === record.challengeId) === index
  ));
  const availableReports = latestHistory.filter((record) => progress[record.challengeId]?.completed);

  let title = "Tu progreso";
  let description = "Revisa las experiencias que has iniciado y las competencias que has practicado.";
  if (section === "history") {
    title = "Historial de actividades";
    description = "Retoma el contexto de tus desafíos completados y consulta sus informes personales.";
  } else if (section === "reports") {
    title = "Informes personales";
    description = "Consulta la retroalimentación formativa de tus experiencias.";
  } else if (section === "profile") {
    title = "Tu perfil";
    description = "Un espacio de práctica personal. El prototipo no gestiona una cuenta real.";
  }

  return (
    <WorkspaceFrame
      workspace={workspace}
      eyebrow={`WORKSIM / INDIVIDUAL / ${section.toUpperCase()}`}
      title={title}
      description={description}
    >
      {section === "progress" && (
        <>
          <div className="workspace-metrics">
            <WorkspaceMetric icon="circle-check" label="COMPLETADOS" value={completedCount} detail="Desafíos terminados" />
            <WorkspaceMetric icon="play" label="EN CURSO" value={inProgressCount} detail="Experiencias iniciadas" />
            <WorkspaceMetric icon="brain" label="DESAFÍOS CON PROGRESO" value={progressCount} detail="Con actividad registrada" />
          </div>
          <WorkspacePanel title="Explora competencias" description="Practica con situaciones guiadas; no son calificaciones ni certificaciones.">
            <div className="workspace-chip-list">
              {["Pensamiento crítico", "Validación de información", "Resolución de problemas", "Comunicación"].map((item) => (
                <span className="tag" key={item}>{item}</span>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Tus desafíos" description="La exploración sigue siendo el punto de partida.">
            <div className="workspace-entity-list">
              {AVAILABLE_CHALLENGES.map((challenge) => {
                const item = progress[challenge.id] || {};
                return (
                  <article className="workspace-entity-row" key={challenge.id}>
                    <div><strong>{challenge.title}</strong><span>{challenge.categoryId === "general" ? "Pensamiento crítico" : challenge.profession}</span></div>
                    <WorkspaceStatus variant={item.completed ? "success" : item.inProgress ? "warning" : "neutral"}>
                      {item.completed ? "Completado" : item.inProgress ? "En curso" : "Disponible"}
                    </WorkspaceStatus>
                  </article>
                );
              })}
            </div>
          </WorkspacePanel>
        </>
      )}

      {section === "history" && (
        <WorkspacePanel title="Actividad reciente" description="Tus registros se guardan en este navegador.">
          {history.length ? (
            <div className="workspace-entity-list">
              {history.map((record, index) => {
                const isLatest = history.findIndex((entry) => entry.challengeId === record.challengeId) === index;
                const canOpenReport = isLatest && Boolean(progress[record.challengeId]?.completed);
                return (
                  <article className="workspace-entity-row" key={record.id}>
                    <div>
                      <strong>{record.title}</strong>
                      <span>{formatDate(record.completedAt)} · {record.verdict || "Práctica completada"}</span>
                    </div>
                    {canOpenReport
                      ? <button className="text-button" type="button" onClick={() => onOpenReport(record.challengeId)}>Ver informe</button>
                      : <WorkspaceStatus>Registro histórico</WorkspaceStatus>}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="workspace-empty">Cuando completes un desafío, aparecerá aquí.</p>
          )}
        </WorkspacePanel>
      )}

      {section === "reports" && (
        <>
          <WorkspaceNotice icon="lightbulb">
            Los informes reflejan evidencia y retroalimentación del prototipo; no representan una certificación profesional.
          </WorkspaceNotice>
          <WorkspacePanel title="Informes disponibles" description="Cada informe pertenece a tu actividad personal.">
            {availableReports.length ? (
              <div className="workspace-entity-list">
                {availableReports.map((record) => (
                  <article className="workspace-entity-row" key={record.id}>
                    <div>
                      <strong>{record.title}</strong>
                      <span>Completado el {formatDate(record.completedAt)}</span>
                    </div>
                    <button className="button secondary" type="button" onClick={() => onOpenReport(record.challengeId)}>
                      Abrir informe
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="workspace-empty">Completa una experiencia para generar tu primer informe.</p>
            )}
          </WorkspacePanel>
        </>
      )}

      {section === "profile" && (
        <>
          <WorkspacePanel title="Perfil de demostración">
            <div className="workspace-profile-card">
              <div className="avatar">AM</div>
              <div><strong>Alejandro Mora</strong><span>Estudiante · Espacio individual</span></div>
              <WorkspaceStatus variant="neutral">Prototipo local</WorkspaceStatus>
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Modalidades de WORKSIM" description="Representación conceptual; no se procesan pagos ni se activa una suscripción.">
            <div className="workspace-plan-grid">
              <article className="workspace-plan-card current">
                <span className="eyebrow">ACTUAL EN LA DEMOSTRACIÓN</span>
                <h3>Gratuita</h3>
                <p>Desafíos introductorios y funciones personales básicas.</p>
                <WorkspaceStatus variant="success">En uso</WorkspaceStatus>
              </article>
              <article className="workspace-plan-card">
                <span className="eyebrow">OPCIÓN CONCEPTUAL</span>
                <h3>Premium individual</h3>
                <p>Desafíos especializados, rutas de entrenamiento e informes avanzados.</p>
                <WorkspaceStatus>Sin contratación</WorkspaceStatus>
              </article>
            </div>
          </WorkspacePanel>
        </>
      )}
    </WorkspaceFrame>
  );
}
