import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "./supabase/server";
import { EMPTY_FOCUS, type CampaignFocusRow } from "./campaign";
import { situationPhotos, withUpdatePhotos } from "./case-photos";
import { lastUpdateOn } from "./case-updates";
import {
  asCaseProgress,
  budgetProgress,
  countOpenBudgetCases,
  countSolvedBudgetCases,
  mergeBudget,
  type BudgetItem,
} from "./budget";
import {
  CITY_OFFER_ACTIVITY_VIEW,
  type CityOfferActivity,
} from "./city-activity";
import {
  CONTRIBUTION_TALLY_VIEW,
  EMPTY_TALLY,
  type ContributionTally,
} from "./contributions";
import { donationChannel, type DonationChannel } from "./donation-channel";
import { DONATION_LOG_LIMIT, DONATION_LOG_VIEW, type DonationLogSort } from "./donation-log";
import { isCoveredNeed, isOpenNeed } from "./needs";
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
  DonationColumns,
  DonationLogEntry,
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
 * `includeDrafts` no toca las filas: solo deja que el panel abra la ficha de un
 * municipio todavía sin casos, que el portal público esconde.
 */

type Options = { includeDrafts?: boolean };

type NestedCityRow = City & {
  needs: Pick<Need, "id" | "category" | "status" | "case_id">[];
  cases: (Pick<Case, "id"> & {
    budget_items: Pick<BudgetItem, "case_id" | "amount_cop" | "purchased">[];
  })[];
  photos: Pick<Photo, "storage_path" | "thumb_path" | "sort_order" | "case_id" | "focus_x" | "focus_y" | "zoom">[];
};

const CASE_BUDGET_VIEW = "case_budget";

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
 * El canal general del portal, o nulo si no hay ninguno registrado.
 *
 * Es una fila y solo una, garantizado por la base de datos
 * (`donation_channel_one_row`, 0015). Se pide con `maybeSingle`, que aquí es una
 * afirmación y no una comodidad: si algún día hubiera dos, devuelve error y esto
 * devuelve nulo, o sea «no hay canal general». Ante la ambigüedad sobre a dónde
 * va el dinero, callar es la respuesta correcta, y las fichas de los casos sin
 * canal propio pasan a decir que todavía no hay a dónde enviarles. Es la misma
 * decisión que tomaba `donationChannel()` con dos columnas llenas.
 *
 * Nulo es un estado que se puede provocar en un minuto y a propósito: si el
 * destino general se compromete, coordinación lo vacía desde el panel y el portal
 * deja de enseñarlo sin esperar a tener el siguiente.
 */
export async function getGeneralChannel(): Promise<DonationChannel | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("donation_channel")
    .select(
      "donation_key, donation_url, donation_phone, donation_app, donation_holder, donation_verified_on",
    )
    .maybeSingle<DonationColumns>();

  return data ? donationChannel(data) : null;
}

/**
 * El foco que coordinación ha marcado, o vacío si no hay ninguno.
 *
 * Vacío no es un error: entonces el aviso del inicio cae en el pueblo más
 * atrasado. `maybeSingle` ante dos filas (que la base de datos impide) también
 * devuelve vacío, y el mapa sigue hablando solo.
 */
export async function getCampaignFocusRow(): Promise<CampaignFocusRow> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("campaign_focus")
    .select("city_id, case_id, note")
    .maybeSingle<CampaignFocusRow>();

  return data ?? EMPTY_FOCUS;
}

function cityBoard(
  items: Pick<BudgetItem, "case_id" | "amount_cop" | "purchased">[],
  donated: number,
  standingOffers: number,
) {
  const budget = budgetProgress(items, donated);
  return {
    openNeeds: budget.pendingItems,
    openCases: countOpenBudgetCases(items),
    solvedCases: countSolvedBudgetCases(items),
    progress: asCaseProgress(budget),
    budget,
    standingOffers,
  };
}

/**
 * Los dos números del contador de aportes.
 *
 * Es la ÚNICA lectura de `public.offer_tally` en todo el proyecto, y la regla
 * `no-restricted-syntax` de eslint.config.mjs lo mantiene así: el número no puede
 * entrar al portal por una segunda consulta que filtre a su manera, que es
 * exactamente cómo se coló el descuadre de las necesidades abiertas. Qué cuenta
 * cada uno está escrito en lib/contributions.ts y en la vista.
 *
 * Sin fila —no debería pasar, la vista siempre devuelve una— se enseñan ceros y
 * no se esconde el contador: un cero es cierto y además es la verdad de un portal
 * que acaba de abrir.
 */
