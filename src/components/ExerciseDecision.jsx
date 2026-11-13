import { decisionIsComplete } from "../lib/completion";
import ActionButton from "./ActionButton";
import ContentCard from "./ContentCard";
import Field from "./Field";
import PageActions from "./PageActions";

export default function ExerciseDecision({ testing, options, onChange, onFinish, onBack, ready, finishLabel = "Guardar y ver informe", notReadyHint, rationaleLabel = "Justifica tu decisión con evidencia" }) {
  const decisionReady = decisionIsComplete(testing, options.map(([value]) => value));
  return (
    <>
      {ready && <ContentCard>
        <h2>Tu recomendación</h2>
        <label className="general-select-field">
          <span>¿Qué harías con la propuesta de IA?</span>
          <select value={testing.verdict} onChange={event => onChange("verdict", event.target.value)}>
            <option value="">Selecciona una decisión</option>
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <Field id="exercise-rationale" label={rationaleLabel} value={testing.rationale}
          rows={3} required onChange={value => onChange("rationale", value)} />
      </ContentCard>}
      <PageActions>
        <ActionButton variant="secondary" onClick={onBack}>Volver a desafíos</ActionButton>
        <ActionButton icon="arrow-right" disabled={!ready || !decisionReady}
          onClick={onFinish}>{finishLabel}</ActionButton>
      </PageActions>
      {notReadyHint && !ready && <p className="validation-hint">{notReadyHint}</p>}
      {notReadyHint && ready && !decisionReady && <p className="validation-hint">Selecciona una decisión y escribe una justificación breve.</p>}
    </>
  );
}
