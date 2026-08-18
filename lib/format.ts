import { PHOTO_BUCKET } from "./constants";
import { supabaseEnv } from "./supabase/env";

/** El bucket es público, así que basta la URL directa del CDN. */
export function photoUrl(storagePath: string): string {
  // Las fotos de muestra no están en Storage, sino en public/demo. Llevan el
  // sello "muestra" incrustado. Los paisajes no muestran daños; los retratos
  // son caras de archivo, no de las familias de los textos.
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
 * El número como se lee, no como se guarda. Un móvil colombiano de diez
 * dígitos se parte en grupos de tres: es como se dicta y como cabe en un
 * titular. Cualquier otra forma se deja tal cual.
 */
export function formatPhone(value: string): string {
  const digits = digitsOnly(value);
  const local =
    digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
  if (local.length === 10 && local.startsWith("3")) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return value.trim();
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

/**
 * Una fecha sin hora, como la que trae `delivered_on`: "2026-08-15".
 *
 * Va con su propio formateador anclado a UTC porque `new Date("2026-08-15")` es
 * medianoche UTC, y con el reloj de Colombia detrás se imprimiría el día
 * anterior. Una ayuda que llegó el 15 no puede leerse "14 de agosto".
 */
const dayFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDay(date: string): string {
  return dayFormatter.format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

/**
 * Un mes suelto, como el que trae `delivered_month` del registro público:
 * "2026-08". No hay día que imprimir porque no llega ninguno; el día uno que se
 * le pone aquí es solo para poder construir una fecha.
 */
const monthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonth(month: string): string {
  return monthFormatter.format(new Date(`${month.slice(0, 7)}-01T00:00:00Z`));
}

/**
 * Cuánto hace, en días. Sustituye a la campana de notificaciones de la
 * referencia: en un portal que documenta un terremoto, lo que hay que saber al
 * abrirlo es si esto sigue vivo.
 *
 * Se calcula en el servidor y en cada petición —las páginas del portal son
 * dinámicas—, así que no hay riesgo de que el navegador diga otra cosa.
 */
export function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Actualizado hoy";
  if (days === 1) return "Actualizado ayer";
  return `Actualizado hace ${days} días`;
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
