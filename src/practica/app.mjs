import {
  canFinish, confidenceIsValid, exercises, issues, level, scoreDetection, supportFixture, transfersFixture,
} from "./cases.mjs";

const app = document.querySelector("#main");
const announcement = document.querySelector("#announcement");
const draftKey = "worksim-banco-test-draft-v1";
const recordsKey = "worksim-banco-test-records-v1";
const confidenceLabels = ["Nada seguro/a", "Poco seguro/a", "Algo seguro/a", "Bastante seguro/a", "Muy seguro/a"];
const compareOptions = ["Mi consulta", "La de la IA", "Ninguna cumple del todo", "No estoy seguro/a"];
const feelOptions = ["Cómodo/a", "Normal", "Presionado/a"];
const closingStep = exercises.length + 1;
let storageFailed = false;
let running = "";
let runtimeError = null;

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    storageFailed = true;
    return fallback;
  }
}

function save(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    storageFailed = false;
  } catch {
    storageFailed = true;
  }
}

function newAttempt(code = "") {
  return {
    code, initialCode: null, pick: "", differences: "", lines: [], none: false,
    hypothesis: "", lastResult: null, comparison: null, predictionLocked: false, runs: [],
  };
}

function newSession() {
  return {
    version: 2, id: crypto.randomUUID(), startedAt: new Date().toISOString(), step: 0,
    before: null, after: null, feel: "", note: "",
    attempts: Object.fromEntries(exercises.map(exercise => [exercise.id, newAttempt()])),
  };
}

function restoreSession(saved) {
  if (!saved || saved.version === 2) return saved;
  const session = newSession();
  session.id = saved.id;
  session.startedAt = saved.startedAt;
  session.before = saved.before;
  session.feel = saved.feel;
  session.note = saved.note;
  session.step = confidenceIsValid(saved.before) ? 1 : 0;
  session.attempts.transfers = newAttempt(saved.query || "");
  session.attempts.transfers.differences = saved.differences || "";
  session.attempts.withdrawal.hypothesis = saved.hypothesis || "";
  session.migrated = Boolean(saved.query);
  return session;
}

const savedDraft = read(draftKey, null);
let session = restoreSession(savedDraft);
let records = read(recordsKey, []);
if (session && session !== savedDraft) save(draftKey, session);

