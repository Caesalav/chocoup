"use server";

import { redirect } from "next/navigation";
import { CASE_KINDS, NEED_CATEGORIES, PHOTO_BUCKET, TEAM_ROLES } from "@/lib/constants";
import { externalUrl, normalizePhone } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canWriteCity, currentTeam } from "@/lib/team";
import { uniqueSlug } from "@/lib/slug";
import { clampFrame, type PhotoFrame } from "@/lib/photo-frame";
import { today } from "./today";
import type { OfferStatus, TeamSession } from "@/lib/types";

/**
 * Autorización de todas las acciones del panel.
 *
 * Cada acción la comprueba por su cuenta y en el servidor. El proxy no basta —un
 * cambio de matcher dejaría las acciones sin cobertura— y el formulario menos:
 * cualquiera con sesión puede llamar a la API por su cuenta. Nada de lo que
 * llega del cliente afirma quién es ni qué municipio le corresponde; el rol y
 * las asignaciones se preguntan a la base de datos en cada llamada.
 *
 * Esto es la primera de dos barreras. La segunda son las RLS, que siguen
 * puestas: si algo de aquí se olvida, la base de datos rechaza la escritura.
 */

type Session = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  team: TeamSession;
};

async function requireTeam(): Promise<Session> {
  const team = await currentTeam();
  if (!team) throw new Error("Tu cuenta no está en la lista del equipo.");

  return { supabase: await createSupabaseServerClient(), team };
}

async function requireCoordination(): Promise<Session> {
  const session = await requireTeam();
  if (session.team.role !== "coordinacion") {
    throw new Error("Esto lo hace coordinación. Tu cuenta documenta municipios.");
  }
  return session;
}

/** Escribir en un municipio: coordinación en cualquiera, documentación en los suyos. */
async function requireCity(cityId: string | null): Promise<Session> {
  const session = await requireTeam();
  if (!canWriteCity(session.team, cityId)) {
    throw new Error(
      "Ese municipio no está entre los que tienes asignados. Pídeselo a coordinación.",
    );
  }
  return session;
}

/**
 * El municipio de una fila que ya existe, leído de la base de datos.
 *
 * Es lo que permite no fiarse del formulario: para editar una necesidad llega su
 * id, y el municipio al que pertenece se averigua aquí. Si llegara en un campo
 * oculto, bastaría cambiarlo para escribir donde no toca.
 */
async function cityOfRow(
  table: "cases" | "needs" | "photos" | "offers" | "case_updates" | "budget_items",
  id: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from(table).select("city_id").eq("id", id).maybeSingle();
  const cityId = (data as { city_id: string | null } | null)?.city_id;
  return typeof cityId === "string" ? cityId : null;
}

/** Como requireCity, pero resolviendo el municipio desde la fila. */
async function requireRowCity(
  table: "cases" | "needs" | "photos" | "offers" | "case_updates" | "budget_items",
  id: string,
): Promise<Session> {
  return requireCity(await cityOfRow(table, id));
}

/**
 * Comprueba que el caso al que se cuelga una foto o una necesidad sea de ese
 * municipio. Sin esto, mandando el municipio propio en un campo y el id de un
 * caso ajeno en el otro, la fila pasaría las políticas —que miran `city_id`— y
 * saldría en la ficha de una familia de otro pueblo. La base de datos lo rechaza
 * igual (disparador needs_case_belongs_to_city), pero el error se entiende mejor
 * aquí.
 */
async function caseInCity(caseId: string | null, cityId: string): Promise<string | null> {
  if (!caseId) return null;
  if ((await cityOfRow("cases", caseId)) !== cityId) {
    throw new Error("Ese caso no es de este municipio.");
  }
  return caseId;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function optionalId(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function fail(message: string, error: { message: string } | null): never {
  throw new Error(`${message}: ${error?.message ?? "error desconocido"}`);
}

// ---------------------------------------------------------------------------
// Ciudades
// ---------------------------------------------------------------------------

export async function createCity(formData: FormData) {
  // Crear un municipio es abrir un frente de trabajo, y quien lo abre decide
  // también quién lo atiende: es de coordinación.
  const { supabase } = await requireCoordination();

  const name = text(formData, "name");
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Falta el nombre o la ubicación del municipio.");
  }

  const { data: existing } = await supabase.from("cities").select("slug");
  const slug = uniqueSlug(name, (existing ?? []).map((row) => row.slug as string));

  const { error } = await supabase.from("cities").insert({ name, slug, lat, lng });
  if (error) fail("No se pudo crear el municipio", error);

  redirect(`/admin/ciudades/${slug}`);
}

export async function updateCity(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el municipio.");

  const { supabase, team } = await requireCity(id);

  const values: Record<string, unknown> = {
    name: text(formData, "name"),
    summary: text(formData, "summary"),
  };

  // Publicar saca a la calle las fotos y las historias de personas
  // identificables: es la decisión editorial del portal y la toma coordinación.
  // Quien documenta no manda el campo, y si lo mandara no se mira: sin esto, un
  // formulario sin la casilla despublicaría el municipio al guardar. La base de
  // datos lo rechazaría igual (disparador cities_guard_publication).
  if (team.role === "coordinacion") {
    values.published = bool(formData, "published");
  }

  // Si el mapa no cargó y los campos llegan vacíos, se conserva la ubicación
  // guardada en vez de mandar el municipio a las coordenadas 0,0.
  const lat = Number(text(formData, "lat"));
  const lng = Number(text(formData, "lng"));
  if (text(formData, "lat") && text(formData, "lng") && Number.isFinite(lat) && Number.isFinite(lng)) {
    values.lat = lat;
    values.lng = lng;
  }

  const { error } = await supabase.from("cities").update(values).eq("id", id);
  if (error) fail("No se pudo guardar el municipio", error);
}

export async function deleteCity(formData: FormData) {
  // Se lleva por delante fotos, casos y necesidades de gente real.
  const { supabase } = await requireCoordination();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el municipio.");

  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) fail("No se pudo borrar el municipio", error);

  // A la lista de municipios y no a la puerta: quien acaba de borrar uno está
  // trabajando en Ciudades y lo siguiente que quiere ver es la lista sin él.
  redirect("/admin/ciudades");
}

