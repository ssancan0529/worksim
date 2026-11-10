import { CHALLENGE } from "../data/scenario";
import { getReportFeedback, verdictLabel } from "../lib/simulation";
import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";

export default function ReportPage({
  draft,
  history,
  onReflectionChange,
  onBack,
  onRestart,
  onCopy,
  onExport,
}) {
  const feedback = getReportFeedback(draft);

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 5 DE 5 · TU APRENDIZAJE"
        title={`Informe de desempeño profesional: Desafío #${CHALLENGE.ticket} ${draft.completedAt ? "completado" : ""}`}
        description="Retroalimentación formativa basada en tus acciones, pruebas y justificación. No es una calificación ni una certificación de competencias."
      >
        <span className={`completion-badge ${draft.completedAt ? "" : "preview"}`}>
          <Icon name={draft.completedAt ? "circle-check" : "info"} />
          {draft.completedAt ? "Práctica registrada" : "Vista previa del informe"}
        </span>
      </PageIntro>

      <section className="report-summary">
        <div><span className="eyebrow">EVIDENCIA</span><strong>{draft.testing.ran ? `${feedback.passed.length} de ${draft.testing.results.length} comprobaciones` : "Sin suite ejecutada"}</strong><span>{feedback.selectedHypotheses.length} hipótesis investigadas</span></div>
        <div><span className="eyebrow">DICTAMEN</span><strong>{verdictLabel(draft.testing.verdict)}</strong><span>{draft.testing.rationale ? "Justificación registrada" : "Sin justificación"}</span></div>
        <div><span className="eyebrow">APRENDIZAJE</span><strong>Práctica sin nota</strong><span>{history.length} práctica{history.length === 1 ? "" : "s"} guardada{history.length === 1 ? "" : "s"}</span></div>
      </section>

      <ContentCard className="report-card">
        <h2>Evaluación de criterio profesional y auditoría</h2>
        {draft.testing.ran ? (
          <div className="feedback-grid">
            <article>
              <span className="feedback-icon"><Icon name="search" /></span>
              <div><h3>Señales confirmadas</h3><p>{feedback.passed.length ? feedback.passed.map((item) => item.name).join("; ") : "La revisión heurística no confirmó los requisitos comprobados."}</p></div>
            </article>
            <article>
              <span className="feedback-icon"><Icon name="circle-alert" /></span>
              <div><h3>Aspectos por revisar</h3><p>{feedback.failed.length ? feedback.failed.map((item) => item.name).join("; ") : "No se encontraron señales de los fallos previstos en esta revisión heurística."}</p></div>
            </article>
            <article>
              <span className="feedback-icon"><Icon name="balance" /></span>
              <div><h3>Tu decisión</h3><p>{draft.testing.rationale || "Todavía no registraste una justificación."}</p></div>
            </article>
          </div>
        ) : (
          <p className="muted">Aún no hay resultados para evaluar. Vuelve a Pruebas y decisión para validar la propuesta y completar tu dictamen.</p>
        )}
      </ContentCard>

      <ContentCard className="recommendations-card">
        <h2>Siguientes pasos sugeridos</h2>
        <ul className="recommendation-list">
          {feedback.recommendations.map((item) => <li key={item}><Icon name="lightbulb" size={17} />{item}</li>)}
        </ul>
        <p className="small-note">La simulación examina patrones de texto y no valida sintaxis ni comportamiento de una aplicación real.</p>
      </ContentCard>

      <details className="content-card practice-details reflection-card">
        <summary>Escribir una reflexión (opcional)</summary>
        <p className="muted">Registra qué aprendiste y qué evidencia te ayudó a decidir. Las notas se guardan en este navegador.</p>
        <div className="reflection-grid">
          <Field
            id="blind-spot"
            label="¿Qué punto ciego no habías considerado?"
            value={draft.reflection.blindSpot}
            onChange={(value) => onReflectionChange("blindSpot", value)}
            placeholder="Anota una suposición o un caso límite que ahora revisarías."
            rows={3}
          />
          <Field
            id="reflection-evidence"
            label="¿Qué evidencia cambió tu decisión?"
            value={draft.reflection.evidence}
            onChange={(value) => onReflectionChange("evidence", value)}
            placeholder="Describe el resultado o requisito más importante."
            rows={3}
          />
          <Field
            id="real-world"
            label="¿Qué revisarías en una situación real?"
            value={draft.reflection.realWorld}
            onChange={(value) => onReflectionChange("realWorld", value)}
            placeholder="Anota una comprobación que llevarías al trabajo."
            rows={3}
          />
        </div>
      </details>

      <details className="content-card trace-card">
        <summary><Icon name="history" /> Revisar simulación paso a paso</summary>
        <div className="trace-content">
          <p><strong>Análisis inicial:</strong> {draft.analysis.approach || "Sin respuesta."}</p>
          <p><strong>Riesgos previstos:</strong> {draft.analysis.risks || "Sin respuesta."}</p>
          <p><strong>Hipótesis investigadas:</strong> {feedback.selectedHypotheses.length ? feedback.selectedHypotheses.map((item) => item.text).join("; ") : "Ninguna marcada."}</p>
          <p><strong>Notas de investigación:</strong> {draft.investigation.notes || "Sin notas."}</p>
          <p><strong>Dictamen y justificación:</strong> {verdictLabel(draft.testing.verdict)} · {draft.testing.rationale || "Sin justificación."}</p>
          {draft.testing.runs.length > 0 && (
            <ul>{draft.testing.runs.map((run, index) => <li key={`${run.at}-${index}`}>{new Date(run.at).toLocaleString("es")} · {run.passed}/{run.total} comprobaciones con señal compatible</li>)}</ul>
          )}
        </div>
      </details>

      <PageActions className="report-actions">
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a Pruebas</ActionButton>
        <ActionButton variant="secondary" onClick={onCopy} icon="copy">Copiar resumen</ActionButton>
        <ActionButton variant="secondary" onClick={onExport} icon="download">Descargar evidencia JSON</ActionButton>
        <ActionButton onClick={onRestart} icon="arrow-right">Volver a Desafíos</ActionButton>
      </PageActions>
    </>
  );
}