const esc = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const codeBlock = value => `<pre class="code"><code>${esc(value)}</code></pre>`;
const arrow = '<span aria-hidden="true">→</span>';
const metric = (value, label) => `<div class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
const exerciseAtStep = () => exercises[session.step - 1];
const currentAttempt = () => session.attempts[exerciseAtStep().id];
const persist = () => save(draftKey, session);

function dateText(iso) {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function recordSummary(record) {
  const d = record.detection;
  const mark = result => result.error ? "Error de ejecución" : `${result.passed}/${result.total}`;
  const support = record.support ? ` · Soporte ${mark(record.support.user)}` : "";
  const python = record.python.user ? `Python ${mark(record.python.user)}${record.python.user.error ? "" : " pruebas"}` : `Python ${d.hits}/${d.total} hallazgos`;
  const audit = d.status === "excess" ? " · Auditoría no validada" : "";
  return `SQL ${mark(record.sql.user)}${support} · ${python}${audit} · Seguridad ${record.before} → ${record.after}`;
}

function portal() {
  return `
    <section class="portal-intro">
      <a class="secondary catalog-link" href="../#available-challenges">← Volver a desafíos</a>
      <div class="eyebrow">PORTAL DE PRÁCTICA</div>
      <h1 tabindex="-1">Revisa código de IA<br class="wide"> con pruebas reales</h1>
      <p>Escribe tu solución, contrástala con una propuesta de IA y comprueba tu decisión con casos de prueba.</p>
    </section>
    <div class="portal-grid">
      <section class="mission panel">
        <div class="mission-top">
          <span class="mission-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="mission-meta">DATOS Y ANÁLISIS</span>
        </div>
        <h2>Práctica de SQL y Python</h2>
        <p>Resuelve tres encargos en Banco Horizonte y en la mesa de soporte.</p>
        <ul class="tags"><li>SQL</li><li>Python</li><li>${level}</li></ul>
        <button class="primary" id="start">${records.length ? "Iniciar otra práctica" : "Iniciar práctica"} ${arrow}</button>
      </section>
      <aside class="route panel" aria-labelledby="route-title">
        <h2 id="route-title">Ejercicios de la práctica</h2>
        <ol>${exercises.map((exercise, i) => `<li><span class="route-number">${i + 1}</span>
          <div><strong>${exercise.title}</strong><p>${exercise.engine === "sql" ? "SQL" : "Python"}</p></div></li>`).join("")}</ol>
      </aside>
    </div>
    ${records.length ? `<section class="panel history"><h2>Intentos completados</h2>
      <ul>${[...records].reverse().map(record => `<li><div><strong>${esc(dateText(record.completedAt))}</strong>
        <span>${esc(recordSummary(record))}</span></div>
        <button class="secondary" data-export="${esc(record.id)}">Descargar resultados</button></li>`).join("")}</ul>
      </section>` : ""}
    <p class="privacy-note">Tus respuestas se guardan en este navegador. Puedes descargar un resumen para compartirlo.</p>`;
}

function progress() {
  const labels = ["Inicio", ...exercises.map(exercise => exercise.short), "Cierre"];
  return `<nav class="progress" aria-label="Progreso de la práctica"><ol>
    ${labels.map((name, i) => `<li class="${i === session.step ? "current" : i < session.step ? "complete" : ""}" ${i === session.step ? 'aria-current="step"' : ""}>
      <span class="step-circle" aria-hidden="true">${i < session.step ? "✓" : i + 1}</span><span>${name}</span>
    </li>`).join("")}
  </ol></nav>`;
}

function scale(field) {
  return `<div class="scale">${confidenceLabels.map((label, i) => `<label>
    <input type="radio" name="${field}" value="${i + 1}" ${session[field] === i + 1 ? "checked" : ""} aria-label="${i + 1} de 5, ${label}">
    <span>${i + 1}</span>
  </label>`).join("")}</div>
  <div class="scale-ends"><span>Nada seguro/a</span><span>Muy seguro/a</span></div>`;
}

function options(field, values, selected) {
  return `<div class="options">${values.map(value => `<label class="option">
    <input type="radio" name="${field}" value="${esc(value)}" ${selected === value ? "checked" : ""}>
    <span>${esc(value)}</span></label>`).join("")}</div>`;
}

function textField(field, label, value) {
  return `<label class="field" for="${field}">${label}</label>
    <textarea id="${field}" data-bind="${field}" maxlength="1600" rows="3">${esc(value)}</textarea>`;
}

function table(columns, rows, label) {
  return `<div class="lab-table" tabindex="0" role="region" aria-label="${esc(label)}">
    <table><thead><tr>${columns.map(column => `<th scope="col">${esc(column)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(value => `<td>${value === null ? "NULL" : esc(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function brief(exercise) {
  let data;
  if (exercise.engine === "sql") {
    const rows = exercise.id === "support" ? supportFixture(0) : transfersFixture(0).slice(0, 8);
    data = `<div class="lab-data"><h3>Tabla <code>${exercise.dataName}</code></h3>
      <p class="small">${exercise.id === "support" ? `${rows.length} filas de práctica` : "Muestra de 8 filas · sospechosa vale 1 o 0"}</p>
      ${table(exercise.columns, rows, `Datos de ${exercise.dataName}`)}</div>`;
  } else {
    data = `<div class="lab-data"><h3>Métodos disponibles en <code>db</code></h3>
      <dl class="lab-methods">${exercise.methods.map(([name, description]) => `<div><dt><code>${esc(name)}</code></dt><dd>${esc(description)}</dd></div>`).join("")}</dl></div>`;
  }
  return `<section class="panel lab-brief"><div class="lab-requirements"><h2>Tu encargo</h2>
    <ul>${exercise.requirements.map(requirement => `<li>${requirement}</li>`).join("")}</ul></div>${data}</section>`;
}

function guide(exercise) {
  return `<details class="panel lab-guide" data-panel="guide-${exercise.id}" open>
    <summary><span class="lab-help-icon" aria-hidden="true">?</span> Guía rápida de ${exercise.engine === "sql" ? "SQL" : "Python"}</summary>
    <div class="lab-guide-body"><dl>${exercise.guide.map(([term, text]) => `<div><dt>${esc(term)}</dt><dd>${esc(text)}</dd></div>`).join("")}</dl>
    ${codeBlock(exercise.example)}</div></details>`;
}

function resultContent(result, kind) {
  if (!result) return '<p class="small">Ejecuta tu código para comprobar los requisitos.</p>';
  if (result.error) return `<p class="error" role="status">${esc(result.error)}</p>`;
  const passed = result.passed === result.total;
  const formatState = state => {
    const withdrawals = state.withdrawals.map(([account, amount, key]) => `${account}/${key}: $${amount}`).join(", ") || "ninguno";
    const balances = Object.entries(state.balances).map(([account, balance]) => `${account}: $${balance}`).join(", ") || "sin cuenta";
    return `Códigos ${state.codes.join(", ") || "—"} · Retiros ${withdrawals} · Saldos ${balances}`;
  };
  return `<div class="lab-result-status">
      <span class="badge ${passed ? "pass" : "score"}">${result.passed} de ${result.total} pruebas</span>
      ${kind === "sql" ? `<span class="small">${result.rowCount === 1 ? "1 fila devuelta" : `${result.rowCount} filas devueltas`}</span>` : ""}
    </div>
    ${kind === "sql" && result.rows.length ? table(result.columns, result.rows, "Filas devueltas") : ""}
    ${kind === "sql" && result.rowCount > result.rows.length ? '<p class="small">Se muestran las primeras 25 filas.</p>' : ""}
    <ul class="checks">${result.checks.map(check => `<li>
      <div class="check-line"><strong>${esc(check.label)}</strong>
        <span class="badge ${check.passed ? "pass" : "fail"}">${check.passed ? "Pasa" : "Por revisar"}</span></div>
      <details><summary>Ver evidencia</summary>${kind === "sql"
        ? check.evidence.map(line => `<p>${esc(line)}</p>`).join("")
        : `<p><strong>Esperado</strong> · ${esc(formatState(check.expected))}</p>
           <p><strong>Obtenido</strong> · ${esc(formatState(check.observed))}</p>`}</details>
    </li>`).join("")}</ul>`;
}

function editor(exercise, attempt) {
  const sql = exercise.engine === "sql";
  return `<section class="panel lab-editor"><div class="result-title">
    <h2><label for="code-editor">${sql ? "Tu consulta" : "Tu función"}</label></h2>
    <span class="small lab-engine"><i aria-hidden="true"></i>${sql ? "SQLite" : "Python"}</span></div>
    <div class="lab-code">
      <div class="lab-file" aria-hidden="true">&lt;/&gt; &nbsp; ${sql ? "consulta.sql" : "retiros.py"}</div>
      <div class="lab-code-body"><div class="lab-gutter" aria-hidden="true"><pre id="line-numbers">1</pre></div>
        <textarea id="code-editor" data-bind="code" rows="8" maxlength="6000" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"
          ${running ? "readonly" : ""} placeholder="${sql ? "Escribe tu consulta SQL aquí…" : "def retirar(cuenta_id, monto, solicitud_id):"}">\n${esc(attempt.code)}</textarea></div>
    </div>
    <div class="lab-editor-actions">
      <button type="button" class="primary" id="run-code" ${!attempt.code.trim() || running ? "disabled" : ""}><span class="lab-play" aria-hidden="true"></span>${running === "code" ? "Ejecutando…" : sql ? "Ejecutar consulta" : "Ejecutar Python"}</button>
      <span class="lab-shortcut small" aria-hidden="true"><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"}</kbd> + <kbd>↵</kbd></span>
      <details class="lab-hint" data-panel="hint-${exercise.id}"><summary>Ver pista</summary><p>${esc(exercise.hint)}</p></details>
    </div></section>`;
}

function pythonLines(exercise, attempt) {
  const showFeedback = Boolean(attempt.comparison);
  return `<div class="code code-lines" aria-label="Código Python de la IA">${exercise.ai.split("\n").map((line, i) => {
    const n = i + 1;
    const selected = attempt.lines.includes(n);
    const relevant = issues.some(issue => issue.lines.includes(n));
    const content = `<span class="line-num" aria-hidden="true">${n}</span><code>${esc(line)}</code>`;
    if (showFeedback || attempt.predictionLocked) {
      const highlight = showFeedback ? selected ? relevant ? "hit" : "extra" : relevant ? "relevant" : "" : selected ? "selected" : "";
      return `<div class="code-line ${highlight}">${content}</div>`;
    }
    return `<button type="button" class="code-line ${selected ? "selected" : ""}" aria-pressed="${selected}" data-line="${n}" aria-label="Línea ${n}: ${esc(line.trim())}">${content}</button>`;
  }).join("")}</div>`;
}

function auditFeedback(attempt) {
  const detection = scoreDetection(attempt.lines);
  const status = detection.status === "excess" ? "Detección no validada por exceso de líneas adicionales."
    : detection.status === "valid" ? "Detección validada." : "No se detectaron problemas.";
  return `<section class="panel result-card"><h2>Tu auditoría</h2>
    <div class="metric-row">${metric(`${detection.hits}/${detection.total}`, "Problemas")}${metric(detection.extra, "Líneas extra")}
      ${metric(detection.precision === null ? "—" : `${detection.precision}%`, "Precisión")}</div>
    <p class="${detection.status === "excess" ? "error" : "small"}">${status}</p>
    <ul class="lab-findings">${issues.map(issue => `<li><strong>${esc(issue.title)}.</strong> ${esc(issue.explanation)}</li>`).join("")}</ul>
  </section>`;
}

function compareFeedback(exercise, attempt) {
  if (!attempt.comparison) return "";
  return `<div class="lab-compare-feedback"><section class="panel result-card">
    <h2 tabindex="-1">Resultado de la IA</h2>${resultContent(attempt.comparison.ai, exercise.engine)}
    </section>${exercise.engine === "python" ? auditFeedback(attempt) : `<section class="panel result-card">
      <h2>Revisa tu consulta</h2><details data-panel="solution-${exercise.id}"><summary>Ver una solución posible</summary>
      ${codeBlock(exercise.reference)}</details></section>`}</div>`;
}

function compareReady(exercise, attempt) {
  return !running && Boolean(attempt.code.trim()) && (exercise.engine === "sql" ? Boolean(attempt.pick) : attempt.lines.length > 0 || attempt.none);
}

function comparison(exercise, attempt) {
  if (attempt.initialCode === null) return `<section class="panel lab-compare-closed" aria-labelledby="compare-title">
    <div><h2 id="compare-title">Compara con la IA</h2><p class="small">Escribe tu primera solución para ver la propuesta.</p></div>
    <button class="secondary" id="reveal" ${!attempt.code.trim() || running ? "disabled" : ""}>Ver propuesta de la IA</button></section>`;
  const python = exercise.engine === "python";
  const busy = running || attempt.predictionLocked;
  return `<section class="panel flow-card lab-ai" aria-labelledby="compare-title">
    <h2 id="compare-title" tabindex="-1">${python ? "Audita la función de la IA" : "Compara con la IA"}</h2>
    <div class="comparison"><section><h3>Tu primer código</h3>${codeBlock(attempt.initialCode)}</section>
    <section><h3>Propuesta de la IA</h3>${python ? pythonLines(exercise, attempt) : codeBlock(exercise.ai)}</section></div>
    <fieldset ${busy ? "disabled" : ""}>
      <legend>${python ? "Marca las líneas que revisarías en la función de la IA." : "¿Cuál crees que cumple mejor el encargo?"}</legend>
      ${python ? `<button class="secondary" type="button" id="none" aria-pressed="${attempt.none}">No veo ningún problema</button>
        ${textField("hypothesis", "¿En qué caso fallaría? (opcional)", attempt.hypothesis)}`
        : `${options("pick", compareOptions, attempt.pick)}${textField("differences", "¿Qué diferencia encontraste? (opcional)", attempt.differences)}`}
    </fieldset>
    <button class="primary" id="run-comparison" ${compareReady(exercise, attempt) ? "" : "disabled"}>
      ${running === "comparison" ? "Ejecutando comparación…" : attempt.comparison ? "Volver a ejecutar ambas soluciones" : "Ejecutar ambas soluciones"}</button>
    ${running === "comparison" ? '<p class="small" role="status">Ejecutando tu código y la propuesta de IA…</p>' : ""}
    ${runtimeError?.target === "comparison" ? `<p class="error" role="alert">${esc(runtimeError.message)}</p>` : ""}
  </section><div id="compare-feedback">${compareFeedback(exercise, attempt)}</div>`;
}

function canAdvance() {
  if (running) return false;
  if (!session.step) return confidenceIsValid(session.before);
  if (session.step === closingStep) return canFinish(session);
  return Boolean(currentAttempt().comparison);
}

function actions() {
  const atClose = session.step === closingStep;
  const ready = canAdvance();
  const label = !session.step ? "Empezar" : atClose ? "Volver al portal"
    : session.step === exercises.length ? "Ir al cierre" : "Ir al siguiente ejercicio";
  const hint = !session.step ? "Selecciona un número para empezar."
    : atClose ? ready ? "Tu seguridad posterior está registrada." : "Elige tu seguridad posterior para volver al portal."
    : ready ? "La comparación quedó registrada." : "Ejecuta la comparación para continuar.";
  return `<div class="actions"><p class="small" id="step-hint">${hint}</p>
    <button class="primary" id="next" ${ready ? "" : "disabled"} aria-describedby="step-hint">${label} ${arrow}</button></div>`;
}

function exercisePage(exercise) {
  const attempt = currentAttempt();
  return `<section class="lab-hero" aria-labelledby="exercise-title">
    <div><p class="eyebrow">${exercise.company} <span aria-hidden="true">/</span> ${level}</p>
    <h1 id="exercise-title" tabindex="-1">${exercise.title}</h1><p class="lede">${exercise.intro}</p></div>
    <div class="lab-hero-icon" aria-hidden="true"><i></i><i></i><i></i></div>
    </section>
    ${session.migrated && session.step === 1 ? '<p class="status">Recuperamos tu consulta anterior. Revisa el encargo actualizado antes de ejecutar.</p>' : ""}
    ${guide(exercise)}
    <div class="lab-grid">${brief(exercise)}<div class="lab-workspace">${editor(exercise, attempt)}
      <section class="panel result-card lab-result"><h2 id="result-title" tabindex="-1">Resultado</h2>
      <div id="work-result" aria-live="polite" aria-busy="${Boolean(running)}">${running
        ? '<p class="small">Ejecutando casos de prueba…</p>'
        : runtimeError?.target === "code" ? `<p class="error" role="alert">${esc(runtimeError.message)}</p>` : resultContent(attempt.lastResult, exercise.engine)}</div></section>
    </div></div>
    ${comparison(exercise, attempt)}${actions()}`;
}

function initialPage() {
  return `<section class="flow-head"><p class="eyebrow">PRÁCTICA DE WORKSIM</p><h1 tabindex="-1">Antes de empezar</h1></section>
    <div class="flow-stack">
    <section class="panel flow-card"><h2>Tu encargo</h2><p>Prepara dos consultas SQL y una función de Python. Después de escribir cada solución, revisa la propuesta de IA y ejecuta ambas con los mismos casos de prueba.</p></section>
    <fieldset class="panel flow-card"><legend class="sr-only">Seguridad inicial</legend>
    <h2>¿Qué tan seguro/a te sientes revisando código generado por IA?</h2>${scale("before")}</fieldset>${actions()}</div>`;
}

function closingPage() {
  const detection = scoreDetection(session.attempts.withdrawal.lines);
  return `<section class="flow-head"><p class="eyebrow">PRÁCTICA DE WORKSIM</p><h1 tabindex="-1">Cierra tu práctica</h1></section>
    <div class="flow-stack">
    <fieldset class="panel flow-card"><legend class="sr-only">Seguridad posterior</legend>
    <h2>¿Qué tan seguro/a te sientes ahora revisando código generado por IA?</h2>
    <p>Selecciona una respuesta para terminar la práctica.</p>${scale("after")}</fieldset>
    <fieldset class="panel flow-card"><legend class="sr-only">Comentarios de la práctica</legend>
    <h2>¿Cómo te sentiste durante la práctica? (opcional)</h2>
    ${options("feel", feelOptions, session.feel)}${textField("note", "¿Algo te confundió durante el test? (opcional)", session.note)}</fieldset>
    <section class="panel flow-card"><h2>Resumen de tu intento</h2>
    <div class="metric-row">${exercises.map(exercise => {
      const result = session.attempts[exercise.id].comparison.user;
      return metric(result.error ? "Error" : `${result.passed}/${result.total}`, exercise.short);
    }).join("")}${metric(`${detection.hits}/${detection.total}`, "Hallazgos de Python")}
      ${metric(`${session.before} → ${session.after ?? "—"}`, "Seguridad antes y después")}</div>
    ${detection.status === "excess" ? '<p class="error">Detección de Python no validada por exceso de líneas adicionales.</p>' : ""}
    <div class="buttons"><button class="secondary" id="copy" ${canFinish(session) ? "" : "disabled"}>Copiar resumen</button>
      <button class="secondary" id="export" ${canFinish(session) ? "" : "disabled"}>Descargar resultados</button></div>
    <p class="small">El archivo incluye tus respuestas y la evidencia de las pruebas.</p></section>${actions()}</div>`;
}

function syncGutter() {
  const editor = app.querySelector("#code-editor");
  if (editor) app.querySelector("#line-numbers").style.transform = `translateY(-${editor.scrollTop}px)`;
}

function syncEditor() {
  const editor = app.querySelector("#code-editor");
  if (!editor) return;
  const lines = editor.value.split("\n").length;
  app.querySelector("#line-numbers").textContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
  syncGutter();
}

function render(focus = "") {
  const disclosure = new Map([...app.querySelectorAll("details[data-panel]")].map(node => [node.dataset.panel, node.open]));
  let body = portal;
  if (session) body = session.step === 0 ? initialPage : session.step === closingStep ? closingPage : () => exercisePage(exerciseAtStep());
  app.innerHTML = (session ? progress() : "") + body();
  for (const node of app.querySelectorAll("details[data-panel]")) {
    if (disclosure.has(node.dataset.panel)) node.open = disclosure.get(node.dataset.panel);
  }
  const editor = app.querySelector("#code-editor");
  if (editor) {
    editor.addEventListener("scroll", syncGutter);
    syncEditor();
  }
  if (storageFailed) app.insertAdjacentHTML("beforeend", '<p class="error" role="status">Este navegador no pudo guardar el intento. Descarga tus resultados antes de salir.</p>');
  if (focus) {
    app.querySelector(focus)?.focus({ preventScroll: focus === "h1" });
    if (focus === "h1") window.scrollTo(0, 0);
  }
}

function run(exercise, code, compare) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./engines.worker.js", import.meta.url));
    let timer = setTimeout(() => {
      finish();
      reject(new Error("El motor tardó demasiado en cargar. Vuelve a intentar."));
    }, exercise.engine === "sql" ? 10000 : 90000);
    function finish() {
      clearTimeout(timer);
      worker.terminate();
    }
    worker.onmessage = ({ data }) => {
      if (data.phase === "ready") {
        clearTimeout(timer);
        timer = setTimeout(() => {
          finish();
          reject(new Error("La ejecución tardó demasiado. Revisa el código y vuelve a intentar."));
        }, 10000);
        return;
      }
      finish();
      if (data.error) reject(new Error(data.error));
      else resolve(data);
    };
    worker.onerror = () => {
      finish();
      reject(new Error("No se pudo iniciar el motor de pruebas. Vuelve a intentar."));
    };
    worker.postMessage({ id: exercise.id, code, compare });
  });
}

async function execute(compare, fromEditor = false) {
  const exercise = exerciseAtStep();
  const attempt = currentAttempt();
  if (running || !attempt.code.trim() || (compare && !compareReady(exercise, attempt))) return;
  const previousEditor = app.querySelector("#code-editor");
  const caret = previousEditor.selectionStart;
  running = compare ? "comparison" : "code";
  runtimeError = null;
  render();
  try {
    const result = await run(exercise, attempt.code, compare);
    attempt.lastResult = result.user;
    if (compare) {
      attempt.comparison = result;
      attempt.predictionLocked = true;
    }
    attempt.runs.push({
      at: new Date().toISOString(), comparedWithAI: compare,
      passed: result.user.passed ?? 0, total: result.user.total ?? null, error: result.user.error ?? null,
    });
    persist();
    announcement.textContent = result.user.error
      ? "Revisa el mensaje de ejecución."
      : `Tu código pasó ${result.user.passed} de ${result.user.total} pruebas.`;
  } catch (error) {
    runtimeError = { target: running, message: error.message };
  } finally {
    running = "";
    render(compare ? (runtimeError ? "#run-comparison" : "#compare-feedback h2") : fromEditor ? "#code-editor" : "#result-title");
    if (fromEditor) app.querySelector("#code-editor").setSelectionRange(caret, caret);
  }
}

function buildRecord() {
  const results = session.attempts;
  const sql = exercise => {
    const attempt = results[exercise.id];
    return {
      query: attempt.code, initialQuery: attempt.initialCode, aiQuery: exercise.ai,
      initialComparison: attempt.pick, differences: attempt.differences, runs: attempt.runs, ...attempt.comparison,
    };
  };
  const python = results.withdrawal;
  return {
    id: session.id, mission: "Práctica de SQL y Python", version: 2, level,
    startedAt: session.startedAt, completedAt: new Date().toISOString(),
    before: session.before, after: session.after, confidenceChange: session.after - session.before,
    sql: sql(exercises[0]), support: sql(exercises[1]),
    python: {
      source: exercises[2].ai, code: python.code, initialCode: python.initialCode, markedLines: [...python.lines].sort((a, b) => a - b),
      noIssueSelected: python.none, hypothesis: python.hypothesis, runs: python.runs,
      ...python.comparison.ai, user: python.comparison.user,
    },
    detection: scoreDetection(python.lines), feel: session.feel, note: session.note,
  };
}

function download(record) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `WORKSIM-${record.id.slice(0, 8)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copy() {
  const record = buildRecord();
  const resultLabel = result => result.error ? "error de ejecución" : `${result.passed}/${result.total} pruebas`;
  const evidence = exercises.map(exercise => {
    const attempt = session.attempts[exercise.id];
    const { user, ai } = attempt.comparison;
    return `${exercise.title}\nMi código: ${resultLabel(user)} · IA: ${resultLabel(ai)}\n${attempt.code}`;
  });
  const d = record.detection;
  const text = ["WORKSIM · Práctica de SQL y Python", `Seguridad antes y después: ${record.before} → ${record.after} de 5`,
    ...evidence, `Auditoría Python: ${d.hits}/${d.total} hallazgos · ${d.extra} líneas extra${d.status === "excess" ? " · Detección no validada" : ""}`,
    `Comentario: ${record.note || "—"}`].join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    announcement.textContent = "Resumen copiado.";
    app.querySelector("#copy").textContent = "Resumen copiado";
  } catch {
    announcement.textContent = "No se pudo copiar. Puedes descargar los resultados.";
    app.querySelector("#copy").textContent = "No se pudo copiar";
  }
}

function advance() {
  if (!canAdvance()) return;
  if (session.step === closingStep) {
    const record = buildRecord();
    records = [...read(recordsKey, records).filter(item => item.id !== record.id), record];
    save(recordsKey, records);
    if (!storageFailed) save(draftKey, null);
    session = null;
    announcement.textContent = "Práctica finalizada.";
  } else {
    session.step += 1;
    persist();
  }
  runtimeError = null;
  render("h1");
}

function updateButtons() {
  const editor = app.querySelector("#code-editor");
  app.querySelector("#next").disabled = !canAdvance();
  if (!editor) return;
  const attempt = currentAttempt();
  app.querySelector("#run-code").disabled = !attempt.code.trim();
  const reveal = app.querySelector("#reveal");
  if (reveal) reveal.disabled = !attempt.code.trim();
  const compare = app.querySelector("#run-comparison");
  if (compare) compare.disabled = !compareReady(exerciseAtStep(), attempt);
}

app.addEventListener("input", ({ target }) => {
  const key = target.dataset.bind;
  if (!session || !key || running) return;
  if (key === "note") session.note = target.value;
  else {
    const attempt = currentAttempt();
    attempt[key] = target.value;
    if (key === "code") {
      if (attempt.lastResult || attempt.comparison) {
        attempt.lastResult = null;
        attempt.comparison = null;
        app.querySelector("#work-result").innerHTML = '<p class="small">Ejecuta el código editado para actualizar el resultado.</p>';
        const feedback = app.querySelector("#compare-feedback");
        if (feedback) feedback.replaceChildren();
        app.querySelector("#step-hint").textContent = "Ejecuta la comparación con el código editado para continuar.";
      }
      syncEditor();
    }
  }
  persist();
  updateButtons();
});

app.addEventListener("change", ({ target }) => {
  if (!session || target.type !== "radio" || running) return;
  if (target.name === "pick") {
    currentAttempt().pick = target.value;
    persist();
    updateButtons();
    return;
  }
  session[target.name] = ["before", "after"].includes(target.name) ? Number(target.value) : target.value;
  persist();
  render(`input[name="${target.name}"][value="${CSS.escape(target.value)}"]`);
});

app.addEventListener("keydown", event => {
  if (event.target.id === "code-editor" && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    execute(false, true);
  }
});

app.addEventListener("click", async ({ target }) => {
  const button = target.closest("button");
  if (!button || running) return;
  if (button.id === "start") {
    session = newSession();
    persist();
    render("h1");
  } else if (button.id === "next") {
    advance();
  } else if (button.id === "run-code" || button.id === "run-comparison") {
    await execute(button.id === "run-comparison");
  } else if (button.id === "reveal") {
    currentAttempt().initialCode = currentAttempt().code;
    persist();
    render("#compare-title");
  } else if (button.dataset.line || button.id === "none") {
    const attempt = currentAttempt();
    if (attempt.predictionLocked) return;
    if (button.dataset.line) {
      const line = Number(button.dataset.line);
      attempt.lines = attempt.lines.includes(line) ? attempt.lines.filter(mark => mark !== line) : [...attempt.lines, line];
      attempt.none = false;
    } else {
      attempt.none = !attempt.none;
      attempt.lines = [];
    }
    persist();
    render(button.id ? "#none" : `[data-line="${button.dataset.line}"]`);
  } else if (session && canFinish(session) && button.id === "copy") {
    await copy();
  } else if (session && canFinish(session) && button.id === "export") {
    download(buildRecord());
  } else if (button.dataset.export) {
    const record = records.find(item => item.id === button.dataset.export);
    if (record) download(record);
  }
});

render();
