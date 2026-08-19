"use server";

import { looksLikeEmail } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";

export type DonorFormState = { error: string } | { saved: true } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * El correo de quien va a donar, dentro del mismo recuadro de Mercado Pago.
 *
 * La pasarela todavía no cobra. Guardar el correo aquí es lo que deja un rastro
 * para escribirle, sin un segundo formulario de avisos al pie de la página.
 */
export async function saveDonorEmail(
  _previous: DonorFormState,
  formData: FormData,
): Promise<DonorFormState> {
  if (text(formData, "website")) return { saved: true };

  const email = text(formData, "email").toLowerCase();
  if (!looksLikeEmail(email)) return { error: "Escribe un correo válido." };

  if (isDemoMode()) return { saved: true };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("newsletter_signups").insert({ email });
  if (error) console.error("newsletter_signups", error.message);

  return { saved: true };
}
