import { useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import Icon from "../components/Icon";
import PageIntro from "../components/PageIntro";
import SectionTitle from "../components/SectionTitle";
import {
  AVAILABLE_CATEGORIES,
  AVAILABLE_CHALLENGES,
  CATALOG_STATUS,
  PLANNED_CHALLENGES,
  PROFESSIONAL_CATEGORIES,
} from "../data/catalog";
import {
  filterChallenges,
  hasActiveCatalogFilters,
  searchCategories,
  searchPlannedChallenges,
} from "../lib/catalog";
import CatalogFilters from "./CatalogFilters";
import CategoryCard from "./CategoryCard";
import ChallengeCard from "./ChallengeCard";
import PlannedChallengeCard from "./PlannedChallengeCard";
import UpcomingAreaRow from "./UpcomingAreaRow";

const INITIAL_FILTERS = {
  area: "all",
  difficulty: "all",
  duration: "all",
  competency: "all",
};

const QUICK_SEARCHES = ["Pensamiento crítico", "Python", "SQL"];

function CategoryDetail({ category }) {
  const status = CATALOG_STATUS[category.status];
  const plannedChallenges = PLANNED_CHALLENGES.filter((challenge) => challenge.categoryId === category.id);

  return (
    <section className={`category-detail category-detail-${category.status}`} aria-live="polite">
      <div className="category-detail-main">
        <span className="category-detail-icon"><Icon name={category.icon} size={22} /></span>
        <div>
          <div className="category-detail-heading">
            <span className="eyebrow">EXPLORANDO ÁREA</span>
            <span className={`availability status-${category.status}`}>{status.label}</span>
          </div>
          <h3>{category.name}</h3>
          <p>{category.description}</p>
        </div>
      </div>
      <div className="category-detail-meta">
        <div>
          <strong>Roles relacionados</strong>
          <span>{category.roles.join(" · ")}</span>
        </div>
        <div>
          <strong>Habilidades y competencias</strong>
          <span>{[...category.skills.slice(0, 3), ...category.competencies.slice(0, 2)].join(" · ")}</span>
        </div>
      </div>
      <div className="category-detail-availability">
        <Icon name={category.status === "available" ? "circle-check" : "info"} size={17} />
        <p>
          {category.status === "available"
            ? "Puedes iniciar los desafíos de esta área."
            : `${status.description} Por ahora no hay pruebas iniciables en esta área.`}
        </p>
        {category.status === "available" && <a className="text-button" href="#available-challenges">Ver desafíos disponibles →</a>}
      </div>
      {plannedChallenges.length > 0 && (
        <div className="category-planned-challenges">
          <strong>También en preparación</strong>
          <div className="planned-challenge-list">
            {plannedChallenges.map((challenge) => (
              <PlannedChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyResults({ query, onClear, unavailableArea = false }) {
  return (
    <div className="catalog-empty" role="status">
      <span className="catalog-empty-icon"><Icon name="search" size={22} /></span>
      <h3>
        {unavailableArea
          ? "Todavía no hay desafíos disponibles en esta área"
          : query
            ? "No hay pruebas iniciables para esta búsqueda"
            : "No hay desafíos con estos filtros"}
      </h3>
      <p>
        {unavailableArea
          ? "La categoría permanece visible para que explores sus profesiones y habilidades; no hay una prueba iniciable todavía."
          : query
            ? "Prueba con otra profesión, área, habilidad o tema. También puedes explorar las categorías."
            : "Ajusta los filtros o explora las áreas para conocer qué experiencias se están preparando."}
      </p>
      <button className="text-button" type="button" onClick={onClear}>Ver el catálogo completo</button>
    </div>
  );
}

export default function ChallengesPage({
  history,
  onStart,
  onOpenReport,
  progress = {},
  canOpenCurrentReport,
}) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [previewLocation, setPreviewLocation] = useState("categories");
  const categoryResults = useMemo(
    () => searchCategories(PROFESSIONAL_CATEGORIES, query),
    [query],
  );
  const challengeResults = useMemo(
    () => filterChallenges(AVAILABLE_CHALLENGES, filters, query),
    [filters, query],
  );
  const plannedChallengeResults = useMemo(
    () => searchPlannedChallenges(PLANNED_CHALLENGES, query, filters),
    [filters, query],
  );
  const isSearching = Boolean(query.trim());
  const hasFilters = hasActiveCatalogFilters(filters);
  const activeFilterCount = Object.values(filters).filter(value => value !== "all").length;
  const showResults = isSearching || hasFilters;
  const selectedCategory = PROFESSIONAL_CATEGORIES.find((category) => category.id === selectedCategoryId);
  const upcomingCategories = PROFESSIONAL_CATEGORIES.filter(category =>
    !AVAILABLE_CATEGORIES.some(available => available.id === category.id));
  const completed = Object.values(progress).some((item) => item.completed);

  function getProgress(challenge) {
    return progress[challenge.id] || { completed: false, inProgress: false };
  }

  function renderChallenge(challenge) {
    const itemProgress = getProgress(challenge);

    return (
      <ChallengeCard
        key={challenge.id}
        challenge={challenge}
        completed={itemProgress.completed}
        inProgress={itemProgress.inProgress}
        onStart={() => onStart(challenge.id)}
      />
    );
  }

  function selectCategory(category, location = "categories") {
    const deselect = selectedCategoryId === category.id;
    setSelectedCategoryId(deselect ? null : category.id);
    setPreviewLocation(location);
    if (AVAILABLE_CATEGORIES.some((available) => available.id === category.id)) {
      setFilters((current) => ({ ...current, area: deselect ? "all" : category.id }));
    }
  }

  function changeFilters(nextFilters) {
    setPreviewLocation("categories");
    setFilters(nextFilters);
    setSelectedCategoryId(nextFilters.area === "all" ? null : nextFilters.area);
  }

  function clearCatalog() {
    setQuery("");
    setFilters(INITIAL_FILTERS);
    setSelectedCategoryId(null);
  }

  return (
    <>
      <PageIntro
        eyebrow="WORKSIM / EXPLORADOR DE DESAFÍOS"
        title="Explora desafíos profesionales"
        description="Elige un desafío disponible para practicar cómo contrastar una propuesta de IA con evidencia."
      />

      <section className="catalog-search-panel" aria-labelledby="catalog-search-title">
        <div className="catalog-search-copy">
          <span className="eyebrow">ENCUENTRA TU PRÓXIMO RETO</span>
          <h2 id="catalog-search-title">¿Qué te gustaría explorar?</h2>
          <p>Busca una profesión, área, habilidad o tema de interés.</p>
        </div>
        <div className="catalog-search-controls">
        <label className="catalog-search-field">
          <Icon name="search" size={21} />
          <span className="sr-only">Buscar por profesión, área, habilidad o tema</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej. SQL, Python, pensamiento crítico..."
            aria-controls="available-challenges catalog-results"
          />
          {query && (
            <button type="button" aria-label="Borrar búsqueda" onClick={() => setQuery("")}>
              <Icon name="circle-x" size={17} />
            </button>
          )}
        </label>
        <button type="button" className="catalog-filter-toggle" aria-expanded={filtersOpen}
          aria-controls="catalog-filter-options" onClick={() => setFiltersOpen(open => !open)}>
          <Icon name="filter" size={17} />
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
        </div>
        {!query && (
          <div className="quick-searches" aria-label="Búsquedas sugeridas">
            <span>Explora:</span>
            {QUICK_SEARCHES.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>{suggestion}</button>
            ))}
          </div>
        )}
        <div id="catalog-filter-options" hidden={!filtersOpen}>
      <CatalogFilters
        filters={filters}
        onChange={changeFilters}
        onClear={() => {
          setFilters(INITIAL_FILTERS);
          setSelectedCategoryId(null);
        }}
        active={hasFilters}
      />
        </div>
      </section>

      {!(isSearching && !categoryResults.length && !challengeResults.length && !plannedChallengeResults.length) && (
        <section className="catalog-challenges" id="available-challenges" aria-live="polite">
          <SectionTitle aside={
            <span className="catalog-available-label"><i /> Solo experiencias iniciables</span>
          }>
            {showResults ? "Desafíos que coinciden" : "Desafíos disponibles"}
          </SectionTitle>
          {showResults ? (
            challengeResults.length > 0 ? (
              <div className="catalog-challenge-list">
                {challengeResults.map(renderChallenge)}
              </div>
            ) : isSearching && plannedChallengeResults.length > 0 ? (
              <p className="catalog-no-live-results">Los desafíos planificados que coinciden aparecen en los resultados de búsqueda; ninguno permite iniciar una prueba todavía.</p>
            ) : (
              <EmptyResults
                query={query}
                unavailableArea={filters.area !== "all"
                  && PROFESSIONAL_CATEGORIES.find((category) => category.id === filters.area)?.status !== "available"}
                onClear={clearCatalog}
              />
            )
          ) : (
            <div className="catalog-challenge-list">
              {AVAILABLE_CHALLENGES.map(renderChallenge)}
            </div>
          )}
        </section>
      )}

      {isSearching && (
        <section className="catalog-results" id="catalog-results" aria-live="polite">
          <SectionTitle aside={<span className="eyebrow">{categoryResults.length} área{categoryResults.length === 1 ? "" : "s"} relacionada{categoryResults.length === 1 ? "" : "s"}</span>}>
            Resultados de búsqueda
          </SectionTitle>
          {!categoryResults.length && !challengeResults.length && !plannedChallengeResults.length ? (
            <>
              <EmptyResults
                query={query}
                unavailableArea={filters.area !== "all"
                  && PROFESSIONAL_CATEGORIES.find((category) => category.id === filters.area)?.status !== "available"}
                onClear={clearCatalog}
              />
            </>
          ) : categoryResults.length > 0 ? (
            <div className="category-grid category-grid-results">
              {categoryResults.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  selected={selectedCategoryId === category.id}
                  onSelect={selectCategory}
                  compact
                />
              ))}
            </div>
          ) : (
            <p className="catalog-no-live-results">
              {challengeResults.length
                ? "No hay áreas relacionadas; revisa los desafíos que aparecen debajo de los filtros."
                : "No hay áreas disponibles para esta búsqueda. Estos desafíos están planificados, pero aún no se pueden iniciar."}
            </p>
          )}
          {plannedChallengeResults.length > 0 && (
            <div className="planned-search-results">
              <h3>Próximamente · no iniciables todavía</h3>
              <div className="planned-challenge-list">
                {plannedChallengeResults.map((challenge) => (
                  <PlannedChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </div>
          )}
          {selectedCategory && previewLocation === "categories" && <CategoryDetail category={selectedCategory} />}
        </section>
      )}

      {!isSearching && (
        <section className="catalog-categories" aria-labelledby="catalog-categories-title">
          <SectionTitle aside={<span className="eyebrow">{AVAILABLE_CATEGORIES.length} ÁREAS DISPONIBLES</span>}>
            <span id="catalog-categories-title">Explora por área profesional</span>
          </SectionTitle>
          <div className="category-grid">
            {AVAILABLE_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                selected={selectedCategoryId === category.id}
                onSelect={selectCategory}
              />
            ))}
          </div>
          {selectedCategory && previewLocation === "categories" && <CategoryDetail category={selectedCategory} />}
        </section>
      )}

      {!isSearching && upcomingCategories.length > 0 && (
        <section className="catalog-upcoming" aria-labelledby="catalog-upcoming-title">
          <SectionTitle aside={<span className="eyebrow">MÁS DISCIPLINAS EN CAMINO</span>}>
            <span id="catalog-upcoming-title">Áreas próximas a incorporarse</span>
          </SectionTitle>
          <p className="catalog-upcoming-intro">WORKSIM está diseñado para crecer más allá de las experiencias disponibles hoy.</p>
          <div className="upcoming-area-list">
            {upcomingCategories.map((category) => (
              <UpcomingAreaRow
                key={category.id}
                category={category}
                onSelect={(category) => selectCategory(category, "upcoming")}
              />
            ))}
          </div>
          {selectedCategory && previewLocation === "upcoming" && <CategoryDetail category={selectedCategory} />}
        </section>
      )}

      {completed && (
        <div className="learning-summary catalog-learning-summary">
          <span className="eyebrow">MI APRENDIZAJE</span>
          <strong>Primero tu criterio. Después, la IA.</strong>
          <span>{history.length} práctica{history.length === 1 ? "" : "s"} completada{history.length === 1 ? "" : "s"} · sin nota</span>
          {canOpenCurrentReport && <button type="button" onClick={onOpenReport}>Revisar el informe de esta práctica →</button>}
        </div>
      )}
    </>
  );
}
