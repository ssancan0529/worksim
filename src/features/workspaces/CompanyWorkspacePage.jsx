import {
  WorkspaceFrame,
  WorkspaceMetric,
  WorkspaceNotice,
  WorkspacePanel,
  WorkspaceProgress,
  WorkspaceStatus,
} from "./WorkspaceComponents";

const TEAMS = [
  { name: "Operaciones", people: 34, active: 26 },
  { name: "Atención al cliente", people: 22, active: 18 },
  { name: "Producto", people: 17, active: 12 },
];

const SIMULATIONS = [
  { title: "Verificar un resumen de reunión", team: "Operaciones", status: "Disponible", variant: "success" },
  { title: "Evaluar una propuesta de IA", team: "Producto", status: "En preparación", variant: "neutral" },
  { title: "Responder a un caso de cliente", team: "Atención al cliente", status: "En curso", variant: "warning" },
];

export default function CompanyWorkspacePage({ workspace, section, onAction }) {
  const page = {
    teams: ["Equipos", "Organiza la capacitación por equipos y áreas de trabajo."],
    simulations: ["Simulaciones", "Explora y asigna prácticas profesionales basadas en el uso de IA."],
    training: ["Capacitación", "Revisa el avance general de las rutas asignadas."],
    reports: ["Informes empresariales", "Observa tendencias agregadas para orientar la capacitación."],
  }[section] || ["Equipos", "Organiza la capacitación por equipos y áreas de trabajo."];

  return (
    <WorkspaceFrame workspace={workspace} eyebrow={`WORKSIM / EMPRESA / ${section.toUpperCase()}`} title={page[0]} description={page[1]}>
      <div className="workspace-metrics">
        <WorkspaceMetric icon="briefcase" label="EQUIPOS" value="3" detail="Áreas de demostración" />
        <WorkspaceMetric icon="clipboard-list" label="SIMULACIONES" value="4" detail="Disponibles y planificadas" />
        <WorkspaceMetric icon="circle-check" label="PARTICIPACIÓN" value="76%" detail="Actividad agregada simulada" />
      </div>

      {section === "teams" && (
        <WorkspacePanel
          title="Equipos"
          description="Ejemplos ficticios; no corresponden a colaboradores reales."
          action={<button className="button secondary" type="button" onClick={() => onAction("La gestión de usuarios se representa en este prototipo.")}>Gestionar equipos</button>}
        >
          <div className="workspace-entity-list">
            {TEAMS.map((team) => (
              <article className="workspace-entity-row" key={team.name}>
                <div><strong>{team.name}</strong><span>{team.people} colaboradores · {team.active} con actividad</span></div>
                <WorkspaceStatus variant="success">Activo</WorkspaceStatus>
              </article>
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "simulations" && (
        <WorkspacePanel
          title="Banco de simulaciones"
          description="La disponibilidad indica si existe una experiencia iniciable en el catálogo."
          action={<button className="button" type="button" onClick={() => onAction("La asignación se simula; no se notificó a colaboradores reales.")}>Asignar simulación</button>}
        >
          <div className="workspace-entity-list">
            {SIMULATIONS.map((simulation) => (
              <article className="workspace-entity-row" key={simulation.title}>
                <div><strong>{simulation.title}</strong><span>Equipo sugerido: {simulation.team}</span></div>
                <WorkspaceStatus variant={simulation.variant}>{simulation.status}</WorkspaceStatus>
              </article>
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "training" && (
        <WorkspacePanel title="Rutas de capacitación" description="Seguimiento de ejemplo por área; no se muestran resultados personales.">
          <div className="workspace-entity-list">
            <WorkspaceProgress label="Criterio frente a IA" value={69} detail="Ruta introductoria · participación agregada" />
            <WorkspaceProgress label="Verificación y comunicación" value={54} detail="Ruta en curso · participación agregada" />
            <WorkspaceProgress label="Uso responsable de herramientas" value={37} detail="Ruta planificada" />
          </div>
        </WorkspacePanel>
      )}

      {section === "reports" && (
        <>
          <WorkspaceNotice icon="shield">
            Los reportes son agregados por equipo y tienen fines de capacitación. No exponen resultados individuales ni otorgan certificaciones profesionales.
          </WorkspaceNotice>
          <WorkspacePanel title="Competencias del equipo" description="Datos simulados; las oportunidades de mejora se reportan a nivel agregado.">
            <div className="workspace-entity-list">
              <WorkspaceProgress label="Verificación de resultados de IA" value={71} detail="Tendencia agregada" />
              <WorkspaceProgress label="Juicio profesional" value={63} detail="Oportunidad de refuerzo" />
              <WorkspaceProgress label="Comunicación de riesgos" value={78} detail="Tendencia agregada" />
            </div>
          </WorkspacePanel>
        </>
      )}
    </WorkspaceFrame>
  );
}
