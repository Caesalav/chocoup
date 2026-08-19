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

/**
 * Cuánto hace, en la medida más cercana.
 *
 * Una donación no es una factura: la hora exacta no demuestra nada y solo
 * tiene que sonar a movimiento, que es lo que hace la referencia con «6 yrs».
 * Las compras del presupuesto siguen yendo con el día entero.
 */
export function timeAgo(iso: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${plural(minutes, "minuto", "minutos")}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${plural(hours, "hora", "horas")}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 14) return `hace ${plural(days, "día", "días")}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `hace ${plural(weeks, "semana", "semanas")}`;
  const months = Math.floor(days / 30);
  if (months < 18) return `hace ${plural(months, "mes", "meses")}`;
  const years = Math.max(1, Math.floor(days / 365));
  return `hace ${plural(years, "año", "años")}`;
}

export function formatDateTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function excerpt(text: string, max = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/** La misma forma que exige `newsletter_email_shape` en la base. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 200;
}

/**
 * La primera frase de una causa: la escrita a mano si la hay, y si no el recorte
 * de su historia.
 *
 * Es la misma decisión en los sitios donde esa frase se lee, y por eso está
 * escrita una vez: la tarjeta de /donaciones, la fila del listado, la tarjeta
 * grande de la ficha de un municipio, y —la que de verdad importa— la
 * descripción de la página, que es lo que WhatsApp enseña en la vista previa
 * cuando alguien pega el enlace.
 *
 * `cases.summary` (0016) existe justamente por ese tercer sitio. El recorte
 * automático corta donde cae, a mitad de frase o de palabra, y da igual dentro de
 * una lista pero no cuando esa media oración es el primer contacto de alguien con
 * una familia del Chocó.
 *
 * El resumen se recorta también, aunque la base de datos lo limite a 120: los
 * huecos donde se pinta son de 140 y de 150, así que sin este recorte un resumen de
 * 120 caracteres desbordaría el sitio más estrecho de los tres. Recortar algo que
 * ya cabe no hace nada, y es lo que hace que este hueco no dependa de que el límite
 * de la columna y el de la tarjeta no se separen nunca.
 */
export function caseLead(row: { summary: string; story: string }, max: number): string {
  // El `?? ""` no es un adorno defensivo: es el hueco de la ventana en la que el
  // código va por delante de la base. `cases.summary` la crea 0016, y si este
  // código llega a producción antes de que se pegue esa migración, la fila que
  // vuelve de Supabase no trae la columna y aquí `row.summary` es `undefined`. Se
  // midió: `.trim()` a secas convertía eso en un 500 en la ficha de Quibdó, o sea
  // el municipio con casos reales caído por una columna que aún no existía.
  //
  // Con esto, ese rato degrada a lo que el portal hacía ayer —el recorte de la
  // historia— y nadie se queda sin leer a una familia. El tipo dice `string`
  // porque en la base ya migrada lo es, y no se relaja a `string | undefined`
  // para que quien escriba un formulario nuevo siga teniendo que mandarlo.
  const written = (row.summary ?? "").trim();
  if (written) return excerpt(written, max);
  return row.story ? excerpt(row.story, max) : "";
}

/** Pluralización mínima en español, suficiente para los contadores del portal. */
export function plural(count: number, singular: string, plural_: string): string {
  return `${count} ${count === 1 ? singular : plural_}`;
}

/**
 * Un importe en pesos colombianos, como se lee: $ 1.200.000.
 *
 * Sin decimales: el peso no los usa en la práctica y un presupuesto de
 * reconstrucción no se decide en centavos.
 */
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(amount: number): string {
  return copFormatter.format(Math.max(0, Math.round(amount)));
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
