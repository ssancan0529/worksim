import { AVAILABLE_CATEGORIES, AVAILABLE_CHALLENGES, COMPETENCY_TYPES, DIFFICULTIES } from "../data/catalog";
import { filterChallenges } from "../lib/catalog";
import Icon from "../components/Icon";

const DURATION_OPTIONS = [
  { value: "short", label: "Menos de 15 min" },
  { value: "medium", label: "15–30 min" },
  { value: "long", label: "Más de 30 min" },
].filter(({ value }) => filterChallenges(AVAILABLE_CHALLENGES, {
  area: "all", difficulty: "all", duration: value, competency: "all",
}).length > 0);

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

  const advancedCount = [filters.difficulty, filters.duration, filters.competency].filter((value) => value !== "all").length;

  return (
    <section className="catalog-filter-panel" aria-label="Filtros de desafíos">
      <div className="catalog-filter-heading">
        <span><Icon name="filter" size={17} /> Refina los desafíos</span>
        {active && <button className="text-button" type="button" onClick={onClear}>Limpiar filtros</button>}
      </div>
      <div className="catalog-filter-primary">
        <FilterSelect label="Área" value={filters.area} onChange={update("area")}>
          <option value="all">Todas las áreas</option>
          {AVAILABLE_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </FilterSelect>
      </div>
      <details className="catalog-more-filters">
        <summary>Más filtros{advancedCount > 0 ? ` (${advancedCount} activos)` : ""}</summary>
        <div className="catalog-filters">
          <FilterSelect label="Dificultad" value={filters.difficulty} onChange={update("difficulty")}>
            <option value="all">Cualquier nivel</option>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Duración" value={filters.duration} onChange={update("duration")}>
            <option value="all">Cualquier duración</option>
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Competencia" value={filters.competency} onChange={update("competency")}>
            <option value="all">Cualquier competencia</option>
            {COMPETENCY_TYPES.map((competency) => (
              <option key={competency} value={competency}>{competency}</option>
            ))}
          </FilterSelect>
        </div>
      </details>
    </section>
  );
}
