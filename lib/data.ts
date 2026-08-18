import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import {
  demoAidRecords,
  demoCasePage,
  demoCaseCards,
  demoCityCards,
  demoCityDonationEntries,
  demoCityPage,
  demoNeedCards,
  demoOfferRecords,
  demoOfferTarget,
  demoPortalTotals,
} from "./demo-data";
import { situationPhotos, withUpdatePhotos } from "./case-photos";
import { donationChannel } from "./donation-channel";
import { savedFrame, type PhotoFrame } from "./photo-frame";
import type {
  AidRecord,
  Case,
  CaseCard,
  CasePage,
  CityCardData,
  CityDonationEntry,
  CityPage,
  City,
  CaseUpdate,
  Foundation,
  Need,
  NeedCard,
  NeedCategory,
  OfferRecord,
  OfferTarget,
  Photo,
  PortalTotals,
  SearchResults,
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
  photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order" | "case_id" | "focus_x" | "focus_y" | "zoom">[];
};

/** Las portadas se muestran pequeñas: siempre la miniatura si existe. */
function coverOf(photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order">[]) {
  const first = [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  if (!first) return null;
  return first.thumb_path || first.storage_path;
}

function coverFrameOf(
  photos: Pick<Photo, "sort_order" | "focus_x" | "focus_y" | "zoom">[],
): PhotoFrame | null {
  const first = [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  return first ? savedFrame(first) : null;
}

/**
 * El retrato de una persona: la foto que el equipo eligió para representarla.
 *
 * Se busca ENTRE LAS FOTOS DE ESE CASO y no por identificador contra la tabla
 * entera. Es la diferencia entre «no hay retrato» y «hay un retrato que no es de
 * esta persona»: la base de datos ya impide lo segundo (disparador
 * `cases_portrait_belongs_to_case`), y buscar aquí dentro hace que ni un puntero
 * viejo ni una foto que las RLS esconden puedan acabar en la tarjeta de otra
 * familia. No encontrarlo devuelve nulo, que es un estado normal: la mayoría de
 * los casos no va a tener retrato y la tarjeta lo dibuja con sus iniciales.
 *
 * Se sirve la miniatura: el retrato se ve a 80 px y la grande son 1600.
 */
function portraitOf(
  portraitPhotoId: string | null,
  photos: Pick<Photo, "id" | "storage_path" | "thumb_path">[],
): string | null {
  if (!portraitPhotoId) return null;
  const chosen = photos.find((photo) => photo.id === portraitPhotoId);
  if (!chosen) return null;
  return chosen.thumb_path || chosen.storage_path;
}

function portraitFrameOf(
  portraitPhotoId: string | null,
  photos: Pick<Photo, "id" | "focus_x" | "focus_y" | "zoom">[],
): PhotoFrame | null {
  if (!portraitPhotoId) return null;
  const chosen = photos.find((photo) => photo.id === portraitPhotoId);
  return chosen ? savedFrame(chosen) : null;
}

/** El orden que el equipo le dio a las fotos de un caso, que es el del carrusel. */
function bySortOrder<T extends Pick<Photo, "sort_order">>(photos: T[]): T[] {
  return [...photos].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * La fundación de un municipio. Una, no la primera de una lista.
 *
 * Se pide con `maybeSingle`, que es una afirmación y no una comodidad: la base de
 * datos garantiza una fila por municipio (`foundations_one_per_city`, 0004), de
 * modo que aquí no hay nada que desempatar. Antes se pedía la lista ordenada por
 * la marca de «madre» y se cogía la primera, y eso convertía el destino del dinero
 * en el resultado de un orden.
 *
 * Y si algún día hubiera dos —una base sin la migración aplicada—, `maybeSingle`
 * devuelve error y esto devuelve nulo, o sea «sin fundación»: la ficha se queda sin
 * botón de donar en vez de mandar el dinero a un enlace elegido al azar. Con la
 * ambigüedad delante, no publicar es la respuesta correcta.
 */
async function foundationOf(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  cityId: string,
): Promise<Foundation | null> {
  const { data } = await supabase
    .from("foundations")
    .select("*")
    .eq("city_id", cityId)
    .maybeSingle<Foundation>();

  return data ?? null;
}

/**
 * Categorías con algo sin cerrar, sin repetir y en el orden en que llegan.
 * Son las etiquetas de la tarjeta de un caso: tres palabras que dicen qué falta.
 */
export function openCategories(needs: Pick<Need, "category" | "status">[]): NeedCategory[] {
  return [
    ...new Set(
      needs.filter((need) => need.status !== "cubierta").map((need) => need.category),
    ),
  ];
}

export async function getCityCards(): Promise<CityCardData[]> {
  if (isDemoMode()) return demoCityCards();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("cities")
    .select(
      "*, needs(id, category, status, case_id), cases(id), photos(storage_path, thumb_path, sort_order, case_id, focus_x, focus_y, zoom)",
    )
    .order("name");

  if (error || !data) return [];

  return (data as NestedCityRow[]).map((city) => ({
    ...city,
    coverPath: coverOf(city.photos.filter((photo) => photo.case_id === null)),
    coverFrame: coverFrameOf(city.photos.filter((photo) => photo.case_id === null)),
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

  const [foundation, photos, needs, cases, updateLinks] = await Promise.all([
    foundationOf(supabase, city.id),
    supabase
      .from("photos")
      .select("*")
      .eq("city_id", city.id)
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
      // La clave ajena va nombrada: desde que 0003 añadió `cases.portrait_photo_id`
      // hay dos caminos entre `cases` y `photos` —las fotos DEL caso y el retrato
      // que el caso señala—, y PostgREST rechaza la consulta entera si no se dice
      // cuál. Escribir solo `photos(...)` devuelve PGRST201 y el municipio se
      // queda sin casos sin que se note, porque el error viaja en `error` y aquí
      // solo se lee `data`.
      .select(
        "*, photos!photos_case_id_fkey(id, storage_path, thumb_path, caption, sort_order, focus_x, focus_y, zoom), needs(id, status, category)",
      )
      .eq("city_id", city.id)
      .order("created_at", { ascending: false }),
    supabase.from("case_updates").select("case_id, photo_id").eq("city_id", city.id),
  ]);

  const allNeeds = (needs.data ?? []) as Need[];
  const allPhotos = (photos.data ?? []) as Photo[];

  type NestedCaseRow = Case & {
    photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "caption" | "sort_order" | "focus_x" | "focus_y" | "zoom">[];
    needs: Pick<Need, "id" | "status" | "category">[];
  };

  return {
    city,
    foundation,
    photos: allPhotos.filter((photo) => photo.case_id === null),
    zoneNeeds: allNeeds.filter((need) => need.case_id === null),
    caseNeeds: allNeeds.filter((need) => need.case_id !== null),
    // El orden de las fotos anidadas no lo garantiza la consulta —el `order` de
    // arriba es de los casos—, y aquí sí importa: es el del carrusel de esa
    // persona y el que el equipo dejó puesto en el panel.
    cases: ((cases.data ?? []) as NestedCaseRow[]).map((row) => {
      const progress = ((updateLinks.data ?? []) as { case_id: string; photo_id: string | null }[])
        .filter((link) => link.case_id === row.id)
        .map((link) => ({ photo_id: link.photo_id }));
      const nestedPhotos = bySortOrder(row.photos ?? []);
      const casePhotos = situationPhotos(nestedPhotos, row.portrait_photo_id, progress);
      return {
        ...row,
        photos: casePhotos,
        coverPath: coverOf(casePhotos),
        coverFrame: coverFrameOf(casePhotos),
        portraitPath: portraitOf(row.portrait_photo_id, nestedPhotos),
        portraitFrame: portraitFrameOf(row.portrait_photo_id, nestedPhotos),
        openNeeds: row.needs.filter((need) => need.status !== "cubierta").length,
        categories: openCategories(row.needs),
      };
    }),
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

  const [photos, needs, updateRows, foundation] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("sort_order")
      .order("created_at"),
    supabase.from("needs").select("*").eq("case_id", caseRecord.id).order("created_at"),
    supabase
      .from("case_updates")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("happened_on", { ascending: true })
      .order("created_at", { ascending: true }),
    foundationOf(supabase, city.id),
  ]);

  const allPhotos = (photos.data ?? []) as Photo[];

  return {
    city,
    caseRecord,
    photos: allPhotos,
    needs: (needs.data ?? []) as Need[],
    updates: withUpdatePhotos(
      (updateRows.data ?? []) as Omit<CaseUpdate, "photoPath" | "photoFrame">[],
      allPhotos,
    ),
    foundation,
  };
}

// ---------------------------------------------------------------------------
// Vistas transversales: el inicio y las cuatro secciones
//
// Cada lista trae ya resuelto lo que su tarjeta enseña —portada, necesidades
// abiertas, categorías, municipio— para que ninguna pantalla tenga que volver a
// preguntar ni contar por su cuenta. Los números del inicio y el buscador se
// apoyan además en `getCityCards`, que abarca el portal entero en una consulta:
// hay treinta municipios como techo, así que es barato, y evita que dos
// pantallas cuenten distinto por haber filtrado cada una a su manera.
// ---------------------------------------------------------------------------

/** Los números del inicio. Ninguno se estima: todos son filas contadas. */
export async function getPortalTotals(): Promise<PortalTotals> {
  if (isDemoMode()) return demoPortalTotals();
  const cities = await getCityCards();

  const needs = cities.flatMap((city) => city.needs);
  const covered = needs.filter((need) => need.status === "cubierta").length;

  return {
    cities: cities.length,
    cases: cities.reduce((sum, city) => sum + city.caseCount, 0),
    needs: needs.length,
    coveredNeeds: covered,
    openNeeds: needs.length - covered,
    updatedAt:
      cities.map((city) => city.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

/** Casos de todo el portal, del más reciente al más antiguo. */
export async function getCaseCards(): Promise<CaseCard[]> {
  if (isDemoMode()) return demoCaseCards();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cases")
    // Igual que en getCityPage: `photos` a secas es ambiguo desde 0003.
    .select(
      "*, cities(name, slug), photos!photos_case_id_fkey(id, storage_path, thumb_path, sort_order, focus_x, focus_y, zoom), needs(id, status, category)",
    )
    .order("updated_at", { ascending: false });

  type Row = Case & {
    cities: Pick<City, "name" | "slug"> | null;
    photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "sort_order" | "focus_x" | "focus_y" | "zoom">[];
    needs: Pick<Need, "id" | "status" | "category">[];
  };

  return ((data ?? []) as Row[])
    .filter((row) => row.cities)
    .map((row) => {
      const first = [...(row.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
      return {
        ...row,
        // La grande: estas fotos ahora llenan una tarjeta de /donaciones, y la
        // miniatura de 400 px se queda corta.
        coverPath: first?.storage_path ?? null,
        coverFrame: first ? savedFrame(first) : null,
        portraitPath: portraitOf(row.portrait_photo_id, row.photos),
        portraitFrame: portraitFrameOf(row.portrait_photo_id, row.photos),
        openNeeds: row.needs.filter((need) => need.status !== "cubierta").length,
        categories: openCategories(row.needs),
        cityName: row.cities!.name,
        citySlug: row.cities!.slug,
      };
    });
}

/**
 * Necesidades de todo el portal. Las urgentes primero y las cubiertas al final:
 * la lista existe para que alguien encuentre algo que pueda aportar hoy.
 */
export async function getNeedCards(): Promise<NeedCard[]> {
  if (isDemoMode()) return sortNeeds(demoNeedCards());
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("needs")
    .select("*, cities(name, slug), cases(display_name)")
    .order("urgent", { ascending: false })
    .order("created_at");

  type Row = Need & {
    cities: Pick<City, "name" | "slug"> | null;
    cases: Pick<Case, "display_name"> | null;
  };

  return sortNeeds(
    ((data ?? []) as Row[])
      .filter((row) => row.cities)
      .map((row) => ({
        ...row,
        cityName: row.cities!.name,
        citySlug: row.cities!.slug,
        caseName: row.cases?.display_name ?? null,
      })),
  );
}

/** Orden común a la lista general y al buscador. */
export function sortNeeds<T extends Pick<Need, "status" | "urgent" | "created_at">>(
  needs: T[],
): T[] {
  const rank = (need: T) => (need.status === "cubierta" ? 2 : need.urgent ? 0 : 1);
  return [...needs].sort(
    (a, b) => rank(a) - rank(b) || a.created_at.localeCompare(b.created_at),
  );
}

/**
 * Las ayudas que ya llegaron, para el registro público.
 *
 * Lee `aid_log` y no `offers`: es una vista que no tiene columna de contacto, ni
 * el día exacto de la entrega, ni el caso al que fue, ni el texto con el que quien
 * ofrecía describió su ayuda, y que enmascara el nombre de quien no autorizó
 * publicarlo. El público no tiene permiso sobre la tabla, así que aunque esta
 * función se escribiera mal no podría sacar de aquí nada de eso: el recorte está
 * en la vista y no en esta consulta.
 */
export async function getAidRecords(): Promise<AidRecord[]> {
  if (isDemoMode()) return demoAidRecords();
  const supabase = await createSupabaseServerClient();

  // Se ordena por mes, que es lo que hay. Dentro del mes manda el identificador:
  // arbitrario, pero estable —sin él la lista se reordenaría sola entre visitas,
  // y esta página existe para poder comprobar algo—. Ordenar por el día exacto
  // habría contado el día por la puerta de atrás.
  const { data } = await supabase
    .from("aid_log")
    .select("*")
    .order("delivered_month", { ascending: false })
    .order("id");

  return (data ?? []) as AidRecord[];
}

/**
 * Lo que se ha prometido y todavía no ha llegado, para /ofrecido.
 *
 * Lee `offer_log` y no `offers`, por lo mismo que `getAidRecords()`: es una vista
 * sin columna de contacto, sin el mensaje largo, sin las notas del equipo y sin
 * el caso al que apunta, que además tapa los teléfonos y los correos escritos
 * dentro del texto y no publica el nombre de quien ofrece mientras nadie del
 * equipo haya hablado con esa persona. El público no tiene permiso sobre la
 * tabla, así que aunque esta función se escribiera mal no podría sacar de aquí
 * nada de eso: el recorte está en la vista y no en esta consulta.
 *
 * La caducidad de ocho semanas también es de la vista, así que esta lista se
 * acorta sola sin que ninguna pantalla tenga que acordarse de filtrar por fecha.
 */
export async function getOfferRecords(): Promise<OfferRecord[]> {
  if (isDemoMode()) return demoOfferRecords();
  const supabase = await createSupabaseServerClient();

  // Lo más reciente primero, que es lo contrario de lo que pide una lista de
  // necesidades: aquí la fila de arriba es la promesa que más probablemente siga
  // en pie. Dentro del mismo día manda el identificador —arbitrario, pero
  // estable—, porque sin él la lista se reordenaría sola entre dos visitas.
  const { data } = await supabase
    .from("offer_log")
    .select("*")
    .order("offered_on", { ascending: false })
    .order("id");

  return (data ?? []) as OfferRecord[];
}

/**
 * La fundación que viene anidada en una consulta de municipios, sea cual sea la
 * forma en que la sirva PostgREST.
 *
 * Y son dos formas distintas, que es lo que hace falta saber aquí. `foundations`
 * es una lista desde el lado del municipio, pero `foundations_one_per_city`
 * (0004) es una restricción de unicidad sobre `city_id`, así que PostgREST lee la
 * relación como de uno a uno y devuelve **un objeto o nulo**, no un array. Un
 * `.length` sobre eso revienta la página entera, y no en las pruebas: revienta en
 * producción, que es donde existe la restricción.
 *
 * Se aceptan las dos formas a propósito. La restricción se puede quitar o
 * renombrar sin que nadie se acuerde de esta línea, y `/donaciones` cayéndose no
 * es una degradación aceptable: es la pantalla que contesta a dónde va el dinero.
 * Con dos filas —que la base de datos no permite— devuelve nula, que es la misma
 * respuesta que da la ficha del municipio ante la ambigüedad.
 */
export function embeddedFoundation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  if (!Array.isArray(value)) return value;
  return value.length === 1 ? value[0] : null;
}

/**
 * Los municipios publicados, con foto, canal y fundación, para /donaciones.
 *
 * Salen todos, tengan o no canal: la pestaña de municipios es una rejilla de
 * pueblos, no un listado de cuentas. El pop-up de «Donar» enseña la llave o
 * dice que todavía no hay. Los no publicados no llegan: los esconden las RLS.
 */
export async function getCityDonationEntries(): Promise<CityDonationEntry[]> {
  if (isDemoMode()) return demoCityDonationEntries();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("cities")
    .select(
      "*, foundations(*), photos(storage_path, thumb_path, sort_order, case_id, focus_x, focus_y, zoom)",
    )
    .order("name");

  type Row = City & {
    foundations: Foundation | Foundation[] | null;
    photos: Pick<
      Photo,
      "storage_path" | "thumb_path" | "sort_order" | "case_id" | "focus_x" | "focus_y" | "zoom"
    >[];
  };

  return ((data ?? []) as Row[]).map((row) => {
    const covers = (row.photos ?? []).filter((photo) => photo.case_id === null);
    const first = [...covers].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      city: row,
      channel: donationChannel(row),
      foundation: embeddedFoundation(row.foundations),
      // La foto grande, no la miniatura: estas tarjetas ocupan casi el ancho de
      // la columna y 400 px se notan blandos.
      coverPath: first?.storage_path ?? null,
      coverFrame: coverFrameOf(covers),
    };
  });
}

/**
 * Búsqueda por texto sobre lo que hay publicado.
 *
 * Se filtra en memoria y no en la base de datos a propósito: el portal cabe
 * entero en una consulta, y así la búsqueda ignora tildes y mayúsculas sin
 * montar índices ni depender de la configuración de idioma de Postgres. Quien
 * busca desde el Chocó escribe "quibdo" sin tilde.
 */
export async function searchPortal(query: string): Promise<SearchResults> {
  const term = fold(query);
  if (term.length < 2) return { cities: [], cases: [], needs: [], offers: [] };

  const [cities, cases, needs, offers] = await Promise.all([
    getCityCards(),
    getCaseCards(),
    getNeedCards(),
    getOfferRecords(),
  ]);

  const hits = (...fields: (string | null)[]) =>
    fields.some((field) => field && fold(field).includes(term));

  return {
    cities: cities.filter((city) => hits(city.name, city.summary)),
    cases: cases.filter((row) => hits(row.display_name, row.household, row.story, row.cityName)),
    needs: needs.filter((row) =>
      hits(row.title, row.details, row.quantity, row.cityName, row.caseName),
    ),
    // Se busca sobre las columnas de la vista y no sobre las de la tabla, así que
    // el término se compara contra el texto YA recortado: quien busque el número
    // que alguien escribió en su descripción no lo encuentra, porque en el portal
    // ese número no existe. Es el mismo criterio de siempre —lo que no se publica
    // no se puede pedir— aplicado también al buscador.
    offers: offers.filter((row) =>
      hits(row.resource, row.city_name, row.need_title, row.offerer_name),
    ),
  };
}

/** Sin tildes y en minúsculas, que es como se teclea con prisa. */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * El destino de /ofrecer, más la oferta que se quiere completar cuando quien
 * llega viene del muro de lo prometido.
 *
 * Vive aquí y no en lib/types.ts porque `OfferTarget` contesta a una pregunta
 * —a quién va dirigida la ayuda: un municipio, una familia, una necesidad— y
 * esto contesta a otra: de dónde viene quien está rellenando el formulario. Lo
 * produce solo esta función y lo lee solo la página de ofrecer; el resto del
 * portal sigue hablando de `OfferTarget`, que es lo que el formulario necesita
 * para armar sus campos ocultos.
 *
 * `completes` es un `Pick` de `OfferRecord` y no un tipo escrito a mano, y esa
 * es la parte que importa: lo que se puede pintar en esa tarjeta queda limitado
 * a lo que la vista pública publica de verdad. Con un tipo propio, un día
 * alguien le añadiría `offerer_contact` y compilaría.
 */
export type OfferTargetWithSource = OfferTarget & {
  completes: Pick<OfferRecord, "id" | "category" | "resource" | "offered_on" | "state"> | null;
};

export async function getOfferTarget(params: {
  need?: string;
  case?: string;
  city?: string;
  completa?: string;
}): Promise<OfferTargetWithSource | null> {
  if (isDemoMode()) {
    // Con datos de muestra no hay base de datos donde resolver el parámetro, así
    // que se resuelve contra la misma lista que pinta el muro. Hereda el
    // municipio por el slug, igual que abajo, y no la necesidad: la lista de
    // muestra tampoco publica su identificador y aquí no hay dónde buscar el
    // título. El equipo la vincula desde la bandeja.
    const promised = params.completa
      ? demoOfferRecords().find((row) => row.id === params.completa)
      : undefined;

    if (!promised) {
      const base = demoOfferTarget(params);
      return base && { ...base, completes: null };
    }

    const city = promised.city_slug ? demoOfferTarget({ city: promised.city_slug }) : null;
    return {
      cityId: city?.cityId ?? null,
      cityName: city?.cityName ?? null,
      citySlug: city?.citySlug ?? null,
      caseId: null,
      caseName: null,
      needId: null,
      needTitle: promised.need_title,
      needCategory: null,
      completes: {
        id: promised.id,
        category: promised.category,
        resource: promised.resource,
        offered_on: promised.offered_on,
        state: promised.state,
      },
    };
  }

  const supabase = await createSupabaseServerClient();

  // «Puedo completar esto»: alguien vio una promesa en /ofrecido —600 tejas sin
  // transporte, un camión que sube vacío— y viene a ofrecer la pieza que falta.
  //
  // SE LEE `public.offer_log` Y NUNCA `public.offers`. Esta página es pública y
  // la tabla guarda el contacto de quien hizo la oferta original: publicar el
  // muro sin publicar contactos y resolver luego este parámetro contra la tabla
  // sería abrir por detrás la puerta que el muro cierra por delante, y es
  // justamente lo que todo este diseño existe para evitar. La vista no tiene esa
  // columna, así que aquí no hay nada que se pueda filtrar por descuido.
  //
  // El precio es que la vista tampoco publica `city_id` ni `need_id`, y la oferta
  // nueva tiene que heredar los dos para que las dos lleguen emparejadas a la
  // bandeja. Se reconstruyen desde lo que sí publica:
  //
  //   * El municipio, por su `slug`. Y no es una aproximación: la vista solo deja
  //     pasar filas de municipio publicado o sin municipio (0012), así que un
  //     `city_slug` nulo significa exactamente «esta oferta no iba a ningún
  //     sitio» y un slug con valor identifica un municipio y solo uno. Preguntar
  //     por él a `cities` no abre nada nuevo: lo publicado ya es de lectura
  //     pública.
  //
  //   * La necesidad, por su título, entre las DE ZONA de ese municipio. Es
  //     exactamente el conjunto del que la vista publica el título: las de un
  //     caso salen con `need_title` nulo a propósito, porque ese título está
  //     escrito en la ficha de la familia. Así que de una oferta dirigida a una
  //     familia se hereda el municipio y nada más, y eso no es una carencia que
  //     haya que tapar: es la misma regla que hace pública la vista. El equipo,
  //     que sí lo ve todo, vuelve a vincularla desde la bandeja.
  //
  // Emparejar por título puede fallar de dos formas —dos necesidades de zona
  // llamadas igual, o una renombrada después de la oferta— y las dos se resuelven
  // igual: sin vínculo. Perder el vínculo lo arregla el equipo con un
  // desplegable; inventarlo mandaría esta oferta a la necesidad de otro.
  if (params.completa) {
    const { data } = await supabase
      .from("offer_log")
      .select("id, category, resource, offered_on, state, city_slug, need_title")
      .eq("id", params.completa)
      .maybeSingle<
        Pick<
          OfferRecord,
          "id" | "category" | "resource" | "offered_on" | "state" | "city_slug" | "need_title"
        >
      >();

    if (data) {
      let city: Pick<City, "id" | "name" | "slug"> | null = null;
      if (data.city_slug) {
        const { data: cityRow } = await supabase
          .from("cities")
          .select("id, name, slug")
          .eq("slug", data.city_slug)
          .maybeSingle<Pick<City, "id" | "name" | "slug">>();
        city = cityRow ?? null;
      }

      let need: Pick<Need, "id" | "category"> | null = null;
      if (city && data.need_title) {
        // Se piden dos para poder distinguir «una» de «más de una». Con `limit(1)`
        // el empate se resolvería por el orden en que vengan las filas, que es
        // como se acaba vinculando la oferta a la necesidad equivocada.
        const { data: needRows } = await supabase
          .from("needs")
          .select("id, category")
          .eq("city_id", city.id)
          .is("case_id", null)
          .eq("title", data.need_title)
          .limit(2);

        const found = (needRows ?? []) as Pick<Need, "id" | "category">[];
        need = found.length === 1 ? found[0] : null;
      }

      return {
        cityId: city?.id ?? null,
        cityName: city?.name ?? null,
        citySlug: city?.slug ?? null,
        // El caso se queda fuera y no por falta de sitio: la vista no lo publica,
        // y es la columna que más protege —por ella se llega a la ficha de una
        // familia—. Lo recupera el equipo sin escribirlo, vinculando la oferta a
        // la necesidad desde la bandeja: `updateOffer` copia entonces el
        // municipio y el caso de esa necesidad.
        caseId: null,
        caseName: null,
        needId: need?.id ?? null,
        // El título se enseña aunque no se haya podido resolver el puntero: es
        // texto que la vista ya publica, y quien lee agradece saber para qué se
        // ofreció aquello. Lo que tiene que ser exacto es el identificador.
        needTitle: data.need_title,
        needCategory: need?.category ?? null,
        completes: {
          id: data.id,
          category: data.category,
          resource: data.resource,
          offered_on: data.offered_on,
          state: data.state,
        },
      };
    }
  }

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
        completes: null,
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
        completes: null,
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
        completes: null,
      };
    }
  }

  return null;
}
