import Link from "next/link";
import type { Metadata } from "next";
import { DonationCauseCard } from "@/components/donations/DonationCauseCard";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
import { GeneralChannelNote } from "@/components/donations/GeneralChannelNote";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { blockInvite, card, cardGrid, screenTitle, shell } from "@/components/ui/styles";
import { caseDonation } from "@/lib/donation-channel";
import { plural } from "@/lib/format";
import { getCaseCards, getGeneralChannel } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donaciones",
  description:
    "A dónde va el dinero: el canal general del portal y el de cada causa documentada en el Chocó. Cada canal es de quien lo recibe y ninguno pasa por este portal.",
};

/**
 * A dónde va el dinero.
 *
 * Tenía tres pestañas —municipios, fundaciones y causas— y ahora es una sola
 * lista. No es una simplificación de forma: donar a un municipio no significaba
 * nada, porque un municipio no recibe nada, y donar «a una fundación» mandaba a
 * la gente al canal del pueblo con el nombre de la fundación encima. Las dos
 * pestañas contestaban una pregunta que nadie hace.
 *
 * Lo que queda es lo que sí se puede responder: el canal general del portal, y
 * después cada causa con el suyo o con el general. Las causas con canal propio
 * van primero, y eso también es una decisión: quien busca a quién ayudar debería
 * encontrar antes a las que alguien abrió una cuenta para ellas.
 */
export default async function DonationsPage() {
  const [general, cases] = await Promise.all([getGeneralChannel(), getCaseCards()]);

  const own = cases.filter((row) => caseDonation(row, general).source === "propio");
  const viaGeneral = cases.filter((row) => caseDonation(row, general).source !== "propio");
  const ordered = [...own, ...viaGeneral];

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Donaciones"
          subtitle="A una causa concreta o al canal general, que reparte entre todas. El dinero va directo a quien lo recibe."
          backHref="/"
          backLabel="Volver al inicio"
        />

        {/* Lavanda, la misma receta que /ofrecer y /sugerencias, porque es el
            mismo acto: las tres pantallas piden algo a quien llega. Lo que no
            sube de voz son las tarjetas de causa, que llevan la cara y el
            nombre de alguien. */}
        <div className={`${blockInvite} enters enters-1 mt-5 max-w-[68ch] p-5 sm:p-6`}>
          <p className="text-[14px] leading-relaxed text-body">
            Nada de lo que dones pasa por este portal. Cada causa enseña a dónde va lo que le
            mandes: unas tienen un canal abierto a su nombre y otras reciben por el canal general,
            y su ficha lo dice con esas palabras.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            De lo que sí pasa por el portal —los recursos que la gente ofrece— hay constancia
            pública en el{" "}
            {/* `accent-strong` y no `accent`: sobre lavanda el acento normal se
                queda en 4,33:1, que no llega a AA. Lo mide scripts/contraste.mjs. */}
            <Link href="/ayudas" className="text-accent-strong underline">
              registro de ayudas
            </Link>
            : de qué tipo era cada ayuda, en qué mes llegó y a qué municipio.
          </p>
        </div>

        {/* El canal general va arriba y entero, no escondido detrás de un botón.
            Es el destino con más alcance del portal —lo usan todas las causas sin
            canal propio— y quien llega aquí desde un WhatsApp tiene que poder
            copiarlo sin abrir nada. Cuando no hay, se dice: un hueco callado se
            leería como que la página se quedó a medias. */}
        <section className="enters enters-2 mt-8 lg:grid lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
          <div>
            <h2 className={screenTitle}>Canal general</h2>
            <GeneralChannelNote className="mt-2" />
          </div>
          <div className="mt-5 lg:mt-0 lg:max-w-md">
            {general ? (
              <DonationChannelCard channel={general} featured />
            ) : (
              <p className={`${card} p-5 text-[14px] leading-relaxed text-muted`}>
                Ahora mismo no hay canal general registrado, así que las causas que no tienen el
                suyo no pueden recibir dinero todavía. No enseñamos ninguno en su lugar.
              </p>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className={screenTitle}>Causas documentadas</h2>
          <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-muted">
            {cases.length === 0
              ? "Todavía no hay ninguna publicada. Solo publicamos una causa cuando la persona da su consentimiento."
              : `${plural(cases.length, "causa publicada", "causas publicadas")}, ${
                  own.length === 0
                    ? "todas por el canal general"
                    : `${own.length} con canal propio y el resto por el general`
                }. Una causa puede ser una persona, un colegio, un animal o una fundación.`}
          </p>

          {ordered.length > 0 && (
            <ul className={`enters enters-3 mt-6 ${cardGrid}`}>
              {ordered.map((caseCard) => (
                <li key={caseCard.id}>
                  <DonationCauseCard caseCard={caseCard} generalChannel={general} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SiteFooter />
    </>
  );
}
