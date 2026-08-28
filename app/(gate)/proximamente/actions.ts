"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_PREVIEW_COOKIE } from "@/lib/site-gate";

export type PreviewState = { error: string } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Abre el tablero sin ser del equipo, con la clave que abre la puerta.
 *
 * ---------------------------------------------------------------------------
 * LA CLAVE YA NO ESTÁ EN ESTE ARCHIVO, Y HAY QUE EXPLICAR POR QUÉ
 *
 * Aquí había una constante `PREVIEW_PASSWORD` con la clave escrita, y una nota
 * que decía «la clave vive aquí, no en el HTML: el botón de la landing no dice
 * qué hay que escribir». Lo del HTML era cierto y lo otro no servía de nada:
 * ESTE REPOSITORIO ES PÚBLICO. La clave estaba en este mismo archivo, legible
 * por cualquiera que abriera la carpeta en GitHub. O sea que el cerrojo que
 * esconde las fichas de las familias se saltaba leyendo el código, y encima no
 * había forma de cambiarla sin desplegar.
 *
 * Y no se repite aquí ni como ejemplo: un comentario que cita la clave la
 * publica igual que la constante que sustituye.
 *
 * Ahora la clave es `SITE_PREVIEW_SECRET`, que vive en el entorno y no viaja al
 * repositorio. Se puede cambiar en un minuto desde el panel de Vercel, sin
 * tocar código.
 *
 * SIN LA VARIABLE PUESTA NO ABRE NADIE, y es la decisión correcta: la
 * alternativa —dejar una clave escrita como respaldo— es volver a publicarla.
 * El equipo entra por /entrar con su sesión, que no depende de esto.
 * ---------------------------------------------------------------------------
 */
export async function unlockPreview(
  _previous: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  if (text(formData, "website")) redirect("/proximamente");

  const password = text(formData, "password");
  const secret = process.env.SITE_PREVIEW_SECRET?.trim() ?? "";

  if (!secret) {
    console.error("vista previa: falta SITE_PREVIEW_SECRET, la clave no puede abrir");
    return { error: "La clave no está configurada. Avisa al equipo." };
  }

  if (password !== secret) {
    return { error: "Esa clave no abre." };
  }

  const jar = await cookies();
  jar.set(GATE_PREVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
