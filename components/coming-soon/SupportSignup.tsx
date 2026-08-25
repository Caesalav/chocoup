"use client";

import { useState } from "react";
import { SupportForm } from "@/app/(public)/ofrecer/SupportForm";
import { OfferIcon, ProfessionIcon, ResourceIcon } from "@/components/ui/icons";
import { SUPPORT_KINDS } from "@/lib/support";
import type { SupportOfferKind } from "@/lib/types";

/**
 * Apuntarse desde la landing: voluntariado, profesión o un recurso.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO ESTÁ AQUÍ Y NO ES UN ENLACE A /ofrecer
 *
 * Con el portal cerrado, /ofrecer no existe para quien llega: el cerrojo lo
 * reescribe a esta misma pantalla. Un enlace ahí sería un botón que devuelve al
 * sitio donde ya estabas, que es la peor forma de perder a alguien que venía a
 * ofrecer ayuda.
 *
 * Así que el formulario entra aquí entero. No es una copia: es el mismo
 * componente y la misma acción de /ofrecer, con `from` puesto para que conteste
 * en vez de redirigir a una pantalla de gracias que también está cerrada. Los
 * datos caen en la misma tabla (`support_offers`) y en la misma bandeja del
 * panel, así que abrir el portal no parte el registro en dos.
 *
 * LOS TRES CAMINOS SE ELIGEN ANTES DE VER NINGÚN CAMPO, y es deliberado: los
 * tres formularios preguntan cosas distintas —a un voluntario, cuándo puede; a
 * un profesional, su oficio; a quien trae tejas, cuántas— y apilarlos con
 * campos que aparecen y desaparecen convierte una pantalla de apuntarse en un
 * trámite. Se elige uno, se ve solo ese, y se puede cambiar sin perder nada
 * porque todavía no se ha escrito nada.
 * ---------------------------------------------------------------------------
 */

const ICONS: Record<SupportOfferKind, (props: { className?: string }) => React.ReactElement> = {
  voluntario: OfferIcon,
  profesion: ProfessionIcon,
  recurso: ResourceIcon,
};

/**
 * Cada camino con su color, los mismos de /ofrecer para que sea reconocible
 * cuando el portal abra: lavanda el voluntariado, liana la profesión, selva el
 * recurso. Elegido lleva el bloque macizo; sin elegir, papel con filete.
 */
const TILES: Record<SupportOfferKind, { on: string; off: string }> = {
  voluntario: {
    on: "bg-lavanda text-ink border-ink/15",
    off: "bg-panel-high text-body border-line hover:border-ink/30 hover:text-ink",
  },
  profesion: {
    on: "bg-liana text-selva border-selva/25",
    off: "bg-panel-high text-body border-line hover:border-ink/30 hover:text-ink",
  },
  recurso: {
    on: "bg-selva text-luz border-selva",
    off: "bg-panel-high text-body border-line hover:border-ink/30 hover:text-ink",
  },
};

export function SupportSignup() {
  const [chosen, setChosen] = useState<SupportOfferKind | null>(null);
  const meta = SUPPORT_KINDS.find((entry) => entry.value === chosen) ?? null;

  return (
    <section aria-labelledby="apuntarse" className="rounded-3xl border border-line bg-panel p-5 sm:p-6">
      <h2 id="apuntarse" className="font-display text-[22px] leading-tight text-ink">
        Apúntate ahora
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-body">
        El tablero todavía no está abierto, pero el equipo ya está en campo y la
        ayuda hace falta desde hoy. Déjanos lo que puedes aportar y te
        escribimos.
      </p>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {SUPPORT_KINDS.map((kind) => {
          const Icon = ICONS[kind.value];
          const selected = chosen === kind.value;
          const skin = TILES[kind.value];

          return (
            <li key={kind.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(selected ? null : kind.value)}
                className={`flex size-full min-h-[6.5rem] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-[background-color,border-color,color,translate] duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected ? skin.on : skin.off
                }`}
              >
                <Icon className="size-6" />
                <span className="text-[13px] font-medium leading-tight">{kind.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {meta ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="font-display text-[18px] leading-tight text-ink">{meta.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{meta.blurb}</p>
          {/* `key` por tipo: cambiar de camino tiene que dar un formulario
              nuevo, no el anterior con otros campos. Sin esto, React reutiliza
              el estado del que estaba puesto y arrastra lo ya escrito a campos
              que preguntan otra cosa. */}
          <SupportForm key={meta.value} kind={meta.value} from="/proximamente" />
        </div>
      ) : (
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Elige uno de los tres para ver qué necesitamos saber. Son pocas
          preguntas y el contacto no se publica nunca.
        </p>
      )}
    </section>
  );
}
