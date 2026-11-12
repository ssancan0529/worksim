import "../../vendor/sql-wasm.js";
import wasmUrl from "../../vendor/sql-wasm.wasm?url";
import { TRANSACTIONS } from "../data/mayra";

self.onmessage = async ({ data: query }) => {
  let db;
  try {
    if (typeof globalThis.initSqlJs !== "function") {
      throw new Error("No se pudo cargar SQL.js.");
    }
    const SQL = await globalThis.initSqlJs({ locateFile: () => wasmUrl });
    db = new SQL.Database();
    db.run("CREATE TABLE transacciones (id INTEGER PRIMARY KEY, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER)");
    for (const row of TRANSACTIONS) {
      db.run("INSERT INTO transacciones VALUES (?, ?, ?, ?, ?)", row);
    }
    db.run("PRAGMA query_only = ON");
    self.postMessage({ results: db.exec(query) });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    db?.close();
  }
};
