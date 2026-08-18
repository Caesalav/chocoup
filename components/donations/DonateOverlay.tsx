"use client";

import { createContext, useContext, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
import { button } from "@/components/ui/styles";
import type { DonationChannel } from "@/lib/donation-channel";

const DonateOpen = createContext<(() => void) | null>(null);

/**
 * El botón que abre el pop-up. Tiene que vivir dentro de `DonateOverlay` para
 * que dos «Donar» de la misma tarjeta —el de encima de la foto y el de abajo—
 * compartan un solo diálogo y no se pisen.
 */
export function DonateButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const open = useContext(DonateOpen);
  if (!open) {
    throw new Error("DonateButton tiene que ir dentro de DonateOverlay");
  }

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}

type Props = {
  title: string;
  channel: DonationChannel | null;
  /**
   * Cuando el canal no es el de quien retrata la tarjeta —una causa que usa el
   * del municipio, una fundación que manda a la gente del pueblo— hay que
   * decirlo antes de enseñar la llave. Callarse haría creer que el dinero va a
   * otro sitio.
   */
  note?: string;
  children: React.ReactNode;
};

/**
 * El pop-up de donación: la llave o el enlace, superpuestos a la página.
 *
 * Las pestañas de /donaciones siguen siendo enlaces en la dirección. Este
 * diálogo es lo único que pide JavaScript, y solo para no salir de la rejilla
 * al mirar a dónde va el dinero. Sin él, «Ver más» sigue llevando a la ficha,
 * donde el canal está escrito entero.
 */
export function DonateOverlay({ title, channel, note, children }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <DonateOpen.Provider value={() => setOpen(true)}>
      {children}

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="max-h-[86svh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-panel-high p-5 shadow-float"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id={titleId} className="font-display text-[22px] leading-tight text-ink">
                  {title}
                </h2>
                <button type="button" className={`${button.ghost} shrink-0`} onClick={() => setOpen(false)}>
                  Cerrar
                </button>
              </div>

              {note && (
                <p className="mt-3 text-[13px] leading-relaxed text-muted">{note}</p>
              )}

              <div className="mt-4">
                {channel ? (
                  <DonationChannelCard channel={channel} featured />
                ) : (
                  <p className="text-[14px] leading-relaxed text-muted">
                    Todavía no hay llave, enlace ni número publicado para este destino. El
                    portal no inventa uno: si no está aquí, no hay a dónde enviar el dinero
                    todavía.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DonateOpen.Provider>
  );
}
