/**
 * Los iconos del portal, dibujados aquí y no traídos de una librería: son un
 * puñado, pesan lo que pesan sus trazos y así comparten grosor y remate sin
 * depender de nadie.
 *
 * Todos son de contorno, 1,6 de grosor sobre una rejilla de 24, y ninguno lleva
 * relleno: los dos únicos rellenos macizos de este diseño son el verde de una
 * acción y el rojo de «Urgente», y un icono macizo competiría con ellos.
 *
 * Van siempre acompañados de texto —etiqueta debajo o nombre accesible— porque
 * la mitad de estos dibujos no significan nada por sí solos para quien llega al
 * portal por un enlace de WhatsApp.
 */

type IconProps = { className?: string };

function Glyph({ className = "size-6", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3.6 10.4 12 3.4l8.4 7v9.2a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4z" />
      <path d="M9.6 21v-5.6h4.8V21" />
    </Glyph>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="m9 4.2-5.4 2.1v13.5L9 17.7l6 2.1 5.4-2.1V4.2L15 6.3z" />
      <path d="M9 4.2v13.5M15 6.3v13.5" />
    </Glyph>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.6 4.6" />
    </Glyph>
  );
}

/**
 * Ofrecer: una mano levantada, el gesto de «yo puedo».
 *
 * Eran dos palmas abiertas y a 22 px —el tamaño al que vive en la barra— las dos
 * palmas se fundían en un cuenco, que es justo el gesto contrario: recibir, o
 * pedir. Y este es el único icono del portal que tiene que apañarse solo, porque
 * en la barra del móvil no hay etiqueta debajo, solo nombre accesible.
 *
 * Levantar la mano y no dibujar el objeto porque lo que /ofrecer recoge es una
 * persona poniéndose delante: el propio formulario dice que sirve igual si no
 * eres tú quien dona sino alguien que conoces. Un paquete —se probó, con su
 * flecha y todo— estrecha la acción a mandar cosas y encima queda como el gemelo
 * logístico del botón «Donar», que está pegado en la misma barra.
 *
 * No es un corazón ni un carrito por lo de siempre en este portal: esto no es
 * caridad y no es una compra.
 */
export function OfferIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7.6 13.4V6.6a1.5 1.5 0 0 1 3 0v5.2" />
      <path d="M10.6 11.8V5.4a1.5 1.5 0 0 1 3 0v6.4" />
      <path d="M13.6 11.8V6.8a1.5 1.5 0 0 1 3 0v5.4" />
      <path d="M16.6 12.4v-1.6a1.5 1.5 0 0 1 3 0v5.2a5.4 5.4 0 0 1-5.4 5.4h-2.4a5 5 0 0 1-3.5-1.5l-3.4-3.4a1.6 1.6 0 0 1 2.3-2.3l2.1 2.1" />
    </Glyph>
  );
}

export function TownIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20.4V9.4l6-3.4v14.4" />
      <path d="M10 11.4h9.4v9" />
      <path d="M2.6 20.4h18.8" />
      <path d="M13.4 14.6h0M16.6 14.6h0M13.4 17.6h0M16.6 17.6h0M6.8 11.8h0M6.8 15.4h0" />
    </Glyph>
  );
}

export function NeedsIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8.6 5.2H6.4A1.4 1.4 0 0 0 5 6.6v12.8a1.4 1.4 0 0 0 1.4 1.4h11.2a1.4 1.4 0 0 0 1.4-1.4V6.6a1.4 1.4 0 0 0-1.4-1.4h-2.2" />
      <path d="M9.6 3.4h4.8a1 1 0 0 1 1 1v2.4H8.6V4.4a1 1 0 0 1 1-1z" />
      <path d="M8.8 11.4h6.4M8.8 15.4h4.4" />
    </Glyph>
  );
}

export function CasesIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="9.4" cy="8.2" r="3.4" />
      <path d="M3.6 20.6c0-3.2 2.6-5.8 5.8-5.8s5.8 2.6 5.8 5.8" />
      <path d="M16.2 5.4a3 3 0 0 1 0 5.6" />
      <path d="M17.4 15.2c1.9.8 3.2 2.7 3.2 5" />
    </Glyph>
  );
}

/** Donaciones: dinero, sin metáforas. El corazón sobra en un portal así. */
export function DonationIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 7.2h15.2a1.4 1.4 0 0 1 1.4 1.4v6.8a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 15.4V8.6a1.4 1.4 0 0 1 1.4-1.4z" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6.2 12h0M17.8 12h0" />
    </Glyph>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <circle cx="17.6" cy="5.8" r="2.8" />
      <circle cx="6.4" cy="12" r="2.8" />
      <circle cx="17.6" cy="18.2" r="2.8" />
      <path d="m8.9 10.6 6.2-3.4M8.9 13.4l6.2 3.4" />
    </Glyph>
  );
}

/**
 * El buzón de sugerencias: un recuadro con líneas, no la burbuja de WhatsApp.
 *
 * `ChatIcon` ya significa escribir por WhatsApp a quien recibe. Reutilizarlo haría
 * que el botón de «Sugerencias» se leyera como otro chat, y no lo es: es un
 * recado al equipo sobre el portal.
 */
export function FeedbackIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5.2 4.6h13.6A1.6 1.6 0 0 1 20.4 6.2v8.4a1.6 1.6 0 0 1-1.6 1.6H10L5.2 20.2V6.2A1.6 1.6 0 0 1 6.8 4.6H5.2z" />
      <path d="M8.4 8.8h7.2M8.4 12h4.8" />
    </Glyph>
  );
}

