import { exercises } from "./cases.mjs";

const definitions = {
  transfers: {
    schema: "id INTEGER UNIQUE, ciudad TEXT, tipo TEXT, estado TEXT, monto INTEGER",
    filterIssue([, city, type, status, amount]) {
      if (city !== "Guayaquil") return `es de ${city}. El encargo pide Guayaquil.`;
      if (type !== "transferencia") return `es de tipo «${type}». El encargo pide transferencias.`;
      if (status !== "confirmada") return `tiene estado «${status}». El encargo pide «confirmada».`;
      if (amount < 100) return `tiene un monto de $${amount}. El mínimo es $100.`;
      return null;
    },
    order: (a, b) => b[4] - a[4] || a[0] - b[0],
    limit: 3,
    selectionLabel: "Las tres transferencias solicitadas",
    orderLabel: "Orden por monto e ID",
  },
  support: {
    schema: "id INTEGER UNIQUE, asunto TEXT, estado TEXT, prioridad INTEGER",
    filterIssue([, , status, priority]) {
      if (status !== "abierta") return `tiene estado «${status}». El encargo pide solicitudes abiertas.`;
      if (priority < 3) return `tiene prioridad ${priority}. El mínimo es 3.`;
      return null;
    },
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

function findFilterFailure(definition, selected, idIndex) {
  if (selected.length === 0) return "La consulta devolvió cero filas.";
  if (idIndex < 0) return "Incluye la columna id para comprobar los filtros en cada fila.";
  for (const row of selected) {
    if (!row) return "Algún ID o valor devuelto no coincide con los datos de la tabla.";
    const issue = definition.filterIssue(row);
    if (issue) return `La fila con ID ${row[0]} ${issue}`;
  }
  return null;
}

function validate(exercise, definition, fixture, output) {
  const names = output.columns.map(name => name.toLowerCase());
  const idIndex = names.indexOf("id");
  const ids = output.rows.map(row => row[idIndex]);
  const byId = new Map(fixture.map(row => [row[0], row]));
  const indexes = names.map(name => exercise.columns.indexOf(name));
  const selected = output.rows.map((row, i) => {
    const original = byId.get(ids[i]);
    return original && indexes.every((index, j) => index < 0 || original[index] === row[j]) ? original : null;
  });
  const known = selected.length > 0 && selected.every(Boolean);
  const filterFailure = findFilterFailure(definition, selected, idIndex);
  const expected = fixture.filter(row => !definition.filterIssue(row))
    .sort(definition.order).slice(0, definition.limit ?? fixture.length);
  const expectedIds = new Set(expected.map(row => row[0]));
  const distinct = new Set(ids);
  const missingIds = [...expectedIds].filter(id => !distinct.has(id));
  const extraIds = [...distinct].filter(id => id != null && !expectedIds.has(id));
  const selectionEvidence = idIndex < 0 ? "Incluye la columna id para comparar las filas."
    : [
      `Se esperaban ${expected.length} filas. La consulta devolvió ${ids.length}.`,
      missingIds.length && `IDs faltantes (${missingIds.join(", ")}).`,
      extraIds.length && `IDs de más (${extraIds.slice(0, 6).join(", ")}${extraIds.length > 6 ? ", …" : ""}).`,
      distinct.size < ids.length && "Hay IDs repetidos.",
    ].filter(Boolean).join(" ");
  return [
    ["Columnas solicitadas", names.length === exercise.output.length
      && exercise.output.every((name, i) => names[i] === name),
    `Columnas esperadas: ${exercise.output.join(", ")}.`],
    ["Filtros del encargo", filterFailure === null,
      filterFailure ?? "Todas las filas devueltas cumplen las condiciones."],
    [definition.selectionLabel, known && ids.length === expected.length
      && distinct.size === expected.length && missingIds.length === 0, selectionEvidence],
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
  const checks = first.checks.map(([label, , evidence], index) => {
    const failedAt = results.findIndex(result => result.error || !result.checks[index][1]);
    if (failedAt === -1) return { label, passed: true, evidence };
    const failed = results[failedAt];
    const context = failedAt === 1 ? "En el segundo conjunto de prueba. " : "";
    return { label, passed: false, evidence: context + (failed.error ?? failed.checks[index][2]) };
  });
  return {
    columns: first.columns, rows: first.rows, checks,
    passed: checks.filter(check => check.passed).length, total: checks.length,
    error: first.error,
  };
}
