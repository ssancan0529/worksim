import assert from "node:assert/strict";
import test from "node:test";
import { PROJECTS } from "../data/projects.js";
import { evaluateProjectSubmission, getProjectProgress, normalizeProjectWork } from "./projects.js";

const completeAnswers = {
  "diagnostico-de-ventas": [
    "Enero, febrero y marzo: revisar las ventas, los ingresos y el número de pedidos.",
    "Detectar pedidos duplicados y documentar las devoluciones.",
    "Agrupar por mes y por categoría; comparar con una consulta de control.",
    "Hallazgo: las ventas bajaron. El dato respalda la recomendación de revisar el surtido. Documentar los pasos para repetir la consulta.",
  ],
  "api-de-inventario": [
    "Producto con código y stock. Definir las operaciones GET, POST y PATCH con su respuesta.",
    "GET /productos y POST /productos. Validar existencias y rechazar la salida con stock insuficiente.",
    "Probar una actualización válida y otra con stock insuficiente; mantener el stock sin cambiar cuando se rechaza.",
    "Instalar e iniciar el servicio, ejecutar pruebas con pytest e incluir una solicitud y su respuesta.",
  ],
  "campana-de-lanzamiento": [
    "Público: tiendas pequeñas. Objetivo: recibir solicitudes de cotización durante la semana.",
    "Propuesta de valor: servicio de entregas. Consulta la cobertura. Verificar que la promesa esté respaldada por el brief.",
    "Calendario de Instagram: anuncio el lunes y demostración el miércoles.",
    "Medir alcance e impresiones, además de solicitudes recibidas. Usar el registro de campaña y revisar los datos cada semana.",
  ],
};

function answersFor(projectId) {
  return Object.fromEntries(completeAnswers[projectId].map((answer, index) => [index, answer]));
}

test("cada proyecto valida criterios propios y una entrega completa puede completarlos", () => {
  for (const project of PROJECTS) {
    const result = evaluateProjectSubmission(project, answersFor(project.id));
    assert.equal(result.passed, true, project.id);
    assert.ok(result.criteria.length >= 4, project.id);
  }
});

test("una entrega vacía no aprueba y detalla qué falta por criterio", () => {
  for (const project of PROJECTS) {
    const result = evaluateProjectSubmission(project, {});
    assert.equal(result.passed, false, project.id);
    assert.ok(result.criteria.every((criterion) => !criterion.passed), project.id);
    assert.ok(result.criteria.every((criterion) => criterion.requirements.some((item) => !item.passed)), project.id);
  }
});

test("project progress only reports completion while the current answers match the passing submission", () => {
  const project = PROJECTS[0];
  const answers = answersFor(project.id);
  const projectState = {
    answers,
    submittedAnswers: answers,
    submittedAt: "2026-11-12T00:00:00.000Z",
  };

  assert.equal(getProjectProgress(project, projectState).completed, true);
  assert.equal(getProjectProgress(project, {
    ...projectState,
    answers: { ...projectState.answers, 0: "Trabajo en curso" },
  }).completed, false);
  const emptyAnswers = { 0: "", 1: "", 2: "", 3: "" };
  assert.equal(getProjectProgress(project, {
    answers: emptyAnswers,
    submittedAnswers: emptyAnswers,
    submittedAt: "2026-11-12T00:00:00.000Z",
  }).needsImprovement, true);
});

test("project work normalization preserves valid drafts and drops unknown stage values", () => {
  const normalized = normalizeProjectWork({
    "diagnostico-de-ventas": {
      answers: { 0: "Mi análisis", 99: "No corresponde", 1: 42 },
      submittedAt: null,
    },
    "unknown-project": { answers: { 0: "ignorar" } },
  });

  assert.equal(normalized["diagnostico-de-ventas"].answers[0], "Mi análisis");
  assert.equal(normalized["diagnostico-de-ventas"].answers[1], "");
  assert.equal(Object.hasOwn(normalized, "unknown-project"), false);
});
