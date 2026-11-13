import { useEffect, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import ReviewPrompt from "../components/ReviewPrompt";
import ContentCard from "../components/ContentCard";
import CriterionStatus from "../components/CriterionStatus";
import ExerciseTable from "../components/ExerciseTable";
import ExerciseEditor from "../components/ExerciseEditor";
import ExerciseGuide from "../components/ExerciseGuide";
import Field from "../components/Field";
import PageActions from "../components/PageActions";
import PageIntro from "../components/PageIntro";
import StatusNotice from "../components/StatusNotice";
import {
  confidenceIsValid, exercises, issues, PRACTICE_CHALLENGE, PRACTICE_CLOSING_STEP, PRACTICE_STEPS, scoreDetection,
} from "../practica/cases.mjs";
import { attemptResultLabel, canAdvanceExercise, canCompletePractice, getAttemptResult, getPracticeStep, readPreviousPractice } from "../practica/state.mjs";
import { runExercise } from "../practica/runExercise";

const ratings = ["Nada seguro/a", "Poco seguro/a", "Algo seguro/a", "Bastante seguro/a", "Muy seguro/a"];
const predictions = ["Mi consulta", "La consulta de la IA", "Ninguna cumple todos los requisitos", "Todavía tengo dudas"];

function ConfidenceScale({ name, question, value, onChange, disabled }) {
  return (
    <fieldset className="exercise-confidence" disabled={disabled}>
      <legend>{question}</legend>
      <div className="exercise-confidence-options">
        {ratings.map((label, index) => (
          <label key={label}>
            <input type="radio" name={name} value={index + 1}
              checked={value === index + 1} onChange={() => onChange(index + 1)}
              aria-label={`${index + 1} de 5, ${label}`} />
            <span>{index + 1}</span>
          </label>
        ))}
      </div>
      <div className="exercise-confidence-labels"><span>{ratings[0]}</span><span>{ratings[4]}</span></div>
    </fieldset>
  );
}

function downloadPrevious(record, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function PreviousPractice() {
  const [{ draft, records }] = useState(readPreviousPractice);
  if (!draft && !records.length) return null;
  return (
    <details className="content-card practice-details">
      <summary>Intentos de la versión anterior</summary>
      {draft && <ActionButton variant="secondary" icon="download" onClick={() => downloadPrevious(draft, "worksim-borrador-anterior.json")}>Descargar borrador anterior</ActionButton>}
      {records.map((record, index) => (
        <div className="exercise-archive-row" key={record.id || index}>
          <span>{record.completedAt ? new Date(record.completedAt).toLocaleString("es-EC") : `Intento ${index + 1}`}</span>
          <ActionButton variant="secondary" icon="download" onClick={() => downloadPrevious(record, `worksim-intento-anterior-${index + 1}.json`)}>Descargar resultados</ActionButton>
        </div>
      ))}
    </details>
  );
}

function PracticeStepNavigation({ step, draft, onNavigate }) {
  const maxUnlockedStep = getPracticeStep(draft);
  return (
    <nav className={`exercise-step-nav${step === 1 || step === PRACTICE_CLOSING_STEP ? " compact" : ""}`}
      aria-label="Etapas del ejercicio">
      {PRACTICE_STEPS.slice(1).map((item, index) => {
        const stepIndex = index + 1;
        const locked = stepIndex > maxUnlockedStep;
        const current = step === stepIndex;
        return (
          <button key={item.path} type="button" disabled={locked}
            aria-current={current ? "step" : undefined}
            onClick={() => onNavigate(stepIndex)}>
            <span>{stepIndex}.</span> {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function PracticeStart({ draft, onUpdate, onExit, onNext }) {
  return (
    <div className="practice-form">
      <PageIntro eyebrow="PRÁCTICA GUIADA · NIVEL JUNIOR" title={PRACTICE_CHALLENGE.title}
        description="Resuelve dos consultas y una función corta. Luego contrasta tus resultados con la propuesta de IA." />
      <ContentCard>
        <h2>Tu encargo</h2>
        <ul className="plain-list">{exercises.map(exercise => <li key={exercise.id}><strong>{exercise.language}.</strong> {exercise.title}</li>)}</ul>
      </ContentCard>
      <ContentCard>
        <ConfidenceScale name="confidence-before" question="¿Qué tan seguro/a te sientes al revisar código de IA?"
          value={draft.before} disabled={Boolean(draft.completedAt)}
          onChange={before => onUpdate(current => ({ ...current, before }))} />
      </ContentCard>
      <PreviousPractice />
      <PageActions>
        <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={onExit}>Volver al explorador</ActionButton>
        <ActionButton icon="arrow-right" onClick={onNext} disabled={!confidenceIsValid(draft.before)}>Empezar</ActionButton>
      </PageActions>
    </div>
  );
}

function ExerciseResult({ result, emptyText }) {
  if (!result) return <p className="muted">{emptyText}</p>;
  if (result.error) return <StatusNotice variant="warning">{result.error}</StatusNotice>;
  return (
    <>
      <p className="exercise-score"><strong>{result.passed} de {result.total}</strong> criterios cumplidos</p>
      {result.rows && (result.rows.length
        ? <ExerciseTable columns={result.columns} rows={result.rows} caption="Filas devueltas" />
        : <p className="muted">La consulta devolvió cero filas.</p>)}
      <ul className="exercise-criteria">
        {result.checks.map(check => (
          <li key={check.label}>
            <div><strong>{check.label}</strong><CriterionStatus passed={check.passed} /></div>
            <details><summary>Ver evidencia</summary><p>{check.evidence}</p></details>
          </li>
        ))}
      </ul>
    </>
  );
}

function PythonAudit({ exercise, attempt, disabled, onChange }) {
  return (
    <>
      <p className="field-hint">Marca las líneas donde cambiarías una condición.</p>
      <div className="code-block exercise-audit" aria-label="Líneas de la propuesta de IA">
        {exercise.ai.split("\n").map((line, index) => {
          const number = index + 1;
          const selected = attempt.lines.includes(number);
          return (
            <button type="button" key={number} disabled={disabled} aria-pressed={selected}
              aria-label={`Línea ${number}: ${line.trim()}`}
              onClick={() => onChange({
                none: false,
                lines: selected ? attempt.lines.filter(value => value !== number) : [...attempt.lines, number],
              })}>
              <span aria-hidden="true">{number}</span><code>{line}</code>
            </button>
          );
        })}
      </div>
      <label className="exercise-option">
        <input type="checkbox" disabled={disabled} checked={attempt.none}
          onChange={event => onChange({ none: event.target.checked, lines: [] })} />
        No veo un problema
      </label>
    </>
  );
}

function AuditResult({ lines }) {
  const audit = scoreDetection(lines);
  return (
    <div className="exercise-audit-result">
      <h3>Tu revisión de las líneas</h3>
      <p>{audit.hits} de {audit.total} hallazgos · {audit.extra} líneas adicionales
        {audit.precision !== null && ` · ${audit.precision}% de precisión`}</p>
      {!audit.valid && audit.extra >= 3 && <p className="muted">Revisa las líneas adicionales que marcaste.</p>}
      <ul className="plain-list">
        {issues.map(issue => (
          <li key={issue.line}><strong>Línea {issue.line}. {issue.title}.</strong> {issue.explanation}</li>
        ))}
      </ul>
    </div>
  );
}

function PracticeExercise({ exercise, draft, onUpdate, onBack, onNext, nextLabel }) {
  const attempt = draft.attempts[exercise.id];
  const readOnly = Boolean(draft.completedAt);
  const isSql = exercise.language === "SQL";
  const [busy, setBusy] = useState("");
  const [error, setError] = useState(null);
  const currentRun = useRef(null);
  const ready = Boolean(attempt.code.trim()) && (!draft.guidedReview || Boolean(attempt.expectation.trim())) && !readOnly && !busy;
  const readyToCompare = ready && (isSql ? Boolean(attempt.prediction) : attempt.lines.length > 0 || attempt.none);
  const result = getAttemptResult(attempt);
  const reviewed = canAdvanceExercise(attempt) && !busy && !error;
  const canAdvance = readOnly || reviewed && (!draft.guidedReview || Boolean(attempt.reasoning.trim()));
  const pending = result?.checks?.find(check => !check.passed);

  useEffect(() => () => {
    const job = currentRun.current;
    currentRun.current = null;
    job?.cancel();
  }, []);

  function updateAttempt(patch, resetAfter = false) {
    onUpdate(current => ({
      ...current,
      after: resetAfter ? null : current.after,
      attempts: { ...current.attempts, [exercise.id]: { ...current.attempts[exercise.id], ...patch } },
    }));
  }

  async function execute(compare) {
    if (currentRun.current || !(compare ? readyToCompare : ready)) return;
    const target = compare ? "comparison" : "preview";
    let task;
    setBusy(target);
    setError(null);
    updateAttempt({ executedCode: null, preview: null, comparison: null });
    try {
      task = runExercise(exercise, attempt.code, compare);
      currentRun.current = task;
      const results = await task.promise;
      if (currentRun.current !== task) return;
      const run = { at: new Date().toISOString(), comparedWithAI: compare,
        passed: results.user.passed, total: results.user.total, error: results.user.error };
      updateAttempt({
        executedCode: attempt.code,
        preview: results.user,
        runs: [...attempt.runs, run],
        ...(compare ? { comparison: results, predictionLocked: true } : {}),
      });
    } catch (failure) {
      if (!task || currentRun.current === task) {
        const message = failure instanceof Error ? failure.message : String(failure);
        const failedPreview = { error: message, checks: [], passed: 0, total: 0 };
        setError({ target, message });
        updateAttempt({
          executedCode: null,
          preview: failedPreview,
          comparison: null,
          runs: [...attempt.runs, {
            at: new Date().toISOString(), comparedWithAI: compare,
            passed: 0, total: 0, error: message,
          }],
        });
      }
    } finally {
      if (!task || currentRun.current === task) {
        currentRun.current = null;
        setBusy("");
      }
    }
  }

  return (
    <>
      <PageIntro eyebrow={`${exercise.company} · ${exercise.language} · NIVEL JUNIOR`}
        title={exercise.title} description={exercise.intro} />
      <ExerciseGuide items={exercise.guide} example={exercise.example} exampleIsCode />
      <ContentCard className="exercise-brief">
        <h2>Tu encargo</h2>
        <ul className="plain-list">{exercise.requirements.map(text => <li key={text}>{text}</li>)}</ul>
        {isSql && <ExerciseTable columns={exercise.columns} rows={exercise.rows}
          caption={`Tabla ${exercise.table}`} collapsible />}
      </ContentCard>
      <ContentCard>
        <Field id={`expectation-${exercise.id}`} label="Antes de ejecutar: ¿qué resultado esperas o qué caso límite probarías?"
          value={attempt.expectation} rows={2} disabled={readOnly || Boolean(busy)}
          onChange={expectation => updateAttempt({ expectation })} />
      </ContentCard>
      <div className="exercise-code-results">
        <ContentCard>
          <ExerciseEditor id={`editor-${exercise.id}`} label={isSql ? "Tu consulta SQL" : "Tu función de Python"}
            file={isSql ? "consulta.sql" : "retiros.py"} value={attempt.code} readOnly={readOnly || Boolean(busy)}
            maxLength={6000}
            placeholder={isSql ? `SELECT * FROM ${exercise.table};` : "def retirar(saldo, monto):"}
            onRun={() => execute(false)} onChange={code => {
              setError(null);
              updateAttempt({ code, reasoning: "", executedCode: null, preview: null, comparison: null }, true);
            }} />
          <p className="field-hint exercise-start-hint">
            Anota qué esperas y ejecuta tu intento. Puedes continuar con criterios pendientes.
            {isSql && <> Puedes empezar con <code>SELECT 1;</code>.</>}
          </p>
          <div className="exercise-editor-actions">
            <ActionButton icon="play" iconPosition="left" disabled={!ready} onClick={() => execute(false)}>
              {busy === "preview" ? "Ejecutando…" : isSql ? "Ejecutar consulta" : "Ejecutar Python"}
            </ActionButton>
            <details className="exercise-hint"><summary>Ver pista</summary><p>{exercise.hint}</p></details>
          </div>
        </ContentCard>
        <ContentCard>
          <h2>Resultado de tu código</h2>
          <div aria-live="polite" aria-busy={Boolean(busy)}>
            {reviewed && !readOnly && !busy && <p className="field-hint">Intento registrado. Revisa la salida para explicar tu decisión.</p>}
            {busy === "preview" ? <p className="muted">Ejecutando casos de prueba…</p>
              : error?.target === "preview" ? <StatusNotice variant="warning">{error.message}</StatusNotice>
                : <ExerciseResult result={result} emptyText="Ejecuta tu código para comprobar los requisitos. Puedes avanzar sin cumplirlos todos." />}
          </div>
        </ContentCard>
      </div>

      <ContentCard className="exercise-comparison">
        <h2>Compara con la IA (opcional)</h2>
        {attempt.initialCode === null ? (
          <>
            <p>Registra qué esperas y escribe un primer intento para contrastarlo con el ejemplo preparado.</p>
            <ActionButton variant="secondary" disabled={!ready || (draft.guidedReview && !attempt.expectation.trim())} onClick={() => updateAttempt({ initialCode: attempt.code })}>Ver propuesta de la IA</ActionButton>
          </>
        ) : (
          <>
            <div className="exercise-comparison-grid">
              <section><h3>Tu primer código</h3><pre className="code-block"><code>{attempt.initialCode}</code></pre></section>
              <section><h3>Propuesta de la IA</h3>{isSql
                ? <pre className="code-block"><code>{exercise.ai}</code></pre>
                : <PythonAudit exercise={exercise} attempt={attempt}
                    disabled={readOnly || Boolean(busy) || attempt.predictionLocked} onChange={updateAttempt} />}</section>
            </div>
            {isSql && (
              <fieldset className="exercise-prediction" disabled={readOnly || Boolean(busy) || attempt.predictionLocked}>
                <legend>¿Cuál crees que cumple mejor el encargo?</legend>
                {predictions.map(prediction => (
                  <label className="exercise-option" key={prediction}>
                    <input type="radio" name={`prediction-${exercise.id}`} checked={attempt.prediction === prediction}
                      onChange={() => updateAttempt({ prediction })} />
                    {prediction}
                  </label>
                ))}
              </fieldset>
            )}
            <Field id={`notes-${exercise.id}`} label={isSql ? "¿Qué diferencia encontraste? (opcional)" : "¿En qué caso fallaría? (opcional)"}
              value={attempt.notes} rows={2} disabled={readOnly || Boolean(busy) || attempt.predictionLocked}
              onChange={notes => updateAttempt({ notes })} />
            <div className="exercise-editor-actions">
              <ActionButton icon="play" disabled={!readyToCompare} onClick={() => execute(true)}>
                {busy === "comparison" ? "Ejecutando comparación…" : "Ejecutar ambas soluciones"}
              </ActionButton>
            </div>
            {error?.target === "comparison" && <StatusNotice variant="warning">{error.message}</StatusNotice>}
          </>
        )}
      </ContentCard>

      {attempt.comparison && (
        <ContentCard>
          <h2>Resultado de la IA</h2>
          <ExerciseResult result={attempt.comparison.ai} />
          {isSql ? (
            <details className="exercise-hint">
              <summary>{attempt.reasoning.trim() || !draft.guidedReview ? "Ver una solución posible" : "Registra tu interpretación para consultar la referencia"}</summary>
              {(attempt.reasoning.trim() || !draft.guidedReview) && <pre className="code-block"><code>{exercise.reference}</code></pre>}
            </details>
          ) : <AuditResult lines={attempt.lines} />}
        </ContentCard>
      )}
      {(reviewed || readOnly) && <ContentCard>
        <ReviewPrompt question={pending
          ? `¿Qué salida te permite revisar «${pending.label}»?`
          : "¿Qué caso adicional comprobarías antes de recomendar este resultado?"}
          hint={pending?.evidence || "Considera un empate, un valor límite o un conjunto vacío."} />
        <Field id={`reasoning-${exercise.id}`} label="Compara lo esperado con lo obtenido y explica qué cambiarías o probarías"
          value={attempt.reasoning} rows={2} disabled={readOnly}
          onChange={reasoning => updateAttempt({ reasoning })} />
        <p className="field-hint">La interpretación queda para revisión cualitativa.</p>
      </ContentCard>}
      <PageActions>
        <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={onBack}>Volver</ActionButton>
        <ActionButton icon="arrow-right" disabled={!canAdvance || Boolean(busy)} onClick={onNext}>{nextLabel}</ActionButton>
      </PageActions>
      {!canAdvance && <p className="validation-hint">
        {reviewed ? "Registra qué observaste y cómo lo comprobarías para continuar." : "Ejecuta la versión actual para obtener retroalimentación. Puedes continuar con criterios pendientes."}
      </p>}
    </>
  );
}

function PracticeClose({ draft, onUpdate, onExit, onComplete, onBack, onExport, onCopy }) {
  const complete = Boolean(draft.completedAt);
  const ready = canCompletePractice(draft);
  const audit = scoreDetection(draft.attempts.withdrawal.lines);
  return (
    <div className="practice-form">
      <PageIntro eyebrow="CIERRE · NIVEL JUNIOR" title={complete ? "Informe de SQL y Python" : "Cierra tu práctica"} />
      <ContentCard>
        <ConfidenceScale name="confidence-after" question="¿Qué tan seguro/a te sientes ahora al revisar código de IA?"
          value={draft.after} disabled={complete} onChange={after => onUpdate(current => ({ ...current, after }))} />
      </ContentCard>
      <ContentCard>
        <h2>Resumen de tu intento</h2>
        <ul className="exercise-criteria exercise-summary">
          {exercises.map(exercise => {
            return <li key={exercise.id}><div><strong>{exercise.label}</strong><span>{attemptResultLabel(draft.attempts[exercise.id])}</span>{draft.attempts[exercise.id].reasoning && <p>{draft.attempts[exercise.id].reasoning}</p>}</div></li>;
          })}
          <li><div><strong>Hallazgos en Python</strong><span>{draft.attempts.withdrawal.comparison
            ? `${audit.hits} de ${audit.total}` : "Revisión opcional pendiente"}</span></div></li>
          <li><div><strong>Seguridad antes y después</strong><span>{draft.before} → {draft.after ?? "—"} de 5</span></div></li>
        </ul>
        <label className="general-select-field">
          <span>¿Cómo te sentiste durante la práctica? (opcional)</span>
          <select disabled={complete} value={draft.feel} onChange={event => {
            const feel = event.target.value;
            onUpdate(current => ({ ...current, feel }));
          }}>
            <option value="">Selecciona una opción</option>
            {["Cómodo/a", "Normal", "Presionado/a"].map(feel => <option key={feel} value={feel}>{feel}</option>)}
          </select>
        </label>
        {complete ? (draft.note && <p>{draft.note}</p>) : <Field id="practice-note" label="¿Algo te confundió? (opcional)"
          value={draft.note} rows={3} onChange={note => onUpdate(current => ({ ...current, note }))} />}
        <div className="exercise-editor-actions">
          <ActionButton variant="secondary" disabled={!ready} icon="copy" onClick={onCopy}>Copiar resumen</ActionButton>
          <ActionButton variant="secondary" disabled={!ready} icon="download" onClick={onExport}>Descargar evidencia JSON</ActionButton>
        </div>
      </ContentCard>
      <PageActions>
        <ActionButton variant="secondary" icon="arrow-left" iconPosition="left" onClick={onBack}>Volver a Retiros</ActionButton>
        <ActionButton variant="secondary" onClick={onExit}>Salir sin finalizar</ActionButton>
        <ActionButton icon="check" disabled={!ready} onClick={onComplete}>
          {complete ? "Volver al explorador" : "Finalizar práctica"}
        </ActionButton>
      </PageActions>
      {!ready && <p className="validation-hint">Responde la pregunta de seguridad si quieres finalizar. También puedes salir y continuar después.</p>}
    </div>
  );
}

export default function PracticeChallengePage(props) {
  const { step, draft, onBack, onNext, onExit, onNavigate } = props;
  return (
    <>
      <PracticeStepNavigation step={step} draft={draft} onNavigate={onNavigate} />
      {step === 1
        ? <PracticeStart {...props} />
        : step === PRACTICE_CLOSING_STEP
          ? <PracticeClose {...props} />
          : <PracticeExercise key={exercises[step - 2].id} {...props}
              exercise={exercises[step - 2]} onBack={onBack} onNext={onNext}
              nextLabel={step === PRACTICE_CLOSING_STEP - 1 ? "Ir al cierre" : "Siguiente ejercicio"} />}
    </>
  );
}
