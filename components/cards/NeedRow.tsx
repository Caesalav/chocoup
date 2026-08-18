import Link from "next/link";
import { CategoryChip, NeedStatusChip, UrgentChip } from "@/components/ui/Chip";
import { card } from "@/components/ui/styles";
import type { Need } from "@/lib/types";

/** Lo que hace falta saber de dónde sale una necesidad fuera de su municipio. */
type Origin = { cityName?: string; citySlug?: string; caseName?: string | null };

/**
 * Una necesidad como tarjeta.
 *
 * Antes eran filas separadas por una línea. En un diseño donde todo lo demás es
 * tarjeta, la lista de necesidades era lo único que parecía una tabla, y es
 * justo lo que hay que poder recorrer con el pulgar buscando algo que uno pueda
 * dar.
 *
 * El enlace de aportar no es la tarjeta entera: una necesidad no tiene pantalla
 * propia, así que si toda la tarjeta llevara a /ofrecer, leerla y comprometerse
 * serían el mismo gesto.
 */
export function NeedRow({
  need,
  origin,
  compact = false,
}: {
  need: Need;
  origin?: Origin;
  compact?: boolean;
}) {
  const covered = need.status === "cubierta";

  // La tarjeta ocupa el alto de su fila y el botón se ancla abajo. En una
  // rejilla las necesidades tienen textos de largos muy distintos —una lleva
  // cantidad y detalle, la de al lado solo el título— y con alturas naturales
  // cada fila terminaba en escalera. Anclando el botón, el hueco cae entre el
  // texto y la acción en vez de dentro, y todos los «Puedo aportar esto» de una
  // fila quedan a la misma altura: es la lista que se recorre con el pulgar
  // buscando algo que uno pueda dar, y así se recorre por una sola columna.
  return (
    <article className={`${card} flex h-full flex-col ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryChip category={need.category} />
        {!compact && <NeedStatusChip status={need.status} />}
        {need.urgent && !covered && <UrgentChip />}
      </div>

      <h3
        className={`font-display leading-snug text-ink ${compact ? "mt-2.5 text-[15px]" : "mt-3 text-[17px]"}`}
      >
        {need.title}
      </h3>
      {need.quantity && (
        <p className={`mt-1 text-body ${compact ? "text-[13px]" : "text-[14px]"}`}>
          {need.quantity}
        </p>
      )}
      {need.details && (
        <p
          className={`mt-2 text-[13px] leading-relaxed text-muted ${compact ? "line-clamp-3" : ""}`}
        >
          {need.details}
        </p>
      )}

      {origin?.cityName && (
        <p className="mt-2.5 text-[12px] text-faint">
          {origin.citySlug ? (
            <Link
              href={`/ciudades/${origin.citySlug}`}
              className="text-muted underline-offset-2 hover:underline"
            >
              {origin.cityName}
            </Link>
          ) : (
            origin.cityName
          )}
          {origin.caseName ? ` · ${origin.caseName}` : " · Necesidad de la zona"}
        </p>
      )}

      {/* El envoltorio es quien se lleva el `mt-auto`: sobre el propio enlace,
          el relleno que garantiza el hueco mínimo se confundiría con el del
          botón. */}
      {!covered && (
        <div className="mt-auto pt-3.5">
          <Link
            href={`/ofrecer?need=${need.id}`}
            className={`inline-flex items-center gap-2 rounded-full border border-line-strong font-medium text-body transition-[border-color,color,scale] duration-150 hover:border-accent hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              compact
                ? "min-h-10 w-full justify-center px-3 text-[12px]"
                : "min-h-11 px-4 text-[13px]"
            }`}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Puedo aportar esto
          </Link>
        </div>
      )}
    </article>
  );
}
