import "../../vendor/sql-wasm.js";
import wasmUrl from "../../vendor/sql-wasm.wasm?url";
import { loadBrowserPython } from "../lib/pyodideRuntime.js";
import pythonCases from "./python-cases.py?raw";
import { exercises } from "./cases.mjs";
import { evaluateSql } from "./sql-engine.mjs";

self.onmessage = async ({ data }) => {
  try {
    const exercise = exercises.find(item => item.id === data.id);
    if (!exercise) throw new Error("No se encontró el ejercicio solicitado.");
    let evaluate;
    if (exercise.language === "SQL") {
      if (typeof globalThis.initSqlJs !== "function") {
        throw new Error("No se pudo cargar SQL.js.");
      }
      const SQL = await globalThis.initSqlJs({ locateFile: () => wasmUrl });
      evaluate = code => evaluateSql(SQL, exercise.id, code);
    } else {
      const python = await loadBrowserPython();
      python.setStdout({ batched: () => {} });
      python.setStderr({ batched: () => {} });
      python.runPython(pythonCases);
      const runTests = python.globals.get("ejecutar_pruebas");
      evaluate = code => {
        const result = JSON.parse(runTests(code));
        if (result.error) return { ...result, checks: [], passed: 0, total: 5 };
        return { ...result, passed: result.checks.filter(check => check.passed).length, total: result.checks.length };
      };
    }
    self.postMessage({ phase: "ready" });
    const user = evaluate(data.code);
    self.postMessage({ user, ai: data.compare ? evaluate(exercise.ai) : null });
  } catch (error) {
    self.postMessage({ error: String(error.message || error).slice(0, 300) });
  }
};
