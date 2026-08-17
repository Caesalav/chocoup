import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import {
  demoCasePage,
  demoCityCards,
  demoCityPage,
  demoOfferTarget,
} from "./demo-data";
import type {
  Case,
  CasePage,
  CityCardData,
  CityPage,
  City,
  Foundation,
  Need,
  OfferTarget,
  Photo,
} from "./types";

/**
 * Las consultas públicas no filtran por `published`: eso lo hacen las RLS.
 * Así una consulta olvidada no puede filtrar un caso sin consentimiento.
 *
 * `includeDrafts` solo tiene efecto con datos de muestra, donde no hay RLS que
 * distinga quién pregunta. El panel lo activa; el portal público, no.
 */

type Options = { includeDrafts?: boolean };

type NestedCityRow = City & {
  needs: Pick<Need, "id" | "category" | "status" | "case_id">[];
  cases: Pick<Case, "id">[];
  photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order" | "case_id">[];
};

/** Las portadas se muestran pequeñas: siempre la miniatura si existe. */
function coverOf(photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order">[]) {
  const first = [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  if (!first) return null;
  return first.thumb_path || first.storage_path;
}

export async function getCityCards(): Promise<CityCardData[]> {
  if (isDemoMode()) return demoCityCards();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cities")
    .select(
      "*, needs(id, category, status, case_id), cases(id), photos(storage_path, thumb_path, sort_order, case_id)",
    )
    .order("name");

  if (error || !data) return [];

  return (data as NestedCityRow[]).map((city) => ({
    ...city,
    coverPath: coverOf(city.photos.filter((photo) => photo.case_id === null)),
    openNeeds: city.needs.filter((need) => need.status !== "cubierta").length,
    caseCount: city.cases.length,
    needs: city.needs.map((need) => ({
      category: need.category,
      status: need.status,
      case_id: need.case_id,
    })),
  }));
}

export async function getCityPage(slug: string, options: Options = {}): Promise<CityPage | null> {
  if (isDemoMode()) return demoCityPage(slug, options.includeDrafts ?? false);
  const supabase = await createSupabaseServerClient();

  const { data: city } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<City>();

  if (!city) return null;

  const [foundations, photos, needs, cases] = await Promise.all([
    supabase
      .from("foundations")
      .select("*")
      .eq("city_id", city.id)
      .order("is_primary", { ascending: false })
      .order("created_at"),
    supabase
      .from("photos")
      .select("*")
      .eq("city_id", city.id)
      .is("case_id", null)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("needs")
      .select("*")
      .eq("city_id", city.id)
      .order("urgent", { ascending: false })
      .order("created_at"),
    supabase
      .from("cases")
      .select("*, photos(storage_path, thumb_path, sort_order), needs(id, status)")
      .eq("city_id", city.id)
      .order("created_at", { ascending: false }),
  ]);

  const allNeeds = (needs.data ?? []) as Need[];

  type NestedCaseRow = Case & {
    photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order">[];
    needs: Pick<Need, "id" | "status">[];
  };

  return {
    city,
    foundations: (foundations.data ?? []) as Foundation[],
    photos: (photos.data ?? []) as Photo[],
    zoneNeeds: allNeeds.filter((need) => need.case_id === null),
    cases: ((cases.data ?? []) as NestedCaseRow[]).map((row) => ({
      ...row,
      coverPath: coverOf(row.photos),
      openNeeds: row.needs.filter((need) => need.status !== "cubierta").length,
    })),
  };
}

export async function getCasePage(
  slug: string,
  caseId: string,
  options: Options = {},
): Promise<CasePage | null> {
  if (isDemoMode()) return demoCasePage(slug, caseId, options.includeDrafts ?? false);
  const supabase = await createSupabaseServerClient();

  const { data: city } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<City>();

  if (!city) return null;

  const { data: caseRecord } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("city_id", city.id)
    .maybeSingle<Case>();

  if (!caseRecord) return null;

  const [photos, needs, foundations] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("sort_order")
      .order("created_at"),
    supabase.from("needs").select("*").eq("case_id", caseRecord.id).order("created_at"),
    supabase
      .from("foundations")
      .select("*")
      .eq("city_id", city.id)
      .order("is_primary", { ascending: false })
      .order("created_at"),
  ]);

  const cityFoundations = (foundations.data ?? []) as Foundation[];

  return {
    city,
    caseRecord,
    photos: (photos.data ?? []) as Photo[],
    needs: (needs.data ?? []) as Need[],
    foundation: cityFoundations.find((row) => row.is_primary) ?? cityFoundations[0] ?? null,
  };
}

export async function getOfferTarget(params: {
  need?: string;
  case?: string;
  city?: string;
}): Promise<OfferTarget | null> {
  if (isDemoMode()) return demoOfferTarget(params);
  const supabase = await createSupabaseServerClient();

  if (params.need) {
    const { data } = await supabase
      .from("needs")
      .select("id, title, category, city_id, case_id, cities(name, slug), cases(display_name)")
      .eq("id", params.need)
      .maybeSingle();

    if (data) {
      const row = data as unknown as {
        id: string;
        title: string;
        category: string;
        city_id: string;
        case_id: string | null;
        cities: { name: string; slug: string } | null;
        cases: { display_name: string } | null;
      };
      return {
        cityId: row.city_id,
        cityName: row.cities?.name ?? null,
        citySlug: row.cities?.slug ?? null,
        caseId: row.case_id,
        caseName: row.cases?.display_name ?? null,
        needId: row.id,
        needTitle: row.title,
        needCategory: row.category,
      };
    }
  }

  if (params.case) {
    const { data } = await supabase
      .from("cases")
      .select("id, display_name, city_id, cities(name, slug)")
      .eq("id", params.case)
      .maybeSingle();

    if (data) {
      const row = data as unknown as {
        id: string;
        display_name: string;
        city_id: string;
        cities: { name: string; slug: string } | null;
      };
      return {
        cityId: row.city_id,
        cityName: row.cities?.name ?? null,
        citySlug: row.cities?.slug ?? null,
        caseId: row.id,
        caseName: row.display_name,
        needId: null,
        needTitle: null,
        needCategory: null,
      };
    }
  }

  if (params.city) {
    const { data } = await supabase
      .from("cities")
      .select("id, name, slug")
      .eq("slug", params.city)
      .maybeSingle<Pick<City, "id" | "name" | "slug">>();

    if (data) {
      return {
        cityId: data.id,
        cityName: data.name,
        citySlug: data.slug,
        caseId: null,
        caseName: null,
        needId: null,
        needTitle: null,
        needCategory: null,
      };
    }
  }

  return null;
}