// ---------------------------------------------------------------------------
// El canal de donación de un caso y el general del portal
//
// Es la escritura más peligrosa del panel, y no por lo que borra: no borra nada.
// Quien la toque cambia a dónde va el dinero de una persona con nombre y cara
// publicados —o el de todas las causas del portal a la vez, en el general— y el
// cambio no se nota mirando la pantalla, porque un canal nuevo se ve igual de
// bien que el bueno.
//
// Por eso es de coordinación, y en tres capas que no dependen entre sí: la ficha
// no ofrece el campo, esto lo rechaza, y la base de datos lo para aunque la
// llamada llegue desde fuera de la web. Esa tercera capa no es la misma en los
// dos niveles y conviene saber por qué:
//
//   * En un caso es el disparador `guard_donation_channel` (0011, ampliado en
//     0013), y no basta con la política: quien documenta ese municipio SÍ puede
//     escribir el resto de la ficha, así que la escritura entera pasa y el canal
//     necesita su propia comprobación dentro de ella.
//
//   * En el general basta la política `donation_channel_coordination` (0015),
//     porque esa tabla no tiene ninguna otra escritura legítima que pudiera
//     arrastrar el canal dentro.
//
// Los dos pasan por la misma validación porque el dato es el mismo y las trampas
// también. Escribir dos versiones sería dejar que una se quedara sin lo que la
// otra aprendió.
//
// Y los dos escriben una sexta columna desde 0016: el día en que alguien
// comprobó de verdad ese destino. Hay un comportamiento de la base de datos que
// se nota desde aquí y que el formulario tiene que contar con palabras: si el
// destino cambia y la fecha llega igual que la guardada, la fecha se borra sola
// (`guard_channel_verification`). No es un capricho —una comprobación es un acto
// sobre un destino concreto, y con otro destino delante ese acto no ha
// ocurrido— y es lo que impide el fallo silencioso de una ficha que dice
// «Comprobado el 3 de agosto» debajo de una llave cambiada el 12 de septiembre.
// El caso normal, cambiar la llave y anotar la comprobación de la nueva en el
// mismo envío, funciona: la fecha llega distinta y se respeta.
// ---------------------------------------------------------------------------

/**
 * Las columnas del canal, leídas del formulario y comprobadas.
 *
 * Las validaciones no son de forma: son la confusión concreta que hace falta
 * evitar, que es una llave escrita donde va un enlace o un teléfono, o al
 * revés. Una llave metida en el campo del enlace sale como `https://@soschoco`
 * —eso hace `externalUrl()` con lo que no trae esquema—, y eso es un enlace
 * válido que no lleva a ninguna parte: se pulsa, no da error y el dinero no
 * sale. Por eso se rechaza aquí, que es el único sitio donde todavía se puede
 * decir qué pasó.
 *
 * Vaciar el canal tiene que ser tan fácil como ponerlo: si un destino se
 * compromete, lo primero es que el portal deje de enseñarlo, y eso no puede
 * depender de tener a mano el siguiente. Los tres campos en blanco dejan la
 * ficha sin canal en la misma petición, y la pantalla pública pasa a decir que
 * todavía no hay a dónde enviar.
 *
 * La fecha de comprobación entra por aquí y no por el formulario grande de la
 * ficha, y va con las otras cinco columnas por lo que dejó escrito 0016:
 * comprobar es un acto sobre un destino concreto, así que cambiar el destino y
 * afirmar que está comprobado son la misma clase de escritura y tienen que estar
 * en el mismo círculo pequeño. Quien documenta no ve ninguno de los seis campos.
 */
function donationChannelValues(formData: FormData) {
  const key = text(formData, "donation_key");
  const url = text(formData, "donation_url");
  const phoneRaw = text(formData, "donation_phone");
  const app = text(formData, "donation_app");
  const holder = text(formData, "donation_holder");
  const verifiedOn = text(formData, "donation_verified_on");

  const filled = [key, url, phoneRaw].filter(Boolean).length;
  if (filled > 1) {
    throw new Error(
      "Un canal es una llave, un enlace o un número, no dos a la vez. Deja solo el que se vaya a usar: con dos puestos no habría forma de saber cuál recibe.",
    );
  }

  if (key) {
    if (/^https?:\/\//i.test(key) || key.includes("/")) {
      throw new Error(
        "Eso parece un enlace y no una llave. Pégalo en el campo del enlace de recaudación.",
      );
    }
    if (/^\+?\d[\d\s.-]*$/.test(key) && key.replace(/\D/g, "").length >= 10) {
      throw new Error(
        "Eso parece un teléfono. Pégalo en el campo del número de contacto.",
      );
    }
    if (/\s/.test(key)) {
      throw new Error("Una llave no lleva espacios. Revisa lo que pegaste antes de guardar.");
    }
    if (key.length > 64) {
      throw new Error(
        "Esa llave es demasiado larga para ser una llave. Comprueba que no sobra nada.",
      );
    }
  }

  // Un enlace tiene que tener dominio. `externalUrl()` acepta lo que sea y le
  // pone `https://` delante, así que sin esto una llave pegada aquí pasaría por
  // enlace y el botón «Donar dinero» apuntaría a ninguna parte.
  if (url) {
    const href = externalUrl(url);
    const host = href ? new URL(href).hostname : "";
    if (!host.includes(".")) {
      throw new Error(
        "Eso no parece un enlace: le falta el dominio. Si es una llave de transferencia, va en el campo de la llave.",
      );
    }
  }

  let phone = "";
  if (phoneRaw) {
    if (/^https?:\/\//i.test(phoneRaw) || phoneRaw.includes("@")) {
      throw new Error(
        "Eso no es un teléfono. Si es una llave o un enlace, va en su propio campo.",
      );
    }
    const international = normalizePhone(phoneRaw);
    const local =
      international.length === 12 && international.startsWith("57")
        ? international.slice(2)
        : international;
    if (!(local.length === 10 && local.startsWith("3"))) {
      throw new Error(
        "Eso no parece un móvil colombiano. Van diez dígitos que empiezan por 3.",
      );
    }
    phone = local;
  }

  // Una comprobación es algo que ya ocurrió, así que no puede estar fechada
  // mañana. El disparador `guard_channel_verification` (0016) lo rechaza igual, y
  // se comprueba aquí porque el error de la base de datos habla de un código de
  // estado y este dice qué es lo que no cuadra. Lo que se está fechando es la
  // frase que el portal pone para que alguien se fíe: adelantarla dos meses le
  // regala dos meses de vigencia a una comprobación que no se ha hecho.
  if (verifiedOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedOn)) {
      throw new Error("La fecha de comprobación del canal no tiene el formato de una fecha.");
    }
    if (verifiedOn > today()) {
      throw new Error(
        "Esa comprobación está en el futuro. Se anota el día en que alguien llamó al número o mandó el dinero de prueba, no el día en que piensa hacerlo.",
      );
    }
  }

  return {
    donation_key: key,
    donation_url: url,
    donation_phone: phone,
    donation_app: app,
    donation_holder: holder,
    // Vacío se guarda como nulo y no como cadena vacía: la columna es `date` y
    // nulo es su estado normal —nadie lo ha comprobado—, que es lo que
    // `channelCheck()` lee para callar en vez de afirmar nada.
    donation_verified_on: verifiedOn || null,
  };
}

