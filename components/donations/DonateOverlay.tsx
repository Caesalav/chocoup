"use client";

import { createContext, useContext, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { MercadoPagoCheckout } from "@/components/donations/MercadoPagoCheckout";
import { button } from "@/components/ui/styles";

const DonateOpen = createContext<(() => void) | null>(null);

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

export function DonateLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const open = useContext(DonateOpen);
  if (!open) {
    throw new Error("DonateLink tiene que ir dentro de DonateOverlay");
  }

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        open();
      }}
    >
      {children}
    </a>
  );
}

type Props = {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * El pop-up de donación: Mercado Pago, todavía sin conectar.
 *
 * Sin JavaScript el «Donar» es un ancla a la sección de dinero de la ficha, o
 * «Ver más» en la rejilla. El diálogo es una mejora, no el único camino.
 */
export function DonateOverlay({ title, note, children }: Props) {
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
              {note && <div className="mt-3">{note}</div>}
              <div className="mt-4">
                <MercadoPagoCheckout heading={title} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </DonateOpen.Provider>
  );
}
