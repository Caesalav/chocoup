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

/**
 * La misma URL, pero solo si se puede llegar a ella desde fuera.
 *
 * Hace falta para lo que le damos a Mercado Pago como dirección de aviso: un
 * `http://localhost:3000/...` no es una dirección a la que nadie pueda llamar, y
 * mandársela es pedirle que avise a un sitio que no existe. Devuelve null en
 * local, y quien la pide crea el cobro sin aviso: en el computador de quien
 * programa, donar funciona y la donación no queda registrada, que es exactamente
 * lo que un `localhost` puede prometer.
 *
 * No intenta adivinar más que eso. Un dominio inventado en NEXT_PUBLIC_SITE_URL
 * pasa por aquí, y tiene que pasar: comprobar que el dominio es el bueno no es
 * trabajo de una función, es lo que dice el panel de Mercado Pago cuando el
 * aviso no llega.
 */
export async function publicUrl(path: string): Promise<string | null> {
  const url = await absoluteUrl(path);
  return isPublicUrl(url) ? url : null;
}

/**
 * Si a esta dirección se puede llegar desde internet.
 *
 * Lo usan dos cosas y por eso está suelta. Una es `publicUrl()`, de ahí arriba.
 * La otra es el `auto_return` de Mercado Pago —que la pasarela devuelva sola al
 * portal cuando el pago se aprueba—, y esa hace falta que lo mire aparte porque
 * Mercado Pago RECHAZA la preferencia entera si se le pide devolver a un
 * `localhost`: «auto_return invalid». Sin esta comprobación, donar funciona en
 * el portal publicado y falla en el computador de quien programa, que es la
 * peor forma de fallar de las dos.
 */
export function isPublicUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;

  const { hostname } = new URL(url);
  return hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.endsWith(".local");
}
