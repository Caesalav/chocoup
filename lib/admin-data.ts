import "server-only";

import { createSupabaseServerClient } from "./supabase/server";
import { asCaseProgress, budgetProgress, type BudgetItem } from "./budget";
import type { AdminCaseResource, AdminCaseRow } from "./admin-case";
import { getGeneralChannel } from "./data";
import { donationChannel, moneyDestinationsOf, type MoneyDestination } from "./donation-channel";
import { countOpenNeeds, OPEN_STATUSES } from "./needs";
import { savedFrame } from "./photo-frame";
import type {
  AdminCityRow,
  AdminDonation,
  Case,
  City,
  FeedbackNote,
  Need,
  NeedOption,
  NewsletterSignup,
  OfferStatus,
  SupportOffer,
  SupportOfferKind,
  OfferWithContext,
  PaymentNotice,
  Photo,
  TeamMemberEntry,
} from "./types";
import { groupPhotoUsage, type PhotoUsageRow, type StorageUsage } from "./storage-usage";

export type { AdminCaseResource, AdminCaseRow };

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
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cities")
    .select("*, cases(id), needs(id, status), photos(id), offers(id, status)")
    .order("name");

  type Row = City & {
    cases: { id: string }[];
    // `status` va tipado y no como texto libre porque de aquí sale un conteo:
    // así el contador compartido de lib/needs.ts entra sin conversiones, y un
    // estado que no exista falla al compilar en vez de contarse como abierto.
    needs: Pick<Need, "id" | "status">[];
    photos: { id: string }[];
    offers: { id: string; status: string }[];
  };

  return ((data ?? []) as Row[]).map((city) => ({
    ...city,
    caseCount: city.cases.length,
    // La misma cuenta que el portal público, con una diferencia que no está
    // aquí: al equipo las RLS le dejan ver también las necesidades de los casos
    // sin publicar, así que este número puede ser mayor que el de /municipios.
    // Es correcto —el panel es el inventario, no el escaparate— y por eso la
    // definición se comparte y lo que cambia es quién pregunta. Ver lib/needs.ts.
    openNeeds: countOpenNeeds(city.needs),
    photoCount: city.photos.length,
    pendingOffers: city.offers.filter((offer) => offer.status === "pendiente").length,
  }));
}

/**
 * Las causas de todos los municipios, en una lista.
 *
 * Hasta aquí a una causa solo se llegaba entrando por su municipio, que es el
 * recorrido de quien la documenta por primera vez y no el de quien vuelve: el
 * jueves siguiente hay que escribir un avance de la familia Klinger y pasar por
 * la ficha de Bahía Solano para encontrarla son dos pantallas de más y una
 * decisión —«¿en qué pueblo estaba?»— que el panel puede contestar solo.
 *
 * Trae los borradores y las causas sin consentimiento, igual que el resto del
 * panel: aquí el material se ve completo y lo que cambia es dónde se puede
 * escribir. Quien documenta ve las de todos los municipios y no solo las suyas,
 * por lo mismo que la lista de municipios: hace falta saber qué escribió otra
 * persona esta mañana para no duplicar el trabajo. Lo que recorta de verdad es
 * `canWriteCity`, y la pantalla lo dice fila por fila.
 *
 * El último avance se cuenta desde los avances que las políticas dejan ver, que
 * es lo correcto por la misma razón que en la ficha pública: la fecha tiene que
 * ser la del último avance que quien mira puede leer.
 */
export async function getAdminCases(): Promise<AdminCaseRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cases")
    .select(
      "*, cities(name, slug, published), needs(id, status, title, quantity, category, urgent), budget_items(id, case_id, city_id, title, amount_cop, purchased, purchased_on, sort_order, created_at), case_updates(happened_on), photos!photos_case_id_fkey(id, storage_path, thumb_path, focus_x, focus_y, zoom)",
    )
    .order("created_at", { ascending: false });

  const { data: raised } = await supabase.from("case_budget").select("case_id, donated_cop");
  const donatedByCase = new Map(
    ((raised ?? []) as { case_id: string; donated_cop: number }[]).map((row) => [
      row.case_id,
      Number(row.donated_cop),
    ]),
  );

  type Row = Case & {
    cities: Pick<City, "name" | "slug" | "published"> | null;
    needs: NeedSlice[];
    budget_items: BudgetItem[];
    case_updates: { happened_on: string }[];
    photos: PhotoSlice[];
  };

  return ((data ?? []) as Row[])
    .filter((row) => row.cities)
    .map((row) =>
      toAdminCase(
        row,
        row.cities!,
        row.needs,
        row.budget_items ?? [],
        row.case_updates,
        row.photos ?? [],
        donatedByCase.get(row.id) ?? 0,
      ),
    );
}

type NeedSlice = Pick<Need, "id" | "status" | "title" | "quantity" | "category" | "urgent">;
type PhotoSlice = Pick<Photo, "id" | "storage_path" | "thumb_path" | "focus_x" | "focus_y" | "zoom">;

