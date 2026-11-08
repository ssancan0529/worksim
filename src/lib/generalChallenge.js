import { GENERAL_CLAIMS } from "../data/scenario.js";

export const GENERAL_CLASSIFICATIONS = [
  { value: "supported", label: "Respaldada por las notas" },
  { value: "incomplete", label: "Le falta contexto importante" },
  { value: "unsupported", label: "No aparece en las notas" },
  { value: "contradicted", label: "Contradice las notas" },
];

export function classificationLabel(value) {
  return GENERAL_CLASSIFICATIONS.find((item) => item.value === value)?.label || "Sin clasificar";
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

export function evaluateGeneralReview(testing) {
  const observations = new Map(
    (testing.observations || []).map((item) => [item.claimId, item]),
  );
  const results = GENERAL_CLAIMS.map((claim) => {
    const observation = observations.get(claim.id) || {};
    return {
      id: claim.id,
      name: claim.text,
      passed: observation.classification === claim.expected,
      expected: claim.expected,
      observed: observation.classification || "",
      evidence: observation.evidence || "",
      source: claim.source,
      explanation: claim.explanation,
    };
  });

  const omission = normalize(testing.omission);
  const identifiesMobileCheck = ["movil", "telefono", "celular"].some((word) => omission.includes(word));
  const identifiesSupportRisk = ["soporte", "cobertura", "capacidad"].some((word) => omission.includes(word));
  results.push({
    id: "omission",
    name: "Información relevante omitida",
    passed: identifiesMobileCheck && identifiesSupportRisk,
    expected: "Identificar la validación de acceso móvil y la revisión de capacidad de soporte.",
    observed: testing.omission || "",
    evidence: testing.omission || "",
    source: "Validar el acceso desde el teléfono antes de confirmar el piloto y revisar la cobertura de soporte.",
    explanation: "El resumen no incluye las dos condiciones que el equipo acordó revisar antes de fijar la fecha.",
  });

  const passed = results.filter((item) => item.passed);
  const recommendations = passed.length === results.length
    ? ["Contrastaste todas las afirmaciones y reconociste las condiciones omitidas; conserva esas fuentes en la versión que compartas."]
    : ["Revisa las afirmaciones que no coinciden con la evidencia y comprueba quién aceptó cada compromiso, qué fecha se acordó y qué condiciones quedaron pendientes."];

  if (testing.verdict === "accept" && passed.length < results.length) {
    recommendations.push("Antes de enviar el resumen sin cambios, corrige las afirmaciones no respaldadas y agrega las condiciones pendientes.");
  } else if (testing.verdict === "modify") {
    recommendations.push("Al modificar el resumen, conserva los acuerdos confirmados y atribuye cada acción a quien realmente la aceptó.");
  } else if (testing.verdict === "reject_summary") {
    recommendations.push("Si solicitas una nueva versión, explica qué fuentes y compromisos debe verificar el sistema.");
  }

  return {
    results,
    passed,
    failed: results.filter((item) => !item.passed),
    recommendations,
  };
}
