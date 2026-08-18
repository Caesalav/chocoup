import { headers } from "next/headers";

/**
 * URL absoluta de una ruta del portal.
 *
 * Hace falta para lo único que sale de aquí: compartir. El portal se mueve por
 * WhatsApp y el enlace que se pega tiene que ser el bueno tanto en local como en
 * Vercel como en el dominio propio, así que se toma del host de la petición
 * salvo que haya un NEXT_PUBLIC_SITE_URL configurado, que manda.
 *
 * Leer las cabeceras obliga a renderizar en cada petición; todas las páginas
 * públicas ya son dinámicas, así que no cuesta nada.
 */
export async function absoluteUrl(path: string): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(path, configured).toString();

  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}${path}`;
}
