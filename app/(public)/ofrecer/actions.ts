"use server";

import { redirect } from "next/navigation";
import { NEED_CATEGORIES } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";

export type OfferFormState = { error: string } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function uuidOrNull(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export async function submitOffer(
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  // Campo trampa: los formularios rellenados por bots lo completan. Se responde
  // como si todo hubiera ido bien para no darles pistas.
  if (text(formData, "website")) redirect("/ofrecer/gracias");

  const name = text(formData, "offerer_name");
  const contact = text(formData, "offerer_contact");
  const resource = text(formData, "resource");
  const message = text(formData, "message");
  const category = text(formData, "category") || "otro";

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (contact.length < 5) {
    return { error: "Déjanos un teléfono, WhatsApp o correo para poder responderte." };
  }
  if (resource.length < 2) return { error: "Cuéntanos qué puedes aportar." };
  if (name.length > 120 || contact.length > 200 || resource.length > 200) {
    return { error: "Alguno de los campos es demasiado largo." };
  }
  if (message.length > 2000) return { error: "El comentario es demasiado largo." };
  if (!NEED_CATEGORIES.some((option) => option.value === category)) {
    return { error: "Elige un tipo de recurso válido." };
  }

  // Con datos de muestra el recorrido se puede completar para verlo entero. El
  // banner del portal ya avisa en pantalla de que nada queda guardado.
  if (isDemoMode()) redirect("/ofrecer/gracias");

  const supabase = await createSupabaseServerClient();

  // Sin .select(): el público no tiene permiso de lectura sobre las ofertas.
  //
  // `publish_name` es lo único que decide si esta persona aparece con nombre en el
  // registro público, y solo puede llegar de aquí: el panel del equipo puede
  // retirar el nombre pero no concederlo. Si la casilla no viene, va en falso,
  // que es el valor por omisión de la columna.
  const { error } = await supabase.from("offers").insert({
    offerer_name: name,
    offerer_contact: contact,
    resource,
    category,
    message,
    publish_name: checked(formData, "publish_name"),
    need_id: uuidOrNull(formData, "need_id"),
    case_id: uuidOrNull(formData, "case_id"),
    city_id: uuidOrNull(formData, "city_id"),
  });

  if (error) {
    return { error: "No pudimos guardar tu oferta. Inténtalo de nuevo en un momento." };
  }

  redirect("/ofrecer/gracias");
}
