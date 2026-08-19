import Link from "next/link";
import { CasePortrait } from "@/components/case/CasePortrait";
import { DonationMeter } from "@/components/cards/DonationMeter";
import { CategoryChip, CityChip } from "@/components/ui/Chip";
import { cardLink } from "@/components/ui/styles";
import { caseLead } from "@/lib/format";
import type { CaseCard } from "@/lib/types";

/**
 * El caso en una fila: su retrato a la izquierda y, al lado, quién es, qué le
 * está pasando y cuánto se ha donado.
 *
 * Es la tarjeta horizontal de una lista de campañas: retrato cuadrado y
 * redondeado, título de hasta dos líneas, una frase de tres, y debajo la
 * barra de lo donado. Lo que falta comprar —los ítems pendientes— no va aquí:
 * esa cifra es del presupuesto, y en un listado se lee como si la familia
 * estuviera en falta. Aquí se enseña lo que ha llegado.
 *
 * El municipio va encima del retrato, no en una fila extra: es el dato que se
 * lee de reojo en una lista que mezcla pueblos, y no puede empujar la tarjeta
 * hacia abajo.
 *
 * El hueco del retrato es cuadrado porque es el único encuadre que sobrevive a
 * cualquier original —vertical de móvil o apaisada— sin decidir por dónde
 * recortar. Redondeado y no en círculo como el de la tarjeta grande: aquí la
 * pieza es del ancho de la columna de texto que tiene al lado y un círculo de
 * 84 px dejaría las cuatro esquinas de aire justo donde empieza el nombre.
 */
export function CaseRow({ caseCard }: { caseCard: CaseCard }) {
  const story = caseLead(caseCard, 150);

  return (
    <Link
      href={`/ciudades/${caseCard.citySlug}/casos/${caseCard.id}`}
      className={`${cardLink} h-full p-3`}
    >
      <div className="flex items-start gap-3.5">
        <div className="relative size-[84px] shrink-0">
          <CasePortrait
            name={caseCard.display_name}
            caseKind={caseCard.case_kind}
            path={caseCard.portraitPath}
            frame={caseCard.portraitFrame}
            className="size-[84px] rounded-2xl text-[28px]"
          />
          <span className="pointer-events-none absolute inset-x-1 bottom-1 flex justify-center">
            <CityChip name={caseCard.cityName} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[17px] leading-tight text-ink">
            {caseCard.display_name}
          </h3>

          {story && (
            <p className="mt-2 line-clamp-3 text-[12px] leading-snug text-body">{story}</p>
          )}

          <DonationMeter budget={caseCard.budget} />
        </div>
      </div>

      {caseCard.categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {caseCard.categories.slice(0, 3).map((category) => (
            <li key={category}>
              <CategoryChip category={category} />
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
