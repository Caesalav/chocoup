import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import {
  demoAdminCities,
  demoDonationKey,
  demoNeedOptions,
  demoOffersFor,
  demoTeamDirectory,
} from "./demo-data";
import type {
  AdminCityRow,
  City,
  DonationKey,
  NeedOption,
  OfferStatus,
  OfferWithContext,
  TeamMemberEntry,
} from "./types";

/**
 * Consultas del panel. Las RLS dan al equipo lectura completa del material, así
 * que aquí no hace falta filtrar por `published`: se ve todo, publicado o en
 * borrador.
 *
 * Las ofertas son la excepción y tampoco se filtran aquí: cada una trae el
 * teléfono de una persona ajena al equipo, y quien documenta solo ve las de los
 * municipios que atiende. Eso lo recorta la política, no esta consulta.
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

/**
 * La llave de transferencia tal y como la edita coordinación.
 *
 * Es la misma fila que lee `getDonationKey()` y se lee aparte por una diferencia
 * que importa: ahí una llave vacía se devuelve como nulo, para que ninguna página
 * pública pueda pintar el bloque de la llave sin llave dentro. Aquí la vacía hay
 * que verla, porque es el estado desde el que se escribe la primera y el que queda
 * después de retirar una comprometida.
 *
 * Nulo aquí significa otra cosa: no hay fila, o sea que falta la migración 0010.
 * La pantalla lo dice con esas palabras en vez de ofrecer un formulario que no
 * puede guardar en ningún sitio.
 */
export async function getDonationKeyRow(): Promise<DonationKey | null> {
  if (isDemoMode()) return demoDonationKey();
  const supabase = await createSupabaseServerClient();

  type Row = {
    key_value: string;
    app_label: string;
    holder: string;
    updated_at: string;
    updated_by: string;
  };

  const { data } = await supabase
    .from("donation_key")
    .select("key_value, app_label, holder, updated_at, updated_by")
    .maybeSingle<Row>();

  if (!data) return null;

  return {
    value: data.key_value,
    app: data.app_label,
    holder: data.holder,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
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

/**
 * Las ofertas dirigidas a una familia, para leerlas desde su propia ficha.
 *
 * Existe porque la bandeja general no sirve para la pregunta que se hace en
 * terreno. Ahí las ofertas llegan ordenadas por fecha y de todo el municipio, y
 * quien está delante de una familia necesita lo contrario: qué le han ofrecido a
 * ELLA, para no prometerle dos veces lo mismo ni olvidar lo que ya viene en
 * camino.
 *
 * Trae todos los estados, incluidas las rechazadas: que una oferta se descartara
 * es parte de la historia de esta familia y explica por qué una necesidad sigue
 * abierta después de que alguien ofreciera algo.
 *
 * El recorte por municipio lo sigue haciendo la política, igual que en getOffers:
 * quien no tenga este municipio asignado no llega a esta pantalla.
 */
export async function getOffersForCase(caseId: string): Promise<OfferWithContext[]> {
  if (isDemoMode()) return demoOffersFor().filter((offer) => offer.case_id === caseId);
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("offers")
    .select(
      "*, cities(name, slug), cases(id, display_name), needs(id, title, category, status)",
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

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

/**
 * La lista del equipo con su rol y sus municipios.
 *
 * Pasa por `team_directory()` y no por la tabla porque la allowlist no está
 * expuesta en la API: la lista de correos del equipo es justo lo que no debe
 * filtrarse. La función comprueba por su cuenta que quien pregunta es
 * coordinación y devuelve un error si no; aquí eso se traduce en lista vacía,
 * porque la pantalla ya solo existe para coordinación.
 */
export async function getTeamDirectory(): Promise<TeamMemberEntry[]> {
  if (isDemoMode()) return demoTeamDirectory();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("team_directory");
  if (error || !Array.isArray(data)) return [];

  type Row = {
    email?: unknown;
    nombre?: unknown;
    role?: unknown;
    createdAt?: unknown;
    cityIds?: unknown;
  };

  return (data as Row[])
    .filter((row): row is Row => row.role === "coordinacion" || row.role === "documentacion")
    .map((row) => ({
      email: String(row.email ?? ""),
      nombre: String(row.nombre ?? ""),
      role: row.role as TeamMemberEntry["role"],
      createdAt: String(row.createdAt ?? ""),
      cityIds: Array.isArray(row.cityIds)
        ? row.cityIds.filter((id): id is string => typeof id === "string")
        : [],
    }));
}
