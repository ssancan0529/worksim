import ActionButton from "../components/ActionButton";
import Callout from "../components/Callout";
import ContentCard from "../components/ContentCard";
import ExerciseGuide from "../components/ExerciseGuide";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import RequirementsList from "../components/RequirementsList";
import { endpointGuide } from "../data/exerciseGuides";

export default function BriefingPage({ onBack, onContinue }) {
  return (
    <>
      <PageIntro
        eyebrow="ENCARGO PROFESIONAL · TICKET #ENG-842"
        title="Encargo: Revisión y validación de endpoint de listado en Adopta+"
        description="Especificación técnica del encargo laboral, lineamientos de calidad y criterios de validación previa a despliegue en producción."
      >
        <span className="case-label"><Icon name="paw" /> CASO SIMULADO</span>
      </PageIntro>

      <ExerciseGuide {...endpointGuide} />

      <div className="brief-layout">
        <div className="brief-content">
          <ContentCard>
            <h2>1. Contexto de la situación</h2>
            <p>El equipo necesita actualizar el endpoint central de listado de mascotas para facilitar la búsqueda y priorización de animales que requieren atención inmediata. Se ha desarrollado una propuesta inicial con asistencia de IA y está pendiente de validación antes de su incorporación al sistema.</p>
            <p>La implementación generada por el modelo de IA ya se encuentra disponible en la rama de trabajo. Tu cometido es realizar una auditoría rigurosa para corroborar que la lógica cumpla cada requerimiento sin fallas silenciosas.</p>
          </ContentCard>
          <ContentCard>
            <h2>2. Tu encargo</h2>
            <p>Revisar y validar técnicamente la solución propuesta antes de incorporarla al sistema de producción, asegurando que cumpla con los requerimientos de negocio y no genere regresiones funcionales.</p>
          </ContentCard>
          <ContentCard>
            <h2>3. Requisitos funcionales</h2>
            <RequirementsList />
          </ContentCard>
          <ContentCard>
            <h2>4. Restricciones técnicas</h2>
            <ul className="plain-list">
              <li><strong>Inmutabilidad de esquema:</strong> No alterar las tablas existentes ni dependencias de base de datos.</li>
              <li><strong>Compatibilidad de contrato:</strong> Salida JSON estrictamente compatible con clientes móviles actuales.</li>
              <li><strong>Rendimiento:</strong> Consulta optimizada para tiempo de respuesta menor a 120 ms.</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2>5. Entregables esperados</h2>
            <ul className="plain-list">
              <li>Dictamen técnico sobre la solución: aceptar, modificar o rechazar.</li>
              <li>Suite de pruebas ejecutada con registro de evidencias y resultados.</li>
              <li>Justificación técnica documentada para el Tech Lead.</li>
            </ul>
          </ContentCard>
        </div>

        <aside className="brief-aside">
          <Callout>El briefing permanece disponible durante las siguientes etapas para contrastar tus decisiones con los requisitos.</Callout>
          <div className="index-content-card">
            <span className="eyebrow">CÓMO APRENDERÁS</span>
            <h3>Primero tu criterio. Después, la IA.</h3>
            <p>Tu primer análisis queda registrado antes de inspeccionar la solución. No necesitas tener la respuesta perfecta: importa cómo investigas y justificas tus decisiones.</p>
            <span className="small-note">Evidencia antes que opinión · práctica sin calificación</span>
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
