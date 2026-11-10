import { useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import { executePython } from "../lib/python";

export default function PythonExecution({ code }) {
  const [parameters, setParameters] = useState({ species: "dog", city: "Guayaquil", limit: "10", offset: "0" });
  const [phase, setPhase] = useState("");
  const [response, setResponse] = useState(null);
  const [executedCode, setExecutedCode] = useState("");
  const [executedParameters, setExecutedParameters] = useState(null);
  const activeRun = useRef(null);
  useEffect(() => () => {
    const run = activeRun.current;
    activeRun.current = null;
    run?.cancel();
  }, []);

  const validParameters = /^\d+$/.test(parameters.limit) && /^\d+$/.test(parameters.offset)
    && Number.isSafeInteger(Number(parameters.limit)) && Number.isSafeInteger(Number(parameters.offset));
  const busy = Boolean(phase);

  async function run() {
    setPhase("loading");
    setResponse(null);
    const args = {
      species: parameters.species.trim() || null,
      city: parameters.city.trim() || null,
      limit: Number(parameters.limit), offset: Number(parameters.offset),
    };
    const task = executePython(code, args, () => setPhase("running"));
    activeRun.current = task;
    setExecutedCode(code);
    setExecutedParameters(parameters);
    try {
      const result = await task.promise;
      if (activeRun.current === task) setResponse(result);
    } catch (error) {
      if (activeRun.current === task) setResponse({ error: error.message });
    } finally {
      if (activeRun.current === task) {
        activeRun.current = null;
        setPhase("");
      }
    }
  }

  return (
    <section className="python-execution" aria-labelledby="python-execution-title">
      <h3 id="python-execution-title">Ejecuta tu código Python</h3>
      <p>Se ejecuta el código del editor de arriba y se llama a <code>list_pets</code> con estos parámetros. Dispones de <code>db</code>, <code>Pet</code> y SQLAlchemy sobre 50 mascotas ficticias en SQLite.</p>
      <p className="field-hint">Especies de la muestra: <code>dog</code> y <code>cat</code>. Ciudades: Guayaquil y Quito. Deja especie o ciudad vacía para omitir ese filtro.</p>
      <div className="python-parameters">
        {[["species", "Especie"], ["city", "Ciudad"], ["limit", "Límite"], ["offset", "Desplazamiento"]].map(([key, label]) => (
          <label key={key}>
            <span>{label}</span>
            <input type={key === "limit" || key === "offset" ? "number" : "text"} min={key === "limit" || key === "offset" ? 0 : undefined} step="1" value={parameters[key]} disabled={busy} onChange={(event) => setParameters({ ...parameters, [key]: event.target.value })} />
          </label>
        ))}
      </div>
      <div className="sql-workspace-actions">
        <ActionButton disabled={busy || !code.trim() || !validParameters} onClick={run} icon="play">{phase === "loading" ? "Cargando Python…" : phase === "running" ? "Ejecutando…" : "Ejecutar Python"}</ActionButton>
        {busy && <ActionButton variant="secondary" onClick={() => activeRun.current?.cancel()}>Detener ejecución</ActionButton>}
      </div>
      <p className="field-hint">La primera ejecución descarga Python y sus dependencias. Necesitas conexión a internet.</p>
      {!validParameters && <p role="alert">Límite y desplazamiento deben ser números enteros mayores o iguales a cero.</p>}
      <div aria-live="polite" aria-busy={busy}>
        {response && (
          <>
            <h4>Resultado de la ejecución</h4>
            {(executedCode !== code || executedParameters !== parameters) && <p className="field-hint">Cambiaste el código o los parámetros. Ejecuta de nuevo para actualizar el resultado.</p>}
            {response.output && <pre className="code-block">{response.output}</pre>}
            {response.error && <pre className="code-block" role="alert">{response.error}</pre>}
            {Array.isArray(response.result) && <p>{response.result.length} registro(s) devueltos.</p>}
            {Array.isArray(response.result) && response.result.length > 0 && response.result.every((item) => item && typeof item === "object" && "id" in item) ? (
              <div className="table-scroll"><table>
                <caption>Mascotas devueltas por list_pets</caption>
                <thead><tr>{["ID", "Especie", "Ciudad", "Urgencia", "Adoptada"].map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                <tbody>{response.result.map((pet, index) => <tr key={index}><td>{String(pet.id ?? "NULL")}</td><td>{String(pet.species ?? "NULL")}</td><td>{String(pet.city ?? "NULL")}</td><td>{String(pet.urgency_level ?? "NULL")}</td><td>{String(pet.is_adopted)}</td></tr>)}</tbody>
              </table></div>
            ) : response.result && <pre className="code-block">{JSON.stringify(response.result, null, 2)}</pre>}
          </>
        )}
      </div>
    </section>
  );
}
