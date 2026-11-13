import { PROJECTS } from "./projects.js";

const number = (id, label, expected, help, tolerance = 0.01) => ({ id, label, expected, help, tolerance, type: "number" });
const choice = (id, label, options, expected, help) => ({ id, label, options, expected, help, type: "select" });

export const BANK_TRANSACTIONS = [
  ["T01", "Enero", "Digital", "confirmada", 6000],
  ["T02", "Enero", "Ventanilla", "confirmada", 2200],
  ["T01", "Enero", "Digital", "confirmada", 6000],
  ["T03", "Febrero", "Digital", "confirmada", 5000],
  ["T04", "Febrero", "Ventanilla", "confirmada", 2400],
  ["T05", "Marzo", "Digital", "confirmada", 4000],
  ["T06", "Marzo", "Ventanilla", "confirmada", 2300],
  ["R01", "Marzo", "Ventanilla", "reversión", -200],
  ["T07", "Marzo", "Digital", "pendiente", 1200],
];

export const MOVEMENT_CASES = [
  { name: "Registra un movimiento válido", ledger: [], id: "M2", cents: 250, kind: "abono", expected: { accepted: true, ledger: [{ id: "M2", cents: 250, kind: "abono" }] } },
  { name: "Conserva movimientos anteriores y su orden", ledger: [{ id: "M1", cents: 100, kind: "abono" }], id: "M2", cents: 200, kind: "cargo", expected: { accepted: true, ledger: [{ id: "M1", cents: 100, kind: "abono" }, { id: "M2", cents: 200, kind: "cargo" }] } },
  { name: "Rechaza un ID repetido sin alterar el registro", ledger: [{ id: "M1", cents: 100, kind: "abono" }], id: "M1", cents: 200, kind: "cargo", expected: { accepted: false, ledger: [{ id: "M1", cents: 100, kind: "abono" }] } },
  ...[
    ["Monto cero", "M2", 0, "cargo"],
    ["Monto negativo", "M2", -1, "abono"],
    ["Monto decimal", "M2", 1.5, "cargo"],
    ["Monto booleano", "M2", true, "cargo"],
    ["Monto de texto", "M2", "25", "cargo"],
    ["ID vacío", "  ", 25, "abono"],
    ["Tipo desconocido", "M2", 25, "otro"],
  ].map(([name, id, cents, kind]) => ({ name, ledger: [], id, cents, kind, expected: { accepted: false, ledger: [] } })),
];

const stage = (title, description, tasks, hint) => ({ title, description, tasks, hint });
const file = (name, path) => ({ name, path });

