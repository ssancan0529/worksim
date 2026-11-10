import { MAYRA_CHALLENGE } from "./mayra.js";
import {
  CHALLENGE,
  GENERAL_CHALLENGE,
  UPCOMING_CHALLENGES,
} from "./scenario.js";

export const PROFESSIONAL_CATEGORIES = [
  {
    id: "general",
    name: "General / Pensamiento crítico",
    icon: "lightbulb",
    status: "available",
    description: "Evalúa información generada por IA, contrasta fuentes y comunica decisiones con evidencia.",
    roles: ["Colaboración en equipo", "Revisión de información", "Toma de decisiones"],
    skills: ["Lectura crítica", "Verificación de fuentes", "Síntesis", "Comunicación"],
    competencies: ["Pensamiento crítico", "Comunicación", "Criterio profesional"],
  },
  {
    id: "software",
    name: "Desarrollo de software",
    icon: "code",
    status: "available",
    description: "Construcción, revisión y validación de soluciones digitales.",
    roles: ["Desarrollo backend", "Desarrollo frontend", "QA y testing"],
    skills: ["Python", "APIs", "bases de datos", "depuración"],
    competencies: ["Validación técnica", "Análisis crítico", "Resolución de problemas"],
  },
  {
    id: "design",
    name: "Diseño y creatividad",
    icon: "palette",
    status: "upcoming",
    description: "Retos de diseño visual, experiencia de usuario y creación de contenidos.",
    roles: ["Diseño UX/UI", "Diseño gráfico", "Creación de contenido"],
    skills: ["Prototipado", "composición visual", "accesibilidad", "ideación"],
    competencies: ["Creatividad", "Diseño centrado en las personas", "Comunicación visual"],
  },
  {
    id: "data-ai",
    name: "Datos e inteligencia artificial",
    icon: "brain",
    status: "available",
    description: "Exploración de datos, interpretación de resultados y evaluación de sistemas de IA.",
    roles: ["Análisis de datos", "Ciencia de datos", "Evaluación de IA"],
    skills: ["SQL", "estadística", "calidad de datos", "modelos de IA"],
    competencies: ["Análisis de datos", "Pensamiento crítico", "Alfabetización en IA"],
  },
  {
    id: "business",
    name: "Negocios y administración",
    icon: "briefcase",
    status: "upcoming",
    description: "Decisiones de negocio, operaciones y análisis de procesos organizacionales.",
    roles: ["Administración", "Operaciones", "Gestión de proyectos"],
    skills: ["Planificación", "presupuestos", "priorización", "procesos"],
    competencies: ["Toma de decisiones", "Organización", "Resolución de problemas"],
  },
  {
    id: "communication",
    name: "Comunicación y habilidades interpersonales",
    icon: "messages",
    status: "development",
    description: "Prácticas para comunicar ideas, colaborar y responder a situaciones profesionales.",
    roles: ["Comunicación", "Atención a clientes", "Colaboración en equipos"],
    skills: ["Escucha activa", "redacción", "negociación", "retroalimentación"],
    competencies: ["Comunicación", "Colaboración", "Criterio profesional"],
  },
  {
    id: "science",
    name: "Ciencias e ingeniería",
    icon: "atom",
    status: "upcoming",
    description: "Casos de análisis, investigación y toma de decisiones en contextos científico-técnicos.",
    roles: ["Ingeniería", "Investigación", "Laboratorio"],
    skills: ["Experimentación", "seguridad", "análisis de sistemas", "documentación"],
    competencies: ["Pensamiento sistémico", "Rigor científico", "Análisis de riesgos"],
  },
];

export const AVAILABLE_CHALLENGES = [
  MAYRA_CHALLENGE,
  {
    ...GENERAL_CHALLENGE,
    categoryId: "general",
    competencyType: ["Pensamiento crítico", "Comunicación", "Criterio profesional"],
    keywords: [
      "reunión",
      "resumen",
      "notas",
      "acuerdos",
      "compromisos",
      "fechas",
      "presupuesto",
      "piloto",
      "riesgos",
      "pendientes",
      "inteligencia artificial",
      "IA",
      "evidencia",
    ],
    status: "available",
  },
  {
    ...CHALLENGE,
    categoryId: "software",
    profession: "Desarrollador backend junior",
    competencyType: ["Validación técnica", "Análisis crítico", "Resolución de problemas"],
    keywords: ["endpoint", "API", "mascotas", "filtros", "paginación", "Python", "SQLAlchemy"],
    status: "available",
  },
];

export const PLANNED_CHALLENGES = UPCOMING_CHALLENGES.map((challenge) => ({
  ...challenge,
  categoryId: challenge.area === "Sistemas" ? "science" : "software",
  status: "upcoming",
}));

export const FEATURED_UPCOMING_CATEGORY_IDS = ["design", "communication"];

export const CATALOG_STATUS = {
  available: { label: "Disponible", description: "Ya puedes iniciar un desafío en esta área." },
  upcoming: { label: "Próximamente", description: "Esta área está planificada para una próxima etapa." },
  development: { label: "En desarrollo", description: "Estamos preparando experiencias para esta área." },
};

export const AVAILABLE_CATEGORIES = PROFESSIONAL_CATEGORIES.filter((category) =>
  AVAILABLE_CHALLENGES.some((challenge) => challenge.categoryId === category.id),
);

export const DIFFICULTIES = ["Principiante", "Básico", "Intermedio", "Avanzado"].filter((level) =>
  AVAILABLE_CHALLENGES.some((challenge) => challenge.level === level),
);
export const COMPETENCY_TYPES = [
  ...new Set(AVAILABLE_CHALLENGES.flatMap((challenge) => challenge.competencyType)),
].sort((first, second) => first.localeCompare(second, "es"));
