/**
 * El portal todavía no es público: quien llega ve la landing, no el tablero.
 *
 * Abierto de verdad: `SITE_OPEN=1` en el entorno. El equipo entra por /entrar
 * (la sesión salta el cerrojo). Un avance puntual para quien no es del equipo
 * va con `SITE_PREVIEW_SECRET` y la dirección `/?abrir=…`.
 *
 * Cerrado es el valor por omisión a propósito: olvidarse de una variable no
 * puede publicar fichas de familias. Abrir exige una decisión.
 */

export const GATE_PREVIEW_COOKIE = "chocoup_preview";

export function isSiteOpen(): boolean {
  const value = process.env.SITE_OPEN?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

/** Rutas que el cerrojo deja pasar aunque el portal esté cerrado. */
export function isGatePublicPath(pathname: string): boolean {
  return (
    pathname === "/proximamente" ||
    pathname === "/entrar" ||
    pathname.startsWith("/auth/")
  );
}
