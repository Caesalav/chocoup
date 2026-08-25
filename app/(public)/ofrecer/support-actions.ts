"use server";

import { redirect } from "next/navigation";
import { NEED_CATEGORIES } from "@/lib/constants";
import { looksLikeEmail } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supportKindMeta } from "@/lib/support";
import type { SupportOfferKind } from "@/lib/types";

/**
 * Lo que la acción devuelve, y por qué hay un `ok` además del error.
 *
 * En /ofrecer no hacía falta: al guardar se redirige a /ofrecer/gracias y esta
 * función no vuelve nunca con éxito. Desde la landing sí hace falta, porque esa
 * pantalla de gracias está DETRÁS DEL CERROJO (`isGatePublicPath` no la deja
 * pasar): redirigir allí a alguien que acaba de apuntarse lo mandaría de vuelta
 * a «el tablero todavía no es público», que se lee como que su formulario no se
 * envió. Así que desde ahí no se redirige: se contesta, y la pantalla lo dice
 * sin moverse.
 */
export type SupportFormState = { error: string } | { ok: true } | null;

/**
 * Desde dónde se envió. Solo se distingue una: la landing, que es la única que
 * no puede redirigir. Cualquier otra cosa se trata como /ofrecer.
 */
const FROM_LANDING = "/proximamente";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export async function submitSupportOffer(
  _previous: SupportFormState,
  formData: FormData,
): Promise<SupportFormState> {
  const fromLanding = text(formData, "desde") === FROM_LANDING;

  // La trampa para robots: se contesta como si hubiera salido bien y no se
  // guarda nada. Desde la landing no se puede redirigir, así que se miente
  // igual pero sin moverse.
  if (text(formData, "website")) {
    if (fromLanding) return { ok: true };
    redirect("/ofrecer/gracias");
  }

  const kind = text(formData, "kind") as SupportOfferKind;
  if (!supportKindMeta(kind)) return { error: "Elige una de las tres formas de ofrecer." };

  const person_name = text(formData, "person_name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "contact");
  const city_name = text(formData, "city_name");
  const message = text(formData, "message");

  if (person_name.length < 2) return { error: "Escribe tu nombre." };
  if (!looksLikeEmail(email)) return { error: "Escribe un correo válido." };
  if (person_name.length > 120 || phone.length > 200) {
    return { error: "Alguno de los campos es demasiado largo." };
  }
  if (message.length > 2000) return { error: "El comentario es demasiado largo." };

  const contact = phone.length >= 5 ? phone : email;

  const row: Record<string, string | boolean> = {
    kind,
    person_name,
    contact,
    email,
    city_name,
    message,
  };

  if (kind === "voluntario") {
    const skills = text(formData, "skills");
    const availability = text(formData, "availability");
    if (skills.length < 4) return { error: "Cuéntanos qué puedes hacer." };
    if (availability.length < 4) return { error: "Cuéntanos cuándo puedes." };
    row.skills = skills;
    row.availability = availability;
    row.duration = text(formData, "duration");
    row.has_transport = checked(formData, "has_transport");
  }

  if (kind === "profesion") {
    const profession = text(formData, "profession");
    const modality = text(formData, "modality");
    if (profession.length < 2) return { error: "Escribe tu profesión u oficio." };
    if (!["presencial", "remoto", "ambos"].includes(modality)) {
      return { error: "Elige si puedes ir, atender a distancia, o las dos." };
    }
    row.profession = profession;
    row.experience = text(formData, "experience");
    row.modality = modality;
    row.credentials = text(formData, "credentials");
    row.availability = text(formData, "availability");
  }

  if (kind === "recurso") {
    const resource = text(formData, "resource");
    const category = text(formData, "category") || "otro";
    const condition = text(formData, "condition");
    if (resource.length < 2) return { error: "Cuéntanos qué puedes aportar." };
    if (!NEED_CATEGORIES.some((option) => option.value === category)) {
      return { error: "Elige un tipo de recurso válido." };
    }
    if (!["nuevo", "usado", ""].includes(condition)) {
      return { error: "Elige si es nuevo o usado." };
    }
    row.resource = resource;
    row.quantity = text(formData, "quantity");
    row.condition = condition;
    row.category = category;
    row.can_deliver = checked(formData, "can_deliver");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("support_offers").insert(row);

  if (error) {
    return { error: "No pudimos guardar tu oferta. Inténtalo de nuevo en un momento." };
  }

  if (fromLanding) return { ok: true };

  redirect("/ofrecer/gracias");
}
