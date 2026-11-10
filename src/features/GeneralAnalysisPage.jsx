import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";

export default function GeneralAnalysisPage({ analysis, onChange, onBack, onContinue }) {
  const ready = Boolean(
    analysis.approach.trim() && analysis.risks.trim() && analysis.checks.trim(),
  );

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 2 DE 6 · ANÁLISIS INICIAL"
        title="¿Qué revisarías antes de compartirlo?"
        description="Registra tu criterio inicial antes de leer el resumen generado por IA y las notas de la reunión."
      />

      <div className="practice-form">
        <details className="content-card practice-details">
          <summary>Consultar el encargo</summary>
          <p>Un resumen puede ser claro y aun así modificar un acuerdo, omitir una condición o atribuir una tarea a la persona equivocada.</p>
          <div className="tip-box">
            <Icon name="lightbulb" />
            <span>Piensa en cómo diferenciarías una decisión confirmada, una propuesta y un compromiso personal.</span>
          </div>
        </details>
        <ContentCard>
          <h2>Mi análisis inicial</h2>
          <Field
            id="general-approach"
            label="1. Mi enfoque de revisión"
            hint="¿Cómo compararías el resumen con las notas?"
            value={analysis.approach}
            onChange={(value) => onChange("approach", value)}
            placeholder="Por ejemplo, revisar cada frase y buscar su fuente..."
            required
          />
          <Field
            id="general-risks"
            label="2. Riesgos que tendría en cuenta"
            hint="¿Qué podría salir mal si el equipo comparte un resumen inexacto?"
            value={analysis.risks}
            onChange={(value) => onChange("risks", value)}
            placeholder="Anota posibles confusiones, omisiones o compromisos..."
            required
          />
          <Field
            id="general-checks"
            label="3. Qué verificaría"
            hint="¿Qué buscarías en las fuentes antes de recomendar una decisión?"
            value={analysis.checks}
            onChange={(value) => onChange("checks", value)}
            placeholder="Escribe qué señales o evidencias buscarías..."
            required
          />
        </ContentCard>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver al Briefing</ActionButton>
        <ActionButton onClick={onContinue} disabled={!ready} icon="arrow-right">Guardar análisis y revisar documentos</ActionButton>
      </PageActions>
      {!ready && <p className="validation-hint">Completa las tres respuestas para guardar tu criterio previo.</p>}
    </>
  );
}
