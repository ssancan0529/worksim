import { useState } from "react";
import { HYPOTHESES, ORIGINAL_CODE, REQUIREMENTS } from "../data/scenario";
import ActionButton from "../components/ActionButton";
import Callout from "../components/Callout";
import ContentCard from "../components/ContentCard";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import RequirementsList from "../components/RequirementsList";
import SchemaTable from "../components/SchemaTable";

const tabs = [
  { id: "requirements", label: "Requisitos" },
  { id: "schema", label: "Esquema BD" },
  { id: "analysis", label: "Tu análisis" },
];

export default function InvestigationPage({
  analysis,
  investigation,
  onChange,
  onCopyCode,
  onBack,
  onContinue,
}) {
  const [activeTab, setActiveTab] = useState("requirements");
  const [showBrief, setShowBrief] = useState(false);
  const canContinue = investigation.hypotheses.some(Boolean) || investigation.notes.trim().length > 0;

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 3 DE 5 · AUDITORÍA DE SOLUCIÓN"
        title="Investiga la solución generada por IA"
        description="Contrasta el código con el encargo. Formula hipótesis y busca evidencia antes de decidir si la propuesta cumple los requisitos."
      >
        <button className="button secondary" onClick={() => setShowBrief((shown) => !shown)}>
          <Icon name="file" /> {showBrief ? "Ocultar briefing" : "Ver briefing completo"}
        </button>
      </PageIntro>

      {showBrief && (
        <div className="brief-requirements">
          <strong>Requisitos del encargo</strong>
          <RequirementsList items={REQUIREMENTS} />
          <p><strong>Tu análisis previo:</strong> {analysis.approach}</p>
        </div>
      )}

      <div className="investigation-layout">
        <ContentCard className="code-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">PROPUESTA DE IA</span><h2>pets_controller.py</h2></div>
            <span className="code-badge">Python</span>
          </div>
          <div className="code-toolbar">
            <div className="code-tabs" role="tablist" aria-label="Contexto del encargo">
              {tabs.map(({ id, label }) => (
                <button
                  key={id}
                  className={activeTab === id ? "active" : ""}
                  onClick={() => setActiveTab(id)}
                  role="tab"
                  aria-selected={activeTab === id}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="icon-button" onClick={onCopyCode} aria-label="Copiar código de la propuesta">
              <Icon name="copy" size={15} /> Copiar
            </button>
          </div>
          <div className="tab-content">
            {activeTab === "requirements" && <RequirementsList />}
            {activeTab === "schema" && <SchemaTable />}
            {activeTab === "analysis" && (
              <div className="analysis-summary">
                <p><strong>Enfoque:</strong> {analysis.approach}</p>
                <p><strong>Riesgos:</strong> {analysis.risks}</p>
                <p><strong>Verificaría:</strong> {analysis.checks}</p>
              </div>
            )}
          </div>
          <pre className="code-block"><code>{ORIGINAL_CODE}</code></pre>
          <div className="ai-quote">
            <Icon name="bot" />
            <p>«He implementado el endpoint para Adopta+ optimizando la consulta relacional con filtros condicionales y paginación para alto tráfico.»</p>
          </div>
        </ContentCard>

        <ContentCard className="investigation-notes">
          <span className="eyebrow">BITÁCORA DE INVESTIGACIÓN</span>
          <h2>¿Qué te genera dudas?</h2>
          <p className="muted">Marca las hipótesis que quieres contrastar con pruebas y anota patrones que requieran inspección detallada.</p>
          <div className="hypotheses">
            {HYPOTHESES.map(({ id, text }, index) => (
              <label className="hypothesis" key={id}>
                <input
                  type="checkbox"
                  checked={investigation.hypotheses[index]}
                  onChange={(event) => onChange("hypotheses", index, event.target.checked)}
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
          <Field
            id="investigation-notes"
            label="Mis notas de auditoría"
            value={investigation.notes}
            onChange={(value) => onChange("notes", value)}
            placeholder="¿Qué evidencia esperas encontrar?"
            rows={5}
          />
          <Callout icon="flask">Una hipótesis no es un resultado. Valídala con los casos de prueba antes de emitir un dictamen.</Callout>
          {!canContinue && <p className="validation-hint">Marca una hipótesis o registra una observación antes de pasar a las pruebas.</p>}
        </ContentCard>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a Análisis inicial</ActionButton>
        <ActionButton onClick={onContinue} disabled={!canContinue} icon="arrow-right">Continuar a Pruebas y Decisión</ActionButton>
      </PageActions>
    </>
  );
}