function toAdminCase(
  row: Case,
  city: Pick<City, "name" | "slug" | "published">,
  needs: NeedSlice[],
  items: Pick<BudgetItem, "title" | "amount_cop" | "purchased">[],
  updates: { happened_on: string }[],
  photos: PhotoSlice[],
  donated = 0,
): AdminCaseRow {
  const portrait = row.portrait_photo_id
    ? photos.find((photo) => photo.id === row.portrait_photo_id)
    : undefined;
  const budget = budgetProgress(items, donated);

  return {
    id: row.id,
    displayName: row.display_name,
    kind: row.case_kind,
    household: row.household,
    summary: row.summary,
    createdAt: row.created_at,
    cityId: row.city_id,
    cityName: city.name,
    citySlug: city.slug,
    cityPublished: city.published,
    published: row.published,
    consent: row.consent_to_publish,
    ownChannel: donationChannel(row) !== null,
    openNeeds: budget.pendingItems,
    progress: asCaseProgress(budget),
    resources: items
      .filter((item) => !item.purchased)
      .map((item) => ({
        title: item.title,
        quantity: String(item.amount_cop),
        category: "otro",
        status: "abierta",
        urgent: false,
      })),
    portraitPath: portrait ? portrait.thumb_path || portrait.storage_path : null,
    portraitFrame: portrait ? savedFrame(portrait) : null,
    lastUpdateOn: lastHappenedOn(updates),
  };
}

/** El día del avance más reciente, o nulo si esa causa no tiene ninguno. */
function lastHappenedOn(updates: { happened_on: string }[]): string | null {
  return updates.reduce<string | null>(
    (latest, update) =>
      latest === null || update.happened_on > latest ? update.happened_on : latest,
    null,
  );
}

/**
 * Todos los destinos de dinero que publica el portal, en una lista.
 *
 * Existe porque el destino del dinero está repartido: uno general y uno por cada
 * caso que tenga el suyo. Eso es correcto —cada uno pertenece a alguien— pero
 * deja de haber una pantalla que conteste «¿qué destinos estamos publicando?», y
 * esa pregunta hay que poder hacerla de un vistazo: es la que detecta el canal
 * que no debería estar ahí.
 *
 * No se edita desde aquí, salvo el general, que no tiene ficha propia donde
 * vivir. El de cada caso se cambia en la ficha de quien lo recibe, con su nombre
 * y su historia delante; esta pantalla enseña y enlaza. Un segundo formulario
 * para lo mismo sería un sitio más donde cambiar el canal que no se quería
 * cambiar.
 *
 * Se listan también los que no se ven todavía —un municipio sin publicar, un caso
 * en borrador—, marcados como tales: un destino escrito en una ficha que aún no
 * sale es justo lo que conviene revisar antes de que salga.
 */
export async function getMoneyDestinations(): Promise<MoneyDestination[]> {
  const supabase = await createSupabaseServerClient();

  // Se pide desde los casos y no desde los municipios, que es como se pedía
  // antes: ahora el municipio no tiene canal, así que colgar la consulta de él
  // obligaría a recorrer pueblos vacíos para llegar a lo único que hay.
  const [general, { data }] = await Promise.all([
    getGeneralChannel(),
    supabase.from("cases").select("*, cities(name, slug, published)").order("display_name"),
  ]);

  type Row = Case & { cities: Pick<City, "name" | "slug" | "published"> | null };

  return moneyDestinationsOf(
    general,
    ((data ?? []) as Row[])
      .filter((row) => row.cities)
      .map((row) => ({
        ...row,
        cityName: row.cities!.name,
        citySlug: row.cities!.slug,
        cityPublished: row.cities!.published,
      })),
  );
}

/**
 * Los correos apuntados a los avisos del portal.
 *
 * Solo coordinación, y no por costumbre: es la única lista de datos personales
 * que no pertenece a ningún municipio, así que no hay asignación que la haga de
 * nadie. La política de la base de datos dice lo mismo
 * (`newsletter_coordination_read`, 0015) y es la que manda; esto devolvería una
 * lista vacía para cualquier otra sesión.
 */
export async function getNewsletterSignups(): Promise<NewsletterSignup[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("newsletter_signups")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as NewsletterSignup[];
}

