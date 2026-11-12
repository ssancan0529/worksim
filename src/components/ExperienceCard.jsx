import Icon from "./Icon";

export default function ExperienceCard({
  area,
  areaIcon,
  title,
  description,
  difficulty,
  duration,
  tags = [],
  status,
  visual,
  actions,
  className = "",
}) {
  return (
    <article className={`experience-card ${className}`.trim()}>
      {visual}
      <div className="experience-card-body">
        <div className="experience-card-heading">
          <span className="experience-card-area"><Icon name={areaIcon} size={15} />{area}</span>
          {status}
        </div>
        <h3>{title}</h3>
        <p className="experience-card-description">{description}</p>
        <div className="experience-card-meta">
          <span><strong>Dificultad</strong>{difficulty}</span>
          <span><strong>Duración</strong>{duration}</span>
        </div>
        {tags.length > 0 && (
          <div className="experience-card-tags" aria-label="Competencias o tecnologías">
            {tags.map((tag, index) => <span key={`${tag}-${index}`}>{tag}</span>)}
          </div>
        )}
        {actions && <div className="experience-card-actions">{actions}</div>}
      </div>
    </article>
  );
}
