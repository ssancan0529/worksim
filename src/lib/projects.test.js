import assert from 'node:assert/strict';
import test from 'node:test';
import { PROJECTS } from '../data/projects.js';
import { PROJECT_RUBRICS, INVENTORY_CASES } from '../data/projectRubrics.js';
import { evaluateProjectSubmission, getProjectProgress, normalizeProjectWork, normalizeEvidence } from './projects.js';

const explanations = {0: 'Mi objetivo y sus límites.', 1: 'Método y justificación.', 2: 'Casos contrastados.', 3: 'Recomendación y pasos reproducibles.'};
function evidenceFor(project) {
  return Object.fromEntries(PROJECT_RUBRICS[project.id].stages.flat().map(field => [field.id,
    ({ announcement: 1, demonstration: 3, reminder: 7 })[field.id] ?? (Array.isArray(field.expected) ? field.expected[0] : field.expected)]));
}
const code = 'def mover_stock(stock, cantidad, operacion): ...';
const run = { code, results: INVENTORY_CASES.map(item => ({ result: item.expected })) };

test('las comprobaciones objetivas distinguen evidencia válida de la revisión cualitativa', () => {
  for (const project of PROJECTS) {
    const result = evaluateProjectSubmission(project, explanations, evidenceFor(project), run, code);
    assert.equal(result.passed, true, project.id);
    assert.equal(result.requiresReview, true);
    assert.equal(result.version, 2);
    assert.ok(result.criteria.every(item => item.status === 'correct'));
  }
});

test('palabras clave, textos largos y respuestas vacías no sustituyen evidencia', () => {
  for (const project of PROJECTS) {
    for (const answers of [{}, Object.fromEntries([0,1,2,3].map(i => [i, 'ventas stock GET indicadores '.repeat(20)]))]) {
      const result = evaluateProjectSubmission(project, answers);
      assert.equal(result.passed, false);
      assert.ok(result.criteria.every(item => item.status === 'insufficient'));
    }
  }
});

test('cálculos erróneos, parciales y ausentes producen estados diferentes', () => {
  const project = PROJECTS[0];
  const evidence = evidenceFor(project);
  evidence.january = 14200;
  let result = evaluateProjectSubmission(project, explanations, evidence);
  assert.equal(result.criteria[2].status, 'partial');
  for (const field of PROJECT_RUBRICS[project.id].stages[2]) evidence[field.id] = 99;
  result = evaluateProjectSubmission(project, explanations, evidence);
  assert.equal(result.criteria[2].status, 'incorrect');
  for (const field of PROJECT_RUBRICS[project.id].stages[2]) evidence[field.id] = '';
  assert.equal(evaluateProjectSubmission(project, explanations, evidence).criteria[2].status, 'insufficient');
});

test('admite redondeo y coma decimal y rechaza números no finitos o ambiguos', () => {
  const project = PROJECTS[0];
  const evidence = evidenceFor(project);
  evidence.percent = '-25,61';
  assert.equal(evaluateProjectSubmission(project, explanations, evidence).passed, true);
  for (const value of ['Infinity', 'NaN', '8,200.00', '8200 basura']) {
    assert.equal(evaluateProjectSubmission(project, explanations, {...evidence, january:value}).passed, false);
  }
});

test('un rechazo de inventario que modifica stock falla aunque diga rechazado', () => {
  const project = PROJECTS[1];
  const failedRun = structuredClone(run);
  failedRun.results[1].result.stock = -2;
  const result = evaluateProjectSubmission(project, explanations, evidenceFor(project), failedRun, code);
  assert.equal(result.passed, false);
  assert.equal(result.criteria[1].requirements[1].passed, false);
  assert.match(result.criteria[1].requirements[1].feedback, /Esperado.*10.*Obtenido.*-2/);
  assert.equal(evaluateProjectSubmission(project, explanations, evidenceFor(project), run, 'nuevo código').criteria[1].status, 'insufficient');
});

test('campaña comprueba contexto, presupuesto, orden temporal y fórmulas', () => {
  const project = PROJECTS[2];
  const evidence = evidenceFor(project);
  assert.equal(evaluateProjectSubmission(project, explanations, {...evidence, budget:80, channel:'Correo'}).passed, true);
  for (const patch of [{budget:101}, {announcement:5, demonstration:3}, {reminder:8}, {promise:'Entrega garantizada en una hora'}, {conversion:1}, {coverage:'Todo Ecuador'}]) {
    assert.equal(evaluateProjectSubmission(project, explanations, {...evidence,...patch}).passed, false);
  }
});

test('persistencia conserva la evaluación histórica y el borrador, sin recalificar al cargar', () => {
  const project = PROJECTS[0];
  const legacy = {criteria:[{id:'old',passed:true,requirements:[]}],passed:true};
  const state = {answers:explanations,submittedAnswers:explanations,submittedAt:'2026-11-12T00:00:00Z',evaluation:legacy};
  const restored = normalizeProjectWork({[project.id]:state})[project.id];
  assert.deepEqual(restored.evaluation,legacy);
  assert.deepEqual(restored.answers,explanations);
  assert.equal(getProjectProgress(project,restored).completed,true);
});

test('editar evidencia o código exige reentrega y preserva la instantánea anterior', () => {
  const project = PROJECTS[1];
  const evidence = evidenceFor(project);
  const evaluation = evaluateProjectSubmission(project, explanations, evidence, run, code);
  const state = {answers:explanations,submittedAnswers:explanations,evidence,submittedEvidence:normalizeEvidence(project,evidence),inventoryCode:code,submittedInventoryCode:code,inventoryRun:run,submittedAt:'2026-11-12T00:00:00Z',evaluation,submissions:[{evaluation:{version:1,passed:false,criteria:[]},submittedAt:'2026-11-11T00:00:00Z'}]};
  const restored = normalizeProjectWork({[project.id]:JSON.parse(JSON.stringify(state))})[project.id];
  assert.equal(getProjectProgress(project,restored).completed,true);
  assert.equal(restored.submissions.length,1);
  assert.equal(getProjectProgress(project,{...restored,evidence:{...evidence,created:400}}).submissionIsCurrent,false);
  assert.equal(getProjectProgress(project,{...restored,inventoryCode:'cambiado'}).completed,false);
  assert.deepEqual(restored.evaluation,evaluation);
});
