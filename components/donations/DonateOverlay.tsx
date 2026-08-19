"use client";

import { createContext, useContext, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ChannelCheckNote } from "@/components/donations/ChannelCheckNote";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
import { button } from "@/components/ui/styles";
import type { DonationChannel } from "@/lib/donation-channel";

const DonateOpen = createContext<(() => void) | null>(null);

/**
 * El botón que abre el pop-up. Tiene que vivir dentro de `DonateOverlay` para
 * que dos «Donar» de la misma tarjeta —el de encima de la foto y el de abajo—
 * compartan un solo diálogo y no se pisen.
 *
 * Es un botón de verdad y no un enlace porque en la rejilla de /donaciones no hay
 * ningún sitio de la propia página al que llevar: la llave de esa causa está en su
 * ficha, a un enlace de aquí («Ver más»), y un `<a>` que no lleve a ninguna parte
 * sin JavaScript sería peor que un botón que no hace nada. Donde SÍ hay sitio
 * —dentro de la ficha, con la sección del dinero escrita más abajo— va `DonateLink`.
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

/**
 * El mismo pop-up, abierto desde un enlace de verdad.
 *
 * Es el patrón de `ShareLink` y de `CopyKeyButton` aplicado al dinero: primero el
 * camino que funciona con el navegador apagado, y el JavaScript encima como mejora.
 * El `href` apunta a la sección «Enviar dinero» de la propia ficha, donde el canal
 * está escrito entero; con JavaScript, el toque no salta a ningún sitio y abre el
 * diálogo, que es la misma información sin perder el sitio del scroll.
 *
 * Esto es lo que permite que «Donar» esté en la barra fija de una causa. Un botón
 * ahí arriba sería un botón muerto para quien abre el portal desde un WhatsApp con
 * mala señal y el JavaScript a medio cargar, y el muerto sería justo el que promete
 * lo que más importa de la pantalla.
 *
 * No mira las teclas modificadoras. Abrir en otra pestaña un ancla de la misma
 * página no lleva a ninguna parte nueva, así que no hay nada que respetar; es la
 * misma decisión que `ShareLink`, que también corta el enlace en seco cuando el
 * navegador trae hoja de compartir.
 */
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
  channel: DonationChannel | null;
  /**
   * Cuando el canal no es el de quien retrata la tarjeta —una causa que recibe
   * por el canal general— hay que decirlo antes de enseñar la llave. Callarse
   * haría creer que el dinero va a otro sitio.
   *
   * Es un nodo y no una cadena para que la frase pueda venir del componente que
   * la escribe una sola vez (`GeneralChannelNote`) en vez de repetirse aquí con
   * otras palabras.
   */
  note?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * El pop-up de donación: la llave o el enlace, superpuestos a la página.
 *
 * Las pestañas de /donaciones siguen siendo enlaces en la dirección. Este
 * diálogo es lo único que pide JavaScript, y solo para no salir de la rejilla
 * al mirar a dónde va el dinero.
 *
 * Y SIN JAVASCRIPT NO SE PIERDE NADA, que es la condición con la que existe. Lo
 * que hay debajo no es el mismo camino en los dos sitios donde se abre, y por eso
 * hay dos formas de abrirlo: en la rejilla, «Ver más» lleva a la ficha, donde el
 * canal está escrito entero (`DonateButton`); en la ficha, el «Donar» de la barra
 * fija es un ancla a la sección del dinero de esa misma página (`DonateLink`).
 * Ninguna de las dos pantallas deja el destino del dinero dentro de un diálogo.
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

              {note && <div className="mt-3">{note}</div>}

              {/* La antigüedad de la comprobación se pinta aquí y no la pasa
                  quien abre el diálogo: aquí es donde acaba el pulgar —dos toques
                  desde la rejilla, uno desde la barra fija de una ficha— y es el
                  último sitio donde alguien puede enterarse antes de copiar una
                  llave. Pasada como prop, la pantalla nueva que se olvidara de
                  pasarla se quedaría sin ella y nadie lo notaría mirando.
                  Ver components/donations/ChannelCheckNote.tsx. */}
              <div className="mt-4">
                {channel ? (
                  <>
                    <DonationChannelCard channel={channel} featured />
                    <ChannelCheckNote channel={channel} className="mt-3" />
                  </>
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
