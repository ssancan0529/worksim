export const MAYRA_CHALLENGE = {
  id: "mayra-sql",
  ticket: "DAT-101",
  title: "¿Coincide el resultado de la consulta?",
  company: "Banco Horizonte",
  role: "Analista de datos en prácticas",
  profession: "Análisis de datos",
  description: "Estima el resultado de una consulta SQL generada por IA, haz una corrida de escritorio y comprueba qué filas devuelve.",
  duration: 15,
  level: "Básico",
  environment: "SQL / SQLite",
  categoryId: "data-ai",
  competencyType: ["Análisis de datos", "Pensamiento crítico", "Alfabetización en IA"],
  keywords: ["SQL", "consulta", "transacciones", "corrida de escritorio"],
  status: "available",
};

export const MAYRA_STEPS = [
  { path: "desafios", label: "Desafíos" },
  { path: "encargo", label: "Encargo y estimación" },
  { path: "corrida", label: "Corrida de escritorio" },
  { path: "comprobacion", label: "Comprobación y decisión" },
  { path: "informe", label: "Informe" },
];

export const TRANSACTIONS = [
  [101, "Guayaquil", "Transferencia", "Confirmada", 160],
  [102, "Guayaquil", "Transferencia", "Pendiente", 220],
  [103, "Quito", "Transferencia", "Confirmada", 240],
  [104, "Guayaquil", "Retiro", "Confirmada", 150],
  [105, "Guayaquil", "Transferencia", "Confirmada", 80],
  [106, "Guayaquil", "Transferencia", "Confirmada", 100],
  [107, "Guayaquil", "Transferencia", "Confirmada", 320],
];

export const AI_QUERY = `SELECT id, ciudad, tipo, estado, monto
FROM transacciones
WHERE ciudad = 'Guayaquil'
  AND tipo = 'Transferencia'
  AND monto >= 100
ORDER BY id;`;

export const EXPECTED_ROWS = TRANSACTIONS.filter(
  ([, city, type, status, amount]) =>
    city === "Guayaquil" && type === "Transferencia" && status === "Confirmada" && amount >= 100,
);

export function getMayraStep(draft) {
  if (draft.completedAt) return 4;
  if (draft.investigation.reviewed) return 3;
  if (draft.analysis.saved) return 2;
  return draft.started ? 1 : 0;
}