export async function getOffers(status?: OfferStatus): Promise<OfferWithContext[]> {
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
  const supabase = await createSupabaseServerClient();

  // El desplegable ofrece lo que se puede cubrir, así que el filtro se escribe
  // con la misma lista que cuenta el portal y no como un «distinto de cubierta»
  // suelto: es la única de estas cuentas que viaja a Postgres, y era la que se
  // quedaría atrás el día que la lista de estados cambie. Ver lib/needs.ts.
  const { data } = await supabase
    .from("needs")
    .select("id, title, status, cities(name), cases(display_name)")
    .in("status", [...OPEN_STATUSES])
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

/**
 * El buzón: lo que el público escribió sobre el portal, no sobre las familias.
 *
 * Lo lee todo el equipo. Borrarlo es de coordinación, igual que las ofertas
 * que no apuntan a ningún municipio: no hay un pueblo asignado al que recortar.
 */
export async function getSupportOffers(kind?: SupportOfferKind): Promise<SupportOffer[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("support_offers").select("*").order("created_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data } = await query;
  return (data ?? []) as SupportOffer[];
}

export async function getFeedback(): Promise<FeedbackNote[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("feedback")
    .select("id, kind, body, contact, page_path, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as FeedbackNote[];
}

/**
 * Cuánto pesa cada foto, agrupado por municipio y causa.
 *
 * Lo lee todo el equipo: el cupo es de todo el portal, no de un pueblo, y quien
 * documenta tiene que ver si cabe otra foto antes de subirla. Las políticas de
 * `photos` ya recortan lo que cada sesión puede leer.
 */
export async function getPhotoStorageUsage(): Promise<StorageUsage> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select(
      "id, city_id, case_id, byte_size, thumb_byte_size, cities(name, slug), cases(display_name)",
    );

  if (error || !data) return groupPhotoUsage([]);

  type Row = {
    id: string;
    city_id: string;
    case_id: string | null;
    byte_size: number | null;
    thumb_byte_size: number | null;
    cities: { name: string; slug: string } | null;
    cases: { display_name: string } | null;
  };

  const rows: PhotoUsageRow[] = (data as unknown as Row[])
    .filter((row) => row.cities)
    .map((row) => ({
      id: row.id,
      city_id: row.city_id,
      city_name: row.cities!.name,
      city_slug: row.cities!.slug,
      case_id: row.case_id,
      case_name: row.cases?.display_name ?? null,
      byte_size: Number(row.byte_size) || 0,
      thumb_byte_size: Number(row.thumb_byte_size) || 0,
    }));

  return groupPhotoUsage(rows);
}

/**
 * Quien donó, a qué causa y en qué estado. Solo coordinación: es la misma
 * lista que `donations_coordination_read` (0017).
 */
export async function getAdminDonations(): Promise<AdminDonation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, amount_cop, status, donor_name, publish_name, provider, payment_ref, created_at, settled_at, destination, source, case_id, cases(display_name, city_id, cities(name, slug))",
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  type Row = {
    id: string;
    amount_cop: number;
    status: AdminDonation["status"];
    donor_name: string;
    publish_name: boolean;
    provider: string;
    payment_ref: string;
    created_at: string;
    settled_at: string | null;
    destination: AdminDonation["destination"];
    source: AdminDonation["source"];
    case_id: string | null;
    cases: {
      display_name: string;
      city_id: string;
      cities: { name: string; slug: string } | null;
    } | null;
  };

  /**
   * Aquí había un `.filter((row) => row.cases?.cities)` y se ha ido, porque
   * escondía dinero.
   *
   * Estaba para que los tipos cuadraran —`AdminDonation` prometía causa y
   * municipio no nulos— y el efecto era que una donación al fondo general, que
   * por definición no tiene causa, no llegaba a la lista de coordinación. La
   * fila estaba en la base, el importe contaba en los totales, y la única
   * pantalla donde se mira quién donó no la enseñaba. Un filtro puesto por
   * comodidad del tipo, borrando la mitad del registro.
   *
   * Ahora no se descarta ninguna fila. Lo que no se pudo resolver llega nulo y
   * la pantalla lo dice, que es lo que hay que hacer con lo que no se sabe.
   */
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    amount_cop: Number(row.amount_cop),
    status: row.status,
    donor_name: row.donor_name,
    publish_name: row.publish_name,
    provider: row.provider,
    payment_ref: row.payment_ref,
    created_at: row.created_at,
    settled_at: row.settled_at,
    destination: row.destination,
    source: row.source,
    case_id: row.case_id,
    case_name: row.cases?.display_name ?? null,
    city_id: row.cases?.city_id ?? null,
    city_name: row.cases?.cities?.name ?? null,
    city_slug: row.cases?.cities?.slug ?? null,
  }));
}

/**
 * Los últimos avisos de pago que llegaron, con lo que se decidió (0025).
 *
 * Es la pantalla que faltaba el 23 de agosto: sin ella, «no aparece mi
 * donación» no se puede responder más que mirando el extracto de la pasarela.
 * Solo coordinación, como la tabla.
 */
export async function getPaymentNotices(limit = 50): Promise<PaymentNotice[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("payment_notices")
    .select("id, received_at, provider, payment_ref, kind, request_id, signature, outcome, detail, donation_id")
    .order("received_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));

  if (error || !data) return [];
  return data as unknown as PaymentNotice[];
}