/**
 * Ninguna fila tocada con la llamada aceptada significa que la rechazó la RLS. Un
 * update que no encuentra fila no da error, así que sin esto guardar sin permiso
 * se leería como guardar bien: la pantalla volvería con el canal viejo y sin decir
 * por qué.
 */
function assertChannelSaved(rows: unknown[] | null) {
  if (!rows || rows.length === 0) {
    throw new Error(
      "La base de datos no dejó cambiar el canal. Comprueba que tu cuenta sigue siendo de coordinación.",
    );
  }
}

/**
 * El canal general: el destino con más alcance del portal.
 *
 * Es un `update` y nunca un `insert`: la fila la creó la migración y es única
 * (`donation_channel_one_row`, 0015). Ni esta acción ni la base de datos permiten
 * crear una segunda, porque «el canal general» tiene que poder señalar a una sola
 * cosa; con dos filas volvería a ser «la primera que devuelva la consulta».
 *
 * `singleton` se escribe en el `where` y no en los valores: es la clave y no un
 * campo editable. Sin `.eq()` el update alcanzaría la tabla entera, que hoy es la
 * misma fila y mañana podría no serlo.
 */
export async function saveGeneralDonationChannel(formData: FormData) {
  const { supabase } = await requireCoordination();

  const { data, error } = await supabase
    .from("donation_channel")
    .update(donationChannelValues(formData))
    .eq("singleton", true)
    .select("singleton");

  if (error) fail("No se pudo guardar el canal general", error);
  assertChannelSaved(data);
}

export async function saveCaseDonationChannel(formData: FormData) {
  const { supabase } = await requireCoordination();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el caso.");

  const { data, error } = await supabase
    .from("cases")
    .update(donationChannelValues(formData))
    .eq("id", id)
    .select("id");

  if (error) fail("No se pudo guardar el canal del caso", error);
  assertChannelSaved(data);
}

/**
 * El recado del momento. Un `update` y nunca un `insert`: la fila la creó la
 * migración y es única. Vaciar ciudad y causa es válido: entonces el aviso
 * del inicio cae en el pueblo más atrasado.
 *
 * Si llega una causa, el municipio se lee de esa fila y no del formulario.
 * Marcar una familia de Quibdó y un pueblo distinto sería un recado que
 * señala dos sitios.
 */
export async function saveCampaignFocus(formData: FormData) {
  const { supabase } = await requireCoordination();
  let cityId = optionalId(formData, "city_id");
  const caseId = optionalId(formData, "case_id");
  const note = text(formData, "note").slice(0, 280);

  if (caseId) {
    const { data } = await supabase.from("cases").select("city_id").eq("id", caseId).maybeSingle();
    const fromCase = (data as { city_id: string } | null)?.city_id;
    if (!fromCase) throw new Error("Esa causa no existe.");
    cityId = fromCase;
  }

  const { data, error } = await supabase
    .from("campaign_focus")
    .update({ city_id: cityId, case_id: caseId, note })
    .eq("singleton", true)
    .select("singleton");

  if (error) fail("No se pudo guardar el foco", error);
  assertChannelSaved(data);
}

// ---------------------------------------------------------------------------
// Necesidades
// ---------------------------------------------------------------------------

export async function createNeed(formData: FormData) {
  const cityId = optionalId(formData, "city_id");
  if (!cityId) throw new Error("Falta el municipio.");

  const { supabase } = await requireCity(cityId);
  const caseId = await caseInCity(optionalId(formData, "case_id"), cityId);

  const { error } = await supabase.from("needs").insert({
    city_id: cityId,
    case_id: caseId,
    category: text(formData, "category") || "otro",
    title: text(formData, "title"),
    details: text(formData, "details"),
    quantity: text(formData, "quantity"),
    urgent: bool(formData, "urgent"),
  });

  if (error) fail("No se pudo añadir la necesidad", error);
}

export async function updateNeed(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la necesidad.");

  const { supabase } = await requireRowCity("needs", id);

  const { error } = await supabase
    .from("needs")
    .update({ status: text(formData, "status") })
    .eq("id", id);

  if (error) fail("No se pudo actualizar la necesidad", error);
}

export async function deleteNeed(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la necesidad.");

  const { supabase } = await requireRowCity("needs", id);

  const { error } = await supabase.from("needs").delete().eq("id", id);
  if (error) fail("No se pudo borrar la necesidad", error);
}

function copAmount(formData: FormData, key: string): number {
  const digits = text(formData, key).replace(/\D/g, "");
  return Number(digits);
}

export async function createBudgetItem(formData: FormData) {
  const cityId = optionalId(formData, "city_id");
  const caseId = optionalId(formData, "case_id");
  if (!cityId || !caseId) throw new Error("Falta la causa.");

  const { supabase } = await requireCity(cityId);
  await caseInCity(caseId, cityId);

  const amount = copAmount(formData, "amount_cop");
  if (!Number.isFinite(amount) || amount < 1) {
    throw new Error("El precio tiene que ser un número en pesos, mayor que cero.");
  }

  const { error } = await supabase.from("budget_items").insert({
    city_id: cityId,
    case_id: caseId,
    title: text(formData, "title"),
    amount_cop: amount,
  });

  if (error) fail("No se pudo añadir el ítem", error);
}

export async function toggleBudgetItem(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el ítem.");

  const { supabase } = await requireRowCity("budget_items", id);
  const purchased = bool(formData, "purchased");

  const { error } = await supabase
    .from("budget_items")
    .update({ purchased })
    .eq("id", id);

  if (error) fail("No se pudo actualizar el ítem", error);
}

