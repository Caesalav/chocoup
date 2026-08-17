import { NEED_CATEGORIES } from "./constants";
import type { CityCardData, NeedFacet } from "./types";

/**
 * Filtros del lienzo de la portada, en la URL y no en estado de cliente: así la
 * página sigue renderizándose en el servidor, funciona sin JavaScript y una vista
 * concreta ("qué techo falta en la zona") se puede compartir por WhatsApp.
 */

/** "Ámbito" no le dice nada a nadie: se pregunta a quién quiere ayudar. */
export const SCOPES = [
  { value: "todo", label: "Todo" },
  { value: "zona", label: "Pueblos" },
  { value: "personas", label: "Familias" },
] as const;

export type Scope = (typeof SCOPES)[number]["value"];

export function parseScope(value?: string): Scope {
  return SCOPES.some((scope) => scope.value === value) ? (value as Scope) : "todo";
}

export function parseCategory(value?: string): string {
  return NEED_CATEGORIES.some((category) => category.value === value) ? value! : "todas";
}

function matchesScope(need: NeedFacet, scope: Scope): boolean {
  if (scope === "zona") return need.case_id === null;
  if (scope === "personas") return need.case_id !== null;
  return true;
}

/** Solo cuentan las necesidades sin cubrir: es lo que la gente puede aportar. */
function isOpen(need: NeedFacet): boolean {
  return need.status !== "cubierta";
}

export function countNeeds(cities: CityCardData[], scope: Scope, category: string): number {
  return cities.reduce(
    (total, city) =>
      total +
      city.needs.filter(
        (need) =>
          isOpen(need) &&
          matchesScope(need, scope) &&
          (category === "todas" || need.category === category),
      ).length,
    0,
  );
}

export type CategoryOption = {
  value: string;
  label: string;
  count: number;
};

/** La lista del menú lateral: "Todas" primero y luego cada categoría con datos. */
export function categoryOptions(cities: CityCardData[], scope: Scope): CategoryOption[] {
  const all: CategoryOption = {
    value: "todas",
    label: "Todo lo que falta",
    count: countNeeds(cities, scope, "todas"),
  };

  const rest = NEED_CATEGORIES.map((category) => ({
    value: category.value as string,
    label: category.label as string,
    count: countNeeds(cities, scope, category.value),
  })).filter((option) => option.count > 0);

  return [all, ...rest];
}

/** Municipios con al menos una necesidad abierta que encaje en el filtro. */
export function filterCities(
  cities: CityCardData[],
  scope: Scope,
  category: string,
): (CityCardData & { matchingNeeds: number })[] {
  return cities
    .map((city) => ({
      ...city,
      matchingNeeds: city.needs.filter(
        (need) =>
          isOpen(need) &&
          matchesScope(need, scope) &&
          (category === "todas" || need.category === category),
      ).length,
    }))
    .filter((city) => city.matchingNeeds > 0)
    .sort((a, b) => b.matchingNeeds - a.matchingNeeds);
}

export function canvasHref(scope: Scope, category: string): string {
  const params = new URLSearchParams();
  if (scope !== "todo") params.set("ambito", scope);
  if (category !== "todas") params.set("necesidad", category);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
