import { exercises, supportFixture, transfersFixture } from "./cases.mjs";

const eligibleTransfer = row => row[2] === "transferencia" && row[3] === "Guayaquil" && row[4] >= 100;
const transferPriority = (a, b) => b[5] - a[5] || b[4] - a[4] || a[0] - b[0];
const byRecency = (a, b) => b[6].localeCompare(a[6]) || b[0] - a[0];
const eligibleTicket = row => row[3] === "abierta" && row[4] >= 3;
const ticketScore = row => row[4] * 10 + row[5];
const ticketPriority = (a, b) => ticketScore(b) - ticketScore(a) || a[0] - b[0];

const fixtures = {
  transfers: {
    rows: transfersFixture,
    schema: "id INTEGER UNIQUE, cuenta_id INTEGER, tipo TEXT, ciudad TEXT, monto INTEGER, sospechosa INTEGER, fecha TEXT",
  },
  support: {
    rows: supportFixture,
    schema: "id INTEGER UNIQUE, asunto TEXT, equipo TEXT, estado TEXT, prioridad INTEGER, horas_espera INTEGER",
  },
};

function runQuery(SQL, exercise, code, rows, schema) {
  const db = new SQL.Database();
  try {
    db.run(`CREATE TABLE ${exercise.dataName} (${schema})`);
    const placeholders = exercise.columns.map(() => "?").join(", ");
    const insert = db.prepare(`INSERT INTO ${exercise.dataName} VALUES (${placeholders})`);
    try {
      for (const row of rows) insert.run(row);
    } finally {
      insert.free();
    }

    const uncommented = code.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, "");
    if (!/^(SELECT|WITH)\b/i.test(uncommented)) throw new Error("Escribe una consulta de lectura con SELECT o WITH.");
    db.run("PRAGMA query_only = ON");

    const statements = db.iterateStatements(code);
    const statement = statements.next().value;
    const columns = statement?.getColumnNames() ?? [];
    if (!columns.length) throw new Error("La consulta debe devolver una tabla.");
    if (columns.length > 24) throw new Error("La consulta devolvió más de 24 columnas.");
    const values = [];
    while (statement.step()) {
      if (values.length >= 250) throw new Error("La consulta devolvió más de 250 filas.");
      values.push(statement.get().map(value => {
        if (value instanceof Uint8Array) return "[binario]";
        return typeof value === "string" && value.length > 240 ? value.slice(0, 240) + "…" : value;
      }));
    }
    if (!statements.next().done) throw new Error("Ejecuta una sola consulta por vez.");
    return { columns, rows: values, error: null };
  } catch (error) {
    const message = String(error.message || error).slice(0, 300);
    return { columns: [], rows: [], error: message };
  } finally {
    db.close();
  }
}

function resultsContext(exercise, fixture, result) {
  const names = result.columns.map(name => name.toLowerCase());
  const byId = new Map(fixture.map(row => [row[0], row]));
  const indexes = names.map(name => exercise.columns.indexOf(name));
  const ids = result.rows.map(row => row[names.indexOf("id")] ?? null);
  const rows = result.rows.map((row, i) => {
    const original = byId.get(ids[i]);
    return original && indexes.every((index, j) => index < 0 || original[index] === row[j]) ? original : null;
  });
  const columnsMatch = exercise.output.length === names.length && exercise.output.every((name, i) => names[i] === name);
  return { names, ids, rows, columnsMatch, allKnown: rows.length > 0 && rows.every(Boolean) };
}

function sameIds(ids, expected) {
  const observed = new Set(ids);
  return ids.length === expected.length && observed.size === expected.length
    && expected.every(row => observed.has(row[0]));
}

function sorted(rows, comparator) {
  return rows.length > 1 && rows.every((row, i) => i === 0 || comparator(rows[i - 1], row) <= 0);
}

function idList(ids) {
  return ids.slice(0, 15).map(id => id ?? "sin ID").join(", ") || "—";
}

