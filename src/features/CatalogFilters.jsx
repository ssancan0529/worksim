import { COMPETENCY_TYPES, DIFFICULTIES, PROFESSIONAL_CATEGORIES } from "../data/catalog";
import Icon from "../components/Icon";

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="catalog-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

export default function CatalogFilters({ filters, onChange, onClear, active }) {
  const update = (key) => (value) => onChange({ ...filters, [key]: value });

  return (
    <section className="catalog-filter-panel" aria-label="Filtros de desafíos">
      <div className="catalog-filter-heading">
        <span><Icon name="filter" size={17} /> Refina los desafíos</span>
        {active && <button className="text-button" type="button" onClick={onClear}>Limpiar filtros</button>}
      </div>
      <div className="catalog-filters">
        <FilterSelect label="Área" value={filters.area} onChange={update("area")}>
          <option value="all">Todas las áreas</option>
          {PROFESSIONAL_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Dificultad" value={filters.difficulty} onChange={update("difficulty")}>
          <option value="all">Cualquier nivel</option>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>{difficulty}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Duración" value={filters.duration} onChange={update("duration")}>
          <option value="all">Cualquier duración</option>
          <option value="short">Menos de 15 min</option>
          <option value="medium">15–30 min</option>
          <option value="long">Más de 30 min</option>
        </FilterSelect>
        <FilterSelect label="Competencia" value={filters.competency} onChange={update("competency")}>
          <option value="all">Cualquier competencia</option>
          {COMPETENCY_TYPES.map((competency) => (
            <option key={competency} value={competency}>{competency}</option>
          ))}
        </FilterSelect>
      </div>
    </section>
  );
}
