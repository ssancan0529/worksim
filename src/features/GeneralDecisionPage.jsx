import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";

const decisions = [
  ["accept", "Aceptar", "Compartir el resumen tal como está."],
  ["modify", "Modificar", "Corregirlo con base en las notas antes de compartir."],
  ["reject_summary", "Rechazar", "No compartirlo y solicitar una nueva versión."],
];

export default function GeneralDecisionPage({ testing, onChange, onBack, onContinue }) {
  const ready = Boolean(testing.verdict && testing.rationale.trim().length >= 15);

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 5 DE 6 · DECISIÓN"
        title="¿Qué recomendarías hacer con el resumen?"
        description="Elige una acción y justifícala con la evidencia que registraste. No hay una decisión automática ni una nota."
      />

      <div className="general-decision-layout">
        <ContentCard>
          <span className="eyebrow">TU DICTAMEN</span>
          <h2>Antes de enviarlo al equipo</h2>
          <div className="general-decision-options" role="radiogroup" aria-label="Decisión sobre el resumen">
            {decisions.map(([value, title, description]) => (
              <label className={`general-decision-option ${testing.verdict === value ? "chosen" : ""}`} key={value}>
                <input
                  type="radio"
                  name="general-decision"
                  value={value}
                  checked={testing.verdict === value}
                  onChange={() => onChange("verdict", value)}
                />
                <span className="general-decision-icon"><Icon name={value === "accept" ? "check" : value === "modify" ? "edit" : "circle-x"} /></span>
                <span><strong>{title}</strong><small>{description}</small></span>
              </label>
            ))}
          </div>
        </ContentCard>
        <ContentCard>
          <span className="eyebrow">JUSTIFICACIÓN CON EVIDENCIA</span>
          <h2>Explica tu recomendación</h2>
          <p className="muted">Menciona qué afirmaciones conservarías o cambiarías, y qué acuerdos o pendientes de las notas sustentan tu decisión.</p>
          <Field
            id="general-decision-rationale"
            label="Mi recomendación para el equipo"
            value={testing.rationale}
            onChange={(value) => onChange("rationale", value)}
            placeholder="Por ejemplo: modificaría la fecha porque las notas indican que todavía hay condiciones pendientes..."
            rows={7}
            required
          />
          <div className="tip-box">
            <Icon name="lightbulb" />
            <span>Una recomendación clara distingue los acuerdos reales de las propuestas y compromisos no confirmados.</span>
          </div>
        </ContentCard>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a la verificación</ActionButton>
        <ActionButton onClick={onContinue} disabled={!ready} icon="arrow-right">Guardar decisión y ver informe</ActionButton>
      </PageActions>
      {!ready && <p className="validation-hint">Selecciona aceptar, modificar o rechazar y escribe una justificación con evidencia.</p>}
    </>
  );
}
