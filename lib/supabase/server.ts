import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";
import type { TeamSession } from "../types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. El proxy refresca
          // la sesión en cada petición, así que aquí se puede ignorar.
        }
      },
    },
  });
}

/**
 * Identidad verificada del visitante. getClaims valida la firma del JWT, a
 * diferencia de getSession, que solo lee la cookie.
 */
export async function getSessionEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const email = data.claims.email;
  return typeof email === "string" ? email : null;
}

/** Comprueba la allowlist del equipo contra la base de datos, no contra el JWT. */
export async function isTeamMember(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_team");
  if (error) return false;
  return data === true;
}

/**
 * Rol y municipios asignados de quien tiene la sesión abierta.
 *
 * Lo responde la base de datos a partir del correo del token, nunca el cliente:
 * el rol no viaja en el JWT ni en ningún formulario. Devuelve null si el correo
 * no está en la lista del equipo.
 *
 * Las páginas lo usan para no ofrecer botones que las políticas van a rechazar y
 * las Server Actions para comprobar la autorización antes de escribir. Que
 * exista esta comprobación no sustituye a las RLS: es la primera de dos.
 */
export async function getTeamSession(): Promise<TeamSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("team_session");
  if (error || !data) return null;

  const raw = data as { email?: unknown; role?: unknown; cityIds?: unknown };
  if (raw.role !== "coordinacion" && raw.role !== "documentacion") return null;

  return {
    email: typeof raw.email === "string" ? raw.email : "",
    role: raw.role,
    cityIds: Array.isArray(raw.cityIds) ? raw.cityIds.filter((id) => typeof id === "string") : [],
  };
}
