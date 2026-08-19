import { getCaseCards, getCityCards, getNeedCards } from "@/lib/data";
import { isCoveredNeed } from "@/lib/needs";
import {
  SEARCH_KIND_LABEL,
  SEARCH_PAGES,
  SEARCH_SHORTCUTS,
  type SearchSuggestion,
} from "@/lib/search-kinds";

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function searchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const term = fold(query);
  if (term.length < 2) return SEARCH_SHORTCUTS;

  const [cities, cases, needs] = await Promise.all([
    getCityCards(),
    getCaseCards(),
    getNeedCards(),
  ]);
  const hits = (...fields: (string | null | undefined)[]) =>
    fields.some((field) => field && fold(field).includes(term));

  const fromPages = SEARCH_PAGES.filter((item) =>
    hits(item.title, SEARCH_KIND_LABEL[item.kind]),
  );

  const fromCities = cities
    .filter((city) => hits(city.name, city.summary))
    .slice(0, 4)
    .map((city) => ({
      href: `/ciudades/${city.slug}`,
      title: city.name,
      kind: "ciudad" as const,
    }));

  const fromCases = cases
    .filter((row) => hits(row.display_name, row.household, row.story, row.cityName))
    .slice(0, 6)
    .map((row) => ({
      href: `/ciudades/${row.citySlug}/casos/${row.id}`,
      title: row.display_name,
      kind: "caso" as const,
    }));

  const fromNeeds = needs
    .filter((row) => !isCoveredNeed(row) && hits(row.title, row.details, row.quantity, row.cityName, row.caseName))
    .slice(0, 4)
    .map((row) => ({
      href: row.case_id
        ? `/ciudades/${row.citySlug}/casos/${row.case_id}`
        : `/ciudades/${row.citySlug}`,
      title: row.title,
      kind: "necesidad" as const,
    }));

  return [...fromPages, ...fromCities, ...fromCases, ...fromNeeds].slice(0, 10);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const suggestions = await searchSuggestions(query);
  return Response.json({ suggestions });
}
