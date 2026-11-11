export default function CriterionStatus({ passed }) {
  return <span className={`criterion-status ${passed ? "meets" : "review"}`}>{passed ? "Cumple" : "Por revisar"}</span>;
}
