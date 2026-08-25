"use server";

import { revalidatePath } from "next/cache";
import { NEED_CATEGORIES } from "@/lib/constants";
import { externalUrl, looksLikeEmail } from "@/lib/format";
import { FOUNDATIONS_PATH } from "@/lib/admin-sections";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentTeam } from "@/lib/team";
import type { FoundationStatus } from "@/lib/types";

/**
 * Editar y revisar una fundación (0026).
 *
 * Las dos barreras de siempre, en el mismo orden que el resto del panel: el rol
 * se comprueba aquí contra la base de datos, y detrás está la RLS
 * (`foundations_coordination_update`), que vuelve a decir que no si esto se
 * olvidara. Nada de lo que llega del formulario afirma quién es quien escribe.
 *
 * Es una acción y no cuatro —guardar, verificar, descartar, borrar— porque las
 * tres primeras son el mismo `update` con distinto `status`, y partirlas
 * multiplica los sitios donde comprobar el rol.
 */

export type FoundationFormState = { error: string } | { ok: string } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isStatus(value: string): value is FoundationStatus {
  return value === "pendiente" || value === "verificada" || value === "descartada";
}

export async function saveFoundation(
  _previous: FoundationFormState,
  formData: FormData,
): Promise<FoundationFormState> {
  const team = await currentTeam();
  if (team?.role !== "coordinacion") {
    return { error: "Esto lo hace coordinación." };
  }

  const id = text(formData, "id");
  if (!id) return { error: "Falta la fundación que se está editando." };

  const legal_name = text(formData, "legal_name");
  const contact_name = text(formData, "contact_name");
  const email = text(formData, "email").toLowerCase();
  const focus = text(formData, "focus");
  const category = text(formData, "category") || "otro";
  const status = text(formData, "status");

  if (legal_name.length < 2) return { error: "El nombre legal no puede quedar vacío." };
  if (contact_name.length < 2) return { error: "Escribe quién responde." };
  if (!looksLikeEmail(email)) return { error: "Ese correo no parece un correo." };
  if (focus.length < 4) return { error: "Escribe a qué se dedica." };
  if (!NEED_CATEGORIES.some((option) => option.value === category)) {
    return { error: "Elige una categoría válida." };
  }
  if (!isStatus(status)) return { error: "Ese estado no existe." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("foundations")
    .update({
      legal_name: legal_name.slice(0, 200),
      display_name: text(formData, "display_name").slice(0, 200),
      nit: text(formData, "nit").slice(0, 40),
      contact_name: contact_name.slice(0, 120),
      email: email.slice(0, 200),
      phone: text(formData, "phone").slice(0, 200),
      website: externalUrl(text(formData, "site_url")).slice(0, 300),
      city_name: text(formData, "city_name").slice(0, 120),
      coverage: text(formData, "coverage").slice(0, 400),
      focus: focus.slice(0, 800),
      category,
      offering: text(formData, "offering").slice(0, 800),
      team_size: text(formData, "team_size").slice(0, 80),
      founded_year: text(formData, "founded_year").slice(0, 20),
      message: text(formData, "message").slice(0, 2000),
      status,
      notes: text(formData, "notes").slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath(FOUNDATIONS_PATH);
  revalidatePath(`${FOUNDATIONS_PATH}/${id}`);

  return { ok: "Guardado." };
}

/**
 * Borrar, que es distinto de descartar.
 *
 * `descartada` es una decisión que se puede consultar después —«esta ya la
 * miramos y no»—; borrar es para lo que nunca debió entrar: una prueba, una
 * duplicada, un formulario de spam. Por eso no comparte acción con el resto:
 * un botón que borra no puede estar a un `status` de distancia de uno que
 * guarda.
 */
export async function deleteFoundation(formData: FormData): Promise<void> {
  const team = await currentTeam();
  if (team?.role !== "coordinacion") {
    throw new Error("Esto lo hace coordinación.");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Falta la fundación.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("foundations").delete().eq("id", id);
  if (error) throw new Error("No se pudo borrar.");

  revalidatePath(FOUNDATIONS_PATH);
}