const definitions = [
  {
    title: "Diagnóstico de transacciones",
    description: "Identifica qué canal explica el cambio en el volumen liquidado y recomienda una acción.",
    brief: "Operaciones de Banco Horizonte necesita explicar el cambio en transferencias liquidadas entre enero y marzo. Presenta un diagnóstico que se pueda conciliar y reproducir.",
    deliverables: [file("Consulta reproducible", "sql/operaciones.sql"), file("Indicadores por canal", "resultados/indicadores.csv"), file("Informe de hallazgos", "informe.md")],
    stages: [
      stage("Define la pregunta", "Delimita qué necesita decidir Operaciones.", ["Plantea un indicador y explica qué operaciones representa."], "¿Qué diferencia hay entre una transferencia iniciada y una liquidada?"),
      stage("Prepara el extracto", "Separa duplicados, pendientes y reversiones.", ["Documenta qué incluyes y por qué."], "Un ID repetido y una reversión tienen efectos diferentes."),
      stage("Concilia los resultados", "Compara enero y marzo y comprueba el total trimestral.", ["Deja una consulta o pasos reproducibles en tu explicación."], "Contrasta los totales por mes con una suma independiente."),
      stage("Defiende la recomendación", "Explica qué canal aporta más al cambio.", ["Propón una acción y una comprobación antes de atribuir causas."], "¿Qué dato adicional distinguiría un problema del canal de una caída en la demanda?"),
    ],
    rubric: {
      context: "Extracto ficticio en USD. ID identifica la operación. Las confirmadas y las reversiones cuentan en el volumen neto liquidado. Los pendientes aún no se liquidan. Una reversión tiene importe negativo.",
      review: "Revisar la consulta o los pasos, la relación entre hallazgo y recomendación, y los límites del diagnóstico. Se comprueban los resultados declarados.",
      stages: [
        [choice("period", "Periodo", ["Enero y marzo", "Enero y febrero"], "Enero y marzo", "Usa los extremos del trimestre."), choice("metric", "Indicador", ["Volumen neto liquidado", "Cantidad de filas"], "Volumen neto liquidado", "Mide el importe de movimientos liquidados.")],
        [number("duplicates", "Repeticiones excluidas", 1, "Contrasta el ID de operación."), number("pending", "Pendientes excluidas", 1, "Comprueba el estado de cada fila."), number("reversal", "Importe de la reversión", -200, "Conserva el signo del extracto.")],
        [number("january", "Neto de enero", 8200, "Depura antes de sumar."), number("march", "Neto de marzo", 6100, "Separa lo pendiente y aplica la reversión."), number("change", "Variación porcentual", (6100-8200)/8200*100, "Usa enero como base.", 0.05), number("control", "Total trimestral conciliado", 21700, "Comprueba la suma de los tres meses.")],
        [choice("channel", "Canal con mayor caída absoluta", ["Digital", "Ventanilla"], "Digital", "Compara la diferencia en USD por canal."), number("channelChange", "Variación en USD del canal elegido", -2000, "Resta el valor de enero al de marzo para ese canal.")],
      ],
    },
  },
  {
    title: "API de movimientos bancarios",
    description: "Diseña un contrato de registro y consulta, y prueba la lógica de movimientos con trazabilidad.",
    brief: "El equipo de Banco Horizonte necesita registrar movimientos de prueba con un identificador único y conservar el historial ante entradas inválidas.",
    deliverables: [file("Contrato de rutas", "docs/contrato.md"), file("Lógica Python", "app/movimientos.py"), file("Pruebas y ejemplos", "tests/casos.md")],
    stages: [
      stage("Define el contrato", "Diseña POST /movimientos y GET /movimientos/{id}.", ["Explica cómo tratarás identificadores repetidos y datos inválidos."], "¿Qué debería recibir el cliente si reenvía un identificador ya registrado?"),
      stage("Implementa el registro", "Escribe registrar_movimiento en Python y ejecuta las pruebas.", ["Conserva el historial anterior ante un rechazo."], "Compara el estado antes y después de una entrada inválida."),
      stage("Prueba las reglas", "Contrasta un éxito, un rechazo y un reintento.", ["Documenta un caso adicional y el estado que esperas."], "¿Qué debería permanecer igual al repetir una solicitud?"),
      stage("Defiende la entrega", "Documenta una solicitud y su respuesta.", ["Justifica cómo puede otro desarrollador reproducir el resultado."], "Separa la prueba de la función de una prueba de una ruta HTTP."),
    ],
    rubric: {
      context: "Contrato ficticio: POST /movimientos devuelve 201 al crear, 409 ante ID repetido y 400 por datos inválidos. GET /movimientos/{id} devuelve 200 si existe o 404 si falta. En Python, registrar_movimiento(ledger, movement_id, cents, kind) devuelve {accepted: booleano, ledger: lista}. Cada movimiento contiene id, cents y kind. ID es texto no vacío, el monto es un entero positivo en centavos y el tipo es abono o cargo. Un rechazo conserva los registros y un éxito añade el movimiento al final.",
      review: "Revisar el diseño de rutas, trazabilidad, ejemplos y reproducibilidad. La ejecución automática cubre la función Python y el estado resultante.",
      stages: [
        [number("created", "Estado HTTP al crear", 201, "Consulta el contrato de creación."), number("duplicate", "Estado HTTP para un ID repetido", 409, "El identificador ya existe."), number("invalid", "Estado HTTP con datos inválidos", 400, "Consulta el contrato de entrada.")],
        [],
        [choice("retry", "Efecto de repetir un ID", ["Conserva el registro", "Añade otra fila"], "Conserva el registro", "Verifica el estado tras un rechazo."), number("missing", "Estado HTTP si el movimiento no existe", 404, "Consulta el contrato de búsqueda.")],
        [choice("method", "Método para registrar", ["POST", "GET"], "POST", "Elige la operación de creación."), number("lookup", "Estado HTTP para una consulta exitosa", 200, "Consulta el contrato de búsqueda.")],
      ],
    },
  },
  {
    title: "Campaña de un servicio bancario digital",
    description: "Presenta el piloto de alertas de transferencias y defiende mensajes respaldados por el brief.",
    brief: "Banco Horizonte necesita comunicar un piloto de alertas de transferencias a clientes de banca móvil y medir cuántas personas solicitan acceso.",
    deliverables: [file("Brief y mensajes", "brief.md"), file("Calendario", "calendario.csv"), file("Medición y respuesta a objeciones", "medicion.md")],
    stages: [
      stage("Define el público", "Aclara a quién se dirige la campaña y qué acción esperas.", ["Propón un objetivo medible."], "Comprueba quién puede solicitar acceso al piloto."),
      stage("Redacta y defiende el mensaje", "Explica el beneficio y las condiciones.", ["Responde a Atención al Cliente si pregunta si todas las alertas llegarán de inmediato."], "Distingue las condiciones del piloto de una garantía de entrega."),
      stage("Organiza el calendario", "Coordina anuncio, demostración y recordatorio.", ["Explica por qué seleccionaste el canal."], "Revisa qué canales autoriza el brief."),
      stage("Mide y justifica", "Interpreta las solicitudes y plantea una mejora.", ["Distingue una solicitud de una activación efectiva."], "Comprueba qué mide el denominador de la conversión."),
    ],
    rubric: {
      context: "Piloto ficticio de alertas de transferencias para clientes con banca móvil activa. Solicitar acceso no garantiza activación ni alertas instantáneas. Campaña de siete días, presupuesto máximo de $100 y meta de 12 solicitudes. Canales: correo y aviso en la app. Seguimiento: 80 clics, 12 solicitudes registradas.",
      review: "Revisar adecuación del mensaje, respaldo de promesas y respuesta a la objeción. La rúbrica verifica las condiciones seleccionadas y los cálculos.",
      stages: [
        [choice("audience", "Público", ["Clientes con banca móvil activa", "Público general"], "Clientes con banca móvil activa", "Consulta quién tiene acceso al piloto."), number("goal", "Meta de solicitudes", 12, "Distingue solicitudes de clics."), number("budget", "Presupuesto", 100, "Respeta el máximo del brief.")],
        [choice("promise", "Condición del servicio", ["Acceso sujeto al piloto", "Alertas instantáneas garantizadas"], "Acceso sujeto al piloto", "Comprueba si el brief permite esa promesa."), choice("cta", "Acción del cliente", ["Solicitar acceso", "Confirmar activación inmediata"], "Solicitar acceso", "La campaña mide solicitudes.")],
        [number("announcement", "Día del anuncio", null, "El anuncio abre la secuencia."), number("demonstration", "Día de demostración", null, "Ubica la demostración después del anuncio."), number("reminder", "Día del recordatorio", null, "Cierra la secuencia antes de terminar el día siete."), choice("channel", "Canal", ["Correo", "Aviso en la app", "Televisión"], ["Correo", "Aviso en la app"], "Usa un canal autorizado.")],
        [number("conversion", "Conversión de clics a solicitudes (%)", 15, "Divide las solicitudes por los clics y convierte a porcentaje."), choice("source", "Fuente para verificar la meta", ["Registro de solicitudes", "Impresiones"], "Registro de solicitudes", "Usa el registro que mide la acción buscada.")],
      ],
    },
  },
];

export const BANK_PROJECTS = PROJECTS.map((project, index) => {
  const definition = definitions[index];
  return {
    ...project, ...definition, bank: true,
    criteria: definition.stages.map(({ title }, stageIndex) => ({ id: project.criteria[stageIndex].id, title, stageIndex })),
  };
});