export async function deleteBudgetItem(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el ítem.");

  const { supabase } = await requireRowCity("budget_items", id);
  const { error } = await supabase.from("budget_items").delete().eq("id", id);
  if (error) fail("No se pudo borrar el ítem", error);
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

/**
 * Qué es la causa, comprobado contra la lista del desplegable.
 *
 * Llega de un formulario, así que puede llegar cualquier cosa —o nada, si el
 * campo se queda fuera del envío—, y `cases_kind_valid` (0016) lo rechazaría con
 * un error que habla de una restricción y no de lo que hay que arreglar. Vacío
 * cae en 'persona' y no en un error: es lo que son todas las causas escritas
 * hasta hoy y es el valor por omisión de la columna, así que un formulario viejo
 * que no traiga el campo sigue guardando.
 */
function caseKind(formData: FormData): string {
  const value = text(formData, "case_kind");
  if (!value) return "persona";
  if (!CASE_KINDS.some((kind) => kind.value === value)) {
    throw new Error("Ese tipo de causa no existe.");
  }
  return value;
}

/**
 * La frase que viaja por WhatsApp, con su límite comprobado aquí.
 *
 * Se rechaza en vez de recortar. Recortar sería exactamente el fallo que este
 * campo vino a resolver —una frase cortada donde cae— y encima sin decirlo, así
 * que quien la escribió creería que se guardó entera. El `maxlength` del
 * formulario no basta: no viaja en una llamada a la API, que es por lo que
 * `cases_summary_len` (0016) existe. Esto es para que el error se lea.
 */
function caseSummary(formData: FormData): string {
  const value = text(formData, "summary");
  if (value.length > 120) {
    throw new Error(
      `Ese resumen tiene ${value.length} caracteres y caben 120: es la frase que sale en la vista previa de WhatsApp y ahí se corta. Quítale ${value.length - 120}.`,
    );
  }
  return value;
}

/**
 * Abre la causa y devuelve quién es, sin saltar de página.
 *
 * El formulario de «Nuevo caso» sube las fotos en el navegador justo después,
 * y para eso necesita el identificador. Sin JavaScript el envío sigue yendo
 * por `createCase`, que redirige a la ficha como siempre.
 */
export async function createCaseRecord(formData: FormData): Promise<{
  id: string;
  slug: string;
  cityId: string;
}> {
  const cityId = optionalId(formData, "city_id");
  if (!cityId) throw new Error("Falta el municipio.");

  const { supabase } = await requireCity(cityId);

  const { data: city } = await supabase.from("cities").select("slug").eq("id", cityId).maybeSingle();
  const slug = (city as { slug: string } | null)?.slug ?? text(formData, "city_slug");
  if (!slug) throw new Error("No se encontró ese municipio.");

  // Sin canal de donación, y no es un olvido: un caso nace sin él y lo pone
  // coordinación después, desde la ficha. Mandarlo aquí lo rechazaría el
  // disparador `guard_donation_channel` para quien documenta, que es quien crea
  // casi todos los casos.
  const { data, error } = await supabase
    .from("cases")
    .insert({
      city_id: cityId,
      display_name: text(formData, "display_name"),
      case_kind: caseKind(formData),
      household: text(formData, "household"),
      summary: caseSummary(formData),
      story: text(formData, "story"),
      consent_to_publish: bool(formData, "consent_to_publish"),
    })
    .select("id")
    .single();

  if (error || !data) fail("No se pudo crear el caso", error);

  return { id: data.id, slug, cityId };
}

export async function createCase(formData: FormData) {
  const created = await createCaseRecord(formData);
  redirect(`/admin/ciudades/${created.slug}/casos/${created.id}`);
}

export async function updateCase(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el caso.");

  const { supabase } = await requireRowCity("cases", id);

  const consent = bool(formData, "consent_to_publish");
  const published = bool(formData, "published");

  if (published && !consent) {
    throw new Error("Un caso no se puede publicar sin el consentimiento de la persona.");
  }

  // El canal de donación no va en este update, y quitarlo de aquí no fue una
  // limpieza: mandarlo rompía el formulario. Quien documenta no ve ese campo, así
  // que llegaría vacío, y un vacío distinto de lo guardado es un cambio de canal
  // que el disparador rechaza —con la ficha entera detrás—. Se guarda aparte, en
  // `saveCaseDonationChannel`.
  //
  // La fecha de comprobación tampoco va aquí, y es el mismo razonamiento con una
  // vuelta más: quien documenta no la ve, así que llegaría vacía, y un nulo
  // distinto de la fecha guardada es también un cambio que `guard_donation_channel`
  // rechaza desde 0016. Y aunque quien guardara fuera coordinación, pasarla por
  // este formulario borraría la comprobación al corregir una tilde en la historia.
  //
  // El tipo y el resumen sí: son de la ficha y los escribe quien la escribe.
  const { error } = await supabase
    .from("cases")
    .update({
      display_name: text(formData, "display_name"),
      case_kind: caseKind(formData),
      household: text(formData, "household"),
      summary: caseSummary(formData),
      story: text(formData, "story"),
      consent_to_publish: consent,
      published,
    })
    .eq("id", id);

  if (error) fail("No se pudo guardar el caso", error);
}

export async function deleteCase(formData: FormData) {
  const id = optionalId(formData, "id");
  const slug = text(formData, "city_slug");
  if (!id) throw new Error("Falta el caso.");

  const { supabase } = await requireRowCity("cases", id);

  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) fail("No se pudo borrar el caso", error);

  redirect(`/admin/ciudades/${slug}`);
}

// ---------------------------------------------------------------------------
// Diario de seguimiento
// ---------------------------------------------------------------------------

export async function createCaseUpdate(formData: FormData) {
  const cityId = optionalId(formData, "city_id");
  if (!cityId) throw new Error("Falta el municipio.");

  const { supabase } = await requireCity(cityId);
  const caseId = await caseInCity(optionalId(formData, "case_id"), cityId);
  if (!caseId) throw new Error("Falta el caso.");

  const happenedOn = text(formData, "happened_on");
  const title = text(formData, "title");
  const body = text(formData, "body");
  const photoId = optionalId(formData, "photo_id");
  if (!happenedOn || !title || !body) {
    throw new Error("Cada avance necesita fecha, título y descripción.");
  }
  if (!photoId) {
    throw new Error("Cada avance necesita una fotografía.");
  }

  const { error } = await supabase.from("case_updates").insert({
    city_id: cityId,
    case_id: caseId,
    happened_on: happenedOn,
    title,
    body,
    photo_id: photoId,
  });

  if (error) fail("No se pudo añadir el avance", error);
}

