import { caseKindLabel } from "@/lib/constants";
import type { CaseKind } from "@/lib/types";

/**
 * Qué es esta causa, dicho junto a su nombre: un colegio, un animal, una fundación.
 *
 * ---------------------------------------------------------------------------
 * NO SE PINTA CUANDO ES UNA PERSONA, Y ESA ES LA DECISIÓN
 *
 * «Persona o familia» debajo de una cara y un nombre no dice nada que la cara y el
 * nombre no hayan dicho ya, y una pastilla que sale en las cuatro fichas deja de ser
 * información y pasa a ser parte del marco: se mira una vez y no se vuelve a leer,
 * justo el día en que dice «Animal». Callarse en el caso normal es lo que hace que
 * la pastilla se lea cuando aparece.
 *
 * Y hace falta que se lea, porque el nombre solo no siempre basta. «Institución
 * Educativa Nuestra Señora» se entiende sin ayuda, pero «Kiko» se lee como una
 * persona hasta que alguien dice que es un perro, y lo que significa «donar a Kiko»
 * cambia con eso. El hueco del retrato ya lo dice cuando no hay foto —escribe
 * «Animal» en vez de dos iniciales, ver `CasePortrait`— y deja de decirlo justo
 * cuando SÍ hay foto, que es cuando el retrato podría ser cualquier cosa. Esta
 * pastilla es lo que tapa ese hueco, y por eso vive en la ficha y no en las
 * tarjetas: en una lista lo que hace falta es reconocer la fila, y en la ficha es
 * donde alguien está a punto de mandar dinero.
 *
 * La decisión de callarse está DENTRO del componente y no en la plantilla que lo
 * usa. Así no hay dos sitios donde se pueda decidir distinto, y la ficha no lleva un
 * `case_kind !== "persona"` suelto que el día que haya un quinto tipo habría que
 * volver a leer.
 *
 * ---------------------------------------------------------------------------
 * La receta de la pastilla es la de `CategoryChip` (components/ui/Chip.tsx) escrita
 * a mano: caja redonda, filete y texto en frase, sin versalitas. Su sitio natural es
 * ese archivo, con las otras siete, y ahí es donde habría que mudarla.
 */
export function CaseKindChip({ caseKind }: { caseKind: CaseKind }) {
  // El `!caseKind` cubre la ventana en la que este código esté desplegado y 0016
  // todavía no pegada: sin la columna, el valor llega `undefined` y la comparación
  // de abajo no lo atrapa, así que la pastilla saldría diciendo «Persona o familia»
  // —el único texto que este componente existe para no escribir nunca— encima del
  // nombre de una familia de verdad. TypeScript lo ve imposible por el tipo, y lo
  // es en cuanto la migración está puesta.
  if (!caseKind || caseKind === "persona") return null;

  return (
    <span className="inline-flex items-center rounded-full border border-line-strong px-3 py-1 text-[12px] leading-5 whitespace-nowrap text-muted">
      {caseKindLabel(caseKind)}
    </span>
  );
}
