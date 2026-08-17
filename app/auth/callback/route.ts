import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Cierra el ciclo del enlace mágico. Acepta las dos formas en que Supabase
 * puede devolver al usuario: `code` (flujo PKCE, el de la plantilla nueva) y
 * `token_hash` + `type` (plantilla por defecto del proyecto).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  const requested = requestUrl.searchParams.get("next") ?? "/admin";
  // Solo rutas internas: un `next` absoluto sería un redirect abierto.
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/admin";

  const base = siteOrigin(request);
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, base));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, base));
  }

  return NextResponse.redirect(new URL("/entrar?error=enlace", base));
}

/** Detrás del proxy de Vercel, request.url lleva el host interno. */
function siteOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const protocol = request.headers.get("x-forwarded-proto") ?? "https";
    return `${protocol}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}