function checkTransfers(fixture, context) {
  const latest = new Map();
  for (const row of fixture.filter(eligibleTransfer).sort(byRecency)) {
    if (!latest.has(row[1])) latest.set(row[1], row);
  }
  const expected = [...latest.values()].sort(transferPriority).slice(10, 20);
  const { columnsMatch, rows, allKnown, ids } = context;
  const eligible = allKnown && rows.every(eligibleTransfer);
  const latestMatches = rows.filter(row => row && latest.get(row[1]) === row).length;
  const unique = new Set(rows.filter(Boolean).map(row => row[1]));
  return [
    ["Columnas del reporte", columnsMatch, "Comprueba los nombres y el orden de las cinco columnas."],
    ["Transferencias válidas", eligible, "Cada fila debe ser una transferencia de Guayaquil por al menos $100."],
    ["Última transferencia válida por cuenta", allKnown && latestMatches === rows.length && unique.size === rows.length,
      `${latestMatches} de ${rows.length} filas corresponden a la más reciente de su cuenta.${unique.size < rows.length ? " Revisa las cuentas repetidas." : ""}`],
    ["Página 2 completa", allKnown && sameIds(ids, expected),
      `IDs esperados: ${idList(expected.map(row => row[0]))}. Obtenidos: ${idList(ids)}.`],
    ["Orden del reporte y desempates", allKnown && sorted(rows, transferPriority),
      "Comprueba el orden por sospecha, monto e ID en las filas devueltas."],
  ];
}

function checkSupport(fixture, context, result) {
  const byTeam = new Map();
  for (const row of fixture.filter(eligibleTicket).sort(ticketPriority)) {
    const team = byTeam.get(row[2]) ?? [];
    if (team.length < 2) team.push(row);
    byTeam.set(row[2], team);
  }
  const expected = [...byTeam.values()].flat().sort(ticketPriority);
  const { names, columnsMatch, rows, allKnown, ids } = context;
  const scoreIndex = names.indexOf("puntaje");
  return [
    ["Columnas solicitadas", columnsMatch, "Comprueba el orden y el nombre de las cuatro columnas."],
    ["Solo solicitudes elegibles", allKnown && rows.every(eligibleTicket), "Cada fila debe estar abierta y tener prioridad de 3 o más."],
    ["Puntaje calculado", allKnown && scoreIndex >= 0 && rows.every((row, i) => result.rows[i][scoreIndex] === ticketScore(row)),
      "El puntaje debe combinar prioridad y horas de espera según la fórmula."],
    ["Hasta dos por equipo con desempate", allKnown && sameIds(ids, expected),
      `IDs esperados: ${idList(expected.map(row => row[0]))}. Obtenidos: ${idList(ids)}.`],
    ["Orden global por puntaje e ID", allKnown && sorted(rows, ticketPriority),
      "En puntajes iguales, el ID menor debe aparecer primero."],
  ];
}

export function evaluateSql(SQL, id, code) {
  const exercise = exercises.find(item => item.id === id);
  const { rows, schema } = fixtures[id];
  const results = [0, 1].map(variant => {
    const fixture = rows(variant);
    const output = runQuery(SQL, exercise, code, fixture, schema);
    const context = resultsContext(exercise, fixture, output);
    const checks = id === "transfers" ? checkTransfers(fixture, context) : checkSupport(fixture, context, output);
    return { ...output, checks };
  });
  const checks = results[0].checks.map(([label], i) => ({
    label,
    passed: results.every(result => !result.error && result.checks[i][1]),
    evidence: results.map((result, j) => `Datos ${j + 1}: ${result.error || result.checks[i][2]}`),
  }));
  const first = results[0];
  return {
    checks, passed: checks.filter(check => check.passed).length, total: checks.length,
    columns: first.columns, rows: first.rows.slice(0, 25), rowCount: first.rows.length, error: results.find(result => result.error)?.error ?? null,
  };
}
