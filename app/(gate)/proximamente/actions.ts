"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GATE_PREVIEW_COOKIE } from "@/lib/site-gate";

export type PreviewState = { error: string } | null;

const PREVIEW_PASSWORD = "HolaMundo";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Abre el tablero de muestra sin ser del equipo. La clave vive aquí, no en
 * el HTML: el botón de la landing no dice qué hay que escribir.
 */
export async function unlockPreview(
  _previous: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  if (text(formData, "website")) redirect("/proximamente");

  const password = text(formData, "password");
  const envSecret = process.env.SITE_PREVIEW_SECRET?.trim();
  const ok = password === PREVIEW_PASSWORD || (envSecret != null && password === envSecret);

  if (!ok) {
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
