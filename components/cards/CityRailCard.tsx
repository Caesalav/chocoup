import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { lifts, pillOnPhoto } from "@/components/ui/styles";
import { progressPercent } from "@/lib/case-progress";
import { plural } from "@/lib/format";
import type { CityCardData } from "@/lib/types";

/**
 * La tarjeta grande del inicio y del costado del mapa: foto de portada del
 * municipio, su nombre, cuánto ha avanzado y si hay gente yendo.
 *
 * El color del mapa y el porcentaje de esta tarjeta salen del mismo avance:
 * el montón de necesidades del pueblo. Los casos abiertos van al lado porque
 * contestan otra pregunta: a cuánta gente le falta algo.
 *
 * El bloque de texto va abajo y no centrado, igual que en la referencia, y eso
 * no es una decisión estética: el velo solo garantiza contraste en su tercio
 * bajo (ver .veil-b en globals.css).
 */
export function CityRailCard({
  city,
  featured,
}: {
  city: CityCardData;
  /** Si esta tarjeta es el pueblo del recado: editorial o el más atrasado. */
  featured?: "editorial" | "automatic";
}) {
  const onPhoto = Boolean(city.coverPath);
  const percent = progressPercent(city.progress.ratio);
  const hasBar = city.progress.total > 0;

  return (
    <Link
      href={`/ciudades/${city.slug}`}
      className={`group relative block aspect-4/3 overflow-hidden rounded-3xl border border-line shadow-card ${lifts} hover:-translate-y-1 hover:shadow-lift active:translate-y-0 active:scale-[0.97] active:shadow-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <Photo
        path={city.coverPath}
        frame={city.coverFrame}
        alt=""
        eager
        className="absolute inset-0 size-full"
        emptyLabel="Documentado. Las fotos llegan con el próximo viaje."
      />

      {onPhoto && (
        <>
          <span aria-hidden className="veil-t absolute inset-x-0 top-0 h-20" />
          <span aria-hidden className="veil-b absolute inset-0" />
        </>
      )}

      <div className="relative flex h-full flex-col items-center justify-between p-4 text-center">
        <span
          className={
            onPhoto
              ? pillOnPhoto
              : "inline-flex items-center rounded-full border border-line-strong bg-panel-high px-3.5 py-1.5 text-[12px] font-medium text-muted"
          }
        >
          {featured === "editorial"
            ? "Foco ahora"
            : featured === "automatic"
              ? "Donde más falta"
              : "Municipio documentado"}
        </span>

        <div className="w-full pb-1">
          <h3
            className={`font-display text-[30px] leading-none ${onPhoto ? "text-paper" : "text-ink"}`}
          >
            {city.name},{" "}
            <span className={onPhoto ? "text-paper/65" : "text-faint"}>Chocó</span>
          </h3>
          <p className={`mt-2.5 text-[13px] ${onPhoto ? "text-paper/85" : "text-muted"}`}>
            {city.openCases > 0 && (
              <>
                {plural(city.openCases, "caso abierto", "casos abiertos")}
                <span aria-hidden> · </span>
              </>
            )}
            {hasBar
              ? `${percent} % cubierto`
              : `${percent} % de la meta`}
            {city.standingOffers > 0 && (
              <>
                <span aria-hidden> · </span>
                {plural(city.standingOffers, "aporte en camino", "aportes en camino")}
              </>
            )}
          </p>
          {hasBar && (
            <div
              aria-hidden
              className={`mx-auto mt-3 h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full ${
                onPhoto ? "bg-paper/25" : "bg-canvas"
              }`}
            >
              <div
                className={`h-full rounded-full ${onPhoto ? "bg-paper" : "bg-accent"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
