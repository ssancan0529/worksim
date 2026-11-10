import { CATALOG_STATUS } from "../data/catalog";
import Icon from "../components/Icon";

export default function UpcomingAreaRow({ category, onSelect }) {
  const status = CATALOG_STATUS[category.status];

  return (
    <button
      type="button"
      className={`upcoming-area-row category-${category.id}`}
      onClick={() => onSelect(category)}
      aria-label={`Explorar ${category.name}. Estado: ${status.label}`}
    >
      <span className="upcoming-area-icon"><Icon name={category.icon} size={24} /></span>
      <span className="upcoming-area-copy">
        <strong>{category.name}</strong>
        <small>{category.description}</small>
      </span>
      <span className={`availability status-${category.status}`}>{status.label}</span>
      <Icon name="arrow-right" size={18} />
    </button>
  );
}
