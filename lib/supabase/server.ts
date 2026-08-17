import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

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
