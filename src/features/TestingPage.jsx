import { useState } from "react";
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

export default function TestingPage({ testing, onChange, onRun, onBack, onContinue }) {
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = hasCurrentPetsReview(testing);
  return (
    <>
      <PageIntro eyebrow="ADOPTA+ · PYTHON" title="Un problema en producción"
        description="Implementa el listado de mascotas y comprueba el resultado antes de contrastarlo con la IA." />
      <ExerciseGuide items={[["filter", "Aplica las condiciones al conjunto de mascotas."], ["order_by", "Define el orden de prioridad y cómo resolver empates."], ["offset y limit", "Seleccionan qué página devolver."]]} />
      <PythonExecution code={testing.code} onSuccess={onRun} checks={ready ? testing.results : null} onBusyChange={setBusy} initialParameters={testing.parameters}
        onInvalidate={() => onChange("invalidateRun", null)} onParametersChange={value => onChange("parameters", value)}
        comparisonCode={revealed ? ORIGINAL_CODE : undefined}
        onReveal={() => setRevealed(true)}
        brief={
          <ContentCard>
            <h2>Tu encargo</h2>
            <p>Escribe <code>list_pets(species=None, city=None, limit=10, offset=0)</code>. Usa la sesión <code>db</code> y el modelo <code>Pet</code>.</p>
            <ul className="plain-list">{REQUIREMENTS.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
          </ContentCard>
        }>
        {run => (
          <>
            <ExerciseEditor id="sandbox-code" label="Tu función de Python" file="pets_controller.py"
              value={testing.code} readOnly={busy} onRun={run} onChange={value => onChange("code", value)}
              placeholder="def list_pets(species=None, city=None, limit=10, offset=0):" />
            <p className="field-hint">Puedes empezar con una función que solo haga <code>return []</code>. Ejecuta tu intento para recibir retroalimentación y continuar con los criterios que queden por revisar.</p>
            <details className="exercise-hint"><summary>Ver pista</summary><p>Piensa qué operaciones deben ocurrir antes de llamar a <code>.all()</code>.</p></details>
          </>
        )}
      </PythonExecution>
      <ExerciseDecision testing={testing} options={options} onChange={onChange}
        onFinish={onContinue} onBack={onBack} ready={ready && !busy} />
    </>
  );
}
