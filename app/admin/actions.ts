"use server";

import { redirect } from "next/navigation";
import { OFFER_STATUSES, PHOTO_BUCKET, TEAM_ROLES } from "@/lib/constants";
import { externalUrl, normalizePhone } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";
import { canWriteCity, currentTeam } from "@/lib/team";
import { uniqueSlug } from "@/lib/slug";
import { clampFrame, type PhotoFrame } from "@/lib/photo-frame";
import type { TeamSession } from "@/lib/types";

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
  if (isDemoMode()) {
    throw new Error(
      "El portal está con datos de muestra y no hay base de datos donde guardar. Conecta Supabase siguiendo el README y podrás documentar de verdad.",
    );
  }

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
  table: "cases" | "needs" | "photos" | "offers" | "case_updates",
  id: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from(table).select("city_id").eq("id", id).maybeSingle();
  const cityId = (data as { city_id: string | null } | null)?.city_id;
  return typeof cityId === "string" ? cityId : null;
}

/** Como requireCity, pero resolviendo el municipio desde la fila. */
async function requireRowCity(
  table: "cases" | "needs" | "photos" | "offers" | "case_updates",
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

  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Fundaciones
// ---------------------------------------------------------------------------

/**
 * Las fundaciones son de coordinación, y el motivo es el dinero: `donation_url`
 * es el destino del botón "Donar dinero" de la página pública. Quien pueda
 * editarlo puede desviar donaciones. El equipo en terreno pasa los datos de la
 * fundación a coordinación y coordinación los registra.
 *
 * Hay una por municipio y lo garantiza la base de datos, así que aquí ya no se
 * manda ninguna marca de «es la madre»: no había nada que marcar y la casilla sin
 * marcar publicaba «Organización aliada» sobre el canal de donación del pueblo.
 */
export async function saveFoundation(formData: FormData) {
  const { supabase } = await requireCoordination();
  const cityId = optionalId(formData, "city_id");
  if (!cityId) throw new Error("Falta el municipio.");

  const values = {
    city_id: cityId,
    name: text(formData, "name"),
    description: text(formData, "description"),
    contact_name: text(formData, "contact_name"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    donation_url: text(formData, "donation_url"),
    address: text(formData, "address"),
  };

  const id = optionalId(formData, "id");
  const { error } = id
    ? await supabase.from("foundations").update(values).eq("id", id)
    : await supabase.from("foundations").insert(values);

  // El panel ofrece un solo formulario por municipio, así que llegar aquí con una
  // segunda fundación es o dos personas de coordinación guardando a la vez, o una
  // llamada directa a la API. Se traduce el error de la restricción porque
  // «duplicate key value violates unique constraint» no le dice a nadie qué hacer,
  // y lo que hay que hacer no es reintentar: es recargar y ver cuál quedó.
  if (error?.message.includes("foundations_one_per_city")) {
    throw new Error(
      "Este municipio ya tiene su fundación registrada. Recarga la página: si hay que cambiarla, quita la que está y registra la nueva.",
    );
  }

  if (error) fail("No se pudo guardar la fundación", error);
}

export async function deleteFoundation(formData: FormData) {
  const { supabase } = await requireCoordination();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la fundación.");

  const { error } = await supabase.from("foundations").delete().eq("id", id);
  if (error) fail("No se pudo borrar la fundación", error);
}

// ---------------------------------------------------------------------------
// El canal de donación de un municipio y el de un caso
//
// Es la escritura más peligrosa del panel, y no por lo que borra: no borra nada.
// Quien la toque cambia a dónde va el dinero de un pueblo o de una persona con
// nombre y cara publicados, y el cambio no se nota mirando la pantalla porque un
// canal nuevo se ve igual de bien que el bueno.
//
// Por eso es de coordinación, igual que las fundaciones y su `donation_url`, y en
// tres capas que no dependen entre sí: la ficha no ofrece el campo, esto lo
// rechaza, y el disparador `guard_donation_channel` de 0011 lo para aunque la
// llamada llegue desde fuera de la web. La tercera no es redundante: quien
// documenta un municipio SÍ puede escribir el resto del caso, así que las
// políticas de fila dejan pasar la escritura entera y el canal necesita su propia
// comprobación dentro de ella.
//
// Los dos niveles pasan por la misma función porque el dato es el mismo y las
// trampas también. Escribir dos versiones sería dejar que una se quedara sin la
// validación que la otra aprendió.
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
 */
function donationChannelValues(formData: FormData) {
  const key = text(formData, "donation_key");
  const url = text(formData, "donation_url");
  const phoneRaw = text(formData, "donation_phone");
  const app = text(formData, "donation_app");
  const holder = text(formData, "donation_holder");

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

  return {
    donation_key: key,
    donation_url: url,
    donation_phone: phone,
    donation_app: app,
    donation_holder: holder,
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

export async function saveCityDonationChannel(formData: FormData) {
  const { supabase } = await requireCoordination();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el municipio.");

  const { data, error } = await supabase
    .from("cities")
    .update(donationChannelValues(formData))
    .eq("id", id)
    .select("id");

  if (error) fail("No se pudo guardar el canal del municipio", error);
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

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

export async function createCase(formData: FormData) {
  const cityId = optionalId(formData, "city_id");
  const slug = text(formData, "city_slug");
  if (!cityId) throw new Error("Falta el municipio.");

  const { supabase } = await requireCity(cityId);

  // Sin canal de donación, y no es un olvido: un caso nace sin él y lo pone
  // coordinación después, desde la ficha. Mandarlo aquí lo rechazaría el
  // disparador `guard_donation_channel` para quien documenta, que es quien crea
  // casi todos los casos.
  const { data, error } = await supabase
    .from("cases")
    .insert({
      city_id: cityId,
      display_name: text(formData, "display_name"),
      household: text(formData, "household"),
      story: text(formData, "story"),
      consent_to_publish: bool(formData, "consent_to_publish"),
    })
    .select("id")
    .single();

  if (error || !data) fail("No se pudo crear el caso", error);

  redirect(`/admin/ciudades/${slug}/casos/${data.id}`);
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
  const { error } = await supabase
    .from("cases")
    .update({
      display_name: text(formData, "display_name"),
      household: text(formData, "household"),
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
}): Promise<string> {
  const { supabase } = await requireCity(input.cityId);
  const caseId = await caseInCity(input.caseId, input.cityId);
  const frame = input.frame ? clampFrame(input.frame) : null;

  const { data, error } = await supabase
    .from("photos")
    .insert({
      city_id: input.cityId,
      case_id: caseId,
      storage_path: input.storagePath,
      thumb_path: input.thumbPath ?? "",
      ...(frame
        ? { focus_x: frame.focusX, focus_y: frame.focusY, zoom: frame.zoom }
        : {}),
    })
    .select("id")
    .single();

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
// ---------------------------------------------------------------------------

export async function updateOffer(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  // El municipio de la oferta se lee de la fila. Una oferta sin municipio —"un
  // camión disponible", sin destino todavía— es de coordinación.
  const { supabase } = await requireRowCity("offers", id);

  const status = text(formData, "status");
  const delivered = text(formData, "delivered_on");

  // El estado se comprueba contra la lista del desplegable y no se pasa tal cual.
  // Llega de un formulario, así que puede llegar cualquier cosa —o nada, si el
  // campo se queda fuera del envío—, y `offers_status_valid` (0012) lo rechazaría
  // con un error que habla de una restricción y no de lo que hay que arreglar.
  if (!OFFER_STATUSES.some((option) => option.value === status)) {
    throw new Error("Ese estado no existe para una oferta.");
  }

  if (delivered && !/^\d{4}-\d{2}-\d{2}$/.test(delivered)) {
    throw new Error("La fecha de entrega no tiene el formato de una fecha.");
  }
  if (delivered && delivered > new Date().toISOString().slice(0, 10)) {
    throw new Error("Esa entrega está en el futuro. El registro es de lo que ya llegó.");
  }
  // Una fecha de entrega dice que aquello llegó, y hay dos estados que dicen que
  // no va a llegar. Se avisa en vez de arreglarlo por dentro: la línea de abajo
  // convierte en aceptada cualquier oferta con fecha —lo que llegó, se acepta—, y
  // aplicar eso aquí reescribiría en silencio una decisión del equipo. Con
  // `retirada` sería además la peor de las dos: devolvería al muro público, y
  // encima como entregada, justo la oferta que alguien acababa de quitar de ahí.
  // La base de datos también lo rechaza (`offers_delivery_requires_acceptance`,
  // 0002); esto es para que se lea qué hacer.
  if (delivered && (status === "rechazada" || status === "retirada")) {
    throw new Error(
      `Una oferta ${status} no puede figurar como entregada: quita la fecha o cambia el estado.`,
    );
  }

  const values: Record<string, unknown> = {
    // Lo que llegó, se acepta: registrar la entrega de algo que seguía pendiente
    // cierra también la conversación, y así el estado no se queda contradiciendo
    // a la fecha.
    status: delivered ? "aceptada" : status,
    delivered_on: delivered || null,
    team_notes: text(formData, "team_notes"),
  };

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
 * Quita una oferta del muro público, de un clic.
 *
 * Es la salida rápida que necesita un muro que no está moderado: desde 0012 una
 * oferta se publica en /ofrecido en cuanto entra —sin contacto y con los
 * teléfonos del texto tapados, pero sin que nadie la haya leído—, así que la
 * bandeja tiene que poder sacarla en un gesto y no en tres. `retirada` y no
 * `rechazada`: rechazar dice que el equipo habló con esa persona y decidió, y es
 * el campo con el que después se le responde.
 *
 * Escribe UNA columna y ninguna más, y ahí está el cuidado que justifica una
 * acción aparte. Mandar un formulario de un solo campo a `updateOffer` habría
 * borrado las notas del equipo, la fecha y el vínculo con la necesidad, porque
 * esa acción escribe todo lo que le llega y lo que no le llega, le llega vacío.
 * Un clic no puede tener ese alcance.
 *
 * Y no pide confirmación, al contrario que borrar, porque no se pierde nada: la
 * fila se queda en la bandeja con su contacto y sus notas, se lista en el filtro
 * de retiradas, y para reponerla basta el desplegable de estado. La asimetría es
 * deliberada —un clic para quitar, dos para volver a publicar—: quitar de más se
 * arregla en veinte segundos y publicar de más ya lo ha leído alguien.
 */
export async function withdrawOffer(formData: FormData) {
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  // Igual que en `updateOffer`: el municipio se lee de la fila y no del
  // formulario, así que quien documenta solo puede retirar las de los municipios
  // que atiende y las que llegaron sin municipio son de coordinación. Las RLS
  // (`offers_scoped_update`, 0002) lo rechazarían igual.
  const { supabase } = await requireRowCity("offers", id);

  // Una entrega ya registrada no se retira. `offers_delivery_requires_acceptance`
  // (0002) lo rechaza, y con razón: retirarla sería borrar que aquello llegó. Si
  // esto salta, la fila no es la que creía quien pulsó —lo entregado no está en
  // el muro, está en el registro de ayudas—, así que el mensaje lo dice.
  const { data } = await supabase.from("offers").select("delivered_on").eq("id", id).maybeSingle();
  if ((data as { delivered_on: string | null } | null)?.delivered_on) {
    throw new Error(
      "Esa ayuda ya está registrada como entregada, así que no está en el muro. Si de verdad quieres retirarla, quita antes la fecha de entrega.",
    );
  }

  const { error } = await supabase.from("offers").update({ status: "retirada" }).eq("id", id);
  if (error) fail("No se pudo quitar la oferta del muro", error);
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
