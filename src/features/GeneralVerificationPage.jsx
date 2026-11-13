import { hasCommunicationAttempt } from "../lib/completion";
import ActionButton from "../components/ActionButton";
import ReviewPrompt from "../components/ReviewPrompt";
import ContentCard from "../components/ContentCard";
import ExerciseDecision from "../components/ExerciseDecision";
import ExerciseGuide from "../components/ExerciseGuide";
import CriterionStatus from "../components/CriterionStatus";
import Field from "../components/Field";
import PageIntro from "../components/PageIntro";
import {
  BANK_MEETING_CLAIMS, BANK_MEETING_NOTES, GENERAL_CLAIMS,
  GENERAL_MEETING_NOTES,
} from "../data/scenario";
import { GENERAL_CLASSIFICATIONS } from "../lib/generalChallenge";

export default function GeneralVerificationPage({
  draft,
  onObservationChange,
  onOmissionChange,
  onBack,
  onVerify, onUpdate, onDecisionChange, onFinish,
}) {
  const { testing, analysis, investigation } = draft;
  const bank = testing.bankMeeting;
  const claims = bank ? BANK_MEETING_CLAIMS : GENERAL_CLAIMS;
  const notes = bank ? BANK_MEETING_NOTES : GENERAL_MEETING_NOTES;
  const pending = testing.results.find(check => !check.passed);
  const observations = new Map(
    testing.observations.map((observation) => [observation.claimId, observation]),
  );
  const ready = hasCommunicationAttempt(draft);

  return (
    <>
      <PageIntro title="El informe que no coincide" description={bank ? "Audita el resumen del piloto de transferencias digitales de Banco Horizonte antes de enviarlo a Dirección." : "Prepara una actualización breve para el equipo y contrástala con el resumen de IA."} />
      <ExerciseGuide items={[["Acuerdo", "Distingue las decisiones confirmadas de las propuestas."], ["Evidencia", "Identifica quién se comprometió, qué acordó y qué queda pendiente."]]} />
      <div className="exercise-workbench">
        <ContentCard className="exercise-source">
          <h2>Tu encargo</h2>
          <p>{bank
            ? "Eres analista junior de Comunicación Interna. Dirección necesita decidir hoy si anuncia el piloto de transferencias digitales. Un resumen con fechas o responsables sin confirmar podría activar avisos a clientes antes de que el equipo esté listo."
            : "Eres parte del equipo que prepara el piloto. La persona que coordina el proyecto necesita una actualización breve para decidir qué puede comunicar y qué sigue pendiente."}</p>
          <p>Entrega un resumen que separe acuerdos, responsables y condiciones pendientes. Usa las notas como evidencia.</p>
          <ol className="exercise-notes">{notes.map(line => <li key={line}>{line}</li>)}</ol>
        </ContentCard>
        <ContentCard>
          <Field id="own-summary" label="Tu resumen" value={analysis.approach} rows={7}
            placeholder="Escribe tu versión para el equipo…"
            onChange={approach => onUpdate(current => ({
              ...current,
              analysis: { ...current.analysis, approach },
              testing: { ...current.testing, ran: false, results: [], verdict: "", rationale: "" },
            }))} />
          {ready && <p><a href="#communication-delivery">Ir a la entrega</a></p>}
          <details className="exercise-hint"><summary>Ver pista</summary><p>Comprueba qué debe ocurrir antes de confirmar el piloto.</p></details>
        </ContentCard>
      </div>
      <ContentCard>
        <h2>Resultado de tu revisión</h2>
        {testing.ran ? <ul className="exercise-criteria">{testing.results.map(check => (
          <li key={check.id}><div><strong>{check.name}</strong>{bank ? <span className={`criterion-status ${check.passed ? "meets" : "review"}`}>{check.status}</span> : check.observed ? <CriterionStatus passed={check.passed} /> : <span className="criterion-status review">Sin respuesta</span>}</div>
            {!bank && check.explanation && <details><summary>Ver evidencia</summary><p>{check.explanation}</p><p>{check.source}</p></details>}
          </li>
        ))}</ul> : <p className="muted">Puedes comprobar tus observaciones ahora o recibir la retroalimentación al entregar.</p>}
      </ContentCard>
      <ContentCard className="exercise-comparison">
        <h2>Compara con la IA</h2>
        {!investigation.reviewed ? <>
          <p>{bank ? "Contrasta el ejemplo preparado con las notas de la reunión." : "Escribe tu resumen para ver la propuesta."}</p>
          <ActionButton variant="secondary" disabled={!bank && !analysis.approach.trim()}
            onClick={() => onUpdate(current => ({ ...current, investigation: { ...current.investigation, reviewed: true } }))}>
            Ver propuesta de la IA
          </ActionButton>
        </> : <>
        <div className="general-claim-list">
        {claims.map((claim, index) => {
          const observation = observations.get(claim.id) || { classification: "", evidence: "" };
          return (
            <ContentCard className="general-claim-card" key={claim.id}>
              <div className="general-claim-heading">
                <span className="claim-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="eyebrow">AFIRMACIÓN DEL RESUMEN</span>
              </div>
              <blockquote>{claim.text}</blockquote>
              <label className="general-select-field">
                <span>¿Cómo se relaciona con las notas?</span>
                <select
                  value={observation.classification}
                  onChange={(event) => onObservationChange(claim.id, "classification", event.target.value)}
                >
                  <option value="">Selecciona una observación</option>
                  {GENERAL_CLASSIFICATIONS.map((classification) => (
                    <option key={classification.value} value={classification.value}>{classification.label}</option>
                  ))}
                </select>
              </label>
              {bank && <label className="general-select-field">
                <span>Nota que respalda tu clasificación</span>
                <select value={observation.sourceId || ""}
                  onChange={event => onObservationChange(claim.id, "sourceId", event.target.value)}>
                  <option value="">Selecciona una nota</option>
                  {notes.map((note, i) => <option key={note} value={i + 1}>Nota {i + 1}</option>)}
                </select>
              </label>}
              <label className="general-evidence-field">
                <span>Tu evidencia</span>
                <textarea
                  value={observation.evidence}
                  onChange={(event) => onObservationChange(claim.id, "evidence", event.target.value)}
                  placeholder="Anota quién dijo qué o cita el fragmento que respalda tu observación..."
                  rows={3}
                />
              </label>
            </ContentCard>
          );
        })}
        </div>
      <div className="general-omission-card">
        <span className="eyebrow">REVISIÓN DE CONTEXTO</span>
        <h2>¿Qué información importante de las notas no aparece en el resumen?</h2>
        {bank && notes.map((note, i) => (
          <label className="exercise-option" key={note}>
            <input type="checkbox" checked={testing.omittedSources?.includes(i + 1) || false}
              onChange={event => {
                const selected = event.target.checked;
                onUpdate(current => {
                  const ids = current.testing.omittedSources || [];
                  return { ...current, testing: { ...current.testing,
                    omittedSources: selected ? [...ids, i + 1] : ids.filter(id => id !== i + 1),
                    ran: false, results: [], verdict: "", rationale: "" } };
                });
              }} />
            Nota {i + 1}
          </label>
        ))}
        <label className="general-evidence-field">
          <span>Información omitida y fuente que la respalda</span>
          <textarea
            value={testing.omission}
            onChange={(event) => onOmissionChange(event.target.value)}
            placeholder="Describe qué condición, riesgo o pendiente falta y dónde lo encontraste..."
            rows={3}
          />
        </label>
      </div>
      <ActionButton disabled={!ready} onClick={onVerify} icon="check">Comprobar mi revisión</ActionButton>
      {!ready && <p className="validation-hint">Registra al menos una observación o un dato omitido. Puedes dejar los demás campos pendientes.</p>}
        </>}
      </ContentCard>
      {bank && (testing.ran || investigation.reviewed) && <ContentCard>
        <ReviewPrompt question={pending?.observed
          ? "¿La nota que elegiste prueba la afirmación o solo menciona el mismo tema?"
          : "¿Qué decisión puede tomar Dirección con la evidencia disponible?"}
          hint="Separa los acuerdos confirmados de las condiciones pendientes para aprobar el piloto." />
        <Field id="executive-summary" label="Versión revisada para Dirección (opcional)" rows={4}
          value={testing.executiveSummary || ""} onChange={value => onDecisionChange("executiveSummary", value)} />
        <Field id="executive-objection" label="Si Dirección pregunta si el piloto puede anunciarse hoy, ¿qué responderías y con qué evidencia? (opcional)"
          rows={3} value={testing.objection || ""} onChange={value => onDecisionChange("objection", value)} />
        <p className="field-hint">La claridad del resumen y la respuesta quedan para revisión cualitativa.</p>
      </ContentCard>}
      <section id="communication-delivery">
        <h2>Entrega tu actividad</h2>
        <p>Entrega tu resumen o una revisión parcial. Selecciona qué harías con el informe y explica por qué.</p>
        <ExerciseDecision testing={testing} ready={ready} onChange={onDecisionChange}
          finishLabel="Entregar y ver informe" notReadyHint="Escribe tu resumen o registra una observación para habilitar la entrega."
          onFinish={onFinish} onBack={onBack} options={[["accept", "Enviar el informe"], ["modify", "Corregir antes de enviar"], ["reject_summary", "Solicitar una nueva versión"]]} />
      </section>
    </>
  );
}
