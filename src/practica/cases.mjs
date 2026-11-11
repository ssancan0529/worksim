export const level = "Intermedio-alto";

const transfersAi = `WITH elegidas AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY cuenta_id ORDER BY monto DESC, id DESC
  ) AS fila
  FROM transacciones
  WHERE tipo = 'transferencia' AND ciudad = 'Guayaquil' AND monto >= 100
)
SELECT id, cuenta_id, fecha, monto, sospechosa
FROM elegidas
WHERE fila = 1
ORDER BY sospechosa DESC, monto DESC, id ASC
LIMIT 10 OFFSET 10;`;

const supportAi = `WITH candidatas AS (
  SELECT id, asunto, equipo, prioridad * 10 + horas_espera AS puntaje
  FROM solicitudes
  WHERE estado = 'abierta' AND prioridad >= 3
), clasificadas AS (
  SELECT *, RANK() OVER (
    PARTITION BY equipo ORDER BY puntaje DESC
  ) AS puesto
  FROM candidatas
)
SELECT id, asunto, equipo, puntaje
FROM clasificadas
WHERE puesto <= 2
ORDER BY puntaje DESC, id ASC;`;

export const pythonAI = `def retirar(cuenta_id, monto, solicitud_id):
    cuenta = db.buscar_cuenta(cuenta_id)
    if cuenta is None:
        return 404
    if monto <= 0:
        return 400
    if cuenta["saldo"] < monto:
        return 409
    # Registra el retiro y actualiza el saldo.
    db.registrar_retiro(cuenta_id, monto, solicitud_id)
    cuenta["saldo"] -= monto
    db.guardar_cuenta(cuenta)
    return 201`;

export const issues = [
  { lines: [5, 6], title: "Validación incompleta del monto", explanation: "La comparación con cero admite decimales y True. El contrato exige un entero positivo y excluye los booleanos." },
  { lines: [7, 9, 10], title: "Falta comprobar si la solicitud ya se atendió", explanation: "Consulta la clave antes de validar saldo. Una repetición idéntica debe devolver 201 sin un segundo débito, incluso si el saldo quedó en cero." },
  { lines: [2, 11, 12], title: "Lectura y actualización fuera de una transacción", explanation: "Dos solicitudes pueden decidir con el mismo saldo. La lectura, el registro y el débito deben quedar dentro de la misma transacción, con reversión si falla la escritura." },
];

const windowExample = `SELECT producto, fecha,
       ROW_NUMBER() OVER (
         PARTITION BY producto ORDER BY fecha DESC
       ) AS posicion
FROM entregas;`;

