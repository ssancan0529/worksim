import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import {
  GENERAL_CLAIMS,
  GENERAL_MEETING_NOTES,
} from "../data/scenario";
import { GENERAL_CLASSIFICATIONS } from "../lib/generalChallenge";

export default function GeneralVerificationPage({
  testing,
  onObservationChange,
  onOmissionChange,
  onBack,
  onContinue,
}) {
  const observations = new Map(
    testing.observations.map((observation) => [observation.claimId, observation]),
  );
  const ready = GENERAL_CLAIMS.every((claim) => {
    const observation = observations.get(claim.id);
    return observation?.classification && observation.evidence.trim().length >= 8;
  }) && testing.omission.trim().length >= 8;

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 4 DE 6 · VERIFICACIÓN"
        title="Contrasta cada afirmación"
        description="Lee las notas, clasifica cada afirmación del resumen y registra la evidencia que sostiene tu observación."
      >
        <span className="simulation-label"><i /> Fuentes disponibles</span>
      </PageIntro>

      <div className="exercise-workbench">
        <ContentCard className="exercise-source">
          <h2>Notas originales</h2>
          <ol className="exercise-notes">{GENERAL_MEETING_NOTES.map((line) => <li key={line}>{line}</li>)}</ol>
        </ContentCard>

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
      </div>

      <ContentCard className="general-omission-card">
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
      </ContentCard>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a los documentos</ActionButton>
        <ActionButton onClick={onContinue} disabled={!ready} icon="arrow-right">Guardar verificación y decidir</ActionButton>
      </PageActions>
      {!ready && <p className="validation-hint">Clasifica las cuatro afirmaciones y añade una observación con evidencia para cada una y para la información omitida.</p>}
    </>
  );
}
