import Link from "next/link";
import { DonateButton, DonateOverlay } from "@/components/donations/DonateOverlay";
import { Photo } from "@/components/ui/Photo";
import { button } from "@/components/ui/styles";
import { donationChannel, type DonationChannel } from "@/lib/donation-channel";
import { excerpt } from "@/lib/format";
import type { CaseCard } from "@/lib/types";

type Props = {
  caseCard: CaseCard;
  /** El canal del municipio, por si esta causa todavía no tiene el suyo. */
  cityChannel: DonationChannel | null;
};

/**
 * Una causa en la rejilla de donar: la primera foto, un recorte de su historia
 * y los dos botones. El dinero de «Donar» va al canal de esa familia si lo
 * tiene; si no, al de su municipio, y el pop-up lo dice.
 */
export function DonationCauseCard({ caseCard, cityChannel }: Props) {
  const own = donationChannel(caseCard);
  const channel = own ?? cityChannel;
  const href = `/ciudades/${caseCard.citySlug}/casos/${caseCard.id}`;
  const story = caseCard.story ? excerpt(caseCard.story, 140) : "";
  const onPhoto = Boolean(caseCard.coverPath);

  return (
    <DonateOverlay
      title={own ? `Donar a ${caseCard.display_name}` : `Donar a ${caseCard.cityName}`}
      channel={channel}
      note={
        own
          ? undefined
          : cityChannel
            ? `Esta causa todavía no tiene canal propio. El dinero iría al municipio de ${caseCard.cityName}.`
            : undefined
      }
    >
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-panel-high shadow-card">
        <div className="relative aspect-4/3 overflow-hidden">
          <Photo
            path={caseCard.coverPath}
            frame={caseCard.coverFrame}
            alt=""
            className="absolute inset-0 size-full"
            emptyLabel="Sin fotografías publicadas."
          />
          {onPhoto && <span aria-hidden className="veil-b absolute inset-0" />}
          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <p className={`text-[12px] ${onPhoto ? "text-paper/75" : "text-faint"}`}>
              {caseCard.cityName}
            </p>
            <h2
              className={`mt-1 line-clamp-2 font-display text-[22px] leading-tight ${
                onPhoto ? "text-paper" : "text-ink"
              }`}
            >
              {caseCard.display_name}
            </h2>
          </div>
        </div>

        {story && (
          <p className="px-4 pt-4 text-[14px] leading-relaxed text-body">{story}</p>
        )}

        <div className="mt-auto flex gap-2 p-3.5">
          <Link href={href} className={`${button.secondary} min-w-0 flex-1`}>
            Ver más
          </Link>
          <DonateButton className={`${button.primary} min-w-0 flex-1`}>Donar</DonateButton>
        </div>
      </article>
    </DonateOverlay>
  );
}