export const exercises = [
  {
    id: "transfers", engine: "sql", company: "Banco Horizonte", short: "Transferencias",
    title: "Prioriza las transferencias por cuenta",
    intro: "El equipo de riesgo revisa una transferencia reciente por cuenta. Prepara la segunda página del reporte de Guayaquil.",
    requirements: [
      "Filtra las <strong>transferencias</strong> de <strong>Guayaquil</strong> por montos de <strong>$100 o más</strong>.",
      "De las filas que cumplen el filtro, conserva la más reciente por <code>cuenta_id</code>. En empate de <code>fecha</code>, conserva la de <strong>ID mayor</strong>.",
      "Ordena por <code>sospechosa</code> de mayor a menor, luego por <code>monto</code> de mayor a menor y al final por <code>id</code> ascendente. Devuelve la <strong>página 2 de 10 filas</strong>.",
      "Entrega <code>id</code>, <code>cuenta_id</code>, <code>fecha</code>, <code>monto</code> y <code>sospechosa</code>, en ese orden.",
    ],
    guide: [
      ["WHERE", "Reduce el conjunto a las filas que pueden competir dentro de cada cuenta."],
      ["ROW_NUMBER()", "Numera las filas dentro de cada grupo usando un orden explícito."],
      ["WITH · LIMIT · OFFSET", "Divide la consulta en pasos. Pagina cuando el orden final ya esté definido."],
    ],
    example: windowExample,
    hint: "Define qué significa «primera» en dos niveles. Dentro de una cuenta manda la fecha. En el reporte global mandan las alertas y el monto.",
    ai: transfersAi,
    reference: transfersAi.replace("ORDER BY monto DESC, id DESC", "ORDER BY fecha DESC, id DESC"),
    dataName: "transacciones",
    columns: ["id", "cuenta_id", "tipo", "ciudad", "monto", "sospechosa", "fecha"],
    output: ["id", "cuenta_id", "fecha", "monto", "sospechosa"],
  },
  {
    id: "support", engine: "sql", company: "Mesa de soporte", short: "Cola de soporte",
    title: "Ordena la cola de soporte",
    intro: "La supervisora necesita una lista que priorice solicitudes urgentes sin saturar a un solo equipo.",
    requirements: [
      "Incluye solo solicitudes <strong>abiertas</strong> con prioridad <strong>3 o superior</strong>.",
      "Calcula <code>puntaje = prioridad * 10 + horas_espera</code>.",
      "Conserva hasta <strong>dos solicitudes por equipo</strong> con mayor puntaje. En caso de empate, elige el <strong>ID menor</strong>.",
      "Ordena el resultado completo por <code>puntaje</code> descendente e <code>id</code> ascendente. Muestra <code>id</code>, <code>asunto</code>, <code>equipo</code> y <code>puntaje</code>, en ese orden.",
    ],
    guide: [
      ["SELECT · FROM · WHERE", "Elige los datos, calcula columnas y filtra las solicitudes elegibles."],
      ["PARTITION BY", "Una función de ventana puede reiniciar el conteo al cambiar de equipo."],
      ["ORDER BY", "Una columna adicional desempata cuando dos filas tienen el mismo puntaje."],
    ],
    example: windowExample,
    hint: "Una numeración por equipo permite limitar la cantidad de filas. Comprueba qué ocurre si tres solicitudes empatan en el segundo puesto.",
    ai: supportAi,
    reference: supportAi.replace("RANK()", "ROW_NUMBER()").replace("PARTITION BY equipo ORDER BY puntaje DESC", "PARTITION BY equipo ORDER BY puntaje DESC, id ASC"),
    dataName: "solicitudes",
    columns: ["id", "asunto", "equipo", "estado", "prioridad", "horas_espera"],
    output: ["id", "asunto", "equipo", "puntaje"],
  },
  {
    id: "withdrawal", engine: "python", company: "Banco Horizonte", short: "Retiros",
    title: "Protege el registro de retiros",
    intro: "Dos solicitudes pueden usar el mismo saldo. Implementa una función que también resista reintentos y fallos de escritura.",
    requirements: [
      "Implementa <code>retirar(cuenta_id, monto, solicitud_id)</code>. Devuelve <strong>400</strong> si el monto no es un entero positivo. <code>True</code> y <code>False</code> no cuentan como montos.",
      "Devuelve <strong>404</strong> si la cuenta no existe y <strong>409</strong> si no hay saldo suficiente.",
      "Si la clave de solicitud ya existe en esa cuenta, devuelve <strong>201</strong> cuando el monto coincide, incluso con saldo cero. Devuelve <strong>409</strong> si el monto cambió. En ambos casos, evita un nuevo débito.",
      "Por un retiro nuevo, registra la solicitud, actualiza el saldo y devuelve <strong>201</strong>. Si una escritura falla con <code>RuntimeError</code>, revierte la operación y devuelve <strong>503</strong>.",
    ],
    guide: [
      ["Validación", "Comprueba tipos y límites antes de cambiar el estado."],
      ["Idempotencia", "Un reintento de la misma solicitud debe devolver el mismo resultado sin repetir el efecto."],
      ["Transacción", "Agrupa la lectura y las escrituras. Deja salir el error del bloque para que se revierta la operación."],
    ],
    example: `try:
    with inventario.transaccion():
        inventario.actualizar_existencias()
except RuntimeError:
    registrar_incidencia()`,
    hint: "Piensa qué debería pasar cuando la primera solicitud dejó saldo cero y el cliente repite la misma clave.",
    ai: pythonAI,
    methods: [
      ["db.transaccion()", "Úsalo con with. Serializa las operaciones y revierte sus cambios si sale una excepción."],
      ["db.buscar_cuenta(cuenta_id)", "Devuelve un dict con id y saldo, o None."],
      ["db.buscar_retiro(cuenta_id, solicitud_id)", "Devuelve el monto registrado para esa clave, o None."],
      ["db.registrar_retiro(cuenta_id, monto, solicitud_id)", "Registra el movimiento y la clave."],
      ["db.guardar_cuenta(cuenta)", "Persiste el saldo actualizado del diccionario."],
    ],
  },
];

