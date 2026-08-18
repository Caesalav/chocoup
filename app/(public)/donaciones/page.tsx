import Link from "next/link";
import type { Metadata } from "next";
import { DonationCauseCard } from "@/components/donations/DonationCauseCard";
import { DonationCityCard } from "@/components/donations/DonationCityCard";
import { DonationFoundationTile } from "@/components/donations/DonationFoundationTile";
import { DonationTabs, parseDonationView } from "@/components/donations/DonationTabs";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { card, cardGrid, shell } from "@/components/ui/styles";
import { getCaseCards, getCityDonationEntries } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donaciones",
  description:
    "A dónde va el dinero: el canal de donación de cada municipio del Chocó y de las familias documentadas. Cada canal es de quien lo recibe y ninguno pasa por este portal.",
};

type Props = { searchParams: Promise<{ ver?: string }> };

/**
 * A dónde va el dinero.
 *
 * Esta pantalla existe para decir una cosa con claridad: el portal no recibe
 * donaciones. Cada canal es de quien lo recibe —un municipio, una fundación, una
 * familia— y el dinero va directo allí.
 *
 * Tres pestañas, y cada una es una rejilla: los pueblos con su foto, las
 * fundaciones con el botón hacia la gente de ese pueblo, las causas con la
 * primera imagen de esa familia. «Donar» abre un pop-up con la llave o el enlace;
 * «Ver más» entra en la ficha.
 */
export default async function DonationsPage({ searchParams }: Props) {
  const { ver } = await searchParams;
  const view = parseDonationView(ver);

  const [cities, cases] = await Promise.all([getCityDonationEntries(), getCaseCards()]);
  const foundations = cities.filter((entry) => entry.foundation);
  const channelBySlug = Object.fromEntries(cities.map((entry) => [entry.city.slug, entry.channel]));

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Donaciones"
          subtitle="A un municipio, a su gente o a una familia. Cada canal es de quien lo recibe y el dinero va directo allí."
          backHref="/"
          backLabel="Volver al inicio"
        />

        <div className={`${card} enters enters-1 mt-5 max-w-[68ch] p-4`}>
          <p className="text-[14px] leading-relaxed text-body">
            Nada de lo que dones pasa por este portal. Cada canal lo abrió quien lo recibe y no hay
            ninguno común: si una ficha no enseña canal es que todavía no tiene, y no hay otro que
            valga en su lugar.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            De lo que sí pasa por el portal —los recursos que la gente ofrece— hay constancia pública
            en el{" "}
            <Link href="/ayudas" className="text-accent hover:underline">
              registro de ayudas
            </Link>
            : de qué tipo era cada ayuda, en qué mes llegó y a qué municipio.
          </p>
        </div>

        <div className="enters enters-2 mt-6">
          <DonationTabs
            active={view}
            cityCount={cities.length}
            foundationCount={foundations.length}
            caseCount={cases.length}
          />
        </div>

        {view === "municipios" ? (
          <section className="mt-6">
            {cities.length === 0 ? (
              <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                Todavía no hay municipios publicados.
              </p>
            ) : (
              <ul className={`enters enters-3 ${cardGrid}`}>
                {cities.map((entry) => (
                  <li key={entry.city.id}>
                    <DonationCityCard entry={entry} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : view === "fundaciones" ? (
          <section className="mt-6">
            {foundations.length === 0 ? (
              <p className={`${card} max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                Todavía no hay fundaciones registradas en los municipios publicados.
              </p>
            ) : (
              <ul className={`enters enters-3 ${cardGrid}`}>
                {foundations.map((entry) => (
                  <li key={entry.foundation!.id}>
                    <DonationFoundationTile
                      foundation={entry.foundation!}
                      cityName={entry.city.name}
                      cityChannel={entry.channel}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="mt-6">
            {cases.length === 0 ? (
              <p className={`${card} max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                Todavía no hay casos publicados. Cuando una familia dé su consentimiento, aparecerá
                aquí.
              </p>
            ) : (
              <ul className={`enters enters-3 ${cardGrid}`}>
                {cases.map((caseCard) => (
                  <li key={caseCard.id}>
                    <DonationCauseCard
                      caseCard={caseCard}
                      cityChannel={channelBySlug[caseCard.citySlug] ?? null}
                    />
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
