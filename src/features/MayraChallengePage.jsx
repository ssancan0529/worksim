import { useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import ExerciseDecision from "../components/ExerciseDecision";
import ExerciseEditor from "../components/ExerciseEditor";
import ExerciseGuide from "../components/ExerciseGuide";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import StatusNotice from "../components/StatusNotice";
import { AI_QUERY, EXPECTED_ROWS, MAYRA_CHALLENGE, TRANSACTIONS } from "../data/mayra";
import { runMayraSql } from "../lib/mayraSql";

const columns = ["id", "ciudad", "tipo", "estado", "monto"];
const options = [["accept", "Aceptar"], ["modify", "Modificar"], ["reject", "Rechazar"]];

function Rows({ rows, headers = columns, caption }) {
  return (
    <div className="table-scroll exercise-table" tabIndex={0} role="region" aria-label={caption}>
      <table>
        <caption>{caption}</caption>
        <thead><tr>{headers.map((column, i) => <th scope="col" key={i}>{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value === null ? "NULL" : String(value)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function checkRows(result) {
  const rows = result?.values ?? [];
  const returnedColumns = result?.columns.map(column => column.toLowerCase()) ?? [];
  const idIndex = returnedColumns.indexOf("id");
  const ids = rows.map(row => row[idIndex]);
  const expectedIds = EXPECTED_ROWS.map(([id]) => id);
  const sameRows = ids.length === expectedIds.length && expectedIds.every(id => ids.includes(id));
  return [
    { id: "sql-columns", name: "Devuelve las columnas solicitadas", passed: columns.every(column => returnedColumns.includes(column)) },
    { id: "sql-selection", name: "Selecciona todas y solo las transferencias del encargo", passed: sameRows },
    { id: "sql-order", name: "Ordena las filas por ID ascendente", passed: ids.length > 0
      && ids.every((id, index) => Number.isInteger(id) && (index === 0 || ids[index - 1] < id)) },
  ];
}

function SqlResult({ result, error }) {
  if (error) return <StatusNotice variant="warning">{error}</StatusNotice>;
  if (result === undefined) return <p className="muted">Ejecuta tu código para comprobar los requisitos.</p>;
  return (
    <>
      {result?.values.length ? <Rows rows={result.values} headers={result.columns} caption="Filas devueltas" />
        : <p className="muted">La consulta devolvió cero filas.</p>}
      <ul className="exercise-criteria">
        {checkRows(result).map(check => <li key={check.id}><div><strong>{check.name}</strong><CriterionStatus passed={check.passed} /></div></li>)}
      </ul>
    </>
  );
}

export default function MayraChallengePage({ step, draft, onUpdate, onBack, onFinish, onHome, onExport }) {
  const { testing } = draft;
  const [result, setResult] = useState(undefined);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const running = useRef(false);
  const ready = testing.ran;
  useEffect(() => () => { running.current = false; }, []);

  const update = (key, value) => onUpdate(current => ({
    ...current, testing: { ...current.testing, [key]: value },
  }));

  async function execute(compare = false) {
    if (running.current || !testing.code.trim()) return;
    running.current = true;
    setBusy(compare ? "comparison" : "own");
    setError("");
    try {
      const [ownResult] = await runMayraSql(testing.code);
      if (!running.current) return;
      setResult(ownResult ?? null);
      if (compare) {
        const [aiResult] = await runMayraSql(AI_QUERY);
        if (!running.current) return;
        onUpdate(current => ({
          ...current,
          testing: { ...current.testing, ran: true, rows: aiResult?.values ?? [], results: checkRows(ownResult) },
        }));
      }
    } catch (failure) {
      if (running.current) {
        setResult(undefined);
        setError(failure.message);
      }
    } finally {
      if (running.current) setBusy("");
      running.current = false;
    }
  }

  if (step === 2) return (
    <div className="practice-form">
      <PageIntro title="Informe de transferencias" description="Compara la propuesta con los requisitos del Banco Horizonte." />
      <ContentCard>
        <h2>Resultado de la IA</h2>
        <SqlResult result={{ columns, values: testing.rows }} />
        <h3>Filas esperadas</h3>
        <Rows rows={EXPECTED_ROWS} caption="Transferencias que cumplen el encargo" />
        <p>La propuesta incluye la fila 102, cuyo estado es Pendiente. Verifica el estado de las transferencias antes de entregar el reporte.</p>
      </ContentCard>
      <ContentCard>
        <h2>Tu evidencia</h2>
        {testing.results.map(check => <p key={check.id}>{check.name} · <CriterionStatus passed={check.passed} /></p>)}
        <p>{options.find(([value]) => value === testing.verdict)?.[1]} · {testing.rationale}</p>
      </ContentCard>
      <PageActions>
        <ActionButton variant="secondary" onClick={onExport}>Descargar evidencia</ActionButton>
        <ActionButton onClick={onHome}>Volver a desafíos</ActionButton>
      </PageActions>
    </div>
  );

  return (
    <>
      <PageIntro eyebrow="BANCO HORIZONTE · SQL" title={MAYRA_CHALLENGE.title} />
      <ExerciseGuide items={[["SELECT y FROM", "Elige las columnas y la tabla."], ["WHERE", "Combina los filtros con AND."], ["ORDER BY", "Ordena el resultado por la columna indicada."]]} />
      <div className="exercise-workbench">
        <ContentCard>
          <h2>Tu encargo</h2>
          <p>Lista las transferencias confirmadas de Guayaquil de $100 o más. Devuelve las columnas de la muestra y ordena por ID ascendente.</p>
          <Rows rows={TRANSACTIONS} caption="Tabla transacciones" />
        </ContentCard>
        <div>
          <ContentCard>
            <ExerciseEditor id="mayra-sql-editor" label="Tu consulta SQL" file="consulta.sql" value={testing.code}
              placeholder="Escribe tu consulta aquí…" readOnly={Boolean(busy)} onRun={() => execute()}
              onChange={code => {
                setResult(undefined);
                setError("");
                onUpdate(current => ({ ...current, testing: { ...current.testing, code, ran: false, results: [], rows: [] } }));
              }} />
            <div className="exercise-editor-actions">
              <ActionButton icon="play" iconPosition="left" disabled={Boolean(busy) || !testing.code.trim()} onClick={() => execute()}>
                {busy === "own" ? "Ejecutando…" : "Ejecutar consulta"}
              </ActionButton>
              <details className="exercise-hint"><summary>Ver pista</summary><p>Revisa qué condiciones debe cumplir cada fila antes de ordenar.</p></details>
            </div>
          </ContentCard>
          <ContentCard>
            <h2>Resultado de tu código</h2>
            <div aria-live="polite" aria-busy={Boolean(busy)}><SqlResult result={result} error={error} /></div>
          </ContentCard>
        </div>
      </div>
      <ContentCard className="exercise-comparison">
        <h2>Compara con la IA</h2>
        {draft.investigation.reviewed ? <>
          <pre className="code-block"><code>{AI_QUERY}</code></pre>
          <ActionButton variant="secondary" icon="play" disabled={Boolean(busy) || !testing.code.trim()} onClick={() => execute(true)}>Ejecutar ambas consultas</ActionButton>
          {ready && <><h3>Resultado de la IA</h3><SqlResult result={{ columns, values: testing.rows }} /></>}
        </> : <>
          <p>Escribe y ejecuta tu consulta para ver la propuesta.</p>
          <ActionButton variant="secondary" disabled={result === undefined || Boolean(busy)}
            onClick={() => onUpdate(current => ({ ...current, investigation: { ...current.investigation, reviewed: true } }))}>Ver propuesta de la IA</ActionButton>
        </>}
      </ContentCard>
      <ExerciseDecision testing={testing} options={options} onChange={update} onFinish={onFinish} onBack={onBack} ready={ready && !busy} />
    </>
  );
}
