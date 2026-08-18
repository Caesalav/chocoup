import Link from "next/link";
import { DonateButton, DonateOverlay } from "@/components/donations/DonateOverlay";
import { Photo } from "@/components/ui/Photo";
import { button } from "@/components/ui/styles";
import type { CityDonationEntry } from "@/lib/types";

/**
 * Un municipio en la rejilla de donar: su foto, su nombre y dos caminos.
 *
 * «Donar» —el de encima de la foto y el de abajo— abre el pop-up con la llave o
 * el enlace de ese pueblo. «Ver más» entra en la ficha, que es donde está el
 * resto: las personas, las necesidades, el canal otra vez.
 */
export function DonationCityCard({ entry }: { entry: CityDonationEntry }) {
  const { city } = entry;
  const onPhoto = Boolean(entry.coverPath);

  return (
    <DonateOverlay title={`Donar a ${city.name}`} channel={entry.channel}>
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-panel-high shadow-card">
        <div className="relative aspect-4/3 overflow-hidden">
          <Photo
            path={entry.coverPath}
            frame={entry.coverFrame}
            alt=""
            eager
            className="absolute inset-0 size-full"
            emptyLabel="Documentado. Las fotos llegan con el próximo viaje."
          />

          {onPhoto && (
            <>
              <span aria-hidden className="veil-t absolute inset-x-0 top-0 h-20" />
              <span aria-hidden className="veil-b absolute inset-0" />
            </>
          )}

          <DonateButton
            className={`${button.primary} absolute top-3 right-3 z-10 min-h-11 px-5 shadow-lift`}
          >
            Donar
          </DonateButton>

          <div className="absolute inset-x-0 bottom-0 z-10 p-4">
            <h2
              className={`font-display text-[28px] leading-none ${
                onPhoto ? "text-paper" : "text-ink"
              }`}
            >
              {city.name}
            </h2>
          </div>
        </div>

        <div className="mt-auto flex gap-2 p-3.5">
          <Link href={`/ciudades/${city.slug}`} className={`${button.secondary} min-w-0 flex-1`}>
            Ver más
          </Link>
          <DonateButton className={`${button.primary} min-w-0 flex-1`}>Donar</DonateButton>
        </div>
      </article>
    </DonateOverlay>
  );
}