export async function updateCaseUpdate(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el avance.");

  const { supabase } = await requireRowCity("case_updates", id);
  const happenedOn = text(formData, "happened_on");
  const title = text(formData, "title");
  const body = text(formData, "body");
  if (!happenedOn || !title || !body) {
    throw new Error("Cada avance necesita fecha, título y descripción.");
  }

  const patch: {
    happened_on: string;
    title: string;
    body: string;
    photo_id?: string;
  } = { happened_on: happenedOn, title, body };

  const photoId = optionalId(formData, "photo_id");
  if (photoId) patch.photo_id = photoId;

  const { error } = await supabase.from("case_updates").update(patch).eq("id", id);

  if (error) fail("No se pudo guardar el avance", error);
}

export async function deleteCaseUpdate(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la nota.");

  const { supabase } = await requireRowCity("case_updates", id);

  const { error } = await supabase.from("case_updates").delete().eq("id", id);
  if (error) fail("No se pudo borrar la nota", error);
}

// ---------------------------------------------------------------------------
// Fotos
//
// El navegador sube el archivo comprimido directo a Storage y luego registra
// la fila. Así el archivo no pasa por el servidor de Next.
// ---------------------------------------------------------------------------

export async function registerPhoto(input: {
  cityId: string;
  caseId: string | null;
  storagePath: string;
  thumbPath?: string;
  frame?: PhotoFrame | null;
  byteSize?: number;
  thumbByteSize?: number;
}): Promise<string> {
  const { supabase } = await requireCity(input.cityId);
  const caseId = await caseInCity(input.caseId, input.cityId);
  const frame = input.frame ? clampFrame(input.frame) : null;
  const byteSize = Math.max(0, Math.round(input.byteSize ?? 0));
  const thumbByteSize = Math.max(0, Math.round(input.thumbByteSize ?? 0));

  const row = {
    city_id: input.cityId,
    case_id: caseId,
    storage_path: input.storagePath,
    thumb_path: input.thumbPath ?? "",
    ...(frame
      ? { focus_x: frame.focusX, focus_y: frame.focusY, zoom: frame.zoom }
      : {}),
  };

  let { data, error } = await supabase
    .from("photos")
    .insert({ ...row, byte_size: byteSize, thumb_byte_size: thumbByteSize })
    .select("id")
    .single();

  // 0022 todavía no está: la foto no puede perderse por una columna nueva.
  if (error && /byte_size/.test(error.message)) {
    ({ data, error } = await supabase.from("photos").insert(row).select("id").single());
  }

  if (error || !data) fail("No se pudo registrar la foto", error);
  return data.id as string;
}

export async function savePhotoCaption(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la foto.");

  const { supabase } = await requireRowCity("photos", id);

  const { error } = await supabase
    .from("photos")
    .update({
      caption: text(formData, "caption"),
      sort_order: Number(text(formData, "sort_order")) || 0,
    })
    .eq("id", id);

  if (error) fail("No se pudo guardar el pie de foto", error);
}

/**
 * Guarda o borra el encuadre de una foto.
 *
 * El archivo no se toca: se escriben tres números, o se dejan nulos para volver
 * al recorte por omisión de la caja. Ver 0009_encuadre_de_fotos.sql.
 */
export async function savePhotoFrame(input: {
  id: string;
  frame: PhotoFrame | null;
}) {
  const { supabase } = await requireRowCity("photos", input.id);
  const frame = input.frame ? clampFrame(input.frame) : null;

  const { error } = await supabase
    .from("photos")
    .update(
      frame
        ? { focus_x: frame.focusX, focus_y: frame.focusY, zoom: frame.zoom }
        : { focus_x: null, focus_y: null, zoom: null },
    )
    .eq("id", input.id);

  if (error) fail("No se pudo guardar el encuadre", error);
}

/**
 * Marca cuál de las fotos de una persona es su retrato.
 *
 * No se sube una foto de perfil aparte: se elige una de las que ya están en el
 * caso. El motivo es que el retrato NO se puede tomar por convenio —«la primera
 * foto»—, porque la primera foto de una casa es la casa: la pared caída, el techo
 * apoyado en la viga. Sin esta elección, la tarjeta de una familia enseñaba un
 * recorte redondo de escombros donde tiene que ir una persona.
 *
 * El municipio se saca de la fila del caso y no del formulario (`requireRowCity`),
 * así que quien documenta solo puede marcar el retrato de los suyos. La base de
 * datos lo rechazaría igual —`cases_assigned_update` de 0002—, y el disparador
 * `cases_portrait_belongs_to_case` rechaza además que el retrato sea una foto de
 * otra persona. Aquí se comprueba lo mismo antes para que el error se entienda.
 *
 * Sin foto elegida se guarda nulo, que es un estado válido y frecuente: quitar el
 * retrato tiene que ser tan fácil como ponerlo, porque puede haber que hacerlo
 * deprisa y delante de la familia.
 */
export async function setCasePortrait(formData: FormData) {
  const caseId = optionalId(formData, "case_id");
  if (!caseId) throw new Error("Falta el caso.");

  const { supabase } = await requireRowCity("cases", caseId);

  const photoId = optionalId(formData, "photo_id");

  if (photoId) {
    const { data } = await supabase
      .from("photos")
      .select("case_id")
      .eq("id", photoId)
      .maybeSingle();

    if ((data as { case_id: string | null } | null)?.case_id !== caseId) {
      throw new Error("Esa foto no es de esta persona, así que no puede ser su retrato.");
    }
  }

  const { error } = await supabase
    .from("cases")
    .update({ portrait_photo_id: photoId })
    .eq("id", caseId);

  if (error) fail("No se pudo guardar el retrato", error);
}

export async function deletePhoto(formData: FormData) {
  const id = optionalId(formData, "id");
  const paths = [text(formData, "storage_path"), text(formData, "thumb_path")].filter(Boolean);
  if (!id) throw new Error("Falta la foto.");

  const { supabase } = await requireRowCity("photos", id);

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) fail("No se pudo borrar la foto", error);

  // Las rutas llegan del formulario, así que aquí no se puede saber si son las de
  // esta foto. Lo que impide borrar la de otro municipio es la política del
  // bucket, que compara la carpeta del archivo con los municipios asignados.
  //
  // Si algún archivo queda huérfano no rompe nada, así que no se aborta por esto.
  if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

