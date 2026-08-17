import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import { demoAdminCities, demoNeedOptions, demoOffersFor } from "./demo-data";
import type {
  AdminCityRow,
  City,
  NeedOption,
  OfferStatus,
  OfferWithContext,
} from "./types";

/**
 * Consultas del panel. Las RLS dan al equipo lectura completa, así que aquí no
 * hace falta filtrar por `published`: se ve todo, publicado o en borrador.
 */

export async function getAdminCities(): Promise<AdminCityRow[]> {
  if (isDemoMode()) return demoAdminCities();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cities")
    .select("*, cases(id), needs(id, status), photos(id), offers(id, status)")
    .order("name");

  type Row = City & {
    cases: { id: string }[];
    needs: { id: string; status: string }[];
    photos: { id: string }[];
    offers: { id: string; status: string }[];
  };

  return ((data ?? []) as Row[]).map((city) => ({
    ...city,
    caseCount: city.cases.length,
    openNeeds: city.needs.filter((need) => need.status !== "cubierta").length,
    photoCount: city.photos.length,
    pendingOffers: city.offers.filter((offer) => offer.status === "pendiente").length,
  }));
}

export async function getOffers(status?: OfferStatus): Promise<OfferWithContext[]> {
  if (isDemoMode()) return demoOffersFor(status);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("offers")
    .select(
      "*, cities(name, slug), cases(id, display_name), needs(id, title, category, status)",
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as unknown as OfferWithContext[];
}

/** Opciones para vincular una oferta con la necesidad que cubre. */
export async function getNeedOptions(): Promise<NeedOption[]> {
  if (isDemoMode()) return demoNeedOptions();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("needs")
    .select("id, title, status, cities(name), cases(display_name)")
    .neq("status", "cubierta")
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    title: string;
    cities: { name: string } | null;
    cases: { display_name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    title: row.title,
    cityName: row.cities?.name ?? "Sin municipio",
    caseName: row.cases?.display_name ?? null,
  }));
}
