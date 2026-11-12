import { useState } from "react";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import ExerciseDecision from "../components/ExerciseDecision";
import ExerciseEditor from "../components/ExerciseEditor";
import ExerciseGuide from "../components/ExerciseGuide";
import PageIntro from "../components/PageIntro";
import { ORIGINAL_CODE, REQUIREMENTS } from "../data/scenario";
import PythonExecution from "./PythonExecution";

const options = [
  ["approve", "Aprobar"], ["refactor", "Refactorizar"],
  ["reject", "Rechazar"], ["clarify", "Pedir una aclaración"],
];

export default function TestingPage({ testing, onChange, onRun, onBack, onContinue }) {
  const [revealed, setRevealed] = useState(testing.ran);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageIntro eyebrow="ADOPTA+ · PYTHON" title="Un problema en producción"
        description="Implementa el listado de mascotas y comprueba el resultado antes de contrastarlo con la IA." />
      <ExerciseGuide items={[["filter", "Aplica las condiciones al conjunto de mascotas."], ["order_by", "Define el orden de prioridad y cómo resolver empates."], ["offset y limit", "Seleccionan qué página devolver."]]} />
      <PythonExecution code={testing.code} onSuccess={onRun} onBusyChange={setBusy} initialParameters={testing.parameters}
        onInvalidate={() => onChange("invalidateRun", null)} onParametersChange={value => onChange("parameters", value)}
        comparisonCode={revealed ? ORIGINAL_CODE : undefined}
        onReveal={() => setRevealed(true)} canReveal={testing.ran}
        brief={
          <ContentCard>
            <h2>Tu encargo</h2>
            <p>Escribe <code>list_pets(species=None, city=None, limit=10, offset=0)</code>. Usa la sesión <code>db</code> y el modelo <code>Pet</code>.</p>
            <ul className="plain-list">{REQUIREMENTS.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
          </ContentCard>
        }>
        <ExerciseEditor id="sandbox-code" label="Tu función de Python" file="pets_controller.py"
          value={testing.code} readOnly={busy} onChange={value => onChange("code", value)}
          placeholder="def list_pets(species=None, city=None, limit=10, offset=0):" />
        <details className="exercise-hint"><summary>Ver pista</summary><p>Piensa qué operaciones deben ocurrir antes de llamar a <code>.all()</code>.</p></details>
      </PythonExecution>
      {testing.ran && <ContentCard>
        <h2>Revisión de requisitos del código</h2>
        <p className="muted">Esta revisión busca señales en el código. Contrástalas con el resultado de la ejecución.</p>
        <ul className="exercise-criteria">{testing.results.map(result => (
          <li key={result.id}><div><strong>{result.name}</strong><CriterionStatus passed={result.passed} /></div>
            <details><summary>Ver evidencia</summary><p>{result.detail}</p></details>
          </li>
        ))}</ul>
      </ContentCard>}
      <ExerciseDecision testing={testing} options={options} onChange={onChange}
        onFinish={onContinue} onBack={onBack} ready={testing.ran && testing.executedCode === testing.code && revealed && !busy} />
    </>
  );
}
