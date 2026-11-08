import {
  WorkspaceFrame,
  WorkspaceMetric,
  WorkspaceNotice,
  WorkspacePanel,
  WorkspaceProgress,
  WorkspaceStatus,
} from "./WorkspaceComponents";

const COHORTS = [
  { name: "Introducción a IA · Grupo A", students: 28, active: 21, completed: 13 },
  { name: "Comunicación profesional · Grupo B", students: 24, active: 18, completed: 9 },
  { name: "Pensamiento crítico · Grupo C", students: 31, active: 25, completed: 17 },
];

const ASSIGNMENTS = [
  { title: "El informe que no coincide", cohort: "Introducción a IA · Grupo A", status: "Disponible", variant: "success" },
  { title: "Revisión de una API de adopción", cohort: "Pensamiento crítico · Grupo C", status: "En curso", variant: "warning" },
  { title: "Diseño de una experiencia accesible", cohort: "Comunicación profesional · Grupo B", status: "Próximamente", variant: "neutral" },
];

export default function InstitutionWorkspacePage({ workspace, section, onAction }) {
  const page = {
    cohorts: ["Cohortes", "Organiza grupos y revisa su actividad general."],
    assignments: ["Asignaciones", "Planifica desafíos para una cohorte; las experiencias futuras no son iniciables."],
    activity: ["Seguimiento de actividades", "Observa tendencias de participación sin abrir resultados personales."],
    reports: ["Informes institucionales", "Consulta señales agregadas para orientar el acompañamiento educativo."],
  }[section] || ["Cohortes", "Organiza grupos y revisa su actividad general."];

  return (
    <WorkspaceFrame workspace={workspace} eyebrow={`WORKSIM / INSTITUCIÓN / ${section.toUpperCase()}`} title={page[0]} description={page[1]}>
      <div className="workspace-metrics">
        <WorkspaceMetric icon="user" label="COHORTES ACTIVAS" value="3" detail="Grupos de demostración" />
        <WorkspaceMetric icon="clipboard-list" label="ASIGNACIONES" value="6" detail="Experiencias planificadas" />
        <WorkspaceMetric icon="circle-check" label="PARTICIPACIÓN" value="68%" detail="Actividad agregada simulada" />
      </div>

      {section === "cohorts" && (
        <>
          <WorkspacePanel
            title="Cohortes"
            description="Datos ficticios para ilustrar el espacio de coordinación."
            action={<button className="button secondary" type="button" onClick={() => onAction("La creación de cohortes se representa en este prototipo.")}>Nueva cohorte</button>}
          >
            <div className="workspace-entity-list">
              {COHORTS.map((cohort) => (
                <article className="workspace-entity-row" key={cohort.name}>
                  <div><strong>{cohort.name}</strong><span>{cohort.students} estudiantes · {cohort.active} con actividad · {cohort.completed} completaron</span></div>
                  <WorkspaceStatus variant="success">Activa</WorkspaceStatus>
                </article>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Necesidades de refuerzo" description="Señales agregadas, no evaluaciones individuales.">
            <div className="workspace-chip-list"><span className="tag">Verificación de fuentes</span><span className="tag">Criterio frente a IA</span></div>
          </WorkspacePanel>
        </>
      )}

      {section === "assignments" && (
        <WorkspacePanel
          title="Desafíos asignados"
          description="Las asignaciones de muestra son conceptuales y usan escenarios del catálogo."
          action={<button className="button" type="button" onClick={() => onAction("La asignación se simula; no se notificó a estudiantes reales.")}>Crear asignación</button>}
        >
          <div className="workspace-entity-list">
            {ASSIGNMENTS.map((assignment) => (
              <article className="workspace-entity-row" key={assignment.title}>
                <div><strong>{assignment.title}</strong><span>{assignment.cohort}</span></div>
                <WorkspaceStatus variant={assignment.variant}>{assignment.status}</WorkspaceStatus>
              </article>
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "activity" && (
        <WorkspacePanel title="Actividad por cohorte" description="La vista resume participación y avance sin mostrar estudiantes individuales.">
          <div className="workspace-entity-list">
            {COHORTS.map((cohort) => (
              <WorkspaceProgress key={cohort.name} label={cohort.name} value={Math.round((cohort.completed / cohort.students) * 100)} detail={`${cohort.completed} de ${cohort.students} finalizaron`} />
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "reports" && (
        <>
          <WorkspaceNotice icon="shield">
            Solo se presentan resultados agregados por cohorte. No se incluyen nombres, respuestas ni informes personales; no son certificaciones profesionales.
          </WorkspaceNotice>
          <WorkspacePanel title="Competencias observadas" description="Distribución ficticia para mostrar cómo se vería un reporte agregado.">
            <div className="workspace-entity-list">
              <WorkspaceProgress label="Pensamiento crítico" value={74} detail="Tendencia de los grupos activos" />
              <WorkspaceProgress label="Verificación de información" value={61} detail="Área con oportunidad de refuerzo" />
              <WorkspaceProgress label="Comunicación de decisiones" value={82} detail="Tendencia de los grupos activos" />
            </div>
          </WorkspacePanel>
        </>
      )}
    </WorkspaceFrame>
  );
}
