import Link from "next/link";
import { DonateButton, DonateOverlay } from "@/components/donations/DonateOverlay";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { CityChip } from "@/components/ui/Chip";
import { Photo } from "@/components/ui/Photo";
import { button } from "@/components/ui/styles";
import { caseLead } from "@/lib/format";
import type { CaseCard } from "@/lib/types";

export function DonationCauseCard({ caseCard }: { caseCard: CaseCard }) {
  const href = `/ciudades/${caseCard.citySlug}/casos/${caseCard.id}`;
  const story = caseLead(caseCard, 140);
  const person = caseCard.case_kind === "persona";
  const path = person ? (caseCard.coverPath ?? caseCard.portraitPath) : caseCard.coverPath;
  const frame = person ? caseCard.portraitFrame : caseCard.coverFrame;
  const onPhoto = Boolean(path);

  return (
    <DonateOverlay title={`Donar a ${caseCard.display_name}`} caseId={caseCard.id}>
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-panel-high shadow-card">
        <div className="relative aspect-4/3 overflow-hidden">
          <Photo
            path={path}
            frame={frame}
            kind={person ? "portrait" : "situation"}
            alt=""
            className="absolute inset-0 size-full"
            emptyLabel="Sin fotografías publicadas."
          />
          {onPhoto && <span aria-hidden className="veil-b absolute inset-0" />}
          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <CityChip name={caseCard.cityName} onPhoto={onPhoto} />
            <h2
              className={`mt-2 line-clamp-2 font-display text-[22px] leading-tight ${
                onPhoto ? "text-paper" : "text-ink"
              }`}
            >
              {caseCard.display_name}
            </h2>
          </div>
        </div>

        {story && <p className="px-4 pt-4 text-[14px] leading-relaxed text-body">{story}</p>}

        {/* El «Faltan …» que había aquí contaba sobre lo declarado mientras la
            barra de al lado contaba lo entregado: dos cifras de la misma meta en
            cuatro centímetros. Lo que falta lo dice ahora la propia barra, en el
            mismo sitio y con la misma cuenta que en la ficha. */}
        {caseCard.budget.goal > 0 && (
          <div className="px-4 pt-4">
            <CaseProgressBar budget={caseCard.budget} compact />
          </div>
        )}

        <div className="mt-auto flex gap-2 p-3.5">
          <Link href={href} className={`${button.secondary} min-w-0 flex-1`}>
            Ver más
          </Link>
          {/* `primary` y no `invite`: esta tarjeta lleva la foto y el nombre de
              una persona, así que es del registro sobrio aunque viva en la
              rejilla de /donaciones. La regla del final de eslint.config.mjs la
              tiene en la lista por eso. */}
          <DonateButton className={`${button.primary} min-w-0 flex-1`}>Donar</DonateButton>
        </div>
      </article>
    </DonateOverlay>
  );
}