export async function getContributionTally(): Promise<ContributionTally> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from(CONTRIBUTION_TALLY_VIEW)
    .select("ofrecidos, entregados")
    .maybeSingle<ContributionTally>();

  return data ?? EMPTY_TALLY;
}

/**
 * Categorías con algo sin cerrar, sin repetir y en el orden en que llegan.
 * Son las etiquetas de la tarjeta de un caso: tres palabras que dicen qué falta.
 */
export function openCategories(needs: Pick<Need, "category" | "status">[]): NeedCategory[] {
  return [...new Set(needs.filter(isOpenNeed).map((need) => need.category))];
}

/**
 * Los municipios con casos, con todo lo que enseña su tarjeta.
 *
 * El mapa sigue dibujando los treinta del DANE; esta lista es solo donde el
 * equipo ya documentó una familia. Un pueblo publicado sin casos no sale: no
 * hay nada que enseñar hasta que haya al menos un caso.
 *
 * Va envuelto en `cache` de React, que memoriza la llamada durante UNA petición y
 * nada más. Es la garantía de más abajo dicha con el lenguaje en vez de con
 * cuidado: el inicio y /mapa piden esta lista y además `getPortalTotals()`, que se
 * apoya en ella, así que la misma consulta salía dos veces por visita —tres
 * lecturas contra Supabase cada una— y las dos podían caer a los dos lados de una
 * escritura. Ahora los dos sitios leen las mismas filas porque son literalmente el
 * mismo array.
 *
 * No es caché entre visitas: eso lo deciden las pantallas con
 * `dynamic = "force-dynamic"`, y sigue siendo una consulta por visita.
 */
export const getCityCards = cache(async function cityCards(): Promise<CityCardData[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data, error }, activity, raised] = await Promise.all([
    supabase
      .from("cities")
      .select(
        "*, needs(id, category, status, case_id), cases(id, budget_items(case_id, amount_cop, purchased)), photos(storage_path, thumb_path, sort_order, case_id, focus_x, focus_y, zoom)",
      )
      .order("name"),
    supabase.from(CITY_OFFER_ACTIVITY_VIEW).select("city_id, en_camino"),
    supabase.from(CASE_BUDGET_VIEW).select("case_id, city_id, donated_cop"),
  ]);

  if (error || !data) return [];

  const onTheWay = new Map(
    ((activity.data ?? []) as CityOfferActivity[]).map((row) => [row.city_id, row.en_camino]),
  );
  const donatedByCity = new Map<string, number>();
  for (const row of (raised.data ?? []) as { city_id: string; donated_cop: number }[]) {
    donatedByCity.set(row.city_id, (donatedByCity.get(row.city_id) ?? 0) + Number(row.donated_cop));
  }

  return (data as NestedCityRow[])
    .filter((city) => city.cases.length > 0)
    .map((city) => {
      const items = city.cases.flatMap((row) => row.budget_items ?? []);
      const covers = city.photos.filter((photo) => photo.case_id === null);
      return {
        ...city,
        coverPath: coverOf(covers),
        coverFrame: coverFrameOf(covers),
        caseCount: city.cases.length,
        needs: city.needs.map((need) => ({
          category: need.category,
          status: need.status,
          case_id: need.case_id,
        })),
        ...cityBoard(items, donatedByCity.get(city.id) ?? 0, onTheWay.get(city.id) ?? 0),
      };
    });
});