// ---------------------------------------------------------------------------
// Ofertas
//
// Aquí había UNA acción para todo, y la bandeja obligaba a rellenar cinco campos
// y pulsar «Guardar» para cualquier cosa: aceptar una oferta era mandar el estado,
// la necesidad, la fecha, las notas y la casilla del nombre en el mismo envío. Con
// esa forma, `withdrawOffer` tuvo que nacer aparte —un clic no puede borrar las
// notas del equipo al pasar— y esa excepción era en realidad el diseño correcto
// para las tres decisiones que se toman aquí.
//
// Ahora cada decisión tiene su acción y escribe una columna. No es una cuestión de
// elegancia: quien las usa está en campo, con el teléfono en una mano y mala
// señal, y aceptar una oferta tiene que ser un toque cuyo alcance se pueda leer
// del botón. Lo que queda en `updateOffer` es lo que de verdad se rellena —la
// fecha exacta, la necesidad que cubre, las notas, quitar el nombre— y sigue
// escribiendo todo lo que le llega, así que sigue necesitando que el formulario le
// mande esos campos completos.
//
// Las tres capas se mantienen en las cuatro acciones nuevas: el municipio se lee
// de la fila con `requireRowCity` y nunca del formulario, `offers_scoped_update`
// (0002) lo rechazaría igual, y `offers_delivery_requires_acceptance` (0002) sigue
// impidiendo que lo rechazado o lo retirado figure como entregado.
// ---------------------------------------------------------------------------

/**
 * El estado guardado de una oferta, que es el único que manda.
 *
 * Las acciones de un toque no reciben el estado actual del formulario, y eso es lo
 * que las hace seguras: si llegara en un campo oculto, dos personas mirando la
 * misma bandeja se pisarían —la segunda escribiría sobre una decisión que ya no es
 * la que tenía en pantalla— y bastaría cambiar el campo para saltarse las reglas
 * de abajo. Se pregunta a la base de datos en cada llamada, igual que el municipio.
 */
async function offerRow(
  supabase: Session["supabase"],
  id: string,
): Promise<{ status: OfferStatus; delivered_on: string | null }> {
  const { data } = await supabase
    .from("offers")
    .select("status, delivered_on")
    .eq("id", id)
    .maybeSingle();

  const row = data as { status: OfferStatus; delivered_on: string | null } | null;
  if (!row) {
    throw new Error(
      "Esa oferta ya no está en tu bandeja: la borraron, o la vincularon a una necesidad de otro municipio. Vuelve a cargar la lista.",
    );
  }
  return row;
}

/**
 * Cambia el estado de una oferta y nada más.
 *
 * UNA columna. Es la lección de `withdrawOffer` aplicada a las otras tres: un
 * toque no puede arrastrar la fecha de entrega, las notas ni el vínculo con la
 * necesidad, porque lo que no le llega a un `update` amplio le llega vacío.
 *
 * Si el estado guardado ya es el que se pide, no se escribe nada. Con mala señal
 * el segundo toque es la respuesta normal a un botón que tarda, y así el segundo
 * toque no es una escritura más ni un error: es la misma decisión otra vez.
 *
 * `OfferStatus` en vez de comprobar contra `OFFER_STATUSES`: aquí el valor no
 * llega del formulario, lo pone cada acción, así que un estado que no exista no
 * compila. La comprobación en tiempo de ejecución era necesaria mientras el estado
 * venía de un desplegable.
 */
async function setOfferStatus(
  formData: FormData,
  status: OfferStatus,
  deniedWhenDelivered: string,
) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  // El municipio de la oferta se lee de la fila. Una oferta sin municipio —"un
  // camión disponible", sin destino todavía— es de coordinación.
  const { supabase } = await requireRowCity("offers", id);
  const row = await offerRow(supabase, id);

  // Una entrega registrada no se deshace cambiando el estado: sería borrar que
  // aquello llegó. `offers_delivery_requires_acceptance` (0002) lo rechaza, y aquí
  // se dice qué hacer en vez de devolver el nombre de una restricción.
  if (status !== "aceptada" && row.delivered_on) throw new Error(deniedWhenDelivered);

  if (row.status === status) return;

  const patch: { status: OfferStatus; on_wall?: boolean } = { status };
  if (status === "retirada" || status === "rechazada") patch.on_wall = false;
  if (status === "pendiente" || status === "aceptada") patch.on_wall = true;

  const { error } = await supabase.from("offers").update(patch).eq("id", id);
  if (error) fail("No se pudo cambiar el estado de la oferta", error);
}

/**
 * Aceptar: el equipo habló con quien ofrece y cuenta con lo que ofrece.
 *
 * Publica además su nombre en el muro, si esa persona lo autorizó: la vista
 * `public.offer_log` (0012) solo lo saca con las dos cosas juntas —autorización y
 * oferta aceptada—, así que este toque tiene una consecuencia pública que no está
 * en la palabra «aceptar». La bandeja lo escribe al lado del botón.
 */
export async function acceptOffer(formData: FormData) {
  await setOfferStatus(
    formData,
    "aceptada",
    "Esa ayuda ya está registrada como entregada, así que ya estaba aceptada.",
  );
}

/**
 * Negar: el equipo lo miró y decidió que no. No es lo mismo que retirar.
 *
 * Rechazar es un juicio sobre lo que se ofrecía y es el campo con el que después
 * se le responde a esa persona; retirar es una baja del muro sin dictaminar nada.
 * Ver `OfferStatus` en lib/types.ts.
 */
export async function rejectOffer(formData: FormData) {
  await setOfferStatus(
    formData,
    "rechazada",
    "Esa ayuda ya está registrada como entregada: negarla ahora borraría que llegó. Si la fecha está mal, quítala en «Más cosas de esta oferta».",
  );
}

/**
 * Devolver una oferta a la bandeja de pendientes.
 *
 * Es lo que deshace un «Negar» o un «Quitar del muro», y tiene que existir en un
 * toque por lo que dejó escrito `withdrawOffer`: un botón que esconde lo que toca
 * se usa con miedo si no hay forma rápida de reponerlo. La asimetría sigue siendo
 * la de antes —quitar de más se arregla en veinte segundos y publicar de más ya lo
 * ha leído alguien— y por eso reponer está en la ficha de la oferta y no en la
 * fila de arriba.
 */
