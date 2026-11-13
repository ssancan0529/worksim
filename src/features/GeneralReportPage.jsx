import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import { GENERAL_CHALLENGE } from "../data/scenario";
import {
  classificationLabel,
  evaluateGeneralReview,
} from "../lib/generalChallenge";

const decisionLabels = {
  accept: "Aceptar el resumen",
  modify: "Modificar antes de compartir",
  reject_summary: "Rechazar y solicitar cambios",
};

export default function GeneralReportPage({
  draft,
  history,
  onReflectionChange,
  onBack,
  onRestart,
  onCopy,
  onExport,
}) {
  const feedback = evaluateGeneralReview(draft.testing);

  return (
    <>
      <PageIntro
        eyebrow="INFORME DE APRENDIZAJE"
        title={`${GENERAL_CHALLENGE.title}${draft.completedAt ? " · completado" : ""}`}
        description="Revisa cómo contrastaste las afirmaciones, qué fuentes respaldaron tu decisión y qué información relevante detectaste."
      >
        <span className={`completion-badge ${draft.completedAt ? "" : "preview"}`}>
          <Icon name={draft.completedAt ? "circle-check" : "info"} />
          {draft.completedAt ? "Práctica registrada" : "Vista previa"}
        </span>
      </PageIntro>

      <section className="report-summary">
        <div><span className="eyebrow">COMPROBACIONES</span><strong>{feedback.passed.length} de {feedback.results.length} criterios cumplidos</strong><span>Incluye revisión de información omitida</span></div>
        <div><span className="eyebrow">DECISIÓN</span><strong>{decisionLabels[draft.testing.verdict] || "Sin decisión"}</strong><span>Basada en la evidencia registrada</span></div>
        <div><span className="eyebrow">APRENDIZAJE</span><strong>Práctica sin nota</strong><span>{history.length} práctica{history.length === 1 ? "" : "s"} guardada{history.length === 1 ? "" : "s"}</span></div>
      </section>

      <ContentCard className="general-feedback-card">
        <div className="section-title">
          <h2>Contraste con las fuentes</h2>
          <span className="small-note">La referencia aparece después de tu decisión</span>
        </div>
        <div className="general-feedback-list">
          {feedback.results.map((result) => (
            <article className={`general-feedback-item ${result.passed ? "matched" : "review"}`} key={result.id}>
              <span className="feedback-icon"><Icon name={result.passed ? "circle-check" : "circle-alert"} /></span>
              <div>
                <div className="exercise-criterion-heading"><h3>{result.name}</h3>{draft.testing.bankMeeting ? <span className={`criterion-status ${result.passed ? "meets" : "review"}`}>{result.status}</span> : <CriterionStatus passed={result.passed} /> }</div>
                {result.id === "omission" ? (
                  <>
                    <p><strong>Tu observación:</strong> {result.observed || "No se registró una omisión."}</p>
                    <p><strong>Referencia:</strong> {result.expected}</p>
                  </>
                ) : (
                  <>
                    <p><strong>Tu clasificación:</strong> {classificationLabel(result.observed)}</p>
                    {!result.passed && <p><strong>Contraste esperado:</strong> {classificationLabel(result.expected)}</p>}
                  </>
                )}
                <p>{result.explanation}</p>
                <blockquote><strong>Fuente:</strong> {result.source}</blockquote>
                {result.evidence && <p className="general-evidence-record"><strong>Tu evidencia:</strong> {result.evidence}</p>}
              </div>
            </article>
          ))}
        </div>
      </ContentCard>

      <ContentCard className="recommendations-card">
        <h2>Retroalimentación</h2>
        <ul className="recommendation-list">
          {feedback.recommendations.map((item) => <li key={item}><Icon name="lightbulb" size={17} />{item}</li>)}
        </ul>
        {(draft.testing.executiveSummary || draft.testing.objection) && <>
          {draft.testing.executiveSummary && <p><strong>Versión revisada:</strong> {draft.testing.executiveSummary}</p>}
          {draft.testing.objection && <p><strong>Respuesta a Dirección:</strong> {draft.testing.objection}</p>}
        </>}
        <p><strong>Tu explicación y propuesta:</strong> {draft.testing.rationale || "Sin justificación registrada."}</p>
      </ContentCard>

      <details className="content-card practice-details reflection-card">
        <summary>Escribir una reflexión (opcional)</summary>
        <p className="muted">Registra qué aprendiste y qué evidencia te ayudó a decidir. Las notas se guardan en este navegador.</p>
        <div className="reflection-grid">
          <Field
            id="general-blind-spot"
            label="¿Qué punto ciego no habías considerado?"
            value={draft.reflection.blindSpot}
            onChange={(value) => onReflectionChange("blindSpot", value)}
            placeholder="Anota una suposición o un caso que ahora revisarías."
            rows={3}
          />
          <Field
            id="general-reflection-evidence"
            label="¿Qué evidencia cambió tu decisión?"
            value={draft.reflection.evidence}
            onChange={(value) => onReflectionChange("evidence", value)}
            placeholder="Describe qué nota o afirmación fue decisiva."
            rows={3}
          />
          <Field
            id="general-real-world"
            label="¿Qué revisarías en una situación real?"
            value={draft.reflection.realWorld}
            onChange={(value) => onReflectionChange("realWorld", value)}
            placeholder="Anota cómo confirmarías acuerdos y compromisos."
            rows={3}
          />
        </div>
      </details>

      <details className="content-card trace-card">
        <summary><Icon name="history" /> Revisar el proceso</summary>
        <div className="trace-content">
          <p><strong>Tu resumen:</strong> {draft.analysis.approach || "Sin respuesta."}</p>
          <p><strong>Riesgos previstos:</strong> {draft.analysis.risks || "Sin respuesta."}</p>
          <p><strong>Verificaría:</strong> {draft.analysis.checks || "Sin respuesta."}</p>
          <p><strong>Decisión:</strong> {decisionLabels[draft.testing.verdict] || "Sin decisión"} · {draft.testing.rationale || "Sin justificación."}</p>
        </div>
      </details>

      <p className="small-note general-report-note">WORKSIM evalúa el proceso con resultados simulados; no asigna una calificación ni certifica competencias.</p>

      <PageActions className="report-actions">
        {onBack && <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver al ejercicio</ActionButton>}
        <ActionButton variant="secondary" onClick={onCopy} icon="copy">Copiar resumen</ActionButton>
        <ActionButton variant="secondary" onClick={onExport} icon="download">Descargar evidencia JSON</ActionButton>
        {draft.completedAt && <ActionButton onClick={onRestart} icon="reset">Practicar nuevamente</ActionButton>}
      </PageActions>
    </>
  );
}
