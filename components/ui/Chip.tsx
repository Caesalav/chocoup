import { CheckIcon } from "@/components/ui/icons";
import { pillOnPhoto } from "@/components/ui/styles";
import { isCoveredNeed } from "@/lib/needs";
import type { NeedStatus, OfferRecordState, OfferStatus, FeedbackKind } from "@/lib/types";
import {
  needCategoryLabel,
  needStatusLabel,
  offerStateLabel,
  offerStatusLabel,
} from "@/lib/constants";

/**
 * Pastilla blanda, la de la referencia: caja redonda, texto normal y en frase.
 *
 * Antes iban en versalitas apretadas, que era la voz de la etapa anterior. En
 * una tarjeta con foto esas mayúsculas pesan más que el nombre de la familia, y
 * lo que las etiquetas tienen que hacer aquí es dejarse leer de reojo —"Agua,
 * Techo, Medicinas"— sin disputarle la jerarquía a nada.
 */
const base =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] leading-5 whitespace-nowrap";

export function CategoryChip({ category }: { category: string }) {
  return (
    <span className={`${base} border border-line-strong text-muted`}>
      {needCategoryLabel(category)}
    </span>
  );
}

/** El municipio de una causa: lavanda, más chica que las de categoría.
 *
 * El color la separa de «Agua» o «Techo» de un vistazo —es el pueblo, no la
 * necesidad—. El tamaño es el de una nota al pie, no el de una pastilla de
 * filtro: en la fila del caso va encima del retrato, para no estirar la tarjeta.
 */
