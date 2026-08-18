import { NeedRow } from "./cards/NeedRow";
import { cardGrid } from "./ui/styles";
import type { Need, NeedCard } from "@/lib/types";

type Props = {
  needs: (Need | NeedCard)[];
  emptyLabel?: string;
  /** En la lista general hay que decir de qué municipio y de qué caso sale cada
   *  necesidad; dentro de un municipio, no: ya se sabe. */
  showOrigin?: boolean;
  /** Dos columnas, para la ficha del municipio. */
  columns?: boolean;
};

const isCard = (need: Need | NeedCard): need is NeedCard => "cityName" in need;

export function NeedsList({ needs, emptyLabel, showOrigin = false, columns = false }: Props) {
  if (needs.length === 0) {
    return emptyLabel ? <p className="text-sm text-muted">{emptyLabel}</p> : null;
  }

  // Esta es la lista que se recorre buscando algo que uno pueda dar, así que
  // cuantas más quepan de un vistazo, mejor. En una sola columna a 1400 px se
  // veían cuatro de las veinte que hay.
  return (
    <ul className={columns ? "grid grid-cols-2 gap-3 lg:grid-cols-3" : cardGrid}>
      {needs.map((need) => (
        <li key={need.id}>
          <NeedRow
            need={need}
            compact={columns}
            origin={
              showOrigin && isCard(need)
                ? { cityName: need.cityName, citySlug: need.citySlug, caseName: need.caseName }
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
