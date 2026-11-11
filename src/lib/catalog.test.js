import assert from "node:assert/strict";
import test from "node:test";
import {
  AVAILABLE_CATEGORIES,
  AVAILABLE_CHALLENGES,
  COMPETENCY_TYPES,
  DIFFICULTIES,
  PLANNED_CHALLENGES,
  PROFESSIONAL_CATEGORIES,
} from "../data/catalog.js";
import {
  filterChallenges,
  hasActiveCatalogFilters,
  searchCategories,
  searchPlannedChallenges,
} from "./catalog.js";

const noFilters = {
  area: "all",
  difficulty: "all",
  duration: "all",
  competency: "all",
};

test("category search matches roles, skills and accents", () => {
  const results = searchCategories(PROFESSIONAL_CATEGORIES, "inteligencia artificial");

  assert.deepEqual(results.map((category) => category.id), ["data-ai"]);
});

test("challenge search finds available experience by skill or profession", () => {
  assert.deepEqual(filterChallenges(AVAILABLE_CHALLENGES, noFilters, "Python").map(({ id }) => id),
    ["practica-sql-python", "eng-842"]);
  assert.deepEqual(filterChallenges(AVAILABLE_CHALLENGES, { ...noFilters, difficulty: "Básico" }, "junior")
    .map(({ id }) => id), ["practica-sql-python"]);
  assert.equal(filterChallenges(AVAILABLE_CHALLENGES, noFilters, "backend junior").length, 1);
  assert.equal(filterChallenges(AVAILABLE_CHALLENGES, noFilters, "diseño UX").length, 0);
});

test("the introductory challenge is available to critical-thinking beginners", () => {
  const filters = {
    area: "general",
    difficulty: "Principiante",
    duration: "medium",
    competency: "Pensamiento crítico",
  };

  assert.deepEqual(
    filterChallenges(AVAILABLE_CHALLENGES, filters).map((challenge) => challenge.id),
    ["general-meeting-summary"],
  );
});

test("planned challenges are searchable but stay hidden when unknown facets are filtered", () => {
  assert.equal(searchPlannedChallenges(PLANNED_CHALLENGES, "transaccional", noFilters).length, 1);
  assert.equal(
    searchPlannedChallenges(PLANNED_CHALLENGES, "transaccional", { ...noFilters, duration: "medium" }).length,
    0,
  );
});

test("challenge facets combine area, difficulty, duration and competence", () => {
  const matchingFilters = {
    area: "software",
    difficulty: "Intermedio",
    duration: "medium",
    competency: "Validación técnica",
  };
  const nonMatchingFilters = { ...matchingFilters, duration: "long" };

  assert.equal(filterChallenges(AVAILABLE_CHALLENGES, matchingFilters).length, 1);
  assert.equal(filterChallenges(AVAILABLE_CHALLENGES, nonMatchingFilters).length, 0);
  assert.equal(hasActiveCatalogFilters(matchingFilters), true);
  assert.equal(hasActiveCatalogFilters(noFilters), false);
});


test("catalog filter options only include areas, levels and competencies with available challenges", () => {
  assert.deepEqual(
    AVAILABLE_CATEGORIES.map((category) => category.id).sort(),
    [...new Set(AVAILABLE_CHALLENGES.map((challenge) => challenge.categoryId))].sort(),
  );
  for (const competency of COMPETENCY_TYPES) {
    assert.ok(filterChallenges(AVAILABLE_CHALLENGES, { ...noFilters, competency }).length > 0);
  }
  for (const difficulty of DIFFICULTIES) {
    assert.ok(filterChallenges(AVAILABLE_CHALLENGES, { ...noFilters, difficulty }).length > 0);
  }
});
