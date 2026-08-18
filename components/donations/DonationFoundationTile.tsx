import { DonateButton, DonateOverlay } from "@/components/donations/DonateOverlay";
import { button, card } from "@/components/ui/styles";
import type { DonationChannel } from "@/lib/donation-channel";
import type { Foundation } from "@/lib/types";

type Props = {
  foundation: Foundation;
  cityName: string;
  cityChannel: DonationChannel | null;
};

/**
 * La fundación en /donaciones: quién es, de qué pueblo, y un botón que no dona
 * a la fundación sino a la gente de ese municipio.
 *
 * El recaudo de la fundación vive en su ficha. Aquí el gesto es el contrario al
 * de una lista de ONGs: el dinero de este botón va al canal del pueblo.
 */
export function DonationFoundationTile({ foundation, cityName, cityChannel }: Props) {
  return (
    <DonateOverlay
      title={`Donar a la gente de ${cityName}`}
      channel={cityChannel}
      note={
        cityChannel
          ? `El canal es el de ${cityName}, no el de la fundación.`
          : undefined
      }
    >
      <article className={`${card} flex h-full flex-col p-5`}>
        <h2 className="font-display text-[26px] leading-tight text-ink">{foundation.name}</h2>

        {foundation.description && (
          <p className="mt-3 text-[14px] leading-relaxed text-body">{foundation.description}</p>
        )}

        <p className="mt-3 text-[13px] text-muted">{cityName}</p>

        <div className="mt-auto pt-5">
          <DonateButton className={`${button.primary} w-full`}>Donar a la gente</DonateButton>
        </div>
      </article>
    </DonateOverlay>
  );
}
