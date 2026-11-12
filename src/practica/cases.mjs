export const PRACTICE_CHALLENGE = {
  id: "practica-sql-python",
  ticket: "LAB-101",
  title: "Práctica de SQL y Python",
  description: "Practica filtros, ordenamiento y condiciones con tres encargos de nivel junior.",
  role: "Analista de datos junior",
  profession: "Análisis de datos",
  duration: 20,
  level: "Básico",
  environment: "SQLite / Python",
  categoryId: "data",
  competencyType: ["Análisis de datos", "Validación técnica", "Resolución de problemas"],
  keywords: ["SQL", "Python", "junior", "ordenamiento", "soporte", "retiros"],
  status: "available",
};

const transfers = [
  [108, "Guayaquil", "transferencia", "confirmada", 190],
  [106, "Guayaquil", "transferencia", "pendiente", 310],
  [101, "Guayaquil", "transferencia", "confirmada", 220],
  [107, "Quito", "transferencia", "confirmada", 390],
  [103, "Guayaquil", "transferencia", "confirmada", 190],
  [105, "Guayaquil", "retiro", "confirmada", 280],
  [104, "Guayaquil", "transferencia", "confirmada", 100],
  [102, "Guayaquil", "transferencia", "confirmada", 99],
  [110, "Guayaquil", "transferencia", "confirmada", 190],
];

const support = [
  [108, "Acceso al portal", "abierta", 5],
  [106, "Restablecer contraseña", "cerrada", 5],
  [102, "Error al descargar reporte", "abierta", 3],
  [104, "Permisos de facturación", "abierta", 2],
  [101, "Inicio de sesión bloqueado", "abierta", 5],
  [107, "Actualizar correo", "cerrada", 3],
  [103, "Pago duplicado", "abierta", 4],
  [105, "Cambiar foto de perfil", "abierta", 1],
];

const transfersAI = `SELECT id, monto
FROM transacciones
WHERE ciudad = 'Guayaquil'
  AND tipo = 'transferencia'
  AND monto >= 100
ORDER BY monto DESC, id ASC
LIMIT 3;`;

const supportAI = `SELECT id, asunto, prioridad
FROM solicitudes
WHERE estado = 'abierta' AND prioridad >= 3
ORDER BY prioridad DESC, id DESC;`;

export const pythonAI = `def retirar(saldo, monto):
    if monto < 0:
        return (400, saldo)
    if monto >= saldo:
        return (409, saldo)
    saldo_final = saldo - monto
    return (201, saldo_final)`;

export const issues = [
  { line: 2, title: "El monto cero se acepta", explanation: "La condición de monto inválido debe incluir el cero." },
  { line: 4, title: "Se rechaza retirar el saldo exacto", explanation: "El saldo es insuficiente solo cuando el monto es mayor que el saldo disponible." },
];

const sqlExample = `SELECT titulo, anio
FROM libros
WHERE categoria = 'ciencia'
ORDER BY anio DESC;`;

