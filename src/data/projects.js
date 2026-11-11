export const PROJECT_AREAS = {
  data: { label: "Análisis de datos", filter: "Datos", icon: "clipboard-list" },
  software: { label: "Desarrollo de software", filter: "Software", icon: "code" },
  communication: { label: "Comunicación", filter: "Comunicación", icon: "messages" },
};

export const PROJECTS = [
  {
    id: "diagnostico-de-ventas",
    area: "data",
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
  },
  {
    id: "api-de-inventario",
    area: "software",
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
  },
  {
    id: "campana-de-lanzamiento",
    area: "communication",
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
  },
];

export const PORTFOLIO_SAMPLE = {
  projectId: "diagnostico-de-ventas",
  summary: "Análisis de las ventas trimestrales de una tienda para orientar decisiones de surtido.",
  outcome: "Las ventas bajaron de $8.200 en enero a $6.100 en marzo, cerca de un 26 %. El informe identifica qué categorías explican la caída y propone revisar su surtido.",
  contribution: "Definí los indicadores, revisé los registros duplicados y contrasté las cifras del tablero con las consultas SQL.",
  aiUse: "La IA propuso agrupaciones y visualizaciones. Verifiqué las sugerencias con los datos y documenté los ajustes.",
};
