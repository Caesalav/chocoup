import { formatDate, plural } from "@/lib/format";

/**
 * Pie del mapa: el estado de la documentación en una línea, como la nota al pie
 * de un mapa impreso.
 *
 * Va en una sola fila a propósito: el alto que se lleve se lo quita al mapa, que
 * en esta pantalla es lo único que hay que mirar.
 */
export function MapStatus({
  municipios,
  openCases,
  openNeeds,
  updatedAt,
}: {
  municipios: number;
  /** Casos con algo sin cubrir. Es lo que el mapa cuenta; el color es lo otro. */
  openCases: number;
  openNeeds: number;
  updatedAt: string | null;
}) {
  // Dos líneas y no una que se parta: al envolver, el separador se quedaba
  // colgando al final del renglón como si faltara un dato.
  return (
    <div className="text-[11px] leading-relaxed text-faint">
      <p>
        <span className="text-body">
          {plural(municipios, "municipio documentado", "municipios documentados")}
        </span>
        <span aria-hidden> · </span>
        {plural(openCases, "caso abierto", "casos abiertos")}
        <span aria-hidden> · </span>
        {plural(openNeeds, "necesidad abierta", "necesidades abiertas")}
      </p>
      {updatedAt && <p>Actualizado {formatDate(updatedAt)}</p>}
    </div>
  );
}
