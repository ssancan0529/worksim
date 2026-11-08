import { CATALOG_STATUS } from "../data/catalog";
import Icon from "../components/Icon";

export default function CategoryCard({ category, selected = false, onSelect, compact = false }) {
  const status = CATALOG_STATUS[category.status];

  return (
    <button
      type="button"
      className={`category-card category-${category.id}${selected ? " selected" : ""}${compact ? " compact" : ""}`}
      onClick={() => onSelect(category)}
      aria-pressed={selected}
      aria-label={`Explorar ${category.name}. Estado: ${status.label}`}
    >
      <span className="category-card-top">
        <span className="category-icon"><Icon name={category.icon} size={20} /></span>
        <span className={`availability status-${category.status}`}>{status.label}</span>
      </span>
      <strong>{category.name}</strong>
      {!compact && <span className="category-description">{category.description}</span>}
      <span className="category-card-link">
        {category.status === "available" ? "Ver desafío disponible" : "Explorar área"}
        <Icon name="arrow-right" size={14} />
      </span>
    </button>
  );
}
