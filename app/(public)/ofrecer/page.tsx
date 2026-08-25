import Link from "next/link";
import type { Metadata } from "next";
import {
  DonationIcon,
  OfferIcon,
  ProfessionIcon,
  ResourceIcon,
  TownIcon,
} from "@/components/ui/icons";
import { blockOffer } from "@/components/ui/styles";
import { SUPPORT_KINDS } from "@/lib/support";
import type { SupportOfferKind } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofrecer",
  description:
    "Cuatro caminos para ayudar: voluntariado, tu profesión, un recurso, o dinero. El equipo recibe el contacto y no se publica.",
};

const TILES: Record<
  SupportOfferKind,
  { Icon: (props: { className?: string }) => React.ReactElement; tile: string; chip: string }
> = {
  voluntario: {
    Icon: OfferIcon,
    tile: "bg-lavanda text-ink border-ink/10 hover:brightness-[0.97]",
    chip: "bg-paper/55",
  },
  profesion: {
    Icon: ProfessionIcon,
    tile: "bg-liana text-selva border-selva/20 hover:brightness-95",
    chip: "bg-paper/40",
  },
  recurso: {
    Icon: ResourceIcon,
    tile: "bg-selva text-luz border-luz/10 hover:bg-accent-strong",
    chip: "bg-luz/15",
  },
  // El mismo `ciruela` que en la landing, para que el cuarto camino sea el
  // mismo color en las dos pantallas donde aparece.
  fundacion: {
    Icon: TownIcon,
    tile: "bg-ciruela text-panel-high border-ink/10 hover:brightness-110",
    chip: "bg-panel-high/15",
  },
};

export default function OfferHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-8 pt-6 sm:px-8 lg:pb-20 lg:pt-14">
      <div className={`${blockOffer} p-5 sm:p-6 lg:p-8`}>
        <p className="text-[13px] text-lavanda">Ofrecer</p>
        <h1 className="mt-1.5 font-display text-[28px] leading-tight text-panel-high lg:text-[38px]">
          Cómo puedes ayudar
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-panel-high/80">
          Elige un camino. El equipo lee lo que dejas y te escribe. El contacto no se publica.
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        {SUPPORT_KINDS.map((kind) => {
          const { Icon, tile, chip } = TILES[kind.value];
          return (
            <li key={kind.value}>
              <Link
                href={`/ofrecer/${kind.value}`}
                className={`flex h-full min-h-44 flex-col rounded-[1.75rem] border p-5 transition-[translate,box-shadow,filter,border-color] duration-150 hover:-translate-y-1 hover:shadow-lift ${tile}`}
              >
                <span className={`flex size-12 items-center justify-center rounded-2xl ${chip}`}>
                  <Icon className="size-7" />
                </span>
                <h2 className="mt-4 font-display text-[20px] leading-tight lg:text-[24px]">
                  {kind.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed opacity-80">{kind.blurb}</p>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/donaciones"
            className="flex h-full min-h-44 flex-col rounded-[1.75rem] border border-selva bg-brote p-5 text-selva transition-[translate,box-shadow,background-color] duration-150 hover:-translate-y-1 hover:bg-liana hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-selva/15">
              <DonationIcon className="size-7" />
            </span>
            <h2 className="mt-4 font-display text-[20px] leading-tight lg:text-[24px]">Donar</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-selva/80">
              Aportar al fondo o a una causa. Es el camino del dinero, y está aquí para no
              buscarlo en otro menú.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
