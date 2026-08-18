import { CheckIcon } from "@/components/ui/icons";
import type { NeedStatus, OfferStatus } from "@/lib/types";
import { needCategoryLabel, needStatusLabel, offerStatusLabel } from "@/lib/constants";

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
 *   Urgente   need-high macizo   papel sobre rojo        6,3:1
 *   Abierta   need-mid  lavado   rust sobre naranja      5,9:1 (5,5:1 sobre papel)
 *   Parcial   need-mid  al aire  lo mismo, a medio hacer: el filete y no el relleno
 *   Cubierta  accent    lavado   verde sobre verde       6,7:1
 *
 * El verde y el naranja lavados quedan a la misma luminancia (1,04:1 entre
 * ellos), así que a un ojo que no separe rojo de verde no le bastaría el tono.
 * Por eso «Cubierta» lleva además el visto: la única de las cuatro con dibujo,
 * y la diferencia sobrevive en escala de grises.
 */
const needStatusStyles: Record<NeedStatus, string> = {
  abierta: "bg-need-mid-soft text-need-mid-strong",
  parcial: "border border-need-mid-strong/35 text-need-mid-strong",
  cubierta: "bg-accent-soft text-accent-strong",
};

export function NeedStatusChip({ status }: { status: NeedStatus }) {
  return (
    <span className={`${base} ${needStatusStyles[status] ?? needStatusStyles.abierta}`}>
      {status === "cubierta" && <CheckIcon className="-ml-0.5 size-3.5 stroke-[2.4]" />}
      {needStatusLabel(status)}
    </span>
  );
}

/** La bandeja del equipo usa el mismo reparto: lo que espera va en cálido, lo
 *  resuelto en verde. */
const offerStatusStyles: Record<OfferStatus, string> = {
  pendiente: "bg-need-mid-soft text-need-mid-strong",
  aceptada: "bg-accent-soft text-accent-strong",
  rechazada: "border border-line text-faint",
};

export function OfferStatusChip({ status }: { status: OfferStatus }) {
  return (
    <span className={`${base} ${offerStatusStyles[status] ?? offerStatusStyles.pendiente}`}>
      {offerStatusLabel(status)}
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
