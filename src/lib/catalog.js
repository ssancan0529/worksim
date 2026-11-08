function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();
}

function containsQuery(values, query) {
  const needle = normalize(query);
  if (!needle) return true;
  return values.some((value) => normalize(value).includes(needle));
}

export function searchCategories(categories, query) {
  if (!normalize(query)) return categories;
  return categories.filter((category) =>
    containsQuery(
      [
        category.name,
        category.description,
        ...category.roles,
        ...category.skills,
        ...category.competencies,
      ],
      query,
    ),
  );
}

export function searchPlannedChallenges(challenges, query, filters) {
  const needle = normalize(query);
  if (!needle) return [];

  return challenges.filter((challenge) => {
    const areaMatches = filters.area === "all" || challenge.categoryId === filters.area;
    const difficultyMatches = filters.difficulty === "all" || challenge.level === filters.difficulty;
    const hasUnknownFacetFilters = filters.duration !== "all" || filters.competency !== "all";
    const queryMatches = containsQuery(
      [challenge.title, challenge.area, challenge.level],
      query,
    );

    return areaMatches && difficultyMatches && !hasUnknownFacetFilters && queryMatches;
  });
}

export function filterChallenges(challenges, filters, query = "") {
  const selectedDuration = (duration) => {
    if (filters.duration === "short") return duration < 15;
    if (filters.duration === "medium") return duration >= 15 && duration <= 30;
    if (filters.duration === "long") return duration > 30;
    return true;
  };

  return challenges.filter((challenge) => {
    const categoryMatches = filters.area === "all" || challenge.categoryId === filters.area;
    const difficultyMatches = filters.difficulty === "all" || challenge.level === filters.difficulty;
    const durationMatches = selectedDuration(challenge.duration);
    const competencyMatches = filters.competency === "all"
      || challenge.competencyType.includes(filters.competency);
    const searchMatches = containsQuery(
      [
        challenge.title,
        challenge.description,
        challenge.profession,
        challenge.role,
        challenge.environment,
        ...challenge.keywords,
        ...challenge.competencyType,
      ],
      query,
    );

    return categoryMatches
      && difficultyMatches
      && durationMatches
      && competencyMatches
      && searchMatches;
  });
}

export function hasActiveCatalogFilters(filters) {
  return Object.values(filters).some((value) => value !== "all");
}
