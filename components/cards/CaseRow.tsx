import Link from "next/link";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CategoryChip } from "@/components/ui/Chip";
import { cardLink } from "@/components/ui/styles";
import { plural } from "@/lib/format";
import type { CaseCard } from "@/lib/types";

/**
 * El caso en una fila: su retrato a la izquierda y, al lado, quién es, de dónde y
 * qué le falta.
 *
 * Es la tarjeta horizontal de "Place Recommendation" de la referencia, con las
 * necesidades abiertas donde iba el precio. Lo que allí eran estrellas de
 * valoración aquí no existe: no se puntúa a una familia.
 *
 * A la izquierda iba «la primera foto del caso», que es el convenio que el retrato
 * existe para romper: la primera foto de una visita es la casa —la pared caída, el
 * techo sobre la viga partida—, así que /casos y /buscar enseñaban un recorte de
 * escombros donde va una persona. Ahora es el retrato que el equipo eligió en el
 * panel, y cuando no hay ninguno son sus iniciales —o la palabra del tipo de causa,
 * que para eso le llega—, igual que en la tarjeta grande de la ficha de su municipio.
 *
 * El hueco es cuadrado porque es el único encuadre que sobrevive a cualquier
 * original —vertical de móvil o apaisada— sin decidir por dónde recortar. Redondeado
 * y no en círculo como el de la tarjeta grande: aquí la pieza es del ancho de la
 * columna de texto que tiene al lado y un círculo de 84 px dejaría las cuatro
 * esquinas de aire justo donde empieza el nombre.
 */
export function CaseRow({ caseCard }: { caseCard: CaseCard }) {
  const meta = [caseCard.cityName, caseCard.household].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/ciudades/${caseCard.citySlug}/casos/${caseCard.id}`}
      className={`${cardLink} h-full p-3`}
    >
      <div className="flex items-center gap-3.5">
        <CasePortrait
          name={caseCard.display_name}
          caseKind={caseCard.case_kind}
          path={caseCard.portraitPath}
          frame={caseCard.portraitFrame}
          className="size-[84px] rounded-2xl text-[28px]"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[17px] leading-tight text-ink">
            {caseCard.display_name}
          </h3>
          {meta && <p className="mt-1 truncate text-[13px] text-muted">{meta}</p>}

          {/* Lo que falta va en cálido y lo cubierto en verde, igual que las
              pastillas y que el mapa. Las dos frases se parecen mucho leídas
              deprisa —"1 necesidad abierta" / "Sin necesidades abiertas"— y el
              color es lo que las separa antes de leerlas. */}
          {caseCard.openNeeds > 0 ? (
            <p className="mt-2 flex items-center gap-2 text-[13px] text-need-mid-strong">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-need-mid" />
              {plural(caseCard.openNeeds, "necesidad abierta", "necesidades abiertas")}
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-accent-strong">Sin necesidades abiertas</p>
          )}
        </div>
      </div>

      {caseCard.categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {caseCard.categories.slice(0, 4).map((category) => (
            <li key={category}>
              <CategoryChip category={category} />
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}
