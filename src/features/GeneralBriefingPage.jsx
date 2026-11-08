import ActionButton from "../components/ActionButton";
import Callout from "../components/Callout";
import ContentCard from "../components/ContentCard";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import { GENERAL_CHALLENGE } from "../data/scenario";

export default function GeneralBriefingPage({ onBack, onContinue }) {
  return (
    <>
      <PageIntro
        eyebrow="BRIEFING · GENERAL / PENSAMIENTO CRÍTICO"
        title={GENERAL_CHALLENGE.title}
        description="Una práctica de 15 minutos para revisar un resumen de reunión generado por IA antes de compartirlo con un equipo."
      >
        <span className="case-label"><Icon name="file" /> SIN CONOCIMIENTOS TÉCNICOS</span>
      </PageIntro>

      <div className="brief-layout general-brief-layout">
        <div className="brief-content">
          <ContentCard>
            <span className="eyebrow">CONTEXTO</span>
            <h2>Un resumen listo para enviar</h2>
            <p>Después de una reunión de proyecto, una herramienta de inteligencia artificial preparó un resumen para compartir con el equipo. Antes de enviarlo, te piden comprobar que representa fielmente lo que las personas dijeron y acordaron.</p>
            <p>Dispondrás de las notas originales y del resumen. No tienes que saber de tecnología: céntrate en los acuerdos, los compromisos, las fechas y la información que podría faltar.</p>
          </ContentCard>
          <ContentCard>
            <span className="eyebrow">TU ROL</span>
            <h2>Revisor/a del resumen</h2>
            <p>Actúas como una persona del equipo responsable de revisar el borrador antes de su distribución. Tu trabajo es cuidar que el documento no cambie el sentido de la conversación ni atribuya decisiones que nadie aceptó.</p>
          </ContentCard>
          <ContentCard>
            <span className="eyebrow">OBJETIVO</span>
            <h2>Contrastar antes de compartir</h2>
            <ul className="plain-list">
              <li>Verificar acuerdos y compromisos contra las notas.</li>
              <li>Detectar información relevante que haya quedado fuera.</li>
              <li>Recomendar si conviene aceptar, modificar o rechazar el resumen.</li>
            </ul>
          </ContentCard>
        </div>
        <aside className="brief-aside">
          <Callout icon="lightbulb">No busques errores por defecto. Algunas afirmaciones pueden estar bien respaldadas; la evidencia está en las fuentes.</Callout>
          <div className="index-content-card">
            <span className="eyebrow">PRÁCTICA GUIADA</span>
            <h3>Tu criterio es la herramienta</h3>
            <p>Registrarás qué revisarías antes de ver los documentos y justificarás cada observación con una fuente concreta.</p>
            <span className="small-note">15 minutos · Principiante · Sin programación</span>
          </div>
        </aside>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a Desafíos</ActionButton>
        <ActionButton onClick={onContinue} icon="arrow-right">Comenzar análisis</ActionButton>
      </PageActions>
    </>
  );
}
