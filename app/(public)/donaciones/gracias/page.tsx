import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, DonationIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";
import { formatCOP } from "@/lib/format";
import {
  donationStatus,
  fetchPayment,
  isMercadoPagoConfigured,
  readDonationReference,
} from "@/lib/mercadopago";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gracias por tu donación",
  // No se indexa: es el acuse de un pago concreto, con su importe en la
  // dirección. No es una página del portal, es el final de un trámite.
  robots: { index: false, follow: false },
};

/**
 * A dónde vuelve quien acaba de pagar.
 *
 * ===========================================================================
 * LO QUE ESTA PANTALLA NO PUEDE HACER: CREER LO QUE TRAE LA DIRECCIÓN
 *
 * Mercado Pago devuelve aquí con `?status=approved&payment_id=…` colgando de la
 * URL, y esa cadena la puede escribir cualquiera en la barra de direcciones.
 * Pintar «gracias, recibimos tu donación» porque lo diga un parámetro es
 * enseñar un comprobante que el portal no ha comprobado.
 *
 * Así que del retorno se cree lo mismo que del webhook: solo el identificador.
 * El estado y el importe se leen preguntándole a Mercado Pago con el token, que
 * es la misma regla que gobierna `/api/mercadopago/webhook`, escrita allí con
 * más detalle. Si la pregunta no se puede hacer o el pago no aparece, esta
 * pantalla da las gracias sin afirmar nada: no inventa una cifra.
 *
 * Y NO ESCRIBE NADA. Que esta página vea un pago aprobado no registra la
 * donación —eso sigue siendo cosa exclusiva del webhook, por las tres barreras
 * de 0017—. Aquí solo se mira. Por eso puede pasar, y es correcto, que alguien
 * llegue a esta pantalla un segundo antes de que la donación aparezca en el
 * registro público: son dos caminos distintos y el que manda es el otro.
 * ===========================================================================
 */

type Search = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * La causa a la que fue el dinero, para poder nombrarla y enlazarla.
 *
 * Se lee con el cliente del visitante y no con la llave de servicio, así que
 * una causa sin publicar no vuelve de aquí: las RLS deciden, como en el resto
 * del portal. Sin causa se enseña «el fondo general», que es lo que era.
 */
async function findCase(
  caseId: string,
): Promise<{ name: string; href: string } | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("cases")
      .select("id, display_name, cities(slug)")
      .eq("id", caseId)
      .maybeSingle();

    const row = data as
      | { id: string; display_name: string | null; cities: { slug: string } | null }
      | null;

    if (!row?.display_name || !row.cities?.slug) return null;
    return {
      name: row.display_name,
      href: `/ciudades/${row.cities.slug}/casos/${row.id}`,
    };
  } catch {
    return null;
  }
}

export default async function DonationThanksPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;

  // Mercado Pago manda el identificador con dos nombres según el camino por el
  // que se vuelva. Los dos son el mismo pago.
  const paymentId = one(params.payment_id) ?? one(params.collection_id);

  const payment =
    paymentId && isMercadoPagoConfigured() ? await fetchPayment(paymentId) : null;
  const state = payment ? donationStatus(payment.status) : null;

  const target = readDonationReference(payment?.external_reference);
  const causa = target?.caseId ? await findCase(target.caseId) : null;

  const amount = payment ? formatCOP(payment.transaction_amount) : null;
  const confirmed = state === "confirmada";
  const pending = state === "pendiente";
  const failed = state === "fallida";

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-10 sm:px-8 lg:pb-24 lg:pt-16">
      {/* El sello verde solo cuando el pago está aprobado de verdad. Un pago
          pendiente lleva el glifo de donación en el lavado, sin visto: el visto
          es la promesa de que algo terminó, y una transferencia que tarda dos
          días no ha terminado. */}
      {confirmed ? (
        <span className="flex size-14 items-center justify-center rounded-full bg-brote text-selva">
          <CheckIcon className="draws-check size-7 stroke-[2.5]" />
        </span>
      ) : (
        <span className="flex size-14 items-center justify-center rounded-full bg-land text-ink">
          <DonationIcon className="size-7" />
        </span>
      )}

      <h1 className="enters enters-1 mt-6 font-display text-[30px] leading-tight text-ink">
        {failed ? "El pago no se completó" : "Gracias por tu donación"}
      </h1>

      {confirmed && (
        <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
          Ya está confirmada. Te mandamos el detalle al correo con el que pagaste.
        </p>
      )}

      {pending && (
        <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
          Mercado Pago todavía la está procesando, que es normal con
          transferencias y pagos en efectivo. Cuando la confirme, tu donación
          aparece en el registro y te llega un correo. No hay que hacer nada más.
        </p>
      )}

      {failed && (
        <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
          No se te cobró nada. Puedes intentarlo otra vez cuando quieras.
        </p>
      )}

      {!state && (
        <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
          Si el cobro se completó, tu donación aparecerá en el registro en cuanto
          Mercado Pago lo confirme.
        </p>
      )}

      {/* El resumen sale solo cuando hay un pago comprobado detrás. Sin él no se
          pinta un recuadro vacío ni un importe cogido de la dirección. */}
      {payment && !failed && (
        <dl className="enters enters-3 mt-8 divide-y divide-line rounded-2xl border border-line bg-panel px-5">
          {amount && (
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-[14px] text-muted">Valor</dt>
              <dd className="font-display text-[19px] tabular-nums text-ink">{amount}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-4 py-3.5">
            <dt className="text-[14px] text-muted">Destino</dt>
            <dd className="text-right text-[15px] text-ink">
              {causa ? (
                <Link href={causa.href} className="underline-offset-2 hover:underline">
                  {causa.name}
                </Link>
              ) : (
                "Fondo general"
              )}
            </dd>
          </div>
          {pending && (
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-[14px] text-muted">Estado</dt>
              <dd className="text-[15px] text-ink">Esperando confirmación</dd>
            </div>
          )}
        </dl>
      )}

      <div className="enters enters-3 mt-8 flex flex-wrap gap-3">
        <Link href="/#donaciones" className={button.primary}>
          Ver el registro de donaciones
        </Link>
        {failed ? (
          <Link href="/donaciones" className={button.secondary}>
            Intentar de nuevo
          </Link>
        ) : (
          <Link href="/" className={button.secondary}>
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  );
}
