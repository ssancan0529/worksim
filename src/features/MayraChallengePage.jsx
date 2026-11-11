import { useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import ExerciseEditor from "../components/ExerciseEditor";
import ExerciseGuide from "../components/ExerciseGuide";
import Field from "../components/Field";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import { AI_QUERY, EXPECTED_ROWS, MAYRA_CHALLENGE, MAYRA_STEPS, TRANSACTIONS } from "../data/mayra";
import { queryGuide } from "../data/exerciseGuides";
import { runMayraQuery, runMayraSql } from "../lib/mayraSql";

function TransactionTable({ rows, caption }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead><tr>{["ID", "Ciudad", "Tipo", "Estado", "Monto ($)"].map((column) => (
          <th scope="col" key={column}>{column}</th>
        ))}</tr></thead>
        <tbody>{rows.map(([id, ...values]) => (
          <tr key={id}><th scope="row">{id}</th>{values.map((value, index) => <td key={index}>{value}</td>)}</tr>
        ))}</tbody>
      </table>
      {rows.length === 0 && <p className="muted">La consulta devolvió cero filas.</p>}
    </div>
  );
}

function SqlWorkspace({ code, onChange }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [executedQuery, setExecutedQuery] = useState("");
  const firstResult = results?.[0];
  const idIndex = firstResult?.columns.findIndex(column => column.toLowerCase() === "id") ?? -1;
  const matchesIds = idIndex >= 0 && results.length === 1 && firstResult.values.length === EXPECTED_ROWS.length
    && firstResult.values.every((row, index) => row[idIndex] === EXPECTED_ROWS[index][0]);

  async function execute() {
    setRunning(true);
    setError("");
    setResults(null);
    const query = code;
    try {
      setResults(await runMayraSql(query));
      setExecutedQuery(query);
    } catch (error) {
      setError(error.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="sql-workspace" aria-labelledby="sql-workspace-title">
      <h3 id="sql-workspace-title">Prueba tu propia consulta SQL</h3>
      <p>Escribe o modifica una consulta sobre la tabla <code>transacciones</code>. Sus columnas son <code>id</code>, <code>ciudad</code>, <code>tipo</code>, <code>estado</code> y <code>monto</code>.</p>
      <ExerciseEditor id="mayra-sql-editor" label="Tu consulta SQL" file="consulta.sql" value={code}
        onChange={onChange} onRun={() => { if (!running && code.trim()) execute(); }} placeholder="SELECT * FROM transacciones;" />
      <div className="sql-workspace-actions exercise-editor-actions">
        <ActionButton variant="secondary" disabled={running} onClick={() => onChange(AI_QUERY)}>Cargar consulta de IA</ActionButton>
        <ActionButton disabled={running || !code.trim()} onClick={execute} icon="play">{running ? "Ejecutando…" : "Ejecutar mi consulta"}</ActionButton>
      </div>
      <p className="field-hint">Las consultas se ejecutan sobre los datos ficticios del reto, en modo de lectura.</p>
      <div aria-live="polite" aria-busy={running}>
        {error && <p role="alert">Error de SQL · {error}</p>}
        {results && (
          <>
            <p><strong>Resultado de tu consulta</strong>{executedQuery !== code && " · Editaste el SQL. Ejecútalo para actualizar el resultado."}</p>
            {executedQuery === code && (
              <div className="exercise-criterion-heading"><strong>IDs del encargo en el orden esperado</strong><CriterionStatus passed={matchesIds} /></div>
            )}
            {results.length === 0 && <p>La consulta devolvió cero filas.</p>}
            {results.map((result, index) => (
              <div className="table-scroll" key={index}>
                <table>
                  <caption>Resultado {index + 1} · {result.values.length} fila(s)</caption>
                  <thead><tr>{result.columns.map((column, columnIndex) => <th scope="col" key={columnIndex}>{column}</th>)}</tr></thead>
                  <tbody>{result.values.map((row, rowIndex) => (
                    <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value === null ? "NULL" : String(value)}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

export default function MayraChallengePage({
  step, draft, onUpdate, onBack, onContinue, onFinish, onHome, onExport,
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setError("");
  }, [step]);

  const { analysis, investigation, testing } = draft;
  const prediction = analysis.approach.trim();
  const validPrediction = /^\d+$/.test(prediction) && Number(prediction) <= TRANSACTIONS.length;
  const ready = testing.ran && testing.verdict && testing.rationale.trim();
  const returned = testing.rows;
  const expectedIds = new Set(EXPECTED_ROWS.map(([id]) => id));
  const extraIds = returned.filter(([id]) => !expectedIds.has(id)).map(([id]) => id);

  async function execute() {
    setRunning(true);
    setError("");
    try {
      const rows = await runMayraQuery();
      const passed = rows.length === EXPECTED_ROWS.length
        && rows.every(([id], index) => id === EXPECTED_ROWS[index][0]);
      onUpdate((current) => ({
        ...current,
        testing: {
          ...current.testing,
          ran: true,
          rows,
          results: [{ id: "encargo-sql", name: "Filas que cumplen el encargo", passed }],
        },
      }));
    } catch {
      setError("No se pudo ejecutar la consulta. Vuelve a intentarlo.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="practice-form">
      <PageIntro eyebrow={`ETAPA ${step} DE 4 · ${MAYRA_STEPS[step].label.toUpperCase()}`} title={MAYRA_CHALLENGE.title} />
      {step === 1 && <ExerciseGuide {...queryGuide} />}
      {step === 1 && (
        <ContentCard>
          <h2>Tu encargo</h2>
          <p>Tu supervisora te pide revisar una consulta generada por IA antes de enviar un reporte. Debe listar las <strong>transferencias confirmadas de Guayaquil de $100 o más</strong>, ordenadas por ID.</p>
          <TransactionTable rows={TRANSACTIONS} caption="Muestra de transacciones ficticias" />
          <Field id="mayra-estimate" label="¿Cuántas filas esperas que cumplan el encargo?" hint="Anota tu estimación antes de ver el SQL. Escribe un número del 0 al 7." value={analysis.approach} onChange={(approach) => onUpdate((current) => ({
            ...current, analysis: { ...current.analysis, approach },
          }))} rows={2} required />
          <PageActions>
            <ActionButton variant="secondary" onClick={onHome}>Volver a desafíos</ActionButton>
            <ActionButton disabled={!validPrediction} onClick={() => {
              onUpdate((current) => ({ ...current, analysis: { ...current.analysis, saved: true } }));
              onContinue();
            }} icon="arrow-right">Guardar estimación</ActionButton>
          </PageActions>
        </ContentCard>
      )}
      {step === 2 && (
        <ContentCard>
          <h2>Ejecuta la consulta paso a paso</h2>
          <p>Recorre la consulta fila por fila. Anota qué IDs pasarían sus filtros y señala una fila cuya inclusión o exclusión revisarías frente al encargo.</p>
          <p className="muted">El encargo pide transferencias confirmadas de Guayaquil de $100 o más.</p>
          <pre className="code-block"><code>{AI_QUERY}</code></pre>
          <TransactionTable rows={TRANSACTIONS} caption="Filas para seguir la consulta a mano" />
          <Field id="mayra-trace" label="IDs que esperas obtener y una fila que revisarías" value={investigation.notes} onChange={(notes) => onUpdate((current) => ({
            ...current, investigation: { ...current.investigation, notes },
          }))} rows={3} required />
          <PageActions>
            <ActionButton variant="secondary" onClick={onBack}>Volver a la estimación</ActionButton>
            <ActionButton disabled={!investigation.notes.trim()} onClick={() => {
              onUpdate((current) => ({ ...current, investigation: { ...current.investigation, reviewed: true } }));
              onContinue();
            }} icon="arrow-right">Pasar a la comprobación</ActionButton>
          </PageActions>
        </ContentCard>
      )}
      {step === 3 && (
        <ContentCard>
          <h2>Ejecuta la consulta y decide</h2>
          <p>SQLite ejecuta el SQL en tu navegador con las mismas transacciones ficticias que revisaste paso a paso.</p>
          <details className="practice-details">
            <summary>Consultar mi estimación, ejecución paso a paso y SQL</summary>
            <p><strong>Estimación:</strong> {prediction} filas</p>
            <p><strong>Ejecución paso a paso:</strong> {investigation.notes}</p>
            <pre className="code-block"><code>{AI_QUERY}</code></pre>
          </details>
          {!testing.ran && <ActionButton disabled={running} onClick={execute} icon="play">{running ? "Ejecutando…" : "Ejecutar consulta de IA"}</ActionButton>}
          {error && <p role="alert">{error}</p>}
          {testing.ran && (
            <>
              <TransactionTable rows={returned} caption={`Resultado de SQLite · ${returned.length} filas`} />
              <div className="exercise-criterion-heading"><strong>Filas de la IA que cumplen el encargo</strong><CriterionStatus passed={testing.results[0]?.passed} /></div>
              <label className="general-select-field">
                <span>¿Qué recomendarías a tu supervisora?</span>
                <select value={testing.verdict} onChange={(event) => {
                  const verdict = event.target.value;
                  onUpdate((current) => ({ ...current, testing: { ...current.testing, verdict } }));
                }}>
                  <option value="">Selecciona una decisión</option>
                  <option value="accept">Aceptar la consulta</option>
                  <option value="modify">Modificar la consulta</option>
                  <option value="reject">Rechazar la consulta</option>
                </select>
              </label>
              <Field id="mayra-rationale" label="Justifica tu decisión con evidencia de una fila" value={testing.rationale} onChange={(rationale) => onUpdate((current) => ({
                ...current, testing: { ...current.testing, rationale },
              }))} rows={3} required />
            </>
          )}
          <SqlWorkspace code={testing.code} onChange={(code) => onUpdate((current) => ({
            ...current, testing: { ...current.testing, code },
          }))} />
          <PageActions>
            <ActionButton variant="secondary" disabled={running} onClick={onBack}>Volver a ejecutar paso a paso</ActionButton>
            {testing.ran && <ActionButton disabled={!ready} onClick={onFinish} icon="arrow-right">Guardar decisión y ver informe</ActionButton>}
          </PageActions>
        </ContentCard>
      )}
      {step === 4 && (
        <>
          <ContentCard>
            <h2>Lo que esperabas y lo que salió</h2>
            <p><strong>Tu estimación:</strong> {prediction} filas.</p>
            <p><strong>Tu ejecución paso a paso:</strong> {investigation.notes}</p>
            <p><strong>Resultado de la consulta de IA:</strong> {returned.length} filas.</p>
            <TransactionTable rows={returned} caption="Filas obtenidas al ejecutar la consulta en SQLite" />
            <TransactionTable rows={EXPECTED_ROWS} caption="Filas esperadas según el encargo" />
          </ContentCard>
          <ContentCard>
            <h2>Qué conviene revisar</h2>
            <p>La consulta de IA omite el filtro de estado. La fila {extraIds.join(", ")} se incluye aunque está pendiente. Para cumplir el encargo, añade <code>AND estado = 'Confirmada'</code> antes de ordenar y vuelve a comprobar los IDs.</p>
            <p><strong>Tu decisión:</strong> {{accept: "Aceptar", modify: "Modificar", reject: "Rechazar"}[testing.verdict]}</p>
            <p><strong>Tu evidencia:</strong> {testing.rationale}</p>
          </ContentCard>
          <PageActions>
            <ActionButton variant="secondary" onClick={onExport}>Descargar evidencia</ActionButton>
            <ActionButton onClick={onHome} icon="arrow-right">Volver a desafíos</ActionButton>
          </PageActions>
        </>
      )}
    </div>
  );
}
