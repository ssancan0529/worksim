import scriptUrl from "../../vendor/sql-wasm.js?url";
import wasmUrl from "../../vendor/sql-wasm.wasm?url";
import { TRANSACTIONS } from "../data/mayra";

self.onmessage = async ({ data: query }) => {
  let db;
  try {
    importScripts(scriptUrl);
    const SQL = await self.initSqlJs({ locateFile: () => wasmUrl });
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