export async function getCityPage(slug: string, options: Options = {}): Promise<CityPage | null> {
  const supabase = await createSupabaseServerClient();

  const { data: city } = await supabase
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<City>();

  if (!city) return null;

  const [photos, needs, cases, updateLinks, raised] = await Promise.all([
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
        "*, photos!photos_case_id_fkey(id, storage_path, thumb_path, caption, sort_order, focus_x, focus_y, zoom), budget_items(id, case_id, city_id, title, amount_cop, purchased, purchased_on, sort_order, created_at)",
      )
      .eq("city_id", city.id)
      .order("created_at", { ascending: false }),
    supabase.from("case_updates").select("case_id, photo_id").eq("city_id", city.id),
    supabase.from(CASE_BUDGET_VIEW).select("case_id, donated_cop").eq("city_id", city.id),
  ]);

  const donatedByCase = new Map(
    ((raised.data ?? []) as { case_id: string; donated_cop: number }[]).map((row) => [
      row.case_id,
      Number(row.donated_cop),
    ]),
  );

  const allNeeds = (needs.data ?? []) as Need[];
  const allPhotos = (photos.data ?? []) as Photo[];

  type NestedCaseRow = Case & {
    photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "caption" | "sort_order" | "focus_x" | "focus_y" | "zoom">[];
    budget_items: BudgetItem[];
  };

  const cityCases = ((cases.data ?? []) as NestedCaseRow[]).map((row) => {
    const progress = ((updateLinks.data ?? []) as { case_id: string; photo_id: string | null }[])
      .filter((link) => link.case_id === row.id)
      .map((link) => ({ photo_id: link.photo_id }));
    const nestedPhotos = bySortOrder(row.photos ?? []);
    const casePhotos = situationPhotos(nestedPhotos, row.portrait_photo_id, progress);
    const budget = budgetProgress(row.budget_items ?? [], donatedByCase.get(row.id) ?? 0);
    return {
      ...row,
      photos: casePhotos,
      coverPath: coverOf(casePhotos),
      coverFrame: coverFrameOf(casePhotos),
      portraitPath: portraitOf(row.portrait_photo_id, nestedPhotos),
      portraitFrame: portraitFrameOf(row.portrait_photo_id, nestedPhotos),
      openNeeds: budget.pendingItems,
      budget,
      categories: [],
    };
  });

  // El portal no enseña un pueblo vacío. El panel sí: ahí se crea el municipio
  // antes de documentar la primera familia.
  if (!options.includeDrafts && cityCases.length === 0) return null;

  return {
    city,
    photos: allPhotos.filter((photo) => photo.case_id === null),
    zoneNeeds: allNeeds.filter((need) => need.case_id === null),
    caseNeeds: allNeeds.filter((need) => need.case_id !== null),
    // El orden de las fotos anidadas no lo garantiza la consulta —el `order` de
    // arriba es de los casos—, y aquí sí importa: es el del carrusel de esa
    // persona y el que el equipo dejó puesto en el panel.
    cases: cityCases,
  };
}

export async function getCasePage(slug: string, caseId: string): Promise<CasePage | null> {
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

  const [photos, needs, items, raised, updateRows, generalChannel] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("sort_order")
      .order("created_at"),
    supabase.from("needs").select("*").eq("case_id", caseRecord.id).order("created_at"),
    supabase
      .from("budget_items")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("sort_order")
      .order("created_at"),
    supabase.from(CASE_BUDGET_VIEW).select("donated_cop").eq("case_id", caseRecord.id).maybeSingle(),
    supabase
      .from("case_updates")
      .select("*")
      .eq("case_id", caseRecord.id)
      .order("happened_on", { ascending: true })
      .order("created_at", { ascending: true }),
    getGeneralChannel(),
  ]);

  const allPhotos = (photos.data ?? []) as Photo[];
  const budgetItems = (items.data ?? []) as BudgetItem[];
  const donated = Number((raised.data as { donated_cop?: number } | null)?.donated_cop ?? 0);
  const updates = withUpdatePhotos(
    (updateRows.data ?? []) as Omit<CaseUpdate, "photoPath" | "photoFrame">[],
    allPhotos,
  );

  return {
    city,
    caseRecord,
    photos: allPhotos,
    needs: (needs.data ?? []) as Need[],
    budgetItems,
    budget: budgetProgress(budgetItems, donated),
    updates,
    generalChannel,
    lastUpdateOn: lastUpdateOn(updates),
  };
}

// ---------------------------------------------------------------------------
// Vistas transversales: el inicio y las cuatro secciones
//
// Cada lista trae ya resuelto lo que su tarjeta enseña —portada, necesidades
// abiertas, categorías, municipio— para que ninguna pantalla tenga que volver a
// preguntar ni contar por su cuenta. Los números del inicio y el buscador se
// apoyan además en `getCityCards`, que abarca el portal entero en una consulta:
// solo los municipios con casos, así que es barato, y evita que dos
// pantallas cuenten distinto por haber filtrado cada una a su manera.
// ---------------------------------------------------------------------------

