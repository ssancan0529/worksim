import { useState } from "react";
import Field from "../components/Field";
import ReviewPrompt from "../components/ReviewPrompt";
import { BANK_OPERATION_PROPOSAL, BANK_OPERATION_REQUIREMENTS } from "../data/bankOperations";
import ContentCard from "../components/ContentCard";
import ExerciseDecision from "../components/ExerciseDecision";
import ExerciseEditor from "../components/ExerciseEditor";
import ExerciseGuide from "../components/ExerciseGuide";
import PageIntro from "../components/PageIntro";
import { hasCurrentPetsReview } from "../lib/completion";
import { ORIGINAL_CODE, REQUIREMENTS } from "../data/scenario";
import PythonExecution from "./PythonExecution";

const options = [
  ["approve", "Aprobar"], ["refactor", "Refactorizar"],
  ["reject", "Rechazar"], ["clarify", "Pedir una aclaración"],
];

export default function TestingPage({ testing, onChange, onRun, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const bank = testing.bankOperations === true;
  const ready = hasCurrentPetsReview(testing);
  const pending = testing.results.find(check => !check.passed);
  return (
    <>
      <PageIntro eyebrow={bank ? "BANCO HORIZONTE · PYTHON" : "ADOPTA+ · PYTHON"} title="Un problema en producción"
        description={bank ? "Investiga por qué desaparecen operaciones al cambiar de página en el listado interno." : "Implementa el listado de mascotas y comprueba el resultado antes de contrastarlo con la IA."} />
      <ExerciseGuide items={[["filter", "Aplica las condiciones al conjunto de registros."], ["order_by", "Define el orden del listado y cómo resolver empates."], ["offset y limit", "Seleccionan qué página devolver."]]} />
      {bank && <ContentCard>
        <h2>Incidente del cierre de Operaciones</h2>
        <p>En Banco Horizonte, el equipo que concilia transferencias y retiros reportó que algunas operaciones del mismo día desaparecen al pasar de página. El listado se usa para buscar movimientos pendientes y decidir qué investigar durante el cierre.</p>
        <p>Como desarrollador junior de guardia, entrega una corrección y una prueba que permita a otra persona reproducir el fallo y verificar que dos páginas consecutivas conservan todos los registros en su orden.</p>
      </ContentCard>}
      {bank && <ContentCard>
        <Field id="bank-plan" label="Tu estrategia inicial: explica filtros, orden, paginación y una prueba"
          value={testing.plan || ""} rows={3} disabled={busy} onChange={value => onChange("plan", value)} />
      </ContentCard>}
      <PythonExecution bank={bank} canRun={!bank || Boolean(testing.plan?.trim())} canReveal={!bank || Boolean(testing.plan?.trim() && ready)} code={testing.code} onSuccess={onRun} checks={ready ? testing.results : null} onBusyChange={setBusy} initialParameters={testing.parameters}
        onInvalidate={() => onChange("invalidateRun", null)} onParametersChange={value => onChange("parameters", value)}
        comparisonCode={revealed ? (bank ? BANK_OPERATION_PROPOSAL : ORIGINAL_CODE) : undefined}
        onReveal={() => setRevealed(true)}
        brief={
          <ContentCard>
            <h2>Tu encargo</h2>
            <p>Implementa <code>{bank ? "list_operations(kind=None, status=None, limit=10, offset=0)" : "list_pets(species=None, city=None, limit=10, offset=0)"}</code>.</p>
            <ul className="plain-list">{(bank ? BANK_OPERATION_REQUIREMENTS : REQUIREMENTS).map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
          </ContentCard>
        }>
        {run => (
          <>
            <ExerciseEditor id="sandbox-code" label="Tu función de Python" file={bank ? "operaciones.py" : "pets_controller.py"}
              value={testing.code} readOnly={busy} onRun={run} onChange={value => onChange("code", value)}
              placeholder={bank ? "def list_operations(kind=None, status=None, limit=10, offset=0):" : "def list_pets(species=None, city=None, limit=10, offset=0):"} />
            <p className="field-hint">Puedes empezar con una función que solo haga <code>return []</code>. Ejecuta tu intento para recibir retroalimentación y continuar con los criterios que queden por revisar.</p>
            <details className="exercise-hint"><summary>Ver pista</summary><p>Piensa qué operaciones deben ocurrir antes de llamar a <code>.all()</code>.</p></details>
          </>
        )}
      </PythonExecution>
      {bank && ready && <ReviewPrompt question={pending
        ? `¿Qué cambio harías para comprobar «${pending.name}» de nuevo?`
        : "¿Qué prueba añadirías para asegurar que dos páginas consecutivas no repiten operaciones?"}
        hint={pending?.id.startsWith("invalid") ? "Comprueba los tipos y rangos antes de consultar."
          : ["types", "combined", "status"].includes(pending?.id) ? "Prueba cada filtro por separado antes de combinarlos."
          : ["empty", "zero"].includes(pending?.id) ? "Distingue una lista vacía de un error de ejecución."
          : "Revisa el orden global y el desempate antes de seleccionar la página."} />}
      <ExerciseDecision rationaleLabel={bank ? "Cita una prueba, explica qué cambiaste y justifica tu recomendación" : undefined} testing={testing} options={options} onChange={onChange}
        onFinish={onContinue} ready={ready && !busy && (!bank || Boolean(testing.plan?.trim()))} />
    </>
  );
}
