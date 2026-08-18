import Link from "next/link";
import type { Metadata } from "next";
import { CaseRow } from "@/components/cards/CaseRow";
import { DonationTabs, parseDonationView } from "@/components/donations/DonationTabs";
import { TransferKey } from "@/components/donations/TransferKey";
import { FoundationCard } from "@/components/FoundationCard";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { card, cardGrid, shell } from "@/components/ui/styles";
import { getCaseCards, getDonationKey, getFoundationEntries } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donaciones",
  description:
    "A dónde va el dinero: la llave de transferencia del portal, la fundación de cada municipio del Chocó con su canal oficial de donación, y las familias documentadas a las que se puede aportar a través de ella.",
};

type Props = { searchParams: Promise<{ ver?: string }> };

/**
 * A dónde va el dinero.
 *
 * Esta pantalla existe para decir una cosa con claridad: el portal no recibe
 * donaciones. Cada fundación tiene su canal y el enlace lleva allí. Por eso el
 * aviso va arriba del todo y no en letra pequeña al final.
 *
 * Y son dos preguntas distintas, que antes se contestaban en pantallas distintas:
 * «quiero ayudar a un pueblo» y «quiero ayudar a esta familia». La segunda estaba
 * solo en /casos, que se lee como un archivo de situaciones y no como una lista de
 * a quién se le puede dar. Las dos viven aquí, en dos pestañas, y el dinero
 * termina yendo por el mismo sitio: la fundación del municipio.
 *
 * Las pestañas son dos enlaces con un parámetro en la dirección —como las de la
 * ficha de un municipio— y no un conmutador de cliente: funcionan con el
 * JavaScript caído y cada una se puede compartir por WhatsApp tal cual.
 */
export default async function DonationsPage({ searchParams }: Props) {
  const { ver } = await searchParams;
  const view = parseDonationView(ver);

  // Las dos listas siempre, aunque solo se pinte una: los contadores de las
  // pestañas dicen cuánto hay al otro lado, y una pestaña que no dice cuánto hay
  // detrás no se pulsa. Son dos consultas sobre un portal de treinta municipios.
  const [foundations, cases, donationKey] = await Promise.all([
    getFoundationEntries(),
    getCaseCards(),
    getDonationKey(),
  ]);

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Donaciones"
          subtitle="A un municipio entero o a una familia concreta. En los dos casos el dinero entra por la fundación que ya trabaja allí."
          backHref="/"
          backLabel="Volver al inicio"
        />

        {/* La llave va arriba y antes de las pestañas, y no dentro de una de
            ellas: es una para todo el portal, así que colgarla de «fundaciones» o
            de «familias» diría que solo vale para esa mitad. Es además lo único
            que hoy funciona —no hay ninguna fundación registrada—, y quien llega
            desde un WhatsApp preguntando a dónde manda el dinero tiene que
            encontrar la respuesta sin pulsar nada. */}
        {donationKey && (
          <section className="enters enters-1 mt-5 max-w-[68ch]" aria-label="Llave de transferencia">
            <TransferKey donationKey={donationKey} featured />
          </section>
        )}

        <div className={`${card} enters enters-2 mt-5 max-w-[68ch] p-4`}>
          <p className="text-[14px] leading-relaxed text-body">
            {donationKey
              ? "La llave de arriba es la del portal y sirve para todo el Chocó. Cada fundación tiene además su propio canal, y ese enlace lleva a donde ella rinde cuentas: nada de lo que dones pasa por este portal."
              : "Nada de lo que dones pasa por este portal. Cada enlace lleva al canal oficial de la fundación que ya trabaja en ese municipio y que rinde cuentas allí."}
          </p>
          {/* La pregunta que sigue a "a dónde va el dinero" es "y llegó algo": el
              registro se enlaza desde aquí porque este es el sitio donde uno se la
              hace. Se nombra por lo que publica de verdad —el tipo de ayuda, no qué
              era exactamente— para no prometer un detalle que la vista pública ya no
              da. */}
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            De lo que sí pasa por el portal —los recursos que la gente ofrece— hay constancia
            pública en el{" "}
            <Link href="/ayudas" className="text-accent hover:underline">
              registro de ayudas
            </Link>
            : de qué tipo era cada ayuda, en qué mes llegó y a qué municipio.
          </p>
        </div>

        <div className="enters enters-3 mt-6">
          <DonationTabs
            active={view}
            foundationCount={foundations.length}
            caseCount={cases.length}
          />
        </div>

        {view === "fundaciones" ? (
          <section className="mt-6">
            <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted">
              Una fundación por municipio: la que coordina el reparto allí y la que rinde cuentas de
              lo que entra. Donar aquí es donar al municipio, y el reparto lo decide ella con su
              censo.
            </p>

            {foundations.length === 0 ? (
              <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                Todavía no hay fundaciones publicadas.
              </p>
            ) : (
              <ul className={`enters enters-4 mt-4 ${cardGrid}`}>
                {foundations.map((foundation) => (
                  <li key={foundation.id}>
                    <FoundationCard
                      foundation={foundation}
                      cityName={foundation.cityName}
                      cityHint={foundation.cityName}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="mt-6">
            {/* No hay botón de donar en esta lista, y es a propósito: el aporte a
                una familia se coordina en su ficha, donde está su situación
                escrita y el nombre de la fundación por la que entra. Un «Donar» al
                lado de un nombre, sin haber leído nada, convertiría a estas
                personas en una lista de destinatarios. */}
            <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted">
              Las familias que dieron su consentimiento para que se cuente su situación. El aporte
              se envía por la fundación del municipio, que se lo hace llegar: no publicamos el
              número de nadie. Entra en un caso para leer qué le pasó y coordinar desde ahí.
            </p>

            {cases.length === 0 ? (
              <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                Todavía no hay casos publicados. Cuando una familia dé su consentimiento, aparecerá
                aquí.
              </p>
            ) : (
              <ul className={`enters enters-4 mt-4 ${cardGrid}`}>
                {cases.map((caseCard) => (
                  <li key={caseCard.id}>
                    <CaseRow caseCard={caseCard} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
