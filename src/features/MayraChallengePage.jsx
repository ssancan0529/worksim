import { useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import ReviewPrompt from "../components/ReviewPrompt";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import ExerciseTable from "../components/ExerciseTable";
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

function checkRows(result) {
  const rows = result?.values ?? [];
  const returnedColumns = result?.columns.map(column => column.toLowerCase()) ?? [];
  const ids = rows.map(row => row[returnedColumns.indexOf("id")]);
  const expectedIds = EXPECTED_ROWS.map(([id]) => id);
  const expectedById = new Map(EXPECTED_ROWS.map(row => [row[0], row]));
  const missing = expectedIds.filter(id => !ids.includes(id));
  const extra = ids.filter(id => !expectedById.has(id));
  const matchingValues = rows.every((row, index) => {
    const expected = expectedById.get(ids[index]);
    return expected && columns.every((column, columnIndex) => row[returnedColumns.indexOf(column)] === expected[columnIndex]);
  });
  return [
    { id: "sql-columns", name: "Devuelve las columnas solicitadas",
      passed: returnedColumns.length === columns.length && columns.every((column, index) => returnedColumns[index] === column),
      detail: `Columnas esperadas: ${columns.join(", ")}. Columnas devueltas: ${returnedColumns.join(", ") || "ninguna"}.` },
    { id: "sql-selection", name: "Selecciona todas y solo las transferencias del encargo",
      passed: ids.length === expectedIds.length && !missing.length && matchingValues,
      detail: [
        `Se esperaban ${expectedIds.length} filas. La consulta devolvió ${rows.length}.`,
        missing.length && `IDs faltantes: ${missing.join(", ")}.`,
        extra.length && `IDs fuera del encargo: ${extra.map(id => id ?? "sin ID").join(", ")}.`,
        new Set(ids).size !== ids.length && "Hay IDs repetidos.",
        !matchingValues && !extra.length && "Revisa los valores de las columnas solicitadas.",
      ].filter(Boolean).join(" ") },
    { id: "sql-order", name: "Ordena las filas por ID ascendente", passed: ids.length > 0
      && ids.every((id, index) => Number.isInteger(id) && (index === 0 || ids[index - 1] < id)),
      detail: `IDs devueltos en orden: ${ids.map(id => id ?? "sin ID").join(", ") || "ninguno"}.` },
  ];
}

function SqlResult({ result, error }) {
  if (error) return <StatusNotice variant="warning">{error}</StatusNotice>;
  if (result === undefined) return <p className="muted">Ejecuta tu código para comprobar los requisitos.</p>;
  return (
    <>
      {result?.values.length ? <ExerciseTable columns={result.columns} rows={result.values} caption="Filas devueltas" />
        : <p className="muted">La consulta devolvió cero filas.</p>}
      <ul className="exercise-criteria">
        {checkRows(result).map(check => <li key={check.id}>
          <div><strong>{check.name}</strong><CriterionStatus passed={check.passed} /></div>
          <details><summary>Ver evidencia</summary><p>{check.detail}</p></details>
        </li>)}
      </ul>
    </>
  );
}

export default function MayraChallengePage({ step, draft, onUpdate, onBack, onFinish, onHome, onExport }) {
  const { testing } = draft;
  const [result, setResult] = useState(undefined);
  const [error, setError] = useState("");
  const [comparisonError, setComparisonError] = useState("");
  const [busy, setBusy] = useState("");
  const running = useRef(false);
  const ready = Boolean(testing.code.trim()) && testing.ran && testing.auditExecutedCode === testing.code;
  useEffect(() => () => { running.current = false; }, []);

  const update = (key, value) => onUpdate(current => ({
    ...current, testing: { ...current.testing, [key]: value },
  }));

  async function execute(compare = false) {
    if (running.current || (!compare && !testing.code.trim())) return;
    running.current = true;
    setBusy(compare ? "comparison" : "own");
    setError("");
    setComparisonError("");
    if (testing.code.trim()) setResult(undefined);
    onUpdate(current => ({
      ...current, testing: { ...current.testing, results: [], ...(compare ? { ran: false, rows: [] } : {}) },
    }));
    try {
      if (testing.code.trim()) try {
        const [ownResult] = await runMayraSql(testing.code);
        if (!running.current) return;
        setResult(ownResult ?? null);
        onUpdate(current => ({ ...current, testing: { ...current.testing, results: checkRows(ownResult), auditExecutedCode: testing.code, auditError: "" } }));
      } catch (failure) {
        if (running.current) {
          setError(failure.message);
          onUpdate(current => ({ ...current, testing: { ...current.testing,
            auditExecutedCode: testing.code, auditError: failure.message } }));
        }
      }
      if (compare && running.current) {
        try {
          const [aiResult] = await runMayraSql(AI_QUERY);
          if (!running.current) return;
          onUpdate(current => ({
            ...current, testing: { ...current.testing, ran: true, rows: aiResult?.values ?? [] },
          }));
        } catch (failure) {
          if (running.current) setComparisonError(failure.message);
        }
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
        {testing.ran ? <SqlResult result={{ columns, values: testing.rows }} />
          : <p>Este informe anterior se guardó sin una ejecución de la propuesta.</p>}
        <h3>Filas esperadas</h3>
        <ExerciseTable columns={columns} rows={EXPECTED_ROWS} caption="Transferencias que cumplen el encargo" collapsible />
        <p>La propuesta incluye la fila 102, cuyo estado es Pendiente. Verifica el estado de las transferencias antes de entregar el reporte.</p>
      </ContentCard>
      <ContentCard>
        <h2>Tu evidencia</h2>
        {testing.auditError && <StatusNotice variant="warning">{testing.auditError}</StatusNotice>}
        {!testing.results.length && !testing.auditError && <p>Consulta registrada. La evaluación del código está pendiente.</p>}
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
      <ContentCard className="exercise-brief">
        <h2>Tu encargo</h2>
        <p>Eres analista junior del cierre diario. Tesorería recibió un borrador que podría incluir transferencias aún pendientes. Si se comparte así, el equipo puede tomar como liquidados montos que todavía no lo están. Audita la consulta y deja una versión reproducible para la supervisora.</p>
        <p>Lista las transferencias confirmadas de Guayaquil de $100 o más. Devuelve las columnas de la muestra y ordena por ID ascendente.</p>
        <ExerciseTable columns={columns} rows={TRANSACTIONS} caption="Tabla transacciones" collapsible />
      </ContentCard>
      <ContentCard className="exercise-comparison">
        <h2>Audita la consulta propuesta</h2>
        <p>Ejemplo preparado para decidir si el reporte puede enviarse a Operaciones.</p>
        <pre className="code-block"><code>{AI_QUERY}</code></pre>
        <ActionButton variant="secondary" icon="play" disabled={Boolean(busy)} onClick={() => execute(true)}>
          {busy === "comparison" ? "Ejecutando…" : "Comprobar propuesta en SQLite"}
        </ActionButton>
        {(testing.ran || comparisonError) && <>
          <h3>Resultado de la propuesta</h3>
          <SqlResult result={{ columns, values: testing.rows }} error={comparisonError} />
          {testing.rows.some(row => row[3] !== "Confirmada") &&
            <ReviewPrompt question="¿Qué estado exige el encargo y qué fila contradice esa condición?"
              hint="Contrasta la columna estado con los filtros de la consulta." />}
        </>}
      </ContentCard>
      <div className="exercise-code-results">
        <ContentCard>
          <ExerciseEditor id="mayra-sql-editor" label="Tu consulta SQL" file="consulta.sql" value={testing.code}
            placeholder="Escribe tu consulta aquí…" readOnly={Boolean(busy)} onRun={() => execute()}
            onChange={code => {
              setResult(undefined);
              setError("");
              setComparisonError("");
              onUpdate(current => ({ ...current, testing: { ...current.testing, code, auditExecutedCode: "", auditError: "", results: [], verdict: "", rationale: "" } }));
            }} />
          <p className="field-hint">Escribe lo que sepas para continuar. Tu consulta puede estar incompleta o tener errores.</p>
          <div className="exercise-editor-actions">
            <ActionButton icon="play" iconPosition="left" disabled={Boolean(busy) || !testing.code.trim()} onClick={() => execute()}>
              {busy === "own" ? "Ejecutando…" : "Ejecutar consulta"}
            </ActionButton>
            <details className="exercise-hint"><summary>Ver pista</summary><p>Revisa qué condiciones debe cumplir cada fila antes de ordenar.</p></details>
          </div>
        </ContentCard>
        <ContentCard>
          <h2>Resultado de tu código</h2>
          <div aria-live="polite" aria-busy={Boolean(busy)}><SqlResult result={result} error={error || testing.auditError} /></div>
        </ContentCard>
      </div>
      <ExerciseDecision testing={testing} options={options} rationaleLabel="Cita una fila, explica qué requisito incumple y qué cambiarías antes de enviar el reporte" onChange={update} onFinish={onFinish} onBack={onBack} ready={ready && !busy} />
    </>
  );
}
