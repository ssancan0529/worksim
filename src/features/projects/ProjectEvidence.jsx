import { useEffect, useRef, useState } from 'react';
import { SALES } from '../../data/projectRubrics';
import { BANK_TRANSACTIONS } from '../../data/bankProjects';
import { getProjectRubric } from '../../lib/projects';
import { executePython } from '../../lib/python';
import ActionButton from '../../components/ActionButton';

export default function ProjectEvidence({ project, stageIndex, work, onWorkChange }) {
  const rubric = getProjectRubric(project);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(null);
  useEffect(() => () => { const job = running.current; running.current = null; job?.cancel(); }, []);

  async function runInventory() {
    if (running.current || !work.inventoryCode?.trim()) return;
    setBusy(true);
    setError('');
    const code = work.inventoryCode;
    let job;
    onWorkChange(current => ({ ...current, inventoryRun: null }));
    try {
      job = executePython(code, {}, () => {}, project.bank ? 'bank-movements' : 'inventory');
      running.current = job;
      const response = await job.promise;
      if (running.current !== job) return;
      if (response.error) throw new Error(response.error);
      onWorkChange(current => ({ ...current, inventoryRun: { code, results: response.result, at: new Date().toISOString() } }));
    } catch (failure) {
      if (!job || running.current === job) setError(failure.message);
    } finally {
      if (!job || running.current === job) { running.current = null; setBusy(false); }
    }
  }

  return <div className="project-evidence">
    <details className="project-reference">
      <summary>Datos y condiciones de evaluación</summary>
      <p>{rubric.context}</p>
      {project.area === 'data' && <div className="table-scroll"><table>
        <caption>{project.bank ? "Extracto bancario ficticio" : "Movimientos de ventas de práctica"}</caption>
        <thead><tr>{(project.bank ? ['ID', 'Mes', 'Canal', 'Estado', 'USD'] : ['ID', 'Mes', 'Categoría', 'USD']).map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{(project.bank ? BANK_TRANSACTIONS : SALES).map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{value}</td>)}</tr>)}</tbody>
      </table></div>}
    </details>
    <h3>Evidencia verificable</h3>
    <p>Consulta los datos del encargo. Puedes continuar y entregar respuestas parciales. En los números usa coma o punto decimal, sin separador de miles.</p>
    {rubric.stages[stageIndex].map(field => <label className="project-evidence-field" key={field.id}>
      <span>{field.label}</span>
      {field.type === 'select' ? <select value={work.evidence?.[field.id] ?? ''}
        onChange={event => { const value = event.target.value; onWorkChange(current => ({ ...current, evidence: { ...current.evidence, [field.id]: value } })); }}>
        <option value="">Selecciona una respuesta</option>
        {field.options.map(option => <option key={option} value={option}>{option}</option>)}
      </select> : <input type="text" inputMode="decimal" value={work.evidence?.[field.id] ?? ''}
        onChange={event => { const value = event.target.value; onWorkChange(current => ({ ...current, evidence: { ...current.evidence, [field.id]: value } })); }} />}
    </label>)}
    {project.id === 'api-de-inventario' && stageIndex === 1 && <>
      <label className="project-evidence-field"><span>{project.bank ? "Función registrar_movimiento en Python" : "Función mover_stock en Python"}</span>
        <textarea rows={10} spellCheck={false} value={work.inventoryCode || ''} disabled={busy}
          placeholder={project.bank ? "def registrar_movimiento(ledger, movement_id, cents, kind):" : "def mover_stock(stock, cantidad, operacion):"}
          onChange={event => { const inventoryCode = event.target.value; setError(''); onWorkChange(current => ({ ...current, inventoryCode, inventoryRun: null })); }} />
      </label>
      <p>{project.bank ? "Prueba el registro, los duplicados, los montos inválidos y la conservación del historial." : "Pruebas de entradas, salidas, límite de existencias y cantidades inválidas."} La primera ejecución descarga Python.</p>
      <ActionButton disabled={busy || !work.inventoryCode?.trim()} onClick={runInventory}>{busy ? 'Ejecutando pruebas…' : 'Ejecutar pruebas de Python'}</ActionButton>
      {busy && <ActionButton variant="secondary" onClick={() => running.current?.cancel()}>Detener</ActionButton>}
      <div aria-live="polite">{error && <p role="alert">{error}</p>}
        {!busy && work.inventoryRun?.code === work.inventoryCode && <p>Pruebas registradas. Entrega el proyecto para revisar cada resultado.</p>}
      </div>
    </>}
  </div>;
}
