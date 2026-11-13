import ContentCard from "../components/ContentCard";
import ExerciseDecision from "../components/ExerciseDecision";
import PageIntro from "../components/PageIntro";
import {
  BANK_MEETING_CLAIMS, BANK_MEETING_NOTES, GENERAL_CLAIMS, GENERAL_MEETING_NOTES,
} from "../data/scenario";
import { hasCommunicationAttempt } from "../lib/completion";
import { GENERAL_CLASSIFICATIONS } from "../lib/generalChallenge";

const options = [
  ["accept", "Sí, lo enviaría tal como está"],
  ["modify", "Lo corregiría antes de enviarlo"],
  ["reject_summary", "Pediría una nueva versión"],
];

export default function GeneralVerificationPage({
  draft, onObservationChange, onOmissionChange, onBack, onUpdate, onDecisionChange, onFinish,
}) {
  const { testing, analysis } = draft;
  const bank = testing.bankMeeting;
  const claims = bank ? BANK_MEETING_CLAIMS : GENERAL_CLAIMS;
  const notes = bank ? BANK_MEETING_NOTES : GENERAL_MEETING_NOTES;
  const observations = new Map(testing.observations.map(item => [item.claimId, item]));

  function toggleOmittedSource(id, selected) {
    onUpdate(current => {
      const sources = current.testing.omittedSources || [];
      return { ...current, testing: { ...current.testing,
        omittedSources: selected ? [...sources, id] : sources.filter(source => source !== id),
        ran: false, results: [],
      } };
    });
  }

  return (
    <>
      <PageIntro eyebrow={bank ? "BANCO HORIZONTE · COMUNICACIÓN" : "COMUNICACIÓN INTERNA"}
        title="El informe que no coincide" description="¿Enviarías este borrador a Dirección?" />
      <ContentCard>
        <h2>El encargo</h2>
        <p>{bank
          ? "Dirección debe decidir si anuncia a los clientes el piloto de transferencias digitales. Te pide revisar el borrador de la reunión antes de que circule, porque una fecha o un responsable incorrectos podrían activar el anuncio antes de tiempo."
          : "El equipo necesita decidir si comparte un borrador sobre el piloto. Te pide contrastarlo con las notas antes de circularlo."}</p>
        <ol>
          <li>Lee las notas de la reunión.</li>
          <li>Marca al menos una afirmación del borrador. Puedes revisar las demás si lo deseas.</li>
          <li>Decide si enviarías el borrador y explica qué mantendrías o corregirías, citando una nota.</li>
        </ol>
      </ContentCard>

      <div className="exercise-workbench">
        <ContentCard>
          <h2>Notas de la reunión</h2>
          <ol className="exercise-notes">{notes.map(note => <li key={note}>{note}</li>)}</ol>
        </ContentCard>
        <ContentCard>
          <h2>Borrador preparado como ejemplo de IA</h2>
          <ul className="exercise-criteria">{claims.map(claim => {
            const observation = observations.get(claim.id);
            return <li key={claim.id}>
              <p>{claim.text}</p>
              <label className="general-select-field">
                <span>Contraste con las notas</span>
                <select value={observation?.classification || ""}
                  onChange={event => onObservationChange(claim.id, "classification", event.target.value)}>
                  <option value="">Por revisar</option>
                  {GENERAL_CLASSIFICATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              {bank && observation?.classification && <label className="general-select-field">
                <span>Nota de respaldo (opcional)</span>
                <select value={observation.sourceId || ""}
                  onChange={event => onObservationChange(claim.id, "sourceId", event.target.value)}>
                  <option value="">Citaré la nota en mi explicación</option>
                  {notes.map((note, index) => <option key={note} value={index + 1}>Nota {index + 1}</option>)}
                </select>
              </label>}
            </li>;
          })}</ul>
        </ContentCard>
      </div>

      <ContentCard>
        <details className="exercise-hint">
          <summary>¿Detectaste alguna omisión? (opcional)</summary>
          <p>Identifica condiciones de la reunión que deberían aparecer en el borrador.</p>
          {bank && notes.map((note, index) => (
            <label className="exercise-option" key={note}>
              <input type="checkbox" checked={testing.omittedSources?.includes(index + 1) || false}
                onChange={event => toggleOmittedSource(index + 1, event.target.checked)} />
              Nota {index + 1}
            </label>
          ))}
          <label className="general-evidence-field">
            <span>Explica qué falta</span>
            <textarea rows={2} value={testing.omission} onChange={event => onOmissionChange(event.target.value)} />
          </label>
        </details>
        {analysis.approach?.trim() && <details className="exercise-hint">
          <summary>Ver mi resumen guardado</summary>
          <p className="general-evidence-record">{analysis.approach}</p>
        </details>}
      </ContentCard>

      <ExerciseDecision testing={testing} options={options} ready={hasCommunicationAttempt(draft)}
        decisionLabel="¿Enviarías este borrador a Dirección?"
        rationaleLabel="Explica qué mantendrías o corregirías y qué nota respalda tu decisión"
        finishLabel="Entregar y ver retroalimentación"
        notReadyHint="Marca una afirmación del borrador para habilitar la entrega."
        onChange={onDecisionChange} onFinish={onFinish} onBack={onBack} />
    </>
  );
}
