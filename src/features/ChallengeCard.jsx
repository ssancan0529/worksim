import ActionButton from "../components/ActionButton";
import { PROFESSIONAL_CATEGORIES } from "../data/catalog";

export default function ChallengeCard({ challenge, completed, inProgress, onStart }) {
  const category = PROFESSIONAL_CATEGORIES.find((item) => item.id === challenge.categoryId);

  return (
    <article className="challenge-card catalog-challenge-card">
      <p className="challenge-meta">
        {[category?.name || challenge.category, challenge.level, `${challenge.duration} min`, challenge.environment].join(" · ")}
      </p>
      <h3>{challenge.title}</h3>
      <p>{challenge.description}</p>
      <p className="challenge-skills">{challenge.competencyType.join(" · ")}</p>
      <div className="challenge-footer">
        {completed && <span className="challenge-meta">Completado anteriormente</span>}
        <ActionButton onClick={onStart} icon={completed ? "reset" : "arrow-right"}>
          {completed ? "Practicar nuevamente" : inProgress ? "Continuar desafío" : "Iniciar desafío"}
        </ActionButton>
      </div>
    </article>
  );
}
