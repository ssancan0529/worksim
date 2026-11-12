import { useEffect, useRef, useState } from 'react';
import { PROJECT_RUBRICS, SALES } from '../../data/projectRubrics';
import { executePython } from '../../lib/python';
import ActionButton from '../../components/ActionButton';

export default function ProjectEvidence({ project, stageIndex, work, onWorkChange }) {
  const rubric = PROJECT_RUBRICS[project.id];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(null);
  useEffect(() => () => { const job = running.current; running.current = null; job?.cancel(); }, []);

  async function runInventory() {
    if (running.current || !work.inventoryCode?.trim()) return;
    setBusy(true);
    setError('');
    const code = work.inventoryCode;
    const job = executePython(code, {}, () => {}, 'inventory');
    running.current = job;
    try {
      const response = await job.promise;
      if (running.current !== job) return;
      if (response.error) throw new Error(response.error);
      onWorkChange(current => ({ ...current, inventoryRun: { code, results: response.result, at: new Date().toISOString() } }));
    } catch (failure) {
      if (running.current === job) setError(failure.message);
    } finally {
      if (running.current === job) { running.current = null; setBusy(false); }
    }
  }

  return <div className="project-evidence">
    <details className="project-reference">
      <summary>Datos y condiciones de evaluación</summary>
      <p>{rubric.context}</p>
      {project.area === 'data' && <div className="table-scroll"><table>
        <caption>Movimientos de ventas de práctica</caption>
        <thead><tr>{['ID', 'Mes', 'Categoría', 'USD'].map(label => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{SALES.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{value}</td>)}</tr>)}</tbody>
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
      <label className="project-evidence-field"><span>Función mover_stock en Python</span>
        <textarea rows={10} spellCheck={false} value={work.inventoryCode || ''} disabled={busy}
          placeholder="def mover_stock(stock, cantidad, operacion):"
          onChange={event => { const inventoryCode = event.target.value; setError(''); onWorkChange(current => ({ ...current, inventoryCode, inventoryRun: null })); }} />
      </label>
      <p>Pruebas de entradas, salidas, límite de existencias y cantidades inválidas. El resultado debe tener aceptado (booleano) y stock (entero). La primera ejecución requiere descargar Python.</p>
      <ActionButton disabled={busy || !work.inventoryCode?.trim()} onClick={runInventory}>{busy ? 'Ejecutando pruebas…' : 'Ejecutar pruebas de stock'}</ActionButton>
      {busy && <ActionButton variant="secondary" onClick={() => running.current?.cancel()}>Detener</ActionButton>}
      <div aria-live="polite">{error && <p role="alert">{error}</p>}
        {!busy && work.inventoryRun?.code === work.inventoryCode && <p>Pruebas registradas. Entrega el proyecto para revisar cada resultado.</p>}
      </div>
    </>}
  </div>;
}
