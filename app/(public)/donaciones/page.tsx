import type { Metadata } from "next";
import { DonationCauseCard } from "@/components/donations/DonationCauseCard";
import { GeneralFundHero } from "@/components/donations/GeneralFundHero";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { screenTitle, shell } from "@/components/ui/styles";
import { caseKindLabel } from "@/lib/constants";
import { getCaseCards } from "@/lib/data";
import type { CaseCard, CaseKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donaciones",
  description:
    "Un fondo general y las causas documentadas, para aportar por Mercado Pago. El portal no recauda: el cobro lo confirma la pasarela.",
};

type Shelf = {
  id: string;
  label: string;
  hint: string;
  cards: CaseCard[];
};

function shelvesOf(cases: CaseCard[]): Shelf[] {
  const withGoal = cases.filter((row) => row.budget.goal > 0);
  const ratioOf = (row: CaseCard) => row.budget.ratio;
  const kindOf = (kind: CaseKind) => cases.filter((row) => row.case_kind === kind);

  const needed = [...withGoal].sort((a, b) => ratioOf(a) - ratioOf(b)).slice(0, 8);
  const close = withGoal.filter((row) => row.budget.ratio >= 0.7 && row.budget.ratio < 1);
  const recent = [...cases].slice(0, 6);

  return [
    { id: "necesitadas", label: "Más necesitadas", hint: "Donde falta más para la meta.", cards: needed },
    { id: "cerca", label: "Cerca de la meta", hint: "Un empujón las cierra.", cards: close },
    { id: "familias", label: "Familias", hint: caseKindLabel("persona"), cards: kindOf("persona") },
    { id: "colegios", label: "Colegios", hint: "Escuelas y centros.", cards: kindOf("colegio") },
    { id: "animales", label: "Animales", hint: "Causas de un animal.", cards: kindOf("animal") },
    { id: "fundaciones", label: "Fundaciones", hint: "Sedes y colectivos afectados.", cards: kindOf("fundacion") },
    { id: "nuevas", label: "Recién documentadas", hint: "Las últimas en entrar.", cards: recent },
  ].filter((shelf) => shelf.cards.length > 0);
}

export default async function DonationsPage() {
  const cases = await getCaseCards();
  const menu = shelvesOf(cases);

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Donaciones"
          subtitle="Al fondo general, o a una causa concreta."
          backHref="/"
          backLabel="Volver al inicio"
        />

        <div className="enters enters-1 mt-6">
          <GeneralFundHero />
        </div>

        {menu.length > 0 && (
          <>
            <section className="enters enters-2 mt-12 lg:mt-16">
              <h2 className={screenTitle}>¿No sabes en qué donar?</h2>
              <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-muted">
                Elige una causa: por lo que más falta, por tipo, o por las que están a punto de
                cerrar.
              </p>
            </section>

            <nav aria-label="Categorías" className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {menu.map((shelf) => (
                <a
                  key={shelf.id}
                  href={`#${shelf.id}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line bg-panel-high px-4 text-[14px] text-body hover:border-line-strong hover:text-ink"
                >
                  {shelf.label}
                </a>
              ))}
            </nav>

            {menu.map((shelf) => (
              <section key={shelf.id} id={shelf.id} className="mt-10 scroll-mt-24">
                <h2 className={screenTitle}>{shelf.label}</h2>
                <p className="mt-1 text-[13px] text-muted">{shelf.hint}</p>
                <ul className="mt-5 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
                  {shelf.cards.map((caseCard) => (
                    <li key={caseCard.id} className="w-[min(80vw,22rem)] shrink-0 lg:w-auto">
                      <DonationCauseCard caseCard={caseCard} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
