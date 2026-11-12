import ActionButton from "../components/ActionButton";
import ExperienceCard from "../components/ExperienceCard";
import { AREA_BY_ID } from "../data/areas";

export default function ChallengeCard({ challenge, completed, inProgress, onStart }) {
  return (
    <ExperienceCard
      className="catalog-challenge-card"
      area={AREA_BY_ID[challenge.categoryId]?.label || "Área"}
      areaIcon={AREA_BY_ID[challenge.categoryId]?.icon || "brain"}
      title={challenge.title}
      description={challenge.description}
      difficulty={challenge.level}
      duration={`${challenge.duration} min`}
      tags={[challenge.environment, ...challenge.competencyType]}
      status={completed && <span className="experience-card-status">Completado anteriormente</span>}
      actions={
        <ActionButton onClick={onStart} icon={completed ? "reset" : "arrow-right"}>
          {completed ? "Practicar nuevamente" : inProgress ? "Continuar desafío" : "Iniciar desafío"}
        </ActionButton>
      }
    />
  );
}