export function CityChip({ name, onPhoto = false }: { name: string; onPhoto?: boolean }) {
  if (onPhoto) {
    return <span className={pillOnPhoto}>{name}</span>;
  }

  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-lavanda px-1.5 py-0.5 text-[10px] font-medium leading-4 text-ink">
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Un recuento al lado de un titular: el número, en la misma pastilla. */
export function CountChip({ value, label }: { value: number; label: string }) {
  return (
    <span
      className={`${base} border border-line-strong tabular-nums text-muted`}
      aria-label={label}
    >
      {value}
    </span>
  );
}

/**
 * Estado de una necesidad, en la escala cálida del mapa.
 *
 * Los tres estados vivían antes en la familia verde —relleno suave para
 * «Abierta», relleno macizo para «Urgente», otro suave para «Cubierta»— y como
 * el verde de marca y el de cubierto se llevaban dieciséis grados de tono, las
 * tres pastillas eran el mismo color y la urgencia dejaba de leerse.
 *
 * Ahora cada una está en el tramo de la escala que le corresponde, que es el
 * mismo con el que se pinta su municipio en el mapa:
 *
 *   Urgente   need-high macizo   papel sobre rojo        8,53:1
 *   Abierta   need-mid  lavado   rust sobre naranja      6,07:1
 *   Parcial   need-mid  al aire  lo mismo, a medio hacer: el filete, no el relleno
 *   Cubierta  accent    lavado   verde sobre verde       7,10:1
 *
 * EL REPARTO NO CAMBIA AL CAMBIAR LA IDENTIDAD, y hay que decirlo porque la
 * tentación es la contraria: con tres verdes de marca en la paleta nueva en vez
 * de uno, pintar los estados «a juego» es más fácil que antes y rompe lo mismo.
 * Lo que sí se rederivó son los VALORES de la escala cálida: seguían siendo los
 * de una identidad anterior de papel y ámbar y se leían como de otro sistema. La
 * familia sigue siendo cálida y aparte del verde, pero ahora sale de la misma
 * ley que el resto de la paleta —ver las fichas `--color-need-*`—.
 *
 * El salto de urgencia, que es lo que no puede perderse, subió al rederivarla:
 * «Urgente» contra «Abierta» está en 6,85:1 en color y 3,64:1 en deuteranopía,
 * donde antes daba 4,71:1 y 2,69:1.
 *
 * El verde y el naranja lavados quedan a la misma luminancia a propósito
 * —1,01:1 entre ellos en color, 1,01:1 en gris y 1,17:1 en deuteranopía—, así que
 * a un ojo que no separe rojo de verde el tono no le dice nada. Por eso
 * «Cubierta» lleva además el visto: la única de las cuatro con dibujo, y la
 * diferencia sobrevive a los tres filtros.
 *
 * Los números los saca `node scripts/contraste.mjs --estados` leyendo la paleta,
 * y la lámina renderizada con los filtros está en capturas-verificacion/marca/.
 */
const needStatusStyles: Record<NeedStatus, string> = {
  abierta: "bg-need-mid-soft text-need-mid-strong",
  parcial: "border border-need-mid-strong/35 text-need-mid-strong",
  cubierta: "bg-accent-soft text-accent-strong",
};

export function NeedStatusChip({ status }: { status: NeedStatus }) {
  return (
    <span className={`${base} ${needStatusStyles[status] ?? needStatusStyles.abierta}`}>
      {isCoveredNeed({ status }) && <CheckIcon className="-ml-0.5 size-3.5 stroke-[2.4]" />}
      {needStatusLabel(status)}
    </span>
  );
}

/**
 * La bandeja del equipo usa el mismo reparto: lo que espera va en cálido, lo
 * resuelto en verde.
 *
 * Y lo que ya no está en juego se queda sin color, que es donde caen las otras
 * dos. «Negada» va al aire: el filete y nada dentro, porque hay un veredicto
 * escrito pero no un resultado que celebrar ni una espera que atender.
 *
 * «Retirada» es el caso raro de los cuatro y por eso no cabía en ninguno de los
 * tres estilos que ya había. En verde diría que salió bien y en cálido que sigue
 * esperando, y las dos serían mentira; con el filete de «Negada» se leerían
 * como la misma cosa, que es justo lo que no son —una es un no y la otra una
 * baja—. Así que se queda en la familia sin color, pero rellena en vez de al
 * aire: la pastilla se hunde al tono del papel de fondo (`canvas`, un peldaño por
 * debajo del `panel` sobre el que se pinta la fila), que es literalmente lo que le
 * ha pasado a la oferta. Macizo contra filete se distingue de reojo y sin
 * depender del tono, así que aguanta en escala de grises igual que el visto de
 * «Cubierta» ahí arriba. El texto sube a `muted` porque `faint` sobre `canvas` se
 * queda en 4,57:1 raspando; así son 6,42:1.
 *
 * No lleva dibujo propio —una cruz, una raya— porque el único hueco para
 * distinguirla estaba en el relleno: el filete discontinuo ya es de `DraftChip`
 * («Sin publicar», «Solo lectura») y tacharle la palabra a una pastilla que dice
 * «Retirada» se lee tan fácil como lo contrario de lo que pone.
 */
const offerStatusStyles: Record<OfferStatus, string> = {
  pendiente: "bg-need-mid-soft text-need-mid-strong",
  aceptada: "bg-accent-soft text-accent-strong",
  rechazada: "border border-line text-faint",
  retirada: "bg-canvas text-muted",
};

export function OfferStatusChip({ status }: { status: OfferStatus }) {
  return (
    <span className={`${base} ${offerStatusStyles[status] ?? offerStatusStyles.pendiente}`}>
      {offerStatusLabel(status)}
    </span>
  );
}

/**
 * Lo mismo para quien lee `/ofrecido`, y aparte a propósito.
 *
 * No es la pastilla de arriba con otras etiquetas: son dos vocabularios y solo
 * coinciden en el color. El del equipo dice en qué punto de la bandeja está una
 * oferta; este dice cuánto se puede contar con ella, que es la única pregunta que
 * trae quien mira el muro. Compartir componente obligaría a que las dos escalas
 * se muevan juntas para siempre, y no tienen por qué: aquí solo hay dos valores y
 * la vista `public.offer_log` no publica los otros dos.
 *
 * «Confirmada» va en el verde lavado de lo que ya está hecho, porque alguien del
 * equipo habló con esa persona. «Sin confirmar» va en el cálido de lo que espera
 * —el mismo tramo con el que se pinta una necesidad abierta— pero **al aire, con
 * el filete y sin relleno**, que es el recurso que ya usa «Parcial» ahí arriba
 * para decir «lo mismo, a medio hacer». Un lavado verde y un lavado cálido están
 * a la misma luminancia, así que a un ojo que no separe rojo de verde el tono no
 * le diría nada; macizo contra al aire se ve igual en escala de grises, y es lo
 * que sostiene la diferencia cuando el color no llega.
 *
 * Y «Confirmada» no lleva visto, aunque «Cubierta» lo lleve y aquí quedaría a
 * mano: un visto se lee como «ya está», y lo que hay confirmado en esta pantalla
 * es una promesa que todavía no ha llegado a ningún sitio. La pastilla que dice
 * lo más parecido a un éxito es justo la que no puede insinuarlo.
 */
const offerStateStyles: Record<OfferRecordState, string> = {
  sin_confirmar: "border border-need-mid-strong/35 text-need-mid-strong",
  confirmada: "bg-accent-soft text-accent-strong",
};

export function OfferStateChip({ state }: { state: OfferRecordState }) {
  return (
    <span className={`${base} ${offerStateStyles[state] ?? offerStateStyles.sin_confirmar}`}>
      {offerStateLabel(state)}
    </span>
  );
}

/** Lo más caliente de la escala, y la única pastilla maciza del portal. */
export function UrgentChip() {
  return <span className={`${base} bg-need-high font-medium text-paper`}>Urgente</span>;
}

export function DraftChip({ label = "Borrador" }: { label?: string }) {
  return (
    <span className={`${base} border border-dashed border-line-strong text-faint`}>{label}</span>
  );
}

/**
 * El buzón del equipo: un error es un aviso, una idea no lo es.
 *
 * El error va en el rojo de la escala —el mismo que usa el recuadro de
 * validación—, porque es algo que hay que atender. La idea va en el verde
 * lavado de lo constructivo. Mezclarlos en un solo estilo haría que un «el
 * mapa no carga» y un «¿y si hubiera un filtro por barrio?» se leyeran igual
 * de urgente, y no lo son.
 */
const feedbackKindStyles: Record<FeedbackKind, string> = {
  error: "bg-need-high-soft text-need-high",
  idea: "bg-accent-soft text-accent-strong",
};

export function FeedbackKindChip({ kind }: { kind: FeedbackKind }) {
  return (
    <span className={`${base} ${feedbackKindStyles[kind] ?? feedbackKindStyles.idea}`}>
      {kind === "error" ? "Error" : "Idea"}
    </span>
  );
}
