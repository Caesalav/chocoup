import Link from "next/link";
import { DonateLink, DonateOverlay } from "@/components/donations/DonateOverlay";
import { GeneralChannelNote } from "@/components/donations/GeneralChannelNote";
import { ShareLink } from "@/components/ShareLink";
import { button } from "@/components/ui/styles";
import { ShareIcon } from "@/components/ui/icons";
import type { CaseDonation } from "@/lib/donation-channel";

type Props = {
  /** El nombre de la causa, que es el titular del pop-up. */
  caseName: string;
  /**
   * El canal que enseña esta ficha Y DE QUIÉN ES, tal cual lo devuelve
   * `caseDonation()`. De aquí sale qué acción ofrece la barra: ver el bloque de
   * abajo, que es lo único importante de este archivo.
   */
  donation: CaseDonation;
  /** El ancla de la sección del dinero de la propia ficha: `#enviar-dinero`. */
  donateHref: string;
  offerHref: string;
  shareUrl: string;
  shareTitle: string;
};

const circle =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-panel-high text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** La acción principal ocupa el resto de la barra. La receta es la de
 *  `components/ui/styles.ts` y no una copia: el hundimiento y el color al pasar por
 *  encima tienen que ser los de cualquier botón verde del portal. */
const main = `${button.primary} min-w-0 flex-1 text-[15px]`;

/**
 * La pastilla flotante. Está aparte porque la barra tiene dos contenidos posibles y
 * el envoltorio no puede ser una copia en cada rama: la que se quedara atrás sería
 * la del caso raro, que es el que nadie mira.
 */
function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:p-0">
      <div className="flex w-full max-w-[420px] items-center gap-2 rounded-full border border-line bg-panel-high p-1.5 shadow-float lg:max-w-none lg:shadow-card">
        {children}
      </div>
    </div>
  );
}

/**
 * La barra de acciones del caso, anclada abajo.
 *
 * Ocupa el sitio de la barra de navegación en esta pantalla —dos barras fijas
 * apiladas se comen un tercio del móvil—, y por eso trae la acción principal a
 * pantalla completa en vez de esconderla al final del texto: quien llega aquí
 * desde un WhatsApp no baja hasta abajo.
 *
 * Donde la referencia pone el corazón de favoritos va compartir. Guardar en
 * favoritos a una familia que perdió su casa no significa nada; compartir sí,
 * porque es como se mueve este portal.
 *
 * Va clara y no oscura como la de navegación a propósito: son cosas distintas,
 * y aquí el único color fuerte tiene que ser el del botón que importa.
 *
 * En escritorio se despega del borde y se sienta arriba de la columna lateral,
 * al lado del nombre de la familia. Deja de tener sentido anclarla: la pantalla
 * ya no es una pila que hay que recorrer con el pulgar, y flotando encima del
 * texto solo taparía renglones.
 *
 * ===========================================================================
 * LA ACCIÓN PRINCIPAL ES «DONAR», Y LA DECIDE `caseDonation()`
 *
 * Aquí iba «Ofrecer un recurso» y el dinero estaba al final del scroll. En un móvil
 * eso son galería, retrato, historia, pestañas y necesidades antes de encontrar a
 * dónde transferir: la acción que casi todo el mundo viene a hacer, escondida detrás
 * de todo lo que hay que leer para querer hacerla.
 *
 * PERO LA BARRA NO PUEDE PROMETER LO QUE LA PÁGINA NO PUEDE DAR, y hay causas sin
 * canal: sin uno propio y con el general del portal vacío, no hay a dónde enviar
 * nada. Un «Donar» ahí es un botón que lleva a un hueco, y el hueco está en el sitio
 * más caro de la pantalla.
 *
 * De modo que la barra no recibe un `href` y una etiqueta: recibe el `CaseDonation`
 * entero, que es el valor que lleva el canal Y su procedencia juntos. Con
 * `source === "ninguno"` no hay canal que enseñar y la barra ofrece «Ofrecer un
 * recurso», que es lo que la página sí puede cumplir. No es una comprobación
 * defensiva que alguien pueda quitar de un `if`: es que aquí no hay ninguna forma de
 * escribir «Donar» sin tener delante el canal al que va, porque el pop-up necesita
 * ese mismo valor. El error queda descartado por construcción y no por disciplina.
 *
 * Cuando SÍ hay canal, «Ofrecer un recurso» baja al cuerpo de la ficha, a la columna
 * derecha y debajo de «Enviar dinero». No desaparece y no se queda solo dentro de la
 * lista de necesidades: una necesidad concreta la puede cubrir cualquiera, y quien
 * llega con un camión que sube vacío no está mirando la lista.
 *
 * ===========================================================================
 * ESTÁ DESDE EL PRIMER PÍXEL Y NO APARECE AL BAJAR
 *
 * La barra que se asoma cuando el scroll pasa del titular es un efecto de cliente:
 * hay que medir el scroll, y sin JavaScript no aparecería nunca. En un portal que se
 * abre desde WhatsApp con mala señal, eso significa que la acción principal la
 * tendría solo quien llegue con todo cargado. Así que está puesta desde el primer
 * píxel, `fixed` en el móvil y `static` en la columna a partir de `lg`, que es lo que
 * ya hacía.
 *
 * Eran tres acciones y son dos: aquí iba el WhatsApp de la fundación del
 * municipio, que se fue con 0015 junto con las fundaciones. No se sustituye por
 * un número del portal, y menos en esta barra: el que hubiera aquí se leería como
 * el contacto de esta familia, que es justo lo que la ficha no publica.
 */
export function CaseActions({
  caseName,
  donation,
  donateHref,
  offerHref,
  shareUrl,
  shareTitle,
}: Props) {
  const share = (
    <ShareLink url={shareUrl} title={shareTitle} className={circle}>
      <ShareIcon className="size-5" />
      <span className="sr-only">Compartir este caso</span>
    </ShareLink>
  );

  if (donation.source === "ninguno") {
    return (
      <Bar>
        {share}
        <Link href={offerHref} className={main}>
          Ofrecer un recurso
        </Link>
      </Bar>
    );
  }

  return (
    // El mismo pop-up de /donaciones y con el mismo rótulo de procedencia: quien
    // pulsa desde aquí no ha pasado por la sección del dinero, así que si el canal
    // es el general tiene que leerlo dentro. Ver `GeneralChannelNote`.
    <DonateOverlay
      title={donation.source === "propio" ? `Donar a ${caseName}` : `Donar por ${caseName}`}
      channel={donation.channel}
      note={
        donation.source === "general" ? <GeneralChannelNote caseName={caseName} /> : undefined
      }
    >
      <Bar>
        {share}
        <DonateLink href={donateHref} className={main}>
          Donar
        </DonateLink>
      </Bar>
    </DonateOverlay>
  );
}
