import scriptUrl from "../../vendor/sql-wasm.js?url";
import wasmUrl from "../../vendor/sql-wasm.wasm?url";
import { AI_QUERY, TRANSACTIONS } from "../data/mayra";

let sqlite;

function loadSqlite() {
  if (!sqlite) {
    sqlite = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.onload = () => {
        script.remove();
        if (typeof window.initSqlJs !== "function") {
          reject(new Error("SQLite no se inicializó."));
          return;
        }
        resolve(window.initSqlJs({ locateFile: () => wasmUrl }));
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("No se pudo cargar SQLite."));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      sqlite = undefined;
      throw error;
    });
  }
  return sqlite;
}

export async function runMayraQuery() {
  const SQL = await loadSqlite();
  const db = new SQL.Database();
  try {
    db.run("CREATE TABLE transacciones (id INTEGER PRIMARY KEY, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER)");
    for (const row of TRANSACTIONS) {
      db.run("INSERT INTO transacciones VALUES (?, ?, ?, ?, ?)", row);
    }
    return db.exec(AI_QUERY)[0]?.values ?? [];
  } finally {
    db.close();
  }
}