export async function reopenOffer(formData: FormData) {
  await setOfferStatus(
    formData,
    "pendiente",
    "Esa ayuda ya llegó, así que no vuelve a la bandeja de pendientes. Si la fecha está mal, quítala en «Más cosas de esta oferta».",
  );
}

/**
 * Quita una oferta del muro público, de un toque.
 *
 * Es la salida rápida que necesita un muro que no está moderado: desde 0012 una
 * oferta se publica en /ofrecido en cuanto entra —sin contacto y con los
 * teléfonos del texto tapados, pero sin que nadie la haya leído—, así que la
 * bandeja tiene que poder sacarla en un gesto y no en tres. `retirada` y no
 * `rechazada`: rechazar dice que el equipo habló con esa persona y decidió, y es
 * el campo con el que después se le responde.
 *
 * No pide confirmación, al contrario que borrar, porque no se pierde nada: la
 * fila se queda en la bandeja con su contacto y sus notas, se lista en el filtro
 * de retiradas, y `reopenOffer` la repone de un toque.
 *
 * Que la oferta esté de verdad en el muro depende también de la caducidad de ocho
 * semanas y de que su municipio siga publicado (0012). Eso no se recalcula aquí:
 * una copia de ese filtro en el panel se separaría de la vista sin avisar, y lo
 * que este botón decide es lo único que decide el equipo, que es el estado.
 */
export async function withdrawOffer(formData: FormData) {
  await setOfferStatus(
    formData,
    "retirada",
    "Esa ayuda ya está registrada como entregada, así que no está en el muro: está en el registro de ayudas. Si de verdad quieres retirarla, quita antes la fecha de entrega.",
  );
}

/**
 * Enciende o apaga el muro sin cambiar la verificación.
 *
 * Aceptar o negar es un juicio. Esto es otra cosa: una oferta ya aceptada puede
 * no publicarse todavía, y una pendiente puede quitarse del muro sin negarla.
 * El estado se queda; solo cambia `on_wall`.
 */
export async function setOfferOnWall(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  const { supabase } = await requireRowCity("offers", id);
  const row = await offerRow(supabase, id);
  const onWall = bool(formData, "on_wall");

  if (row.status === "rechazada" || row.status === "retirada") {
    throw new Error(
      onWall
        ? "Vuelve a pendiente primero: lo negado o retirado no sale en el muro."
        : "Esa oferta ya está fuera del muro.",
    );
  }

  const { error } = await supabase.from("offers").update({ on_wall: onWall }).eq("id", id);
  if (error) fail("No se pudo cambiar el muro", error);
}

/**
 * Registrar un recurso desde el equipo, no desde /ofrecer.
 *
 * Nace pendiente. Si ya se habló con quien ofrece, se marca aceptada en el
 * mismo envío. El muro es una casilla aparte.
 */
export async function createOffer(formData: FormData) {
  const cityId = optionalId(formData, "city_id");
  const { supabase } = await requireCity(cityId);

  const name = text(formData, "offerer_name");
  const contact = text(formData, "offerer_contact");
  const resource = text(formData, "resource");
  const message = text(formData, "message");
  const category = text(formData, "category") || "otro";

  if (name.length < 2) throw new Error("Escribe el nombre de quien ofrece.");
  if (contact.length < 5) throw new Error("Hace falta un teléfono, WhatsApp o correo.");
  if (resource.length < 2) throw new Error("Describe el recurso.");
  if (!NEED_CATEGORIES.some((option) => option.value === category)) {
    throw new Error("Ese tipo de recurso no existe.");
  }

  const caseId = optionalId(formData, "case_id");
  if (caseId) {
    if (!cityId) throw new Error("Para vincular a un caso, elige antes el municipio.");
    await caseInCity(caseId, cityId);
  }

  const onWall = bool(formData, "on_wall");
  const accepted = bool(formData, "accepted");

  const { data, error } = await supabase
    .from("offers")
    .insert({
      city_id: cityId,
      case_id: caseId,
      offerer_name: name,
      offerer_contact: contact,
      resource,
      category,
      message,
      publish_name: bool(formData, "publish_name"),
      status: "pendiente",
      team_notes: "",
      delivered_on: null,
      on_wall: true,
    })
    .select("id")
    .single();

  if (error || !data) fail("No se pudo guardar el recurso", error);

  const patch: { status?: OfferStatus; on_wall?: boolean } = {};
  if (accepted) patch.status = "aceptada";
  if (!onWall) patch.on_wall = false;
  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await supabase.from("offers").update(patch).eq("id", data.id);
    if (updateError) fail("El recurso se creó, pero no se pudo aplicar el muro o la aceptación", updateError);
  }

  redirect("/admin/recursos");
}

/**
 * Anota que la ayuda llegó hoy.
 *
 * Es el toque que convierte una promesa en una ayuda registrada, y es el único de
 * los cuatro que escribe dos columnas: la fecha y el estado, juntas y en la misma
 * escritura. No es una excepción a la regla de arriba, es lo que la regla exige
 * aquí —`offers_delivery_requires_acceptance` (0002) impide que exista una fila
 * con fecha y sin aceptar, así que las dos tienen que viajar en el mismo
 * `update`— y además es cierto: lo que llegó, se acepta.
 *
 * Hoy y no una fecha elegida, porque este botón es para el gesto normal: alguien
 * descarga las tejas y se anota. El día distinto —«llegó el martes pasado»— se
 * escribe en el campo de fecha de `updateOffer`, que es donde se puede pensar.
 *
 * Y sobre lo negado o lo retirado no escribe: avisa. Convertir en aceptada de
 * paso una oferta que el equipo rechazó sería reescribir en silencio una
 * decisión, y con `retirada` sería la peor de las dos —devolvería al muro
 * público, y encima como entregada, justo la que alguien acababa de quitar—. La
 * pantalla tampoco ofrece el botón en esos dos estados; esto es la segunda capa.
 */