/** Los números del inicio. Ninguno se estima: todos son filas contadas. */
export async function getPortalTotals(): Promise<PortalTotals> {
  const cities = await getCityCards();
  const budget = mergeBudget(cities.map((city) => city.budget));

  return {
    cities: cities.length,
    cases: cities.reduce((sum, city) => sum + city.caseCount, 0),
    solvedCases: cities.reduce((sum, city) => sum + city.solvedCases, 0),
    openCases: cities.reduce((sum, city) => sum + city.openCases, 0),
    needs: budget.itemCount,
    coveredNeeds: budget.purchasedItems,
    openNeeds: budget.pendingItems,
    budget,
    updatedAt:
      cities.map((city) => city.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

/** Casos de todo el portal, del más reciente al más antiguo. */
export async function getCaseCards(): Promise<CaseCard[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data }, raised] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "*, cities(name, slug), photos!photos_case_id_fkey(id, storage_path, thumb_path, sort_order, focus_x, focus_y, zoom), budget_items(id, case_id, amount_cop, purchased)",
      )
      .order("updated_at", { ascending: false }),
    supabase.from(CASE_BUDGET_VIEW).select("case_id, donated_cop"),
  ]);

  const donatedByCase = new Map(
    ((raised.data ?? []) as { case_id: string; donated_cop: number }[]).map((row) => [
      row.case_id,
      Number(row.donated_cop),
    ]),
  );

  type Row = Case & {
    cities: Pick<City, "name" | "slug"> | null;
    photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "sort_order" | "focus_x" | "focus_y" | "zoom">[];
    budget_items: Pick<BudgetItem, "id" | "case_id" | "amount_cop" | "purchased">[];
  };

  return ((data ?? []) as Row[])
    .filter((row) => row.cities)
    .map((row) => {
      const first = [...(row.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
      const budget = budgetProgress(row.budget_items ?? [], donatedByCase.get(row.id) ?? 0);
      return {
        ...row,
        coverPath: first?.storage_path ?? null,
        coverFrame: first ? savedFrame(first) : null,
        portraitPath: portraitOf(row.portrait_photo_id, row.photos),
        portraitFrame: portraitFrameOf(row.portrait_photo_id, row.photos),
        openNeeds: budget.pendingItems,
        budget,
        categories: [],
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
  const rank = (need: T) => (isCoveredNeed(need) ? 2 : need.urgent ? 0 : 1);
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
/**
 * El registro público de donaciones confirmadas.
 *
 * Lee `donation_log` y no `donations`, por lo mismo que `getAidRecords()`: es
 * una vista sin referencia de pago, sin proveedor y sin las donaciones que
 * todavía no se confirmaron. El público no tiene permiso sobre la tabla, así
 * que aunque esta función se escribiera mal no podría sacar de aquí ni un
 * nombre sin autorizar: el recorte está en la vista y no en esta consulta.
 */
export async function getDonationLog(filters: {
  caseId?: string;
  cityId?: string;
  limit?: number;
  sort?: DonationLogSort;
} = {}): Promise<DonationLogEntry[]> {
  const limit = Math.min(Math.max(filters.limit ?? DONATION_LOG_LIMIT, 1), 50);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from(DONATION_LOG_VIEW)
    .select(
      "id, amount_cop, donated_at, donor_name, publish_name, destination, case_id, case_name, city_id, city_name, city_slug",
    );

  if (filters.caseId) query = query.eq("case_id", filters.caseId);
  if (filters.cityId) query = query.eq("city_id", filters.cityId);

  query =
    filters.sort === "generosas"
      ? query.order("amount_cop", { ascending: false }).order("donated_at", { ascending: false })
      : query.order("donated_at", { ascending: false }).order("id", { ascending: false });

  const { data } = await query.limit(limit);
  return ((data ?? []) as DonationLogEntry[]).map((row) => ({
    ...row,
    amount_cop: Number(row.amount_cop),
  }));
}

/** Cuántas donaciones confirmadas hay, sin recortar a las de la lista. */
export async function countDonationLog(filters: {
  caseId?: string;
  cityId?: string;
} = {}): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from(DONATION_LOG_VIEW).select("id", { count: "exact", head: true });
  if (filters.caseId) query = query.eq("case_id", filters.caseId);
  if (filters.cityId) query = query.eq("city_id", filters.cityId);

  const { count } = await query;
  return count ?? 0;
}

export async function getAidRecords(): Promise<AidRecord[]> {
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
