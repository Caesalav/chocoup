"use server";

import { redirect } from "next/navigation";
import { FEEDBACK_KINDS } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export type FeedbackFormState = { error: string } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Solo acepta un camino interno. El campo lo rellena el botón con la pantalla
 * desde la que se llegó; si alguien lo manipula, se descarta en vez de guardar
 * un javascript: o un dominio ajeno como si fuera una página del portal.
 */
function safePath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "";
  return value.slice(0, 300);
}

export async function submitFeedback(
  _previous: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  if (text(formData, "website")) redirect("/sugerencias/gracias");

  const kind = text(formData, "kind");
  const body = text(formData, "body");
  const contact = text(formData, "contact");
  const pagePath = safePath(text(formData, "page_path"));

  if (!FEEDBACK_KINDS.some((option) => option.value === kind)) {
    return { error: "Elige si es un error o una idea." };
  }
  if (body.length < 4) {
    return { error: "Cuéntanos qué pasa, aunque sea en pocas palabras." };
  }
  if (body.length > 2000) {
    return { error: "El mensaje es demasiado largo." };
  }
  if (contact.length > 200) {
    return { error: "El contacto es demasiado largo." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("feedback").insert({
    kind,
    body,
    contact,
    page_path: pagePath,
  });

  if (error) {
    return { error: "No pudimos guardar el mensaje. Inténtalo de nuevo en un momento." };
  }

  redirect("/sugerencias/gracias");
}