export function transfersFixture(variant) {
  return Array.from({ length: 28 }, (_, i) => {
    const id = 1000 + variant * 1000 + ((i * 17 + variant * 3) % 28) * 10;
    const account = 200 + variant * 100 + i;
    const day = String(8 + (i * 5 + variant * 3) % 20).padStart(2, "0");
    const recent = `2026-10-${day}`;
    const amount = 100 + ((i * 17 + variant * 7) % 8) * 25;
    const valid = [
      [id + 1, account, "transferencia", "Guayaquil", amount + (i % 3 ? 75 : 0), 1, "2026-10-02"],
      [id + 2, account, "transferencia", "Guayaquil", amount, Number((i + variant) % 3 !== 1), recent],
    ];
    if (i % 4 === variant) valid.push([id + 4, account, "transferencia", "Guayaquil", amount, 1, recent]);
    const invalid = [
      ["retiro", "Guayaquil", 700],
      ["transferencia", "Quito", 700],
      ["transferencia", "Guayaquil", 99],
    ][(i + variant) % 3];
    const excluded = [id + 9, account, ...invalid, 1, "2026-10-31"];
    return variant ? [...valid, excluded] : [excluded, ...valid.reverse()];
  }).reverse().flat();
}

const supportRows = [
  [108, "Acceso al portal", "Accesos", "abierta", 5, 6],
  [106, "Restablecer contraseña", "Accesos", "cerrada", 5, 18],
  [102, "Error al descargar reporte", "Reportes", "abierta", 3, 9],
  [104, "Permisos de facturación", "Pagos", "abierta", 2, 30],
  [101, "Inicio de sesión bloqueado", "Accesos", "abierta", 5, 6],
  [107, "Actualizar correo", "Reportes", "cerrada", 3, 22],
  [103, "Pago duplicado", "Pagos", "abierta", 4, 15],
  [105, "Cambiar foto de perfil", "Accesos", "abierta", 1, 25],
  [110, "Error de autenticación", "Accesos", "abierta", 5, 12],
  [112, "Exportar reporte", "Reportes", "abierta", 4, 8],
  [111, "Conciliar depósito", "Pagos", "abierta", 3, 25],
  [114, "Confirmar devolución", "Pagos", "abierta", 5, 5],
  [109, "Informe incompleto", "Reportes", "abierta", 3, 18],
];

export function supportFixture(variant) {
  if (!variant) return supportRows;
  return [
    ...supportRows.map(([id, subject, team, state, priority, hours]) =>
      [320 - id, subject, team, state, priority, hours + (team === "Pagos" ? 8 : 2)]),
    [220, "Solicitud de garantía", "Garantías", "abierta", 4, 7],
  ];
}

export function confidenceIsValid(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function scoreDetection(lines) {
  const marked = [...new Set(lines)];
  const hits = issues.filter(issue => issue.lines.some(line => marked.includes(line))).length;
  const extra = marked.filter(line => !issues.some(issue => issue.lines.includes(line))).length;
  return {
    hits, total: issues.length, extra,
    precision: hits + extra ? Math.round(100 * hits / (hits + extra)) : null,
    status: extra >= 3 ? "excess" : hits ? "valid" : "no-hits",
  };
}

export function canFinish(session) {
  return session.step === exercises.length + 1 && confidenceIsValid(session.before) && confidenceIsValid(session.after)
    && exercises.every(({ id }) => Boolean(session.attempts[id].comparison));
}
