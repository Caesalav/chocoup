import type { Metadata } from "next";
import { CaseRow } from "@/components/cards/CaseRow";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { card, cardGrid, shell } from "@/components/ui/styles";
import { getCaseCards } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Casos",
  description:
    "Personas y familias del Chocó afectadas por el terremoto, publicadas con su consentimiento.",
};

export default async function CasesPage() {
  const cases = await getCaseCards();

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Casos"
          subtitle="Cada caso está publicado con el consentimiento de la persona. Si alguien pide que lo retiremos, se retira."
          backHref="/"
          backLabel="Volver al inicio"
          count={cases.length}
        />

        {cases.length === 0 ? (
          <p className={`${card} mt-6 p-5 text-[14px] leading-relaxed text-muted`}>
            Todavía no hay casos publicados.
          </p>
        ) : (
          <ul className={`enters enters-1 mt-6 ${cardGrid}`}>
            {cases.map((caseCard) => (
              <li key={caseCard.id}>
                <CaseRow caseCard={caseCard} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
