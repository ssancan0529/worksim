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

export function runMayraSql(query) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./mayraSql.worker.js", import.meta.url), { type: "module" });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("La consulta superó el tiempo de ejecución. Simplifícala y vuelve a intentarlo."));
    }, 10000);

    function finish() {
      clearTimeout(timeout);
      worker.terminate();
    }

    worker.onmessage = ({ data }) => {
      finish();
      if (data.error) reject(new Error(data.error));
      else resolve(data.results);
    };
    worker.onerror = event => {
      finish();
      reject(new Error(event.message || "No se pudo iniciar SQLite. Vuelve a intentarlo."));
    };
    worker.postMessage(query);
  });
}
