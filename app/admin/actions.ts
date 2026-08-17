"use server";

import { redirect } from "next/navigation";
import { PHOTO_BUCKET } from "@/lib/constants";
import { createSupabaseServerClient, isTeamMember } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";
import { uniqueSlug } from "@/lib/slug";

/**
 * Toda acción comprueba la pertenencia al equipo por su cuenta. El proxy no
 * basta: un cambio de matcher dejaría las acciones sin cobertura.
 * Las RLS son la segunda barrera.
 */
async function requireTeam() {
  if (isDemoMode()) {
    throw new Error(
      "El portal está con datos de muestra y no hay base de datos donde guardar. Conecta Supabase siguiendo el README y podrás documentar de verdad.",
    );
  }
  if (!(await isTeamMember())) {
    throw new Error("Tu cuenta no está en la lista del equipo.");
  }
  return createSupabaseServerClient();
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
  const supabase = await requireTeam();

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
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el municipio.");

  const values: Record<string, unknown> = {
    name: text(formData, "name"),
    summary: text(formData, "summary"),
    published: bool(formData, "published"),
  };

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
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el municipio.");

  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) fail("No se pudo borrar el municipio", error);

  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Fundaciones
// ---------------------------------------------------------------------------

export async function saveFoundation(formData: FormData) {
  const supabase = await requireTeam();
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
    is_primary: bool(formData, "is_primary"),
  };

  const id = optionalId(formData, "id");
  const { error } = id
    ? await supabase.from("foundations").update(values).eq("id", id)
    : await supabase.from("foundations").insert(values);

  if (error) fail("No se pudo guardar la fundación", error);
}

export async function deleteFoundation(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la fundación.");

  const { error } = await supabase.from("foundations").delete().eq("id", id);
  if (error) fail("No se pudo borrar la fundación", error);
}

// ---------------------------------------------------------------------------
// Necesidades
// ---------------------------------------------------------------------------

export async function createNeed(formData: FormData) {
  const supabase = await requireTeam();
  const cityId = optionalId(formData, "city_id");
  if (!cityId) throw new Error("Falta el municipio.");

  const { error } = await supabase.from("needs").insert({
    city_id: cityId,
    case_id: optionalId(formData, "case_id"),
    category: text(formData, "category") || "otro",
    title: text(formData, "title"),
    details: text(formData, "details"),
    quantity: text(formData, "quantity"),
    urgent: bool(formData, "urgent"),
  });

  if (error) fail("No se pudo añadir la necesidad", error);
}

export async function updateNeed(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la necesidad.");

  const { error } = await supabase
    .from("needs")
    .update({ status: text(formData, "status") })
    .eq("id", id);

  if (error) fail("No se pudo actualizar la necesidad", error);
}

export async function deleteNeed(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la necesidad.");

  const { error } = await supabase.from("needs").delete().eq("id", id);
  if (error) fail("No se pudo borrar la necesidad", error);
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

export async function createCase(formData: FormData) {
  const supabase = await requireTeam();
  const cityId = optionalId(formData, "city_id");
  const slug = text(formData, "city_slug");
  if (!cityId) throw new Error("Falta el municipio.");

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
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta el caso.");

  const consent = bool(formData, "consent_to_publish");
  const published = bool(formData, "published");

  if (published && !consent) {
    throw new Error("Un caso no se puede publicar sin el consentimiento de la persona.");
  }

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
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  const slug = text(formData, "city_slug");
  if (!id) throw new Error("Falta el caso.");

  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) fail("No se pudo borrar el caso", error);

  redirect(`/admin/ciudades/${slug}`);
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
}) {
  const supabase = await requireTeam();

  const { error } = await supabase.from("photos").insert({
    city_id: input.cityId,
    case_id: input.caseId,
    storage_path: input.storagePath,
    thumb_path: input.thumbPath ?? "",
  });

  if (error) fail("No se pudo registrar la foto", error);
}

export async function savePhotoCaption(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la foto.");

  const { error } = await supabase
    .from("photos")
    .update({
      caption: text(formData, "caption"),
      sort_order: Number(text(formData, "sort_order")) || 0,
    })
    .eq("id", id);

  if (error) fail("No se pudo guardar el pie de foto", error);
}

export async function deletePhoto(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  const paths = [text(formData, "storage_path"), text(formData, "thumb_path")].filter(Boolean);
  if (!id) throw new Error("Falta la foto.");

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) fail("No se pudo borrar la foto", error);

  // Si algún archivo queda huérfano no rompe nada, así que no se aborta por esto.
  if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------

export async function updateOffer(formData: FormData) {
  const supabase = await requireTeam();
  const id = optionalId(formData, "id");
  if (!id) throw new Error("Falta la oferta.");

  const values: Record<string, unknown> = {
    status: text(formData, "status"),
    team_notes: text(formData, "team_notes"),
  };

  // "sin-vinculo" permite desvincular una oferta de la necesidad.
  const needId = text(formData, "need_id");
  if (needId) values.need_id = needId === "sin-vinculo" ? null : needId;

  const { error } = await supabase.from("offers").update(values).eq("id", id);
  if (error) fail("No se pudo actualizar la oferta", error);
}
