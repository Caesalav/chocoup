"use client";

import { useState } from "react";
import { SupportForm } from "@/app/(public)/ofrecer/SupportForm";
import { OfferIcon, ProfessionIcon, ResourceIcon, TownIcon } from "@/components/ui/icons";
import { lifts } from "@/components/ui/styles";
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
  fundacion: TownIcon,
};

/**
 * Cada camino con su color, y LO LLEVA SIEMPRE.
 *
 * Aquí las tres nacían en blanco y solo se pintaban al pulsarlas. Sonaba
 * razonable —el color como señal de «elegido»— y en pantalla salía al revés de
 * lo que hace falta: la pieza más importante de la landing era la más apagada,
 * tres rectángulos vacíos que no invitan a tocar nada, y el color aparecía
 * justo después de que la persona ya hubiera decidido.
 *
 * Son los mismos tres bloques de /ofrecer —lavanda el voluntariado, liana la
 * profesión, selva el recurso—, así que quien vea el portal abierto reconoce
 * los caminos, y quien vea solo esto ya sabe que son tres cosas distintas y no
 * tres botones iguales.
 *
 * Elegido no se dice con color, porque el color ya está gastado en decir cuál
 * es cuál. Se dice con un aro de tinta alrededor, que es lo que MARCA.md usa
 * para el estado elegido en un sistema donde las superficies están demasiado
 * juntas para señalarlo con relleno.
 */
const TILES: Record<SupportOfferKind, { skin: string; chip: string; ring: string }> = {
  voluntario: {
    skin: "bg-lavanda text-ink border-ink/10",
    chip: "bg-paper/55",
    ring: "ring-ink/70",
  },
  profesion: {
    skin: "bg-liana text-selva border-selva/20",
    chip: "bg-paper/40",
    ring: "ring-selva",
  },
  recurso: {
    skin: "bg-selva text-luz border-luz/10",
    chip: "bg-luz/15",
    ring: "ring-selva",
  },
  // La fundación entra como cuarta y no tiene bloque propio en /ofrecer, así
  // que toma el `ciruela` de la familia lavanda: es el otro oscuro de la
  // paleta, se distingue de `selva` sin abrir un color nuevo, y deja la pareja
  // de oscuros abajo y la de claros arriba en la rejilla de dos por dos.
  fundacion: {
    skin: "bg-ciruela text-panel-high border-ink/10",
    chip: "bg-panel-high/15",
    ring: "ring-ciruela",
  },
};

export function SupportSignup() {
  const [chosen, setChosen] = useState<SupportOfferKind | null>(null);
  const meta = SUPPORT_KINDS.find((entry) => entry.value === chosen) ?? null;

  return (
    <section
      aria-labelledby="apuntarse"
      className="rounded-3xl border border-line-strong bg-panel-high p-4 shadow-card sm:p-5"
    >
      {/* Aquí había un párrafo que decía «el tablero todavía no está abierto,
          pero el equipo ya está en campo». Es la misma frase del titular y de
          la entradilla, tres renglones más abajo: se ha ido, y lo que queda es
          la instrucción, que es lo único que esta tarjeta tiene que añadir. */}
      <p className="text-[12px] font-medium uppercase tracking-wide text-accent">
        Se puede ayudar ya
      </p>
      <h2 id="apuntarse" className="mt-0.5 font-display text-[24px] leading-tight text-ink">
        Apúntate ahora
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Elige qué puedes aportar. Son pocas preguntas y el contacto no se
        publica nunca.
      </p>

      {/* Los cuatro en una fila, y medido: la rejilla de dos por dos añadía 93
          px de alto y esta pantalla dejaba de caber sin bajar, que es su única
          condición. En fila caben porque las pastillas usan el rótulo corto
          —«Voluntario» y no «Voluntariado»— y porque son más bajas; a cambio
          hay menos sitio, y por eso el icono y el texto se aprietan. */}
      <ul className="mt-4 grid grid-cols-4 gap-2">
        {SUPPORT_KINDS.map((kind) => {
          const Icon = ICONS[kind.value];
          const selected = chosen === kind.value;
          const { skin, chip, ring } = TILES[kind.value];

          return (
            <li key={kind.value}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setChosen(selected ? null : kind.value)}
                className={`flex size-full min-h-[4.75rem] flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left ${lifts} hover:-translate-y-1 hover:shadow-lift active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${skin} ${
                  selected ? `ring-2 ring-offset-2 ring-offset-panel-high ${ring}` : ""
                }`}
              >
                <span className={`flex size-7 items-center justify-center rounded-lg ${chip}`}>
                  <Icon className="size-4" />
                </span>
                <span className="text-[12px] font-medium leading-tight">{kind.short}</span>
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
      ) : null}
    </section>
  );
}
