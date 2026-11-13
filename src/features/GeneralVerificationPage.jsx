import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import ExerciseDecision from "../components/ExerciseDecision";
import ExerciseGuide from "../components/ExerciseGuide";
import CriterionStatus from "../components/CriterionStatus";
import Field from "../components/Field";
import PageIntro from "../components/PageIntro";
import {
  GENERAL_CLAIMS,
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
  const observations = new Map(
    testing.observations.map((observation) => [observation.claimId, observation]),
  );
  const ready = Boolean(analysis.approach.trim() && (
    [...observations.values()].some(observation => observation.classification || observation.evidence.trim())
    || testing.omission.trim()
  ));

  return (
    <>
      <PageIntro title="El informe que no coincide" description="Prepara una actualización breve para el equipo y contrástala con el resumen de IA." />
      <ExerciseGuide items={[["Acuerdo", "Distingue las decisiones confirmadas de las propuestas."], ["Evidencia", "Identifica quién se comprometió, qué acordó y qué queda pendiente."]]} />
      <div className="exercise-workbench">
        <ContentCard className="exercise-source">
          <h2>Tu encargo</h2>
          <p>Lee las notas y resume los acuerdos, responsables y condiciones pendientes del piloto.</p>
          <ol className="exercise-notes">{GENERAL_MEETING_NOTES.map(line => <li key={line}>{line}</li>)}</ol>
        </ContentCard>
        <ContentCard>
          <Field id="own-summary" label="Tu resumen" value={analysis.approach} rows={7}
            placeholder="Escribe tu versión para el equipo…"
            onChange={approach => onUpdate(current => ({
              ...current,
              analysis: { ...current.analysis, approach },
              testing: { ...current.testing, ran: false, results: [], verdict: "", rationale: "" },
            }))} />
          <details className="exercise-hint"><summary>Ver pista</summary><p>Comprueba qué debe ocurrir antes de confirmar el piloto.</p></details>
        </ContentCard>
      </div>
      <ContentCard>
        <h2>Resultado de tu revisión</h2>
        {testing.ran ? <ul className="exercise-criteria">{testing.results.map(check => (
          <li key={check.id}><div><strong>{check.name}</strong>{check.observed ? <CriterionStatus passed={check.passed} /> : <span className="criterion-status review">Sin respuesta</span>}</div>
            {check.explanation && <details><summary>Ver evidencia</summary><p>{check.explanation}</p><p>{check.source}</p></details>}
          </li>
        ))}</ul> : <p className="muted">Compara el resumen con las notas y comprueba tu revisión.</p>}
      </ContentCard>
      <ContentCard className="exercise-comparison">
        <h2>Compara con la IA</h2>
        {!investigation.reviewed ? <>
          <p>Escribe tu resumen para ver la propuesta.</p>
          <ActionButton variant="secondary" disabled={!analysis.approach.trim()}
            onClick={() => onUpdate(current => ({ ...current, investigation: { ...current.investigation, reviewed: true } }))}>
            Ver propuesta de la IA
          </ActionButton>
        </> : <>
        <div className="general-claim-list">
        {GENERAL_CLAIMS.map((claim, index) => {
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
      <ExerciseDecision testing={testing} ready={testing.ran} onChange={onDecisionChange}
        onFinish={onFinish} onBack={onBack} options={[["accept", "Aceptar"], ["modify", "Modificar"], ["reject_summary", "Rechazar"]]} />
    </>
  );
}
