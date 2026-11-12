export const PROJECTS = [
  {
    id: "diagnostico-de-ventas",
    area: "data",
    difficulty: "Intermedio",
    duration: "4–6 h",
    tags: ["SQL", "Análisis de datos", "Informes"],
    title: "Diagnóstico de ventas",
    description: "Analiza las ventas de una tienda y recomienda qué productos conviene revisar.",
    brief: "La tienda necesita explicar cómo cambiaron sus ventas en el trimestre. Prepara un análisis que el equipo comercial pueda verificar y usar para decidir.",
    deliverables: [
      { name: "Consultas SQL", path: "sql/ventas.sql" },
      { name: "Tablero de indicadores", path: "resultados/tablero.html" },
      { name: "Informe de hallazgos", path: "informe.md" },
    ],
    stages: [
      {
        title: "Define el objetivo",
        description: "Acota la pregunta que responderás con los datos de ventas.",
        tasks: ["Elige los meses que vas a comparar.", "Define un indicador y explica para quién será útil."],
        hint: "Compara el valor vendido y el número de pedidos. Esas dos medidas ayudan a distinguir una caída en cantidad de un cambio en el valor de cada compra.",
      },
      {
        title: "Prepara los datos",
        description: "Revisa la calidad de los registros antes de calcular indicadores.",
        tasks: ["Identifica fechas, categorías y montos.", "Documenta cómo tratarás duplicados y devoluciones."],
        hint: "Comprueba si dos registros con el mismo número de pedido tienen productos distintos. Un pedido puede tener varias líneas válidas.",
      },
      {
        title: "Construye el análisis",
        description: "Encuentra los meses y las categorías que explican el cambio.",
        tasks: ["Agrupa las ventas por mes y categoría.", "Contrasta los totales del tablero con una consulta de control."],
        hint: "Ordena las categorías por su cambio en dinero. Así podrás separar una caída grande en porcentaje de una caída que realmente mueve el total.",
      },
      {
        title: "Prepara la entrega",
        description: "Presenta una recomendación respaldada por los resultados.",
        tasks: ["Redacta el hallazgo principal y una acción concreta.", "Incluye los pasos para repetir el análisis."],
        hint: "Acompaña cada recomendación con el dato que la sustenta y el periodo al que corresponde.",
      },
    ],
    criteria: [
      {
        id: "question-and-period",
        title: "Pregunta e indicador delimitados",
        stageIndex: 0,
        requirements: [
          { label: "Define un periodo de análisis.", terms: ["enero", "febrero", "marzo", "trimestre", "meses"] },
          { label: "Nombra las ventas o los ingresos.", terms: ["ventas", "vendido", "ingresos"] },
          { label: "Considera pedidos o transacciones.", terms: ["pedidos", "órdenes", "ordenes", "compras"] },
        ],
      },
      {
        id: "data-quality",
        title: "Revisión de calidad de datos",
        stageIndex: 1,
        requirements: [
          { label: "Explica cómo tratar duplicados.", terms: ["duplicado", "duplicados", "repetido", "repetidos"] },
          { label: "Explica cómo tratar devoluciones.", terms: ["devolución", "devoluciones", "reembolso"] },
        ],
      },
      {
        id: "analysis-validation",
        title: "Análisis contrastable",
        stageIndex: 2,
        requirements: [
          { label: "Agrupa los datos por periodo o categoría.", terms: ["agrupar", "agrupación", "por mes", "por categoría"] },
          { label: "Contrasta los totales con una comprobación.", terms: ["contrastar", "comparar", "consulta de control", "verificar"] },
        ],
      },
      {
        id: "recommendation-evidence",
        title: "Recomendación respaldada y reproducible",
        stageIndex: 3,
        requirements: [
          { label: "Incluye un hallazgo o dato concreto.", terms: ["hallazgo", "resultado", "dato", "cifra"] },
          { label: "Propone una acción.", terms: ["recomendación", "recomiendo", "acción", "revisar"] },
          { label: "Indica cómo repetir o verificar el análisis.", terms: ["repetir", "reproducir", "consulta", "pasos"] },
        ],
      },
    ],
  },
  {
    id: "api-de-inventario",
    area: "software",
    difficulty: "Intermedio",
    duration: "6–8 h",
    tags: ["Python", "APIs", "Pruebas automatizadas"],
    title: "API de inventario",
    description: "Construye un servicio que registre productos y controle las existencias de una tienda.",
    brief: "El equipo de operaciones necesita un registro de productos con entradas y salidas de stock. Entrega un servicio que otro desarrollador pueda instalar y probar.",
    deliverables: [
      { name: "Servicio de inventario", path: "app/main.py" },
      { name: "Pruebas automatizadas", path: "tests/test_inventario.py" },
      { name: "Ejemplos de uso", path: "docs/ejemplos.md" },
    ],
    stages: [
      {
        title: "Define el contrato",
        description: "Describe las operaciones que el servicio debe aceptar.",
        tasks: ["Define los datos mínimos de un producto.", "Describe las respuestas para cada operación."],
        hint: "Piensa en las respuestas cuando el producto existe, cuando falta y cuando ya hay otro con el mismo código.",
      },
      {
        title: "Construye el servicio",
        description: "Implementa las rutas para consultar productos y actualizar su stock.",
        tasks: ["Crea la ruta de listado y la de registro.", "Valida el stock antes de guardar una salida."],
        hint: "Separa la regla de existencias de la ruta HTTP para poder probarla con datos pequeños.",
      },
      {
        title: "Prueba los casos",
        description: "Comprueba las operaciones con datos de ejemplo.",
        tasks: ["Prueba una actualización válida y una con stock insuficiente.", "Verifica que el inventario conserve su valor al rechazar una operación."],
        hint: "Además del código de respuesta, revisa el valor que queda guardado. Ese dato demuestra el efecto real de la operación.",
      },
      {
        title: "Documenta la entrega",
        description: "Deja instrucciones para instalar y usar el servicio.",
        tasks: ["Escribe los pasos para iniciar el servicio y ejecutar las pruebas.", "Incluye un ejemplo de solicitud y su respuesta."],
        hint: "Prueba tus instrucciones en una carpeta nueva para detectar pasos que tu entorno ya tenía configurados.",
      },
    ],
    criteria: [
      {
        id: "api-contract",
        title: "Contrato de la API definido",
        stageIndex: 0,
        requirements: [
          { label: "Identifica el producto y su código.", terms: ["producto", "productos"] },
          { label: "Define el dato de stock o existencias.", terms: ["stock", "existencias"] },
          { label: "Describe las operaciones de la API.", terms: ["get", "post", "patch", "ruta", "operación", "operacion"] },
          { label: "Describe las respuestas de la API.", terms: ["respuesta", "respuestas", "status", "código", "codigo"] },
        ],
      },
      {
        id: "stock-validation",
        title: "Servicio y regla de stock descritos",
        stageIndex: 1,
        requirements: [
          { label: "Incluye una operación para consultar/listar productos.", terms: ["get", "listado", "consultar"] },
          { label: "Incluye una operación para registrar productos.", terms: ["post", "registro", "crear"] },
          { label: "Valida una salida que excede las existencias.", terms: ["stock", "existencias"] },
          { label: "Rechaza el stock insuficiente.", terms: ["insuficiente", "no alcanza", "negativo", "rechaza"] },
        ],
      },
      {
        id: "automated-tests",
        title: "Pruebas cubren éxito y rechazo sin alterar stock",
        stageIndex: 2,
        requirements: [
          { label: "Prueba una actualización válida.", terms: ["válida", "valida", "correcta", "éxito", "exito"] },
          { label: "Prueba el caso de stock insuficiente.", terms: ["insuficiente", "no alcanza", "rechazo"] },
          { label: "Comprueba que el stock no cambie si se rechaza.", terms: ["sin cambiar", "conservar", "mantener", "no cambia"] },
        ],
      },
      {
        id: "installable-documentation",
        title: "Entrega documentada y reproducible",
        stageIndex: 3,
        requirements: [
          { label: "Explica cómo instalar o iniciar el servicio.", terms: ["instalar", "instalación", "iniciar", "ejecutar"] },
          { label: "Indica cómo ejecutar las pruebas.", terms: ["pruebas", "test", "pytest"] },
          { label: "Incluye un ejemplo de solicitud y respuesta.", terms: ["solicitud", "request", "respuesta", "response"] },
        ],
      },
    ],
  },
  {
    id: "campana-de-lanzamiento",
    area: "communication",
    difficulty: "Intermedio",
    duration: "3–4 h",
    tags: ["Redacción", "Presentaciones", "Métricas"],
    title: "Campaña de lanzamiento",
    description: "Diseña una campaña para un nuevo servicio y define cómo medir su alcance.",
    brief: "Un equipo va a lanzar un servicio de entregas en su ciudad. Necesita una propuesta de mensajes, canales y métricas que pueda presentar al equipo comercial.",
    deliverables: [
      { name: "Brief de campaña", path: "brief.md" },
      { name: "Calendario de contenidos", path: "calendario.csv" },
      { name: "Plan de medición", path: "medicion.md" },
    ],
    stages: [
      {
        title: "Define el público",
        description: "Describe a quién le hablará la campaña y qué acción buscas.",
        tasks: ["Elige un público concreto.", "Plantea un objetivo que puedas medir durante el lanzamiento."],
        hint: "Una campaña para tiendas pequeñas podría buscar solicitudes de información de sus dueños durante la primera semana.",
      },
      {
        title: "Redacta el mensaje",
        description: "Escribe la propuesta de valor con un llamado a la acción.",
        tasks: ["Redacta un mensaje principal y una variación.", "Comprueba que las promesas estén respaldadas por el brief."],
        hint: "Usa un beneficio comprobable y una acción clara, como pedir una cotización o consultar la cobertura.",
      },
      {
        title: "Organiza el calendario",
        description: "Planifica los contenidos y el propósito de cada publicación.",
        tasks: ["Elige el canal para cada pieza.", "Ordena las publicaciones de anuncio, demostración y recordatorio."],
        hint: "Relaciona cada publicación con una pregunta que tendría el público en ese momento.",
      },
      {
        title: "Define la medición",
        description: "Prepara una forma de saber si el lanzamiento alcanzó su objetivo.",
        tasks: ["Selecciona un indicador de alcance y uno de respuesta.", "Indica de dónde obtendrás los datos y cuándo los revisarás."],
        hint: "Si el objetivo son solicitudes de información, compara los clics con los formularios recibidos para identificar en qué parte cambia la respuesta.",
      },
    ],
    criteria: [
      {
        id: "audience-and-goal",
        title: "Público y objetivo definidos",
        stageIndex: 0,
        requirements: [
          { label: "Identifica un público concreto.", terms: ["público", "publico", "audiencia", "clientes", "tiendas"] },
          { label: "Plantea una acción u objetivo medible.", terms: ["objetivo", "meta", "solicitudes", "cotizaciones", "registros", "clics"] },
        ],
      },
      {
        id: "supported-message",
        title: "Mensaje claro y respaldado",
        stageIndex: 1,
        requirements: [
          { label: "Incluye una propuesta de valor o beneficio.", terms: ["beneficio", "propuesta de valor", "servicio", "entregas"] },
          { label: "Incluye un llamado a la acción.", terms: ["cotización", "cotizacion", "solicita", "consulta", "regístrate", "registrate"] },
          { label: "Evita promesas sin respaldo.", terms: ["brief", "respaldo", "verificar", "comprobable", "confirmado"] },
        ],
      },
      {
        id: "planned-content",
        title: "Calendario organizado por canal",
        stageIndex: 2,
        requirements: [
          { label: "Asigna un canal a las publicaciones.", terms: ["canal", "instagram", "facebook", "correo", "redes"] },
          { label: "Ordena los contenidos en el tiempo.", terms: ["lunes", "martes", "miércoles", "miercoles", "viernes", "semana", "calendario", "anuncio", "demostración", "demostracion"] },
        ],
      },
      {
        id: "measurement-plan",
        title: "Medición con fuente y momento de revisión",
        stageIndex: 3,
        requirements: [
          { label: "Define indicadores de alcance y respuesta.", terms: ["alcance", "impresiones", "visitas"] },
          { label: "Mide una respuesta del público.", terms: ["solicitudes", "clics", "registros", "conversiones", "respuestas"] },
          { label: "Indica fuente y cuándo revisar los datos.", terms: ["fuente", "registro", "revisar", "día", "semana", "lanzamiento"] },
        ],
      },
    ],
  },
];

export const PORTFOLIO_SAMPLE = {
  projectId: "diagnostico-de-ventas",
  summary: "Análisis de las ventas trimestrales de una tienda para orientar decisiones de surtido.",
  outcome: "Las ventas bajaron de $8.200 en enero a $6.100 en marzo, cerca de un 26 %. El informe identifica qué categorías explican la caída y propone revisar su surtido.",
  contribution: "Definí los indicadores, revisé los registros duplicados y contrasté las cifras del tablero con las consultas SQL.",
  aiUse: "La IA propuso agrupaciones y visualizaciones. Verifiqué las sugerencias con los datos y documenté los ajustes.",
};
