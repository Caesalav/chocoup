import { getDonationLog } from "@/lib/data";
import { DONATION_LOG_LIMIT } from "@/lib/donation-log";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const donations = await getDonationLog({ caseId, cityId, limit });
  return Response.json({ donations });
}