export async function markOfferDelivered(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  const { supabase } = await requireRowCity("offers", id);
  const row = await offerRow(supabase, id);

  if (row.status === "rechazada" || row.status === "retirada") {
    throw new Error(
      `Esta oferta está ${row.status}. Si de verdad llegó, acéptala primero: así queda escrito que el equipo cambió de opinión y no se reescribe una decisión de paso.`,
    );
  }

  // Ya anotada: el segundo toque no le cambia el día. Sin esto, volver a pulsar
  // mañana movería una fecha que ya estaba bien, y la fecha de una entrega es lo
  // que se publica en el registro de ayudas.
  if (row.delivered_on) return;

  const { error } = await supabase
    .from("offers")
    .update({ delivered_on: today(), status: "aceptada" })
    .eq("id", id);

  if (error) fail("No se pudo anotar la entrega", error);
}

/**
 * Lo que se rellena escribiendo: la fecha exacta, la necesidad que cubre, las
 * notas del equipo y quitar el nombre.
 *
 * Sigue escribiendo todo lo que le llega, y lo que no le llega le llega vacío. Eso
 * ya no es un peligro escondido, porque el estado se cambia en las acciones de
 * arriba y este formulario no lo toca: lo único que este `update` puede borrar por
 * omisión son sus propios campos, y los cuatro están en el mismo `<details>`. Si
 * algún día se le llama desde otro sitio, tiene que mandarlos todos.
 */
export async function updateOffer(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  // El municipio de la oferta se lee de la fila. Una oferta sin municipio —"un
  // camión disponible", sin destino todavía— es de coordinación.
  const { supabase } = await requireRowCity("offers", id);
  const row = await offerRow(supabase, id);

  const delivered = text(formData, "delivered_on");

  if (delivered && !/^\d{4}-\d{2}-\d{2}$/.test(delivered)) {
    throw new Error("La fecha de entrega no tiene el formato de una fecha.");
  }
  if (delivered && delivered > today()) {
    throw new Error("Esa entrega está en el futuro. El registro es de lo que ya llegó.");
  }
  // El estado contra el que se comprueba es el GUARDADO y no uno que venga en el
  // envío, que es la diferencia con la versión anterior de esta acción: entonces
  // llegaba en un desplegable y bastaba mandar otro para colar una entrega sobre
  // una oferta rechazada. La base de datos lo pararía igual
  // (`offers_delivery_requires_acceptance`, 0002); esto es para que se lea qué hacer.
  if (delivered && (row.status === "rechazada" || row.status === "retirada")) {
    throw new Error(
      `Una oferta ${row.status} no puede figurar como entregada: acéptala primero, o deja la fecha vacía.`,
    );
  }

  const values: Record<string, unknown> = {
    delivered_on: delivered || null,
    team_notes: text(formData, "team_notes"),
  };

  // Lo que llegó, se acepta: registrar la entrega de algo que seguía pendiente
  // cierra también la conversación, y así el estado no se queda contradiciendo a
  // la fecha. Al revés no: quitar la fecha no devuelve la oferta a pendiente,
  // porque el acuerdo con esa persona sigue en pie.
  if (delivered) values.status = "aceptada";

  // El nombre solo se puede retirar, nunca conceder: la autorización la da quien
  // ofrece marcando su casilla, y el equipo no puede marcarla por ella. Al revés
  // sí, porque alguien puede llamar y pedir que lo quiten.
  if (bool(formData, "revoke_name")) values.publish_name = false;

  // "sin-vinculo" permite desvincular una oferta de la necesidad.
  const needId = text(formData, "need_id");
  if (needId === "sin-vinculo") {
    values.need_id = null;
  } else if (needId) {
    // La necesidad tiene que estar en un municipio propio: si no, esta entrega
    // aparecería en el registro público colgada de otro pueblo.
    await requireRowCity("needs", needId);

    // Vincular manda: la oferta se muda al municipio y al caso de la necesidad
    // que cubre. Mucha gente ofrece desde /ofrecer sin decir a dónde va, y sin
    // esto la entrega saldría en el registro público sin municipio aunque el
    // equipo ya sepa a qué necesidad respondía. Si la necesidad es de la zona, el
    // caso se limpia: lo contrario diría "para la familia X" de algo que no era
    // suyo.
    const { data: need } = await supabase
      .from("needs")
      .select("city_id, case_id")
      .eq("id", needId)
      .maybeSingle();

    const target = need as { city_id: string; case_id: string | null } | null;
    values.need_id = needId;
    if (target) {
      values.city_id = target.city_id;
      values.case_id = target.case_id;
    }
  }

  const { error } = await supabase.from("offers").update(values).eq("id", id);
  if (error) fail("No se pudo actualizar la oferta", error);
}

/**
 * Borrar una nota del buzón. Lo decide coordinación: documentación las lee,
 * no las limpia. Igual que las ofertas que no apuntan a ningún municipio.
 */
export async function deleteFeedback(formData: FormData) {
  const { supabase } = await requireCoordination();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la nota.");

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) fail("No se pudo borrar la nota", error);
}

// ---------------------------------------------------------------------------
// Equipo
//
// Las tres acciones pasan por funciones de la base de datos que vuelven a
// comprobar el rol por su cuenta: la allowlist no está expuesta en la API y no
// hay forma de tocarla sin pasar por ellas.
// ---------------------------------------------------------------------------

export async function saveTeamMember(formData: FormData) {
  const { supabase, team } = await requireCoordination();

  const email = text(formData, "email").toLowerCase();
  const role = text(formData, "role");
  const cities = formData
    .getAll("cities")
    .filter((value): value is string => typeof value === "string")
    .filter((value) => /^[0-9a-f-]{36}$/i.test(value));

  if (!email.includes("@") || email.length < 5) throw new Error("Escribe un correo válido.");
  if (!TEAM_ROLES.some((option) => option.value === role)) throw new Error("Elige un rol.");
  if (email === team.email.toLowerCase() && role !== "coordinacion") {
    throw new Error(
      "No puedes quitarte a ti misma la coordinación: pídeselo a otra persona de coordinación.",
    );
  }

  const { error } = await supabase.rpc("team_save_member", {
    p_email: email,
    p_role: role,
    p_cities: cities,
  });

  if (error) fail("No se pudo guardar la persona", error);
}

export async function removeTeamMember(formData: FormData) {
  const { supabase, team } = await requireCoordination();
  const email = text(formData, "email").toLowerCase();

  if (!email) throw new Error("Falta el correo.");
  if (email === team.email.toLowerCase()) {
    throw new Error("No puedes sacarte a ti misma de la lista del equipo.");
  }

  const { error } = await supabase.rpc("team_remove_member", { p_email: email });
  if (error) fail("No se pudo quitar a esa persona", error);
}