/**
 * Escribir por WhatsApp. Es una burbuja de conversación y no el logotipo de la
 * marca: a 20 px el auricular dentro del globo se convierte en una mancha, y la
 * referencia usa exactamente esta burbuja en el mismo sitio de su barra.
 */
export function ChatIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M20.4 11.6c0 4.2-3.8 7.6-8.4 7.6a9.4 9.4 0 0 1-3-.5l-4.4 1.5 1.4-3.8a7.2 7.2 0 0 1-2.4-5.3C3.6 7.4 7.4 4 12 4s8.4 3.4 8.4 7.6z" />
      <path d="M9 11.6h0M12 11.6h0M15 11.6h0" />
    </Glyph>
  );
}

/** Llamar. El auricular a secas, sin globo: ChatIcon ya es escribir. */
export function PhoneIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M7.4 3.6h3.2l1.4 3.4-2.2 1.2a12.4 12.4 0 0 0 5.8 5.8l1.2-2.2 3.4 1.4v3.2A2 2 0 0 1 18 18.4 15.2 15.2 0 0 1 5.6 6a2 2 0 0 1 1.8-2.4z" />
    </Glyph>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M19.4 12H4.6" />
      <path d="m10.6 5.4-6 6.6 6 6.6" />
    </Glyph>
  );
}

/** Cerrar. La X de cancelar el buscador de la barra. */
export function CloseIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Glyph>
  );
}

/**
 * Ofrecer la profesión: un maletín. Distinto de la mano de voluntario y del
 * recurso, que son tiempo y cosas.
 */
export function ProfessionIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 9.2h15.2a1.4 1.4 0 0 1 1.4 1.4v7.8a1.4 1.4 0 0 1-1.4 1.4H4.4A1.4 1.4 0 0 1 3 18.4v-7.8a1.4 1.4 0 0 1 1.4-1.4z" />
      <path d="M8.4 9.2V6.8A1.6 1.6 0 0 1 10 5.2h4a1.6 1.6 0 0 1 1.6 1.6v2.4" />
      <path d="M3 13.2h18" />
    </Glyph>
  );
}

/**
 * Ofrecer un recurso: tablas apiladas, material que se puede llevar.
 * No es un paquete con flecha —eso competiría con Donar—.
 */
export function ResourceIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4.4 16.4h15.2v3.2H4.4z" />
      <path d="M6 12.4h12v3.2H6z" />
      <path d="M7.6 8.4h8.8v3.2H7.6z" />
    </Glyph>
  );
}

/**
 * Copiar. Solo aparece en la llave de transferencia, y solo cuando hay
 * JavaScript: sin él no existe el botón que lo acompaña, porque copiar al
 * portapapeles no se puede hacer de otra manera y un icono sin función es peor
 * que ninguno.
 */
export function CopyIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M9.4 9.4h8.2a1.4 1.4 0 0 1 1.4 1.4v8.2a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 19V10.8a1.4 1.4 0 0 1 1.4-1.4z" />
      <path d="M15.2 6.6a1.4 1.4 0 0 0-1.4-1.4H6a1.4 1.4 0 0 0-1.4 1.4v7.8a1.4 1.4 0 0 0 1.4 1.4" />
    </Glyph>
  );
}

/**
 * Hecho. Es lo que distingue «Cubierta» de «Abierta» cuando el color no llega:
 * los dos rellenos lavados —verde y naranja— quedan a la misma luminancia, así
 * que en escala de grises, o para quien no separa rojo de verde, el visto es la
 * única señal que queda antes de leer la palabra.
 */
export function CheckIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M5 13l4.5 4.5L19 7" />
    </Glyph>
  );
}

/**
 * Lo que se ha ofrecido: un marcador, algo apartado y todavía sin usar.
 *
 * Hacía falta un dibujo nuevo porque los dos que le quedaban cerca ya significan
 * otra cosa aquí, y significan justo las dos que hay que distinguir de esta:
 * `OfferIcon` es el gesto de ofrecer —la acción, el formulario— y `CheckIcon` es
 * lo que ya llegó. Esto es el tiempo de en medio: material con el nombre de un
 * municipio puesto encima que nadie ha movido todavía. Con la mano se leería
 * «ofrecer aquí» y con el visto, «hecho», que es exactamente lo que no es.
 *
 * Tampoco es un paquete, por lo que ya está escrito arriba en `OfferIcon`: un
 * bulto con su flecha estrecha esto a mandar cajas —y lo que hay ofrecido son
 * unas tejas que nadie puede bajar y un camión que sube vacío— y encima queda de
 * gemelo logístico del botón «Donar».
 *
 * Va estrecho, vacío por dentro y con la muesca profunda a propósito. Hoy no lo
 * pinta nadie, igual que el visto del registro de ayudas, pero el día que entre
 * en una barra va a caer al lado de `NeedsIcon`, que es un portapapeles, y a
 * 22 px dos rectángulos altos con rayas dentro son el mismo icono.
 */
export function PledgeIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8.2 3.6h7.6a1.4 1.4 0 0 1 1.4 1.4v15.4L12 15.8l-5.2 4.6V5a1.4 1.4 0 0 1 1.4-1.4z" />
    </Glyph>
  );
}
