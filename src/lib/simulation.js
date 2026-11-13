import { HYPOTHESES } from "../data/scenario.js";

const tests = [
  {
    id: "adoption",
    name: "Excluir mascotas adoptadas",
    detail: "La consulta debe limitarse a mascotas que aún están disponibles.",
    check: (code) => /is_adopted\s*==\s*(?:False|false|0)\b/.test(code),
  },
  {
    id: "species",
    name: "Aplicar el filtro por especie",
    detail: "La especie solicitada debe formar parte de los filtros de consulta.",
    check: (code) => /filter\s*\(\s*Pet\.species\s*==\s*species\s*\)/i.test(code),
  },
  {
    id: "city",
    name: "Combinar filtros de especie y ciudad",
    detail: "El filtro de ciudad debe aplicarse cuando se envía junto con especie.",
    check: (code) => /filter\s*\(\s*Pet\.city\s*==\s*city\s*\)/i.test(code),
  },
  {
    id: "ordering",
    name: "Ordenar antes de paginar",
    detail: "La prioridad global debe definirse antes de aplicar offset y limit.",
    check: (code) => {
      const sortPositions = [code.indexOf(".order_by("), code.indexOf("sorted(")]
        .filter((position) => position >= 0);
      const pagePositions = [code.indexOf(".offset("), code.indexOf(".limit(")]
        .filter((position) => position >= 0);
      return sortPositions.length > 0
        && pagePositions.length > 0
        && Math.min(...sortPositions) < Math.min(...pagePositions);
    },
  },
  {
    id: "pagination-validation",
    name: "Validar los parámetros de paginación",
    detail: "limit y offset deben validarse para rechazar valores no numéricos o negativos.",
    check: (code) => /isinstance\s*\(\s*(?:limit|offset)\s*,\s*int\s*\)|(?:limit|offset)\s*<\s*0|(?:limit|offset)\s*=\s*int\(/i.test(code),
  },
  {
    id: "stable-order",
    name: "Mantener un orden determinista",
    detail: "Los empates de urgencia necesitan un criterio secundario estable, como el ID.",
    check: (code) => /order_by\([\s\S]{0,180}(?:Pet\.id|\.id\.asc\(\))/i.test(code),
  },
];

export function simulateTests(code) {
  const source = typeof code === "string" ? code : "";
  return tests.map(({ id, name, detail, check }) => {
    const passed = check(source);
    return {
      id,
      name,
      detail: passed
        ? `${detail} La revisión estática encontró una señal compatible.`
        : `${detail} No se encontró una señal compatible en el código.`,
      passed,
    };
  });
}

export function getUnlockedStep(draft) {
  if (draft.kind === "general") {
    if (draft.completedAt) return 6;
    if (draft.testing.ran && draft.testing.verdict && draft.testing.rationale.trim()) return 6;
    if (draft.testing.ran) return 5;
    if (draft.investigation.reviewed) return 4;
    if (draft.analysis.saved) return 3;
    if (draft.briefingRead) return 2;
    if (draft.started) return 1;
    return 0;
  }
  if (draft.completedAt) return 5;
  if (draft.testing.ran && draft.testing.verdict && draft.testing.rationale.trim()) return 5;
  if (draft.investigation.reviewed) return 4;
  if (draft.analysis.saved) return 3;
  if (draft.briefingRead) return 2;
  if (draft.started) return 1;
  return 0;
}

export function getReportFeedback(draft) {
  const results = draft.testing.results;
  const passed = results.filter((result) => result.passed);
  const failed = results.filter((result) => !result.passed);
  const selectedHypotheses = HYPOTHESES.filter(
    (_, index) => draft.investigation.hypotheses[index],
  );
  const recommendations = [];

  if (failed.length) {
    recommendations.push(
      `Contrasta ${failed.map((test) => test.name.toLowerCase()).join(" y ")} con el requisito correspondiente antes de aprobar.`,
    );
  } else if (results.length) {
    recommendations.push("La revisión registrada cumple los criterios comprobados. Valida más casos antes de desplegar.");
  } else {
    recommendations.push("Ejecuta tu código y registra evidencia antes de cerrar tu dictamen.");
  }

  if (selectedHypotheses.length) {
    recommendations.push(`Marcaste ${selectedHypotheses.length} hipótesis para investigar; compáralas con los resultados y anota qué evidencia las confirmó o descartó.`);
  } else {
    recommendations.push("Registra al menos una hipótesis para hacer visible qué querías comprobar.");
  }

  if (!draft.testing.rationale.trim()) {
    recommendations.push("Tu dictamen aún necesita una justificación que cite resultados concretos.");
  }

  return { passed, failed, recommendations, selectedHypotheses };
}

export function verdictLabel(value) {
  return {
    approve: "Aprobar sin cambios",
    refactor: "Refactorizar y validar",
    reject: "Descartar la solución",
    clarify: "Solicitar aclaración",
    accept: "Aceptar el resumen",
    modify: "Modificar antes de compartir",
    reject_summary: "Rechazar y solicitar cambios",
  }[value] || "Sin dictamen";
}
