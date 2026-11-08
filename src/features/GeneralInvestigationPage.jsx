import ActionButton from "../components/ActionButton";
import Callout from "../components/Callout";
import ContentCard from "../components/ContentCard";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import { GENERAL_AI_SUMMARY, GENERAL_MEETING_NOTES } from "../data/scenario";

export default function GeneralInvestigationPage({ analysis, onBack, onContinue }) {
  return (
    <>
      <PageIntro
        eyebrow="ETAPA 3 DE 6 · INVESTIGACIÓN IA"
        title="Lee las dos fuentes"
        description="Revisa el resumen generado y vuelve a las notas originales. En esta etapa aún no se indica qué afirmaciones coinciden."
      />

      <div className="general-documents">
        <ContentCard className="general-document">
          <div className="general-document-heading">
            <span className="document-icon ai"><Icon name="bot" size={18} /></span>
            <div><span className="eyebrow">BORRADOR GENERADO POR IA</span><h2>Resumen de reunión</h2></div>
          </div>
          <p className="document-meta">Borrador para compartir · 4 afirmaciones</p>
          <ol className="document-lines">
            {GENERAL_AI_SUMMARY.map((line, index) => <li key={line}><span>{index + 1}</span><p>{line}</p></li>)}
          </ol>
        </ContentCard>

        <ContentCard className="general-document">
          <div className="general-document-heading">
            <span className="document-icon source"><Icon name="file" size={18} /></span>
            <div><span className="eyebrow">FUENTE ORIGINAL</span><h2>Notas de la reunión</h2></div>
          </div>
          <p className="document-meta">Registro del equipo · contexto de decisiones y pendientes</p>
          <ol className="document-lines source-lines">
            {GENERAL_MEETING_NOTES.map((line, index) => <li key={line}><span>{index + 1}</span><p>{line}</p></li>)}
          </ol>
        </ContentCard>
      </div>

      <div className="general-source-footer">
        <Callout icon="info">Una afirmación correcta también merece respaldo. Fíjate en quién habló, qué aceptó y qué quedó pendiente.</Callout>
        <ContentCard className="analysis-reminder">
          <span className="eyebrow">TU CRITERIO INICIAL</span>
          <p><strong>Enfoque:</strong> {analysis.approach}</p>
          <p><strong>Riesgos previstos:</strong> {analysis.risks}</p>
          <p><strong>Verificaría:</strong> {analysis.checks}</p>
        </ContentCard>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver al análisis</ActionButton>
        <ActionButton onClick={onContinue} icon="arrow-right">Abrir herramientas de verificación</ActionButton>
      </PageActions>
    </>
  );
}
