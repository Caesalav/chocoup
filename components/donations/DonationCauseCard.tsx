import Link from "next/link";
import { DonateButton, DonateOverlay } from "@/components/donations/DonateOverlay";
import { GeneralChannelNote } from "@/components/donations/GeneralChannelNote";
import { Photo } from "@/components/ui/Photo";
import { button } from "@/components/ui/styles";
import { caseDonation, type DonationChannel } from "@/lib/donation-channel";
import { caseLead } from "@/lib/format";
import type { CaseCard } from "@/lib/types";

type Props = {
  caseCard: CaseCard;
  /** El canal general del portal, que es lo que recibe si la causa no tiene el suyo. */
  generalChannel: DonationChannel | null;
};

/**
 * Una causa en la rejilla de donar: la primera foto, un recorte de su historia
 * y los dos botones.
 *
 * Una causa es una persona, un colegio, un animal o una fundación. La palabra
 * importa aquí más que en ninguna otra pantalla: esta rejilla tenía antes tres
 * pestañas —municipios, fundaciones y causas— y donar a un municipio no
 * significaba nada, porque un municipio no recibe nada.
 *
 * El pop-up dice de quién es el canal antes de enseñarlo, y lo dice con la misma
 * frase que la ficha (`GeneralChannelNote`). Esa repetición es deliberada: el
 * gesto de donar desde aquí es más rápido que desde la ficha —dos toques y la
 * llave delante— y es justo donde más falta hace saber a dónde va.
 */
export function DonationCauseCard({ caseCard, generalChannel }: Props) {
  const donation = caseDonation(caseCard, generalChannel);
  const href = `/ciudades/${caseCard.citySlug}/casos/${caseCard.id}`;
  // El resumen escrito a mano si lo hay, y si no el recorte de la historia. Aquí
  // esa frase es lo único que hay para decidir a cuál de las causas de la rejilla
  // pulsar, y un corte a mitad de palabra es lo que la deja sin decir nada. Ver
  // `caseLead()` en lib/format.ts.
  const story = caseLead(caseCard, 140);
  const onPhoto = Boolean(caseCard.coverPath);

  return (
    <DonateOverlay
      title={
        donation.source === "propio"
          ? `Donar a ${caseCard.display_name}`
          : `Donar por ${caseCard.display_name}`
      }
      channel={donation.channel}
      note={
        donation.source === "general" ? (
          <GeneralChannelNote caseName={caseCard.display_name} />
        ) : undefined
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

        {/* El rótulo va en la tarjeta y no solo dentro del pop-up: quien recorre
            la rejilla decide a cuál pulsar mirando esto, y «tiene canal propio» o
            «recibe por el general» cambia lo que está eligiendo. Dentro se repite
            entero, porque leer una etiqueta de tres palabras no es haberlo
            entendido. */}
        <p className="px-4 pt-3 text-[12px] leading-relaxed text-faint">
          {donation.source === "propio"
            ? "Canal propio"
            : donation.source === "general"
              ? "Recibe por el canal general del portal"
              : "Todavía sin canal"}
        </p>

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
