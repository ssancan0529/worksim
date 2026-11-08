import { useState } from "react";
import { AVAILABLE_CHALLENGES, PLANNED_CHALLENGES } from "../../data/catalog";
import {
  WorkspaceFrame,
  WorkspaceMetric,
  WorkspaceNotice,
  WorkspacePanel,
  WorkspaceStatus,
} from "./WorkspaceComponents";

const RUBRIC = [
  ["Contraste con fuentes", "Identifica qué afirmaciones están respaldadas y cuáles necesitan revisión."],
  ["Criterio y decisión", "Propone aceptar, modificar o rechazar con una justificación proporcional a la evidencia."],
  ["Comunicación responsable", "Explica límites y riesgos sin descartar automáticamente todo resultado de IA."],
];

export default function CreatorWorkspacePage({ workspace, section, onAction }) {
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(false);
  const [publication, setPublication] = useState("Borrador");
  const page = {
    bank: ["Banco de desafíos", "Administra experiencias disponibles y áreas en preparación."],
    editor: ["Editor de desafío", "Define el contexto, las fuentes y las decisiones que evaluará la experiencia."],
    competencies: ["Competencias", "Configura qué capacidades se observan durante cada simulación."],
    evaluation: ["Rúbricas y casos de prueba", "Conecta evidencias observables con criterios de retroalimentación."],
    publication: ["Disponibilidad y publicación", "Revisa los estados del catálogo antes de habilitar una experiencia."],
  }[section] || ["Banco de desafíos", "Administra experiencias disponibles y áreas en preparación."];

  function saveDraft(event) {
    event.preventDefault();
    if (!title.trim()) {
      setSaved(false);
      return;
    }
    setSaved(true);
    onAction("Borrador guardado en esta vista de demostración.");
  }

  return (
    <WorkspaceFrame workspace={workspace} eyebrow={`WORKSIM / CONTENIDO / ${section.toUpperCase()}`} title={page[0]} description={page[1]}>
      <div className="workspace-metrics">
        <WorkspaceMetric icon="clipboard-list" label="DESAFÍOS PUBLICADOS" value={AVAILABLE_CHALLENGES.length} detail="Experiencias iniciables" />
        <WorkspaceMetric icon="history" label="EN PREPARACIÓN" value={PLANNED_CHALLENGES.length} detail="Contenido planificado" />
        <WorkspaceMetric icon="brain" label="COMPETENCIAS" value="12" detail="Catálogo de muestra" />
      </div>

      {section === "bank" && (
        <WorkspacePanel
          title="Catálogo editorial"
          description="El contenido no disponible permanece visible, pero no se puede iniciar."
          action={<button className="button" type="button" onClick={() => onAction("Abre la sección Editor para preparar un desafío.")}>Crear desafío</button>}
        >
          <div className="workspace-entity-list">
            {[...AVAILABLE_CHALLENGES, ...PLANNED_CHALLENGES].map((challenge) => (
              <article className="workspace-entity-row" key={challenge.id}>
                <div><strong>{challenge.title}</strong><span>{challenge.category || challenge.profession || challenge.area} · {challenge.level || "Nivel por definir"}</span></div>
                <WorkspaceStatus variant={challenge.status === "available" ? "success" : "neutral"}>
                  {challenge.status === "available" ? "Disponible" : "Próximamente"}
                </WorkspaceStatus>
              </article>
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "editor" && (
        <WorkspacePanel title="Nuevo desafío" description="Este formulario solo ilustra el flujo editorial; los datos no se publican en el catálogo real.">
          <form className="workspace-editor-form" onSubmit={saveDraft}>
            <label className="form-field">
              <span className="editor-label">Nombre del desafío</span>
              <input value={title} onChange={(event) => { setTitle(event.target.value); setSaved(false); }} placeholder="Ej. El brief que cambió de alcance" />
            </label>
            <div className="workspace-form-grid">
              <label className="form-field"><span className="editor-label">Área</span><select defaultValue="general"><option value="general">General</option><option value="software">Desarrollo de software</option><option value="business">Negocios y administración</option></select></label>
              <label className="form-field"><span className="editor-label">Dificultad</span><select defaultValue="beginner"><option value="beginner">Principiante</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option></select></label>
            </div>
            <label className="form-field"><span className="editor-label">Contexto y objetivo</span><textarea placeholder="Describe el rol, la situación y la decisión que deberá tomar la persona." /></label>
            <label className="form-field"><span className="editor-label">Requisitos y restricciones</span><textarea placeholder="Define recursos permitidos, límites del escenario y criterios que no deben asumirse." /></label>
            <label className="form-field"><span className="editor-label">Casos de prueba</span><textarea placeholder="Incluye respuestas esperadas, casos límite y ejemplos que requieren revisión." /></label>
            <div className="workspace-form-actions">
              <button className="button" type="submit">Guardar borrador</button>
              {saved && <WorkspaceStatus variant="success">Guardado en la demostración</WorkspaceStatus>}
              {!title.trim() && <span className="field-hint">Escribe un nombre para guardar.</span>}
            </div>
          </form>
        </WorkspacePanel>
      )}

      {section === "competencies" && (
        <WorkspacePanel title="Competencias observables" description="Selecciona competencias y vincúlalas con evidencia concreta del escenario.">
          <div className="workspace-entity-list">
            {["Pensamiento crítico", "Validación de fuentes", "Resolución de problemas", "Comunicación", "Alfabetización en IA"].map((item, index) => (
              <label className="workspace-check-row" key={item}>
                <input type="checkbox" defaultChecked={index < 3} />
                <span><strong>{item}</strong><small>{index < 3 ? "Configurada para este borrador" : "Disponible para agregar"}</small></span>
              </label>
            ))}
          </div>
        </WorkspacePanel>
      )}

      {section === "evaluation" && (
        <>
          <WorkspacePanel title="Rúbrica de pensamiento crítico" description="Criterios formativos basados en decisiones y evidencias del usuario.">
            <div className="workspace-entity-list">
              {RUBRIC.map(([criterion, description]) => (
                <article className="workspace-entity-row workspace-rubric-row" key={criterion}>
                  <div><strong>{criterion}</strong><span>{description}</span></div>
                  <WorkspaceStatus variant="neutral">Formativo</WorkspaceStatus>
                </article>
              ))}
            </div>
          </WorkspacePanel>
          <WorkspacePanel title="Casos de prueba" description="Cobertura equilibrada para evitar que la persona desconfíe de todas las respuestas.">
            <div className="workspace-entity-list">
              <article className="workspace-entity-row"><div><strong>Afirmación respaldada</strong><span>La propuesta coincide con una fuente verificable.</span></div><WorkspaceStatus variant="success">Correcta</WorkspaceStatus></article>
              <article className="workspace-entity-row"><div><strong>Compromiso no aceptado</strong><span>El resumen atribuye una tarea que nadie asumió.</span></div><WorkspaceStatus variant="warning">Revisar</WorkspaceStatus></article>
              <article className="workspace-entity-row"><div><strong>Conclusión sin evidencia</strong><span>La afirmación no aparece en las notas originales.</span></div><WorkspaceStatus variant="warning">Revisar</WorkspaceStatus></article>
            </div>
          </WorkspacePanel>
          <WorkspaceNotice icon="info">Los casos correctos y problemáticos permiten evaluar el criterio, no la desconfianza automática.</WorkspaceNotice>
        </>
      )}

      {section === "publication" && (
        <>
          <WorkspacePanel title="Revisión previa" description="Verifica que contenido, casos, rúbrica y requisitos estén alineados.">
            <div className="workspace-entity-list">
              {["Briefing y fuentes legibles", "Casos correctos y problemáticos", "Rúbrica vinculada a evidencia", "Dificultad y duración definidas"].map((item) => (
                <div className="workspace-entity-row" key={item}><strong>{item}</strong><WorkspaceStatus variant="success">Listo</WorkspaceStatus></div>
              ))}
            </div>
            <div className="workspace-form-actions">
              <WorkspaceStatus variant={publication === "Disponible" ? "success" : "warning"}>{publication}</WorkspaceStatus>
              <button className="button" type="button" onClick={() => { setPublication("Disponible"); onAction("El estado se actualizó solo en esta demostración local."); }}>
                Marcar como disponible
              </button>
            </div>
          </WorkspacePanel>
          <WorkspaceNotice icon="info">La disponibilidad real depende de publicar contenido validado. Este botón no altera el catálogo actual.</WorkspaceNotice>
        </>
      )}
    </WorkspaceFrame>
  );
}
