import { getDonationLog } from "@/lib/data";
import { DONATION_LOG_LIMIT, parseDonationLogSort } from "@/lib/donation-log";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sin caché, y escrito aunque hoy sea el valor por omisión.
 *
 * Es la ruta que sostiene la palabra «en tiempo real» de las tres listas. Una
 * respuesta cacheada aquí no falla: contesta 200 con la lista de antes, así que
 * quien acaba de donar sigue sin verse y no hay ningún error en ningún sitio
 * donde mirarlo. Es el mismo modo de fallar silencioso que dejó ocho pagos sin
 * registrar, y una línea es barata comparada con volver a buscarlo.
 */
export const dynamic = "force-dynamic";

/**
 * El registro público de donaciones, para que las listas se actualicen solas.
 *
 * El público no puede suscribirse a `public.donations` —0017 se lo niega— así
 * que las tres pantallas preguntan aquí cada quince segundos. Lee la vista,
 * no la tabla.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caso") ?? undefined;
  const cityId = url.searchParams.get("ciudad") ?? undefined;
  const sort = parseDonationLogSort(url.searchParams.get("orden"));
  const rawLimit = Number(url.searchParams.get("limite"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50)
    : DONATION_LOG_LIMIT;

  if (caseId && !UUID.test(caseId)) {
    return Response.json({ donations: [] }, { status: 400 });
  }
  if (cityId && !UUID.test(cityId)) {
    return Response.json({ donations: [] }, { status: 400 });
  }

  const donations = await getDonationLog({ caseId, cityId, limit, sort });
  return Response.json({ donations });
}
