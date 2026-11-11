import { exercises } from "./cases.mjs";

const definitions = {
  transfers: {
    schema: "id INTEGER UNIQUE, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER",
    eligible: ([, city, type, status, amount]) => city === "Guayaquil"
      && type === "transferencia" && status === "confirmada" && amount >= 100,
    order: (a, b) => b[4] - a[4] || a[0] - b[0],
    limit: 3,
    selectionLabel: "Las tres transferencias solicitadas",
    orderLabel: "Orden por monto e ID",
  },
  support: {
    schema: "id INTEGER UNIQUE, asunto TEXT, estado TEXT, prioridad INTEGER",
    eligible: row => row[2] === "abierta" && row[3] >= 3,
    order: (a, b) => b[3] - a[3] || a[0] - b[0],
    selectionLabel: "Todas las solicitudes elegibles",
    orderLabel: "Orden por prioridad e ID",
  },
};

function explainError(error) {
  const message = String(error.message || error).slice(0, 220);
  const table = /^no such table: (.+)$/.exec(message);
  if (table) return `No se encontró la tabla «${table[1]}». Revisa el nombre después de FROM.`;
  const column = /^no such column: (.+)$/.exec(message);
  if (column) return `No se encontró la columna «${column[1]}». Revisa los nombres y las comillas del texto.`;
  const syntax = /^near "(.+)": syntax error$/.exec(message);
  if (syntax) return `Hay un error de sintaxis cerca de «${syntax[1]}».`;
  if (message === "incomplete input") return "La consulta está incompleta.";
  return message;
}

function runQuery(SQL, exercise, schema, code, fixture) {
  const db = new SQL.Database();
  try {
    const uncommented = code.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, "");
    if (!/^(SELECT|WITH)\b/i.test(uncommented)) throw new Error("Escribe una consulta de lectura con SELECT o WITH.");
    db.run(`CREATE TABLE ${exercise.table} (${schema})`);
    const placeholders = exercise.columns.map(() => "?").join(", ");
    const insert = db.prepare(`INSERT INTO ${exercise.table} VALUES (${placeholders})`);
    try {
      for (const row of fixture) insert.run(row);
    } finally {
      insert.free();
    }
    db.run("PRAGMA query_only = ON");
    const statements = db.iterateStatements(code);
    const statement = statements.next().value;
    const columns = statement?.getColumnNames() ?? [];
    if (!columns.length) throw new Error("La consulta debe devolver una tabla.");
    if (columns.length > 16) throw new Error("La consulta devolvió más de 16 columnas.");
    const rows = [];
    while (statement.step()) {
      if (rows.length >= 100) throw new Error("La consulta devolvió más de 100 filas.");
      rows.push(statement.get().map(value => {
        if (ArrayBuffer.isView(value)) return "[binario]";
        return typeof value === "string" ? value.slice(0, 240) : value;
      }));
    }
    if (!statements.next().done) throw new Error("Ejecuta una sola consulta por vez.");
    return { columns, rows, error: null };
  } catch (error) {
    return { columns: [], rows: [], error: explainError(error) };
  } finally {
    db.close();
  }
}

function validate(exercise, definition, fixture, output) {
  const names = output.columns.map(name => name.toLowerCase());
  const ids = output.rows.map(row => row[names.indexOf("id")]);
  const byId = new Map(fixture.map(row => [row[0], row]));
  const indexes = names.map(name => exercise.columns.indexOf(name));
  const selected = output.rows.map((row, i) => {
    const original = byId.get(ids[i]);
    return original && indexes.every((index, j) => index < 0 || original[index] === row[j]) ? original : null;
  });
  const known = selected.length > 0 && selected.every(Boolean);
  const expected = fixture.filter(definition.eligible).sort(definition.order).slice(0, definition.limit ?? fixture.length);
  const distinct = new Set(ids);
  return [
    ["Columnas solicitadas", names.length === exercise.output.length
      && exercise.output.every((name, i) => names[i] === name),
    `Columnas esperadas: ${exercise.output.join(", ")}.`],
    ["Filtros del encargo", known && selected.every(definition.eligible),
      "Comprueba que todas las filas devueltas cumplan las condiciones."],
    [definition.selectionLabel, known && ids.length === expected.length
      && distinct.size === expected.length && expected.every(row => distinct.has(row[0])),
    `Se esperaban ${expected.length} filas. La consulta devolvió ${ids.length}.`],
    [definition.orderLabel, known && selected.length > 1
      && selected.every((row, i) => i === 0 || definition.order(selected[i - 1], row) <= 0),
    "Revisa el orden principal y el sentido del desempate por ID."],
  ];
}

export function evaluateSql(SQL, id, code) {
  const exercise = exercises.find(item => item.id === id);
  const definition = definitions[id];
  const results = [exercise.rows, exercise.variation].map(fixture => {
    const output = runQuery(SQL, exercise, definition.schema, code, fixture);
    return { ...output, checks: validate(exercise, definition, fixture, output) };
  });
  const first = results[0];
  const checks = first.checks.map(([label], index) => ({
    label,
    passed: results.every(result => !result.error && result.checks[index][1]),
    evidence: results.find(result => !result.checks[index][1])?.checks[index][2] ?? first.checks[index][2],
  }));
  return {
    columns: first.columns, rows: first.rows, checks,
    passed: checks.filter(check => check.passed).length, total: checks.length,
    error: results.find(result => result.error)?.error ?? null,
  };
}
