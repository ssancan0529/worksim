import ActionButton from "../components/ActionButton";
import Icon from "../components/Icon";
import { PROFESSIONAL_CATEGORIES } from "../data/catalog";

export default function ChallengeCard({ challenge, completed, inProgress, onStart }) {
  const category = PROFESSIONAL_CATEGORIES.find((item) => item.id === challenge.categoryId);

  return (
    <article className="challenge-card catalog-challenge-card">
      <div className="tag-row">
        <span className="tag">{category?.name || challenge.category}</span>
        <span className="tag">{challenge.level}</span>
        <span className="tag">{challenge.duration} min</span>
        <span className="tag">{challenge.environment}</span>
        {completed && <span className="tag">Completado anteriormente</span>}
      </div>
      <span className="availability status-available">Disponible</span>
      <p className="challenge-profession">{challenge.profession} · {challenge.ticket}</p>
      <h3>{challenge.title}</h3>
      <p>{challenge.description}</p>
      <div className="challenge-skills">
        {challenge.competencyType.map((competency) => (
          <span className="tag" key={competency}>{competency}</span>
        ))}
      </div>
      <div className="challenge-footer">
        <span className="workspace-id">
          <Icon name={challenge.categoryId === "general" ? "file" : "code"} size={16} />
          {challenge.categoryId === "general" ? "Documentos de reunión" : `workspace_id: ${challenge.workspaceId}`}
        </span>
        <ActionButton onClick={onStart} icon={completed ? "reset" : "arrow-right"}>
          {completed ? "Practicar nuevamente" : inProgress ? "Continuar desafío" : "Iniciar desafío"}
        </ActionButton>
      </div>
    </article>
  );
}
