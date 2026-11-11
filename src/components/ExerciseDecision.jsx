import ActionButton from "./ActionButton";
import ContentCard from "./ContentCard";
import Field from "./Field";
import PageActions from "./PageActions";

export default function ExerciseDecision({ testing, options, onChange, onFinish, onBack, ready }) {
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
        <Field id="exercise-rationale" label="Justifica tu decisión con evidencia" value={testing.rationale}
          rows={3} required onChange={value => onChange("rationale", value)} />
      </ContentCard>}
      <PageActions>
        <ActionButton variant="secondary" onClick={onBack}>Volver a desafíos</ActionButton>
        <ActionButton icon="arrow-right" disabled={!ready || !testing.verdict || !testing.rationale.trim()}
          onClick={onFinish}>Guardar y ver informe</ActionButton>
      </PageActions>
    </>
  );
}
