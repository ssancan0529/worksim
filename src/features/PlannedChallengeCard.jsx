import { CATALOG_STATUS } from "../data/catalog";

export default function PlannedChallengeCard({ challenge }) {
  const status = CATALOG_STATUS[challenge.status];

  return (
    <article className="planned-challenge-card">
      <span className={`availability status-${challenge.status}`}>{status.label}</span>
      <h3>{challenge.title}</h3>
      <p>{challenge.area} · {challenge.level} · Requiere completar un desafío previo</p>
    </article>
  );
}
