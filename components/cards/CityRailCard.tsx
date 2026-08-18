import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { lifts, pillOnPhoto } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import type { CityCardData } from "@/lib/types";

/**
 * La tarjeta grande del inicio: foto de portada del municipio, su nombre y
 * cuántas necesidades tiene abiertas.
 *
 * El bloque de texto va abajo y no centrado, igual que en la referencia, y eso
 * no es una decisión estética: el velo solo garantiza contraste en su tercio
 * bajo (ver .veil-b en globals.css). Un titular a media altura sobre una foto de
 * mediodía se queda en 3:1.
 *
 * Cuando el municipio todavía no tiene foto, la tarjeta cambia de bando entera:
 * hueco claro y texto en tinta. Poner un velo oscuro sobre el hueco para no
 * tocar los colores del texto daría un rectángulo negro que finge ser una foto,
 * y va a pasar a menudo —se documenta un municipio y las fotos llegan días
 * después—, así que tiene que verse bien de verdad, no disimulado.
 */
export function CityRailCard({ city }: { city: CityCardData }) {
  const onPhoto = Boolean(city.coverPath);

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
          Municipio documentado
        </span>

        <div className="pb-1">
          <h3
            className={`font-display text-[30px] leading-none ${onPhoto ? "text-paper" : "text-ink"}`}
          >
            {city.name},{" "}
            <span className={onPhoto ? "text-paper/65" : "text-faint"}>Chocó</span>
          </h3>
          <p className={`mt-2.5 text-[13px] ${onPhoto ? "text-paper/85" : "text-muted"}`}>
            {plural(city.openNeeds, "necesidad abierta", "necesidades abiertas")}
          </p>
        </div>
      </div>
    </Link>
  );
}
