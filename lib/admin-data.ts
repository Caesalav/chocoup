import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import { caseProgress, type CaseProgress } from "./case-progress";
import {
  demoAdminCities,
  demoCaseUpdates,
  demoCases,
  demoCities,
  demoFeedback,
  demoMoneyDestinations,
  demoNeedOptions,
  demoNeeds,
  demoNewsletterSignups,
  demoOffersFor,
  demoPhotos,
  demoTeamDirectory,
} from "./demo-data";
import { getGeneralChannel } from "./data";
import { donationChannel, moneyDestinationsOf, type MoneyDestination } from "./donation-channel";
import { countOpenNeeds, isOpenNeed, OPEN_STATUSES } from "./needs";
import { savedFrame, type PhotoFrame } from "./photo-frame";
import type {
  AdminCityRow,
  Case,
  CaseKind,
  City,
  FeedbackNote,
  Need,
  NeedCategory,
  NeedOption,
  NeedStatus,
  NewsletterSignup,
  OfferStatus,
  OfferWithContext,
  Photo,
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
 * Un recurso que todavía falta en una causa, para enseñarlo en la lista.
 *
 * Es el presupuesto de esta pantalla: no hay recaudo en pesos que se pueda
 * leer —la pasarela no está, y un cero fingido diría que nadie ha ayudado—
 * así que el plan son estas líneas (tejas, mercados, tanques) y lo recopilado
 * es cuántas ya están cubiertas. Ver `caseProgress`.
 */
export type AdminCaseResource = {
  title: string;
  quantity: string;
  category: NeedCategory;
  status: NeedStatus;
  urgent: boolean;
};

/**
 * Una causa en la lista de /admin/casos, reducida a lo que hace falta para
 * elegirla de un vistazo.
 *
 * El tipo vive aquí y no en lib/types.ts porque no lo consume nadie más: es la
 * forma de una pantalla del panel, como `AdminCityRow`, y aquélla está allí solo
 * porque nació antes de que hubiera un archivo de consultas del panel.
 *
 * Lo que lleva y lo que no está decidido por una sola pregunta: ¿esto ayuda a
 * saber en qué causa hay que entrar? El municipio y el tipo la identifican; el
 * retrato la reconoce; sin publicar y sin consentimiento dicen qué le falta
 * para salir; el avance dice cuánto del plan está cubierto; los recursos
 * abiertos dicen qué falta todavía, con nombre y cantidad; y el último avance
 * es el dato por el que existe esta pantalla —quien vuelve el jueves a
 * escribir busca la que lleva más tiempo sin ninguno—.
 *
 * No lleva el destino del dinero escrito ni su fecha de comprobación. Eso se
 * repasa entero en `MONEY_REVIEW_PATH`, que es de coordinación, y esta lista la
 * ve también quien documenta: una columna de llaves aquí sería publicar catorce
 * destinos en una pantalla que no existe para eso.
 */
export type AdminCaseRow = {
  id: string;
  displayName: string;
  kind: CaseKind;
  household: string;
  summary: string;
  createdAt: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  cityPublished: boolean;
  published: boolean;
  consent: boolean;
  /** Con canal propio, o recibiendo por el general. Ver `caseDonation()`. */
  ownChannel: boolean;
  openNeeds: number;
  /** Cuánto del plan de recursos está cubierto. Sin necesidades, total 0. */
  progress: CaseProgress;
  /** Lo que todavía falta, urgentes primero. Lo cubierto no se lista aquí. */
  resources: AdminCaseResource[];
  portraitPath: string | null;
  portraitFrame: PhotoFrame | null;
  /**
   * El día del último avance del diario, o nulo si todavía no hay ninguno.
   *
   * Es `max(case_updates.happened_on)` y no `cases.updated_at`, por lo mismo que
   * en `CasePage.lastUpdateOn`: esa columna se mueve al corregir una tilde, así
   * que la lista diría que hay noticias de una familia el día en que alguien
   * arregló una errata. Nulo es frecuente y es una respuesta —esta causa está
   * documentada y todavía no ha pasado nada— y no un hueco.
   */
  lastUpdateOn: string | null;
};

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
  if (isDemoMode()) {
    return demoCases.map((row) => {
      const city = demoCities.find((entry) => entry.id === row.city_id)!;
      return toAdminCase(
        row,
        city,
        demoNeeds.filter((need) => need.case_id === row.id),
        demoCaseUpdates.filter((update) => update.case_id === row.id),
        demoPhotos.filter((photo) => photo.case_id === row.id),
      );
    });
  }

  const supabase = await createSupabaseServerClient();

  // Retrato, recursos y avances van en la misma consulta: son lo que la tarjeta
  // enseña, y pedirlos por separado en una lista de cuarenta causas es cómo
  // esta pantalla dejaría de abrirse con la señal del Chocó. De los avances se
  // pide solo el día. De las fotos, lo que hace falta para el retrato —la
  // grande no cabe aquí—.
  const { data } = await supabase
    .from("cases")
    .select(
      "*, cities(name, slug, published), needs(id, status, title, quantity, category, urgent), case_updates(happened_on), photos!photos_case_id_fkey(id, storage_path, thumb_path, focus_x, focus_y, zoom)",
    )
    .order("created_at", { ascending: false });

  type Row = Case & {
    cities: Pick<City, "name" | "slug" | "published"> | null;
    needs: Pick<Need, "id" | "status" | "title" | "quantity" | "category" | "urgent">[];
    case_updates: { happened_on: string }[];
    photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "focus_x" | "focus_y" | "zoom">[];
  };

  return ((data ?? []) as Row[])
    // Una causa sin municipio no existe —`cases.city_id` es obligatorio— pero el
    // embebido puede llegar nulo si la política del municipio no lo deja leer, y
    // entonces la fila no se puede situar en ninguna parte. Se cae de la lista en
    // vez de inventarle un «Sin municipio» que no llevaría a ningún sitio.
    .filter((row) => row.cities)
    .map((row) => toAdminCase(row, row.cities!, row.needs, row.case_updates, row.photos ?? []));
}

