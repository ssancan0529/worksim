import { REQUIREMENTS } from "../data/scenario";
import ActionButton from "../components/ActionButton";
import Field from "../components/Field";
import Icon from "../components/Icon";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import StatusNotice from "../components/StatusNotice";

const verdicts = [
  ["approve", "Aprobar la implementación generada por la IA sin refactorizar."],
  ["refactor", "Refactorizar el código y validar los cambios con pruebas."],
  ["reject", "Descartar la solución por inviabilidad técnica."],
  ["clarify", "Devolver al equipo por requerimientos que necesitan aclaración."],
];

export default function TestingPage({
  testing,
  onChange,
  onRun,
  onResetCode,
  onBack,
  onContinue,
}) {
  const passedCount = testing.results.filter((result) => result.passed).length;
  const canFinish = testing.ran && testing.verdict && testing.rationale.trim();

  return (
    <>
      <PageIntro
        eyebrow="ETAPA 5 DE 6 · EVIDENCIA Y DICTAMEN"
        title="Pruebas y decisión"
        description="Contrasta la propuesta con casos de prueba y registra un dictamen técnico respaldado por sus resultados."
      >
        <span className="simulation-label"><i /> Simulación controlada</span>
      </PageIntro>

      <div className="brief-requirements">
        <strong>Requisitos que guían la validación</strong>
        <ul>{REQUIREMENTS.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
      </div>

      <div className="testing-layout">
        <section className="content-card sandbox">
          <div className="panel-heading">
            <div><span className="eyebrow">SANDBOX DE VALIDACIÓN</span><h2>Pruebas controladas</h2></div>
            <span className="simulation-label"><i /> No ejecuta código real</span>
          </div>
          <p className="muted">La suite aplica comprobaciones heurísticas al texto del código. No ejecuta Python, no modifica bases de datos y no sustituye pruebas reales.</p>
          <div className="code-toolbar test-file">
            <span><Icon name="code" size={15} /> pets_controller.py</span>
            <span><Icon name="file" size={15} /> suite simulada · {testing.runs.length} ejecuciones</span>
            <button className="text-button" onClick={onResetCode}><Icon name="reset" size={14} /> Restaurar propuesta IA</button>
          </div>
          <label className="editor-label" htmlFor="sandbox-code">Código para inspección heurística</label>
          <textarea
            id="sandbox-code"
            className="sandbox-input"
            value={testing.code}
            onChange={(event) => onChange("code", event.target.value)}
            spellCheck={false}
            rows={12}
          />
          <ActionButton onClick={onRun} icon="play">Ejecutar suite simulada</ActionButton>

          {testing.ran ? (
            <div className="test-results" aria-live="polite">
              <div className="results-heading">
                <h3>Resultados de esta revisión</h3>
                <span>{passedCount} pasan · {testing.results.length - passedCount} requieren revisión</span>
              </div>
              {testing.results.map((result) => (
                <article className="test-result" key={result.id}>
                  <Icon
                    name={result.passed ? "circle-check" : "circle-x"}
                    className={result.passed ? "passed" : "failed"}
                  />
                  <div><strong>{result.name}</strong><p>{result.detail}</p></div>
                </article>
              ))}
            </div>
          ) : (
            <StatusNotice className="test-placeholder">
              Edita el texto si lo deseas y ejecuta la suite para ver qué señales encuentra.
            </StatusNotice>
          )}
        </section>

        <section className="content-card verdict-card">
          <span className="eyebrow">DICTAMEN TÉCNICO PARA PRODUCCIÓN</span>
          <h2>¿Qué decisión recomendarías?</h2>
          <div className="verdict-options" role="radiogroup" aria-label="Dictamen técnico">
            {verdicts.map(([value, label]) => (
              <label className={`verdict-option ${testing.verdict === value ? "chosen" : ""}`} key={value}>
                <input
                  type="radio"
                  name="verdict"
                  value={value}
                  checked={testing.verdict === value}
                  onChange={() => onChange("verdict", value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <Field
            id="rationale"
            label="Justificación técnica para el supervisor (Carlos Méndez)"
            hint="Cita al menos un resultado o requisito del briefing que sostenga tu recomendación."
            value={testing.rationale}
            onChange={(value) => onChange("rationale", value)}
            placeholder="Explica tu decisión y qué evidencia la respalda."
            rows={5}
            required
          />
          {!canFinish && (
            <p className="inline-hint">
              <Icon name="info" size={15} />
              Ejecuta la suite, selecciona un dictamen y escribe su justificación para avanzar.
            </p>
          )}
        </section>
      </div>

      <PageActions>
        <ActionButton variant="secondary" onClick={onBack} icon="arrow-left" iconPosition="left">Volver a Investigación IA</ActionButton>
        <ActionButton onClick={onContinue} disabled={!canFinish} icon="arrow-right">Finalizar y ver Informe</ActionButton>
      </PageActions>
    </>
  );
}
