import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GATE_PREVIEW_COOKIE, isGatePublicPath, isSiteOpen } from "@/lib/site-gate";

/**
 * Refresca el token de sesión y, mientras el portal no es público, manda a
 * quien no tiene sesión a la landing.
 *
 * La autorización real del panel vive en las RLS y en cada Server Action, no
 * aquí. Esto solo decide si se ve el tablero o el aviso de que aún se arma.
 */

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export default async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let response = NextResponse.next({ request });
  let signedIn = false;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, cacheHeaders) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [header, value] of Object.entries(cacheHeaders ?? {})) {
            response.headers.set(header, value);
          }
        },
      },
    });

    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims);
  }

  const previewSecret = process.env.SITE_PREVIEW_SECRET?.trim();
  const abrir = request.nextUrl.searchParams.get("abrir");
  if (previewSecret && abrir === previewSecret) {
    const dest = request.nextUrl.clone();
    dest.searchParams.delete("abrir");
    if (dest.pathname === "/proximamente") dest.pathname = "/";
    const redirect = NextResponse.redirect(dest);
    copyCookies(response, redirect);
    redirect.cookies.set(GATE_PREVIEW_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return redirect;
  }

  if (
    isSiteOpen() ||
    signedIn ||
    isGatePublicPath(request.nextUrl.pathname) ||
    request.cookies.get(GATE_PREVIEW_COOKIE)?.value === "1"
  ) {
    return response;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/proximamente";
  return copyCookies(response, NextResponse.rewrite(rewriteUrl, { request }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};
