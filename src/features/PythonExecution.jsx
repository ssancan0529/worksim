import { useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import { executePython } from "../lib/python";

function PetsChecks({ checks, own = false }) {
  return (
    <>
      <p><strong>{checks.filter(check => check.passed).length} de {checks.length}</strong> criterios cumplidos.
        {own && " Intento registrado. Puedes continuar."}</p>
      <ul className="exercise-criteria">{checks.map(check => (
        <li key={check.id}>
          <div><strong>{check.name}</strong><CriterionStatus passed={check.passed} /></div>
          <details><summary>Ver evidencia</summary><p>{check.detail}</p></details>
        </li>
      ))}</ul>
    </>
  );
}

export default function PythonExecution({ code, children, checks, onSuccess, onBusyChange, comparisonCode, brief, onReveal, initialParameters, onParametersChange, onInvalidate, bank = false, canReveal = true, canRun = true }) {
  const [parameters, setParameters] = useState(initialParameters || (bank ? { kind: "transferencia", status: "", limit: "10", offset: "0" } : { species: "dog", city: "Guayaquil", limit: "10", offset: "0" }));
  const [phase, setPhase] = useState("");
  const [response, setResponse] = useState(null);
  const [comparison, setComparison] = useState(null);
  const activeRun = useRef(null);
  useEffect(() => () => {
    const run = activeRun.current;
    activeRun.current = null;
    run?.cancel();
  }, []);

  useEffect(() => { setResponse(null); setComparison(null); }, [code]);

  const validParameters = /^\d+$/.test(parameters.limit) && /^\d+$/.test(parameters.offset)
    && Number.isSafeInteger(Number(parameters.limit)) && Number.isSafeInteger(Number(parameters.offset));
  const busy = Boolean(phase);

  async function run(compare = false) {
    if (activeRun.current || !canRun || !code.trim() || !validParameters) return;
    onInvalidate();
    onBusyChange(true);
    setComparison(null);
    setPhase("loading");
    setResponse(null);
    const args = {
      ...(bank ? { kind: parameters.kind.trim() || null, status: parameters.status.trim() || null }
        : { species: parameters.species.trim() || null, city: parameters.city.trim() || null }),
      limit: Number(parameters.limit), offset: Number(parameters.offset),
    };
    const taskType = bank ? "bank-operations" : "pets";
    let task;
    let ownFinished = false;
    try {
      task = executePython(code, args, () => setPhase("running"), taskType);
      activeRun.current = task;
      const result = await task.promise;
      if (activeRun.current !== task) return;
      setResponse(result);
      ownFinished = true;
      if (!result.error && Array.isArray(result.checks)) onSuccess(code, result.checks);
      if (compare) {
        setPhase("loading");
        const aiTask = executePython(comparisonCode, args, () => setPhase("running"), taskType);
        task = aiTask;
        activeRun.current = aiTask;
        const aiResult = await aiTask.promise;
        if (activeRun.current === aiTask) setComparison(aiResult);
      }
    } catch (error) {
      if (!task || activeRun.current === task) {
        if (compare && ownFinished) setComparison({ error: error.message });
        else setResponse({ error: error.message });
      }
    } finally {
      if (!task || activeRun.current === task) {
        activeRun.current = null;
        onBusyChange(false);
        setPhase("");
      }
    }
  }

  return (
    <>
      {brief}
      <div className="exercise-code-results">
        <ContentCard>
          {children(() => run())}
          {bank ? <p>Dispones de <code>db</code>, el modelo <code>Operation</code> y 30 operaciones ficticias. Cada operación tiene id, kind, status, date (AAAA-MM-DD) y cents (entero). Tipos: transferencia y retiro. Estados: confirmada y pendiente. Deja un filtro vacío para omitirlo.</p> : <>
          <p>Se ejecuta el código del editor de arriba y se llama a <code>list_pets</code> con estos parámetros. Dispones de <code>db</code>, <code>Pet</code> y SQLAlchemy sobre 50 mascotas ficticias en SQLite.</p>
          <p className="field-hint">Especies de la muestra: <code>dog</code> y <code>cat</code>. Ciudades: Guayaquil y Quito. Deja especie o ciudad vacía para omitir ese filtro.</p></>}
          <div className="python-parameters">
            {[...(bank ? [["kind", "Tipo"], ["status", "Estado"]] : [["species", "Especie"], ["city", "Ciudad"]]), ["limit", "Límite"], ["offset", "Desplazamiento"]].map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input type={key === "limit" || key === "offset" ? "number" : "text"} min={key === "limit" || key === "offset" ? 0 : undefined} step="1" value={parameters[key]} disabled={busy} onChange={(event) => { const next = { ...parameters, [key]: event.target.value }; setParameters(next); onParametersChange(next); setResponse(null); setComparison(null); }} />
              </label>
            ))}
          </div>
          <div className="sql-workspace-actions">
            <ActionButton disabled={busy || !canRun || !code.trim() || !validParameters} onClick={() => run()} icon="play">{phase === "loading" ? "Cargando Python…" : phase === "running" ? "Ejecutando…" : "Ejecutar Python"}</ActionButton>
            {busy && <ActionButton variant="secondary" onClick={() => activeRun.current?.cancel()}>Detener ejecución</ActionButton>}
          </div>
          <p className="field-hint">La primera ejecución descarga Python y sus dependencias. Necesitas conexión a internet.</p>
          {!validParameters && <p role="alert">Límite y desplazamiento deben ser números enteros mayores o iguales a cero.</p>}
        </ContentCard>
        <ContentCard>
          <h2>Resultado de tu código</h2>
          <div aria-live="polite" aria-busy={busy}>
            {!response && !checks && <p className="muted">Ejecuta tu código para comprobar los requisitos.</p>}
            {response && (
              <>
                {response.output && <pre className="code-block">{response.output}</pre>}
                {(response.error || response.caseError) && <pre className="code-block" role="alert">{response.error || response.caseError}</pre>}
                {Array.isArray(response.result) && <p>{response.result.length} registro(s) devueltos.</p>}
                {Array.isArray(response.result) && response.result.length > 0 && response.result.every((item) => item && typeof item === "object" && "id" in item) ? (
                  <div className="table-scroll"><table>
                    <caption>{bank ? "Operaciones devueltas" : "Mascotas devueltas por list_pets"}</caption>
                    <thead><tr>{(bank ? ["ID", "Tipo", "Estado", "Fecha", "Centavos"] : ["ID", "Especie", "Ciudad", "Urgencia", "Adoptada"]).map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                    <tbody>{response.result.map((pet, index) => <tr key={index}><td>{String(pet.id ?? "NULL")}</td>{(bank ? ["kind", "status", "date", "cents"] : ["species", "city", "urgency_level", "is_adopted"]).map(key => <td key={key}>{String(pet[key] ?? "NULL")}</td>)}</tr>)}</tbody>
                  </table></div>
                ) : response.result && <pre className="code-block">{JSON.stringify(response.result, null, 2)}</pre>}
              </>
            )}
            {checks && <PetsChecks checks={checks} own />}
          </div>
        </ContentCard>
      </div>
      <ContentCard className="exercise-comparison">
        <h2>Contrasta con la propuesta preparada (opcional)</h2>
        {comparisonCode ? <>
          <pre className="code-block"><code>{comparisonCode}</code></pre>
          <ActionButton variant="secondary" icon="play" disabled={busy || !canRun || !code.trim() || !validParameters}
            onClick={() => run(true)}>Ejecutar ambas funciones</ActionButton>
          <div aria-live="polite" aria-busy={busy}>
            {comparison && (
              <>
                <h3>Resultado de la IA</h3>
                <pre className="code-block">{comparison.error || comparison.caseError || JSON.stringify(comparison.result, null, 2)}</pre>
                {comparison.checks && <PetsChecks checks={comparison.checks} />}
              </>
            )}
          </div>
        </> : <>
          <p>Escribe un primer intento para ver la propuesta.</p>
          <ActionButton variant="secondary" disabled={!canReveal || !code.trim() || busy} onClick={onReveal}>Ver propuesta de la IA</ActionButton>
        </>}
      </ContentCard>
    </>
  );
}