type NeedSlice = Pick<Need, "id" | "status" | "title" | "quantity" | "category" | "urgent">;
type PhotoSlice = Pick<Photo, "id" | "storage_path" | "thumb_path" | "focus_x" | "focus_y" | "zoom">;

function toAdminCase(
  row: Case,
  city: Pick<City, "name" | "slug" | "published">,
  needs: NeedSlice[],
  updates: { happened_on: string }[],
  photos: PhotoSlice[],
): AdminCaseRow {
  const portrait = row.portrait_photo_id
    ? photos.find((photo) => photo.id === row.portrait_photo_id)
    : undefined;

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
    openNeeds: countOpenNeeds(needs),
    progress: caseProgress(needs),
    resources: needs
      .filter(isOpenNeed)
      .sort((a, b) => Number(b.urgent) - Number(a.urgent))
      .map((need) => ({
        title: need.title,
        quantity: need.quantity,
        category: need.category,
        status: need.status,
        urgent: need.urgent,
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
  if (isDemoMode()) return demoMoneyDestinations();
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
  if (isDemoMode()) return demoNewsletterSignups();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("newsletter_signups")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as NewsletterSignup[];
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

/**
 * El buzón: lo que el público escribió sobre el portal, no sobre las familias.
 *
 * Lo lee todo el equipo. Borrarlo es de coordinación, igual que las ofertas
 * que no apuntan a ningún municipio: no hay un pueblo asignado al que recortar.
 */
export async function getFeedback(): Promise<FeedbackNote[]> {
  if (isDemoMode()) return demoFeedback();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("feedback")
    .select("id, kind, body, contact, page_path, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as FeedbackNote[];
}
