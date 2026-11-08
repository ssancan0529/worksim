export const STORAGE_KEY = "worksim-react-prototype-v2";

export const STEPS = [
  { id: 0, path: "desafios", label: "Desafíos" },
  { id: 1, path: "briefing", label: "Briefing" },
  { id: 2, path: "analisis-inicial", label: "Análisis inicial" },
  { id: 3, path: "investigacion-ia", label: "Investigación IA" },
  { id: 4, path: "pruebas-decision", label: "Pruebas y decisión" },
  { id: 5, path: "informe", label: "Informe" },
];

export const GENERAL_STEPS = [
  STEPS[0],
  { id: 1, path: "briefing", label: "Briefing" },
  { id: 2, path: "analisis-inicial", label: "Análisis" },
  { id: 3, path: "investigacion-ia", label: "Investigación IA" },
  { id: 4, path: "verificacion", label: "Verificación" },
  { id: 5, path: "decision", label: "Decisión" },
  { id: 6, path: "informe", label: "Informe" },
];

export const CHALLENGE = {
  id: "eng-842",
  ticket: "ENG-842",
  title: "Un problema en producción",
  company: "Adopta+",
  role: "Backend Jr",
  description:
    "El equipo reporta que algunos registros importantes no aparecen en el listado de resultados. Debes investigar el comportamiento del endpoint antes de aprobar el cambio.",
  workspaceId: "sim-backend-01",
  duration: 20,
  level: "Intermedio",
  environment: "Python / SQLAlchemy",
};

export const GENERAL_CHALLENGE = {
  id: "general-meeting-summary",
  ticket: "DEMO-001",
  title: "El informe que no coincide",
  company: "Equipo de proyecto",
  role: "Integrante de equipo",
  profession: "Pensamiento crítico",
  description:
    "Revisa un resumen de reunión generado por IA antes de compartirlo y contrasta sus afirmaciones con las notas originales.",
  workspaceId: "sim-general-01",
  duration: 15,
  level: "Principiante",
  environment: "Resumen de reunión",
  category: "General / Pensamiento crítico",
};

export const GENERAL_MEETING_NOTES = [
  "Mateo: «Puedo compartir un primer borrador del presupuesto a más tardar el miércoles». El equipo confirma que ese plazo funciona.",
  "Alicia: «Antes de confirmar el piloto, tenemos que validar que el flujo funcione desde el teléfono. Hoy no tenemos fecha de inicio acordada».",
  "Paula: «El martes confirmaré si el equipo legal tiene disponibilidad para revisar el material». No se le asigna coordinar el piloto ni comunicar un lanzamiento.",
  "Rosa: «Me preocupa la capacidad de soporte durante la primera semana; deberíamos revisar la cobertura antes de fijar la fecha».",
  "Acuerdo final: retomar la fecha del piloto después de validar el acceso móvil y la cobertura de soporte.",
];

export const GENERAL_AI_SUMMARY = [
  "Mateo preparará un primer borrador del presupuesto para el miércoles.",
  "El equipo acordó iniciar el piloto el 18 de septiembre.",
  "Paula coordinará el inicio del piloto y lo comunicará a todas las áreas.",
  "No se identificaron riesgos ni puntos pendientes para el piloto.",
];

export const GENERAL_CLAIMS = [
  {
    id: "budget",
    text: GENERAL_AI_SUMMARY[0],
    expected: "supported",
    explanation: "Mateo ofreció compartir un primer borrador a más tardar el miércoles y el equipo confirmó el plazo.",
    source: GENERAL_MEETING_NOTES[0],
  },
  {
    id: "pilot-date",
    text: GENERAL_AI_SUMMARY[1],
    expected: "unsupported",
    explanation: "Las notas indican que no hay fecha acordada y que se retomará después de validar dos condiciones.",
    source: `${GENERAL_MEETING_NOTES[1]} ${GENERAL_MEETING_NOTES[4]}`,
  },
  {
    id: "paula-commitment",
    text: GENERAL_AI_SUMMARY[2],
    expected: "unsupported",
    explanation: "Paula solo se comprometió a confirmar la disponibilidad del equipo legal; no aceptó coordinar ni anunciar el piloto.",
    source: GENERAL_MEETING_NOTES[2],
  },
  {
    id: "risks",
    text: GENERAL_AI_SUMMARY[3],
    expected: "contradicted",
    explanation: "Rosa sí señaló un riesgo de capacidad de soporte. Además, el resumen omite validar el acceso móvil antes de fijar la fecha.",
    source: `${GENERAL_MEETING_NOTES[1]} ${GENERAL_MEETING_NOTES[3]}`,
  },
];

export const REQUIREMENTS = [
  "Solo animales con is_adopted = False deben ser retornados.",
  "La prioridad por urgency_level DESC se aplica a toda la colección filtrada.",
  "Los parámetros opcionales species y city pueden acumularse conjuntamente.",
  "La paginación con limit y offset se aplica después del ordenamiento global.",
];

export const SCHEMA = [
  ["id", "UUID / INT", "PRIMARY KEY"],
  ["species", "VARCHAR(40)", "INDEXED"],
  ["city", "VARCHAR(60)", "INDEXED"],
  ["urgency_level", "INT (1..5)", "INDEXED (DESC)"],
  ["is_adopted", "BOOLEAN", "DEFAULT FALSE"],
];

export const HYPOTHESES = [
  {
    id: "pagination-order",
    text: "El ordenamiento por urgencia se aplica solo sobre el subconjunto paginado.",
  },
  {
    id: "city-filter",
    text: "Al enviar especie y ciudad juntas, la ciudad podría ser ignorada.",
  },
  {
    id: "invalid-pagination",
    text: "Valores no numéricos de page o limit podrían generar excepciones.",
  },
];

export const ORIGINAL_CODE = `def list_pets(species=None, city=None, limit=10, offset=0):
    query = db.query(Pet).filter(Pet.is_adopted == False)
    if species:
        query = query.filter(Pet.species == species)

    # La paginación ocurre antes de ordenar los resultados
    pets = query.offset(offset).limit(limit).all()
    return sorted(pets, key=lambda pet: pet.urgency_level, reverse=True)`;

export const UPCOMING_CHALLENGES = [
  {
    id: "payments",
    area: "Backend",
    level: "Avanzado",
    title: "Inconsistencia transaccional en pasarela de pagos",
  },
  {
    id: "memory",
    area: "Backend",
    level: "Intermedio",
    title: "Fuga de memoria en pipeline asíncrono de procesamiento",
  },
  {
    id: "race-condition",
    area: "Sistemas",
    level: "Avanzado",
    title: "Condición de carrera en sincronización de inventario distribuido",
  },
];

export const createInitialDraft = () => ({
  kind: "technical",
  started: false,
  briefingRead: false,
  analysis: { approach: "", risks: "", checks: "", saved: false },
  investigation: { notes: "", hypotheses: [false, false, false], reviewed: false },
  testing: {
    code: ORIGINAL_CODE,
    ran: false,
    results: [],
    verdict: "",
    rationale: "",
    runs: [],
  },
  reflection: { blindSpot: "", evidence: "", realWorld: "" },
  completedAt: null,
});

export const createInitialGeneralDraft = () => {
  const draft = createInitialDraft();
  return {
    ...draft,
    kind: "general",
    testing: {
      ...draft.testing,
      code: "",
      observations: GENERAL_CLAIMS.map(({ id }) => ({ claimId: id, classification: "", evidence: "" })),
      omission: "",
    },
  };
};
