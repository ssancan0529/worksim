import { readOnlyQuery } from "./readOnlySql.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { AI_QUERY, EXPECTED_ROWS, TRANSACTIONS } from "../data/mayra.js";
import { exercises } from "../practica/cases.mjs";
import { evaluateSql } from "../practica/sql-engine.mjs";
import { canAdvanceExercise } from "../practica/state.mjs";

const vendorUrl = new URL("../../vendor/sql-wasm.js", import.meta.url);
const loaderContext = {
  self: { location: { href: "https://worksim.test/sql-worker.js" } },
  WorkerGlobalScope: function WorkerGlobalScope() {},
  console, setTimeout, clearTimeout, TextDecoder, TextEncoder, crypto: globalThis.crypto,
};
vm.runInNewContext(`"use strict";\n${readFileSync(vendorUrl, "utf8")}`, loaderContext);
const sqlite = await loaderContext.initSqlJs({
  wasmBinary: readFileSync(new URL("../../vendor/sql-wasm.wasm", import.meta.url)),
});
const source = readFileSync(new URL("./mayraSql.worker.js", import.meta.url), "utf8")
  .replace(/\r\n/g, "\n")
  .replace(/^import .*;\n/gm, "");

async function execute(query) {
  let output;
  const context = {
    wasmUrl: "unused-in-test", TRANSACTIONS, readOnlyQuery, initSqlJs: async () => sqlite,
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

test("SQL advancement requires a successful latest run but not a passing score", () => {
  for (const exercise of exercises.filter(item => item.language === "SQL")) {
    const partial = evaluateSql(sqlite, exercise.id, `SELECT * FROM ${exercise.table};`);
    const noCriteria = evaluateSql(sqlite, exercise.id, "SELECT 1;");
    const invalid = evaluateSql(sqlite, exercise.id, `SELECT FROM ${exercise.table};`);
    assert.ok(partial.passed < partial.total);
    assert.equal(noCriteria.passed, 0);
    assert.equal(canAdvanceExercise({
      code: `SELECT * FROM ${exercise.table};`, executedCode: `SELECT * FROM ${exercise.table};`, preview: partial,
    }), true);
    assert.equal(canAdvanceExercise({ code: "SELECT 1;", executedCode: "SELECT 1;", preview: noCriteria }), true);
    assert.equal(canAdvanceExercise({
      code: `SELECT FROM ${exercise.table};`, executedCode: `SELECT FROM ${exercise.table};`, preview: invalid,
    }), false);
    assert.equal(canAdvanceExercise({ code: "SELECT", preview: null }), false);
    assert.equal(canAdvanceExercise({ code: "SELECT", preview: { checks: [], error: "Fallo del motor" } }), false);
    assert.equal(canAdvanceExercise({ code: "SELECT 1;", executedCode: "SELECT 1", preview: noCriteria }), false);
    assert.equal(canAdvanceExercise({ code: "   \n\t", preview: partial }), false);
    assert.equal(canAdvanceExercise({}), false);
  }
});


test("SQL read-only rejects writes, PRAGMA bypass and multiple statements", async () => {
  for (const query of ["DELETE FROM transacciones", "PRAGMA query_only=OFF; DELETE FROM transacciones; SELECT 1", "SELECT 1; PRAGMA query_only=OFF; DELETE FROM transacciones", "WITH x AS (SELECT 1) DELETE FROM transacciones"]) {
    assert.ok((await execute(query)).error, query);
  }
  assert.equal((await execute("SELECT COUNT(*) FROM transacciones")).results[0].values[0][0], 7);
  assert.equal((await execute("-- comentario\nWITH x AS (SELECT * FROM transacciones) SELECT COUNT(*) FROM x")).results[0].values[0][0], 7);
});