export const exercises = [
  {
    id: "transfers", label: "Transferencias", language: "SQL", company: "Banco Horizonte",
    title: "Prepara el reporte de transferencias",
    intro: "Tu supervisora necesita las tres transferencias confirmadas de mayor monto para revisar el reporte de Guayaquil.",
    requirements: [
      "Incluye transferencias confirmadas de Guayaquil por $100 o más.",
      "Ordena por monto de mayor a menor. En empate, pon primero el ID menor.",
      "Devuelve las primeras tres filas. Muestra las columnas id y monto, en ese orden.",
    ],
    guide: [
      ["SELECT · FROM", "Elige las columnas e indica de qué tabla salen."],
      ["WHERE · AND", "Usa AND cuando todas las condiciones tengan que cumplirse."],
      ["ORDER BY · LIMIT", "Ordena el resultado antes de quedarte con sus primeras filas."],
    ],
    example: sqlExample,
    hint: "Comprueba que tu WHERE considere ciudad, tipo, estado y monto. Usa LIMIT al final.",
    ai: transfersAI,
    reference: transfersAI.replace("  AND monto", "  AND estado = 'confirmada'\n  AND monto"),
    table: "transacciones",
    columns: ["id", "ciudad", "tipo", "estado", "monto"],
    output: ["id", "monto"],
    rows: transfers,
    variation: [
      ...transfers.map(([id, ...row]) => [350 - id, ...row]),
      [222, "Guayaquil", "transferencia", "confirmada", 270],
    ],
  },
  {
    id: "support", label: "Cola de soporte", language: "SQL", company: "Mesa de soporte",
    title: "Ordena la cola de soporte",
    intro: "El equipo de soporte quiere ver las solicitudes abiertas que debe atender primero.",
    requirements: [
      "Incluye solo solicitudes abiertas con prioridad 3 o superior.",
      "Ordena la prioridad de mayor a menor. En empate, pon primero el ID menor.",
      "Muestra las columnas id, asunto y prioridad, en ese orden.",
    ],
    guide: [
      ["SELECT · FROM", "Indica cuáles columnas necesitas y de qué tabla vienen."],
      ["WHERE", "Las condiciones eligen las filas que aparecerán en tu resultado."],
      ["ORDER BY", "Usa DESC para ordenar de mayor a menor y ASC para el sentido contrario."],
    ],
    example: sqlExample,
    hint: "Puedes indicar dos columnas separadas por una coma en ORDER BY. La segunda resuelve los empates.",
    ai: supportAI,
    reference: supportAI.replace("id DESC", "id ASC"),
    table: "solicitudes",
    columns: ["id", "asunto", "estado", "prioridad"],
    output: ["id", "asunto", "prioridad"],
    rows: support,
    variation: [
      ...support.map(([id, ...row]) => [330 - id, ...row]),
      [235, "Exportar comprobante", "abierta", 4],
    ],
  },
  {
    id: "withdrawal", label: "Retiros", language: "Python", company: "Banco Horizonte",
    title: "Valida un retiro",
    intro: "Escribe una función que decida si se puede retirar un monto y devuelva el saldo correspondiente.",
    requirements: [
      "Define retirar(saldo, monto). Recibirás dos números enteros y el saldo inicial será mayor o igual a cero.",
      "Devuelve una tupla (código, saldo_final). Si el monto es cero o negativo, devuelve (400, saldo).",
      "Si el monto supera el saldo, devuelve (409, saldo). Si el retiro se puede hacer, devuelve (201, saldo - monto).",
    ],
    guide: [
      ["def", "Define la función con el nombre y los parámetros del encargo."],
      ["if", "Comprueba una condición y decide qué resultado corresponde."],
      ["return", "Devuelve los dos valores juntos, separados por una coma."],
    ],
    example: `def revisar_stock(unidades):
    if unidades == 0:
        return ("agotado", unidades)
    return ("disponible", unidades)`,
    hint: "Comprueba el caso con monto cero y el retiro por el saldo exacto.",
    ai: pythonAI,
  },
];

export const PRACTICE_STEPS = [
  { path: "desafios", label: "Desafíos" },
  { path: "inicio", label: "Inicio" },
  ...exercises.map(exercise => ({ path: exercise.id, label: exercise.label })),
  { path: "cierre", label: "Cierre" },
];

export const PRACTICE_CLOSING_STEP = PRACTICE_STEPS.length - 1;

export function confidenceIsValid(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function scoreDetection(lines) {
  const marked = [...new Set(lines)];
  const hits = issues.filter(issue => marked.includes(issue.line)).length;
  const extra = marked.length - hits;
  return {
    hits, total: issues.length, extra,
    precision: marked.length ? Math.round(100 * hits / marked.length) : null,
    valid: hits > 0 && extra < 3,
  };
}
