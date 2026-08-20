import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";
import { shortCOP } from "@/lib/money-progress";

/**
 * Marcador del tablero: las tres cifras que se pueden bajar.
 *
 * Un inventario —tantos municipios, tantos casos, tantos ítems— no cambia por
 * mirar el dibujo, así que al pie del mapa no hace nada. Estas tres sí se
 * mueven con el tablero: los prioritarios son los municipios del tramo alto, el
 * color que hay que encoger; los documentados dicen cuánta niebla queda por
 * levantar; lo resuelto es el dinero que ha entrado contra la meta del portal
 * entero, la misma cifra que la tarjeta del inicio.
 *
 * La cifra del tramo alto se rotula «prioritarios» y no «zonas rojas»: es la
 * palabra que ese tramo ya lleva en la leyenda y en las pastillas del resto del
 * portal, y en Colombia «zona roja» nombra otra cosa —el conflicto— que en un
 * mapa del Chocó se leería como esa y no como necesidad sin cubrir.
 *
 * Dos renglones de 11 px y no tres: el alto que se lleve el pie se lo quita al
 * dibujo, que es lo único que hay que mirar en esta pantalla. Los números se
 * leen por la tipografía de titular y la tinta, no por ocupar más sitio —a 15
 * px con `leading-none` caben dentro del renglón de 11 px sin estirarlo—.
 *
 * El segundo renglón es la letra pequeña del primero. Un porcentaje sin
 * denominador no se puede comprobar, así que al lado va el importe abreviado; el
 * exacto vive en /donaciones.
 *
 * El mismo marcador cierra la muestra de /proximamente, y de ahí salen las dos
 * cosas opcionales: la tercera cifra —sin `goal` ni `donated` no se escribe— y
 * el nombre de la lista, que allí no puede ser «Estado del tablero» porque esa
 * pantalla existe para decir que el tablero todavía no es público.
 */
const TONOS = {
  claro: {
    list: "text-muted",
    value: "text-ink",
    quiet: "text-faint",
  },
  oscuro: {
    list: "text-luz/70",
    value: "text-luz",
    quiet: "text-luz/50",
  },
} as const;

export function MapStatus({
  priority,
  documented,
  total,
  goal,
  donated,
  updatedAt,
  label = "Estado del tablero",
  tone = "claro",
}: {
  /** Municipios del tramo alto: los que la leyenda llama «Prioritario». */
  priority: number;
  /** Municipios con ficha, sobre las treinta piezas del departamento. */
  documented: number;
  total: number;
  /** Meta y donado del portal entero, no de un municipio. Ausentes, el marcador
   *  se queda en dos cifras: ver abajo por qué eso no es lo mismo que no tener
   *  meta. */
  goal?: number;
  donated?: number;
  updatedAt: string | null;
  /** Cómo se llama esta lista para quien la oye. */
  label?: string;
  /** `oscuro` es el campo de selva: cifras de `luz` para que se lean encima. */
  tone?: keyof typeof TONOS;
}) {
  // Aquí hay DOS ausencias del dinero y no significan lo mismo. Que no haya meta
  // (`goal === 0`) es un dato del portal y se dice con palabras: el hueco es la
  // noticia, y callarlo dejaría el marcador de un portal sin presupuesto igual
  // que el de uno que ya lo tiene. Que no llegue el dato (`goal`/`donated` sin
  // pasar) es una decisión de la pantalla —en la muestra de /proximamente el
  // dinero no se enseña— y ahí la tercera cifra no se escribe de ninguna forma:
  // un «Sin meta aún» afirmaría algo del portal real desde la única pantalla que
  // dice que el tablero todavía no es público.
  const showsMoney = goal !== undefined && donated !== undefined;

  // La cuenta de ProgressCard, letra por letra, para que el inicio y el mapa no
  // puedan decir dos porcentajes del mismo día. Sin meta no hay denominador, y
  // entonces no se pinta un 0 % que nadie ha medido.
  const hasGoal = showsMoney && goal > 0;
  const percent = hasGoal ? Math.min(100, Math.round((donated / goal) * 100)) : 0;

  // El separador va pegado a lo que SIGUE: si el renglón envuelve, el punto abre
  // el de abajo en vez de quedarse colgando al final como si faltara un dato.
  const note = [
    hasGoal ? `${shortCOP(donated)} donados de ${shortCOP(goal)}` : null,
    updatedAt ? `Actualizado ${formatDate(updatedAt)}` : null,
  ]
    .filter(Boolean)
    .join(" ·\u00A0");

  const t = TONOS[tone];

  return (
    <div className="text-[11px] leading-relaxed">
      <ul
        aria-label={label}
        className={`flex flex-wrap items-baseline gap-x-4 gap-y-0.5 lg:gap-x-6 ${t.list}`}
      >
        <Figure value={priority} valueClass={t.value}>
          {priority === 1 ? "prioritario" : "prioritarios"}
        </Figure>
        <Figure value={documented} valueClass={t.value}>
          de {total} documentados
        </Figure>
        {showsMoney &&
          (hasGoal ? (
            <Figure
              value={
                <>
                  {percent}
                  <span className={t.quiet}> %</span>
                </>
              }
              valueClass={t.value}
            >
              resuelto
            </Figure>
          ) : (
            <li>Sin meta aún</li>
          ))}
      </ul>
      {note && <p className={t.quiet}>{note}</p>}
    </div>
  );
}

/** Una cifra y su rótulo: el número manda, la palabra lo nombra. */
function Figure({
  value,
  valueClass,
  children,
}: {
  value: ReactNode;
  valueClass: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-baseline gap-1">
      <span
        className={`font-display text-[15px] leading-none tabular-nums ${valueClass}`}
      >
        {value}
      </span>
      <span>{children}</span>
    </li>
  );
}
