import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import {
  demoAdminCities,
  demoMoneyDestinations,
  demoNeedOptions,
  demoOffersFor,
  demoTeamDirectory,
} from "./demo-data";
import { embeddedFoundation } from "./data";
import { moneyDestinationsOf, type MoneyDestination } from "./donation-channel";
import type {
  AdminCityRow,
  Case,
  City,
  Foundation,
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
 * Todos los destinos de dinero que publica el portal, en una lista.
 *
 * Existe por lo que se perdió al quitar la llave global: antes había un solo
 * sitio donde mirar a dónde iba el dinero, y ahora hay uno por municipio, uno por
 * caso y el de cada fundación. Eso es correcto —cada uno pertenece a alguien—
 * pero deja de haber una pantalla que conteste «¿qué destinos estamos
 * publicando?», y esa pregunta hay que poder hacerla de un vistazo: es la que
 * detecta el canal que no debería estar ahí.
 *
 * No se edita desde aquí. Cada destino se cambia en la ficha de quien lo recibe,
 * que es donde está su nombre, su historia y su municipio delante; esta pantalla
 * solo enseña y enlaza. Un formulario aquí sería un sitio más donde cambiar lo
 * mismo, que es cómo se cambia el que no se quería cambiar.
 *
 * Se listan también los que no se ven todavía —un municipio sin publicar, un caso
 * en borrador—, marcados como tales: un destino escrito en una ficha que aún no
 * sale es justo lo que conviene revisar antes de que salga.
 */
export async function getMoneyDestinations(): Promise<MoneyDestination[]> {
  if (isDemoMode()) return demoMoneyDestinations();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cities")
    .select("*, foundations(name, donation_url), cases(*)")
    .order("name");

  type EmbeddedFoundation = Pick<Foundation, "name" | "donation_url">;
  type Row = City & {
    foundations: EmbeddedFoundation | EmbeddedFoundation[] | null;
    cases: Case[];
  };

  // `foundations` llega como objeto y no como lista: la restricción de una
  // fundación por municipio hace que PostgREST lea la relación como de uno a uno.
  // Ver `embeddedFoundation`, que acepta las dos formas.
  return ((data ?? []) as Row[]).flatMap((city) =>
    moneyDestinationsOf(city, embeddedFoundation(city.foundations), city.cases),
  );
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
