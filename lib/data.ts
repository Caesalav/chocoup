import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import {
  demoAidRecords,
  demoCasePage,
  demoCaseCards,
  demoCityCards,
  demoCityPage,
  demoDonationKey,
  demoFoundationEntries,
  demoNeedCards,
  demoOfferTarget,
  demoPortalTotals,
} from "./demo-data";
import { situationPhotos, withUpdatePhotos } from "./case-photos";
import { savedFrame, type PhotoFrame } from "./photo-frame";
import type {
  AidRecord,
  Case,
  CaseCard,
  CasePage,
  CityCardData,
  CityPage,
  City,
  CaseUpdate,
  DonationKey,
  Foundation,
  FoundationEntry,
  Need,
  NeedCard,
  NeedCategory,
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
    .map((row) => ({
      ...row,
      coverPath: coverOf(row.photos),
      portraitPath: portraitOf(row.portrait_photo_id, row.photos),
      portraitFrame: portraitFrameOf(row.portrait_photo_id, row.photos),
      openNeeds: row.needs.filter((need) => need.status !== "cubierta").length,
      categories: openCategories(row.needs),
      cityName: row.cities!.name,
      citySlug: row.cities!.slug,
    }));
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
 * La llave de transferencia del portal, o nula si no hay ninguna puesta.
 *
 * Una consulta y una fila. La base de datos garantiza que no puede haber dos
 * (`donation_key_one_row`, 0010), así que aquí no hay nada que desempatar: a
 * diferencia de las fundaciones antes de 0004, el destino del dinero no puede
 * depender de qué fila devuelva antes la consulta.
 *
 * Sin llave escrita devuelve nulo y no una fila con la cadena vacía dentro, para
 * que las páginas tengan una sola cosa que preguntar. Nulo es un estado normal:
 * es como está el portal antes de que coordinación registre la primera llave.
 *
 * Y nulo es también lo que sale si falta la migración, porque una tabla que no
 * existe deja `data` en nulo igual que una fila vacía. Se cae hacia el silencio a
 * propósito —una llave a medias sería peor que ninguna—, pero conviene saberlo al
 * depurar: si la sección de la llave no aparece en ninguna pantalla, lo primero
 * que hay que mirar es si 0010 está aplicada.
 */
export async function getDonationKey(): Promise<DonationKey | null> {
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

  const value = data?.key_value.trim() ?? "";
  if (!value) return null;

  return {
    value,
    app: data!.app_label.trim(),
    holder: data!.holder.trim(),
    updatedAt: data!.updated_at,
    updatedBy: data!.updated_by,
  };
}

/**
 * La fundación de cada municipio publicado, por orden alfabético de municipio.
 *
 * Es una fila por municipio, así que el orden ya no puede decir nada sobre la
 * jerarquía entre fundaciones —no hay— y lo que le queda por hacer es que la lista
 * de /donaciones se pueda recorrer con el dedo buscando un nombre de pueblo. Se
 * ordena en memoria y no en la consulta porque el criterio está en la tabla
 * vecina, y el portal entero cabe en una consulta.
 */
export async function getFoundationEntries(): Promise<FoundationEntry[]> {
  if (isDemoMode()) return demoFoundationEntries();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase.from("foundations").select("*, cities(name, slug)");

  type Row = Foundation & { cities: Pick<City, "name" | "slug"> | null };

  return ((data ?? []) as Row[])
    .filter((row) => row.cities)
    .map((row) => ({ ...row, cityName: row.cities!.name, citySlug: row.cities!.slug }))
    .sort((a, b) => a.cityName.localeCompare(b.cityName, "es"));
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
  if (term.length < 2) return { cities: [], cases: [], needs: [] };

  const [cities, cases, needs] = await Promise.all([
    getCityCards(),
    getCaseCards(),
    getNeedCards(),
  ]);

  const hits = (...fields: (string | null)[]) =>
    fields.some((field) => field && fold(field).includes(term));

  return {
    cities: cities.filter((city) => hits(city.name, city.summary)),
    cases: cases.filter((row) => hits(row.display_name, row.household, row.story, row.cityName)),
    needs: needs.filter((row) =>
      hits(row.title, row.details, row.quantity, row.cityName, row.caseName),
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
