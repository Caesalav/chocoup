import { PHOTO_BUCKET } from "./constants";
import { supabaseEnv } from "./supabase/env";

/** El bucket es público, así que basta la URL directa del CDN. */
export function photoUrl(storagePath: string): string {
  // Las fotos de muestra no están en Storage, sino en public/demo. Llevan el
  // sello "muestra" incrustado y no muestran daños ni personas: nadie debe poder
  // confundirlas con la documentación real del terremoto.
  if (storagePath.startsWith("demo/")) {
    return `/${storagePath}.jpg`;
  }

  const { url } = supabaseEnv();
  if (!url) return "";
  return `${url}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}

/**
 * Imagen para cuadrículas y tarjetas. Cae en la grande si no hay miniatura, así
 * que una foto antigua o una subida a medias sigue viéndose.
 */
export function thumbUrl(photo: { storage_path: string; thumb_path?: string | null }): string {
  return photoUrl(photo.thumb_path || photo.storage_path);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normaliza a formato internacional. Un móvil colombiano son 10 dígitos que
 * empiezan por 3; se le añade el indicativo 57 para que wa.me funcione.
 */
export function normalizePhone(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits;
}

export function whatsappLink(value: string, message?: string): string {
  const phone = normalizePhone(value);
  if (!phone) return "";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${phone}${query}`;
}

export function telLink(value: string): string {
  const digits = digitsOnly(value);
  return digits ? `tel:+${normalizePhone(value)}` : "";
}

/**
 * Convierte lo que el equipo escribe en un enlace seguro para un href. Acepta
 * "atratovive.org/donar" y le añade https://; descarta cualquier esquema que no
 * sea http/https, así un campo mal usado nunca acaba en un javascript: en un botón.
 */
export function externalUrl(value: string): string {
  const clean = value.trim();
  if (!clean) return "";
  const withScheme = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function excerpt(text: string, max = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/** Pluralización mínima en español, suficiente para los contadores del portal. */
export function plural(count: number, singular: string, plural_: string): string {
  return `${count} ${count === 1 ? singular : plural_}`;
}

/**
 * El público escribe el contacto en un solo campo libre. Esto adivina si es
 * correo o teléfono para que el equipo pueda responder con un toque.
 */
export function contactHref(value: string): string | null {
  const clean = value.trim();
  if (clean.includes("@") && !clean.includes(" ")) return `mailto:${clean}`;
  const digits = digitsOnly(clean);
  if (digits.length >= 7) return whatsappLink(clean);
  return null;
}
