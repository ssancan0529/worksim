import { MAYRA_CHALLENGE } from "./mayra.js";
import { PRACTICE_CHALLENGE } from "../practica/cases.mjs";
import { AREAS } from "./areas.js";
import {
  CHALLENGE,
  GENERAL_CHALLENGE,
  UPCOMING_CHALLENGES,
} from "./scenario.js";

export const PROFESSIONAL_CATEGORIES = AREAS;

export const AVAILABLE_CHALLENGES = [
  PRACTICE_CHALLENGE,
  MAYRA_CHALLENGE,
  {
    ...GENERAL_CHALLENGE,
    categoryId: "communication",
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
  area: "Software",
  categoryId: "software",
  status: "upcoming",
}));

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
