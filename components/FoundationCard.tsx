import { DonationIcon } from "@/components/ui/icons";
import { externalUrl, telLink, whatsappLink } from "@/lib/format";
import type { Foundation } from "@/lib/types";
import { button, card } from "./ui/styles";

type Props = {
  foundation: Foundation;
  cityName: string;
  /** Fuera de la pantalla de su municipio hay que decir dónde trabaja. */
  cityHint?: string;
  /** Cierre de la ficha de municipio: el nombre es un botón y donar ocupa
   *  toda la franja. */
  featured?: boolean;
};

/**
 * El botón grande del cierre de la ficha de municipio. No es `button.primary`
 * porque ahí abajo es la última cosa de la pantalla y la única acción: 64 px de
 * alto, 18 px de letra y sombra flotante, contra los 48 y 14 del botón normal.
 *
 * Está en una constante porque se escribía dos veces en este mismo archivo —una
 * para donar y otra para el WhatsApp cuando no hay a dónde donar— y las dos
 * copias tenían que decir lo mismo. Con la lista suelta, un cambio de color o de
 * tamaño se aplicaba a una y no a la otra.
 */
const bigAction =
  "inline-flex min-h-16 w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 text-[18px] font-medium text-paper shadow-lift transition-[background-color,scale] duration-150 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line py-2.5 text-sm">
      <dt className="w-24 shrink-0 text-[12px] text-faint">{label}</dt>
      <dd className="min-w-0 break-words text-body">{children}</dd>
    </div>
  );
}

function ContactList({ foundation, className }: { foundation: Foundation; className?: string }) {
  return (
    <dl className={className}>
      {foundation.contact_name && <Row label="Contacto">{foundation.contact_name}</Row>}
      {foundation.phone && (
        <Row label="Teléfono">
          <a href={telLink(foundation.phone)} className="text-accent hover:underline">
            {foundation.phone}
          </a>
        </Row>
      )}
      {foundation.email && (
        <Row label="Correo">
          <a href={`mailto:${foundation.email}`} className="text-accent hover:underline">
            {foundation.email}
          </a>
        </Row>
      )}
      {foundation.address && <Row label="Dirección">{foundation.address}</Row>}
      {foundation.website && (
        <Row label="Web">
          <a
            href={foundation.website}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent hover:underline"
          >
            {foundation.website}
          </a>
        </Row>
      )}
    </dl>
  );
}

export function FoundationCard({ foundation, cityName, cityHint, featured = false }: Props) {
  const donate = externalUrl(foundation.donation_url);
  const website = externalUrl(foundation.website);
  const whatsapp = whatsappLink(
    foundation.whatsapp,
    `Hola, escribo por la situación en ${cityName}. Quiero ayudar.`,
  );

  if (featured) {
    return (
      <div className={`${card} border-accent/35 p-5 shadow-lift`}>
        {/* En frase normal y no en versalitas apretadas, como el resto del
            portal: era la voz de la etapa anterior y aquí convivía en la misma
            pantalla con las pastillas y las etiquetas de formulario, que ya
            hablan así. Además es la misma línea que abre la tarjeta corriente
            de más abajo, y no tendría sentido que la misma frase cambiara de
            tono según el tamaño de la tarjeta. */}
        <p className="text-center text-[12px] text-accent-strong">
          Fundación madre de {cityName}
        </p>

        {website ? (
          <a
            href={website}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-panel-high px-6 text-center font-display text-[18px] leading-tight text-ink transition-[background-color,scale] duration-150 hover:bg-canvas active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {foundation.name}
          </a>
        ) : (
          <p className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-panel-high px-6 text-center font-display text-[18px] leading-tight text-ink">
            {foundation.name}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {donate && (
            <a
              href={donate}
              target="_blank"
              rel="noreferrer noopener"
              className={bigAction}
            >
              <DonationIcon className="size-6" />
              Donar dinero
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className={donate ? `${button.secondary} w-full` : bigAction}
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>

        <ContactList foundation={foundation} className="mt-5" />
      </div>
    );
  }

  // `h-full` y el `mt-auto` de abajo son para la rejilla de /donaciones: una
  // fundación tiene los datos de contacto que tiene —una lleva web y dirección y
  // la de al lado solo un correo— y con alturas naturales las tarjetas de una
  // misma fila terminaban a tres alturas distintas, que con filete y sombra se
  // lee como una rejilla rota. Estirar sin más dejaría el aire muerto dentro;
  // con los botones anclados abajo, el hueco cae entre bloques y todos los
  // «Donar dinero» de una fila quedan en la misma línea, que es lo que se busca
  // con el ojo. Fuera de una rejilla, `h-full` sobre un padre de alto
  // automático no hace nada.
  return (
    <div className={`${card} flex h-full flex-col p-5`}>
      {/* «Fundación madre» sin condición: hay una por municipio y es la que
          recibe. Esta línea decía «Fundación madre» u «Organización aliada» según
          una casilla, y con la casilla sin marcar rotulaba de aliado el único canal
          de donación de un pueblo. */}
      <p className="text-[12px] text-accent-strong">
        Fundación madre
        {cityHint && <span className="text-faint"> · {cityHint}</span>}
      </p>
      <h3 className="mt-1.5 font-display text-[22px] leading-tight text-ink">{foundation.name}</h3>

      {foundation.description && (
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{foundation.description}</p>
      )}

      <ContactList foundation={foundation} className="mt-5" />

      {(donate || whatsapp) && (
        <div className="mt-auto flex flex-col gap-2.5 pt-5">
          {donate && (
            <a
              href={donate}
              target="_blank"
              rel="noreferrer noopener"
              className={`${button.primary} w-full`}
            >
              Donar dinero
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className={`${donate ? button.secondary : button.primary} w-full`}
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
