import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import { AI_QUERY, EXPECTED_ROWS, TRANSACTIONS } from "../data/mayra.js";
import { exercises } from "../practica/cases.mjs";
import { evaluateSql } from "../practica/sql-engine.mjs";
import { canAdvanceExercise } from "../practica/state.mjs";

const vendorUrl = new URL("../../vendor/sql-wasm.js", import.meta.url);
const loaderContext = {
  module: { exports: {} },
  require: createRequire(import.meta.url),
  __dirname: new URL("../../vendor", import.meta.url).pathname,
  process, console, setTimeout, clearTimeout, TextDecoder, TextEncoder,
};
vm.runInNewContext(readFileSync(vendorUrl, "utf8"), loaderContext);
const sqlite = await loaderContext.initSqlJs({
  wasmBinary: readFileSync(new URL("../../vendor/sql-wasm.wasm", import.meta.url)),
});
const source = readFileSync(new URL("./mayraSql.worker.js", import.meta.url), "utf8")
  .replace(/^import .*;\n/gm, "");

async function execute(query) {
  let output;
  const context = {
    scriptUrl: "unused-in-test", wasmUrl: "unused-in-test", TRANSACTIONS,
    importScripts() {},
    self: { initSqlJs: async () => sqlite, postMessage(value) { output = value; } },
  };
  vm.runInNewContext(source, context);
  await context.self.onmessage({ data: query });
  return JSON.parse(JSON.stringify(output));
}

test("SQL workspace executes IA and corrected queries against the challenge data", async () => {
  const ai = await execute(AI_QUERY);
  assert.deepEqual(ai.results[0].values.map(([id]) => id), [101, 102, 106, 107]);
  const corrected = await execute(AI_QUERY.replace("ORDER BY", "AND estado = 'Confirmada' ORDER BY"));
  assert.deepEqual(corrected.results[0].values, EXPECTED_ROWS);
});

test("SQL workspace supports custom columns, empty results and syntax errors", async () => {
  const count = await execute("-- conteo\nSELECT COUNT(*) AS total FROM transacciones;");
  assert.deepEqual(count.results[0], { columns: ["total"], values: [[7]] });
  assert.deepEqual((await execute("SELECT * FROM transacciones WHERE id = 0")).results, []);
  assert.ok((await execute("SELECT inexistente FROM transacciones")).error);
});

test("junior queries check filtering, selection and sorting with real SQLite output", () => {
  const [transfers, support] = exercises;
  const report = evaluateSql(sqlite, transfers.id, transfers.reference);
  assert.equal(report.passed, 4);
  assert.deepEqual(report.rows.map(([id]) => id), [101, 103, 108]);
  const pendingIncluded = evaluateSql(sqlite, transfers.id, transfers.ai);
  assert.deepEqual(pendingIncluded.checks.map(({ passed }) => passed), [true, false, false, true]);
  assert.match(pendingIncluded.checks[1].evidence, /ID 106.*pendiente/);
  assert.match(pendingIncluded.checks[2].evidence, /faltantes \(108\).*de más \(106\)/);
  assert.equal(evaluateSql(sqlite, support.id, support.reference).passed, 4);
  const reversedTies = evaluateSql(sqlite, support.id, support.ai);
  assert.deepEqual(reversedTies.checks.map(({ passed }) => passed), [true, true, true, false]);
  assert.match(evaluateSql(sqlite, support.id, "SELECT FROM solicitudes").error, /error de sintaxis/i);
});

test("SQL advancement accepts runnable queries regardless of their score", () => {
  for (const exercise of exercises.filter(item => item.language === "SQL")) {
    const partial = evaluateSql(sqlite, exercise.id, `SELECT * FROM ${exercise.table};`);
    const noCriteria = evaluateSql(sqlite, exercise.id, "SELECT 1;");
    const invalid = evaluateSql(sqlite, exercise.id, `SELECT FROM ${exercise.table};`);
    assert.ok(partial.passed < partial.total);
    assert.equal(noCriteria.passed, 0);
    assert.equal(canAdvanceExercise(exercise, { preview: partial }), true);
    assert.equal(canAdvanceExercise(exercise, { preview: noCriteria }), true);
    assert.equal(canAdvanceExercise(exercise, { preview: invalid }), false);
    assert.equal(canAdvanceExercise(exercise, {}), false);
  }
});
