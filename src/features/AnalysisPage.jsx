import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import SchemaTable from "../components/SchemaTable";

export default function AnalysisPage({ analysis, onChange, onBack, onContinue }) {
  const ready = Boolean(
    analysis.approach.trim() && analysis.risks.trim() && analysis.checks.trim(),
  );

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 3 DE 6 · RAZONAMIENTO INDEPENDIENTE"
        title="Registro de análisis técnico autónomo"
        description="Registra tu razonamiento antes de inspeccionar la solución propuesta por la IA. Tu análisis inicial quedará guardado para contrastarlo con la evidencia."
      />

      <div className="practice-form">
        <details className="content-card practice-details">
          <summary>Consultar el encargo y la tabla pets</summary>
          <p>Desarrollar el endpoint relacional de búsqueda y recuperación priorizada de mascotas en adopción con filtrado multicriterio determinista.</p>
          <h3 className="subheading">Esquema: Tabla <code>pets</code></h3>
          <SchemaTable />
          <div className="tip-box">
            <Icon name="lightbulb" />
            <span>No se espera una solución perfecta: identifica qué comprobarías y por qué antes de ver la propuesta.</span>
          </div>
        </details>

        <ContentCard>
          <h2>Espacio de trabajo: criterio previo</h2>
          <p className="muted">¿Qué situaciones podrían generar fallos silenciosos o regresiones?</p>
          <Field
            id="approach"
            label="1. Mi enfoque técnico"
            hint="¿Cómo estructurarías la lógica del endpoint (filtrado, ordenamiento y paginación)?"
            value={analysis.approach}
            onChange={(value) => onChange("approach", value)}
            placeholder="Describe cómo abordarías el problema..."
            required
          />
          <Field
            id="risks"
            label="2. Riesgos que considero"
            hint="¿Qué situaciones o casos borde podrían generar fallos?"
            value={analysis.risks}
            onChange={(value) => onChange("risks", value)}
            placeholder="Anota posibles riesgos y supuestos..."
            required
          />
          <Field
            id="checks"
            label="3. Qué verificaría"
            hint="¿Qué comportamientos o pruebas comprobarías para validar el endpoint?"
            value={analysis.checks}
            onChange={(value) => onChange("checks", value)}
            placeholder="Escribe ejemplos o casos que pondrías a prueba..."
            required
          />
          <div className="checklist-inline">
            <span><Icon name="check" size={14} /> WHERE &gt; ORDER &gt; LIMIT</span>
            <span><Icon name="check" size={14} /> Filtros simultáneos</span>
            <span><Icon name="check" size={14} /> Consistencia en offset</span>
          </div>
        </ContentCard>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver al Briefing</ActionButton>
        <ActionButton onClick={onContinue} disabled={!ready} icon="arrow-right">Guardar análisis y pasar a Investigación IA</ActionButton>
      </PageActions>
      {!ready && <p className="validation-hint">Completa las tres respuestas para guardar tu análisis antes de consultar la IA.</p>}
    </>
  );
}
