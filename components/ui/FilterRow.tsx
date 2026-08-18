import Link from "next/link";

/** Una opción de filtro: el valor que viaja en la dirección y cómo se rotula. */
export type FilterOption = { value: string; label: string };

/**
 * Una fila de filtro.
 *
 * Son enlaces y no un desplegable, por lo mismo que las pestañas del mapa: sin
 * JavaScript funcionan igual, y «las medicinas que llegaron a Quibdó» es una
 * dirección que se puede pegar en un WhatsApp. La pastilla maciza marca lo
 * elegido, que es como se señala lo abierto en el resto del portal.
 *
 * Nació dentro de `/ayudas` y vive aquí desde que `/ofrecido` filtra igual. No
 * sabe nada de municipios ni de tipos ni de estados: recibe las opciones ya
 * calculadas y una función que dice a dónde lleva cada una, así que las dos
 * páginas pueden combinar sus parámetros como les convenga sin que esto cambie.
 * Eso es a propósito y no una abstracción de más —es justo lo que las dos listas
 * **no** comparten—: cada una calcula sus opciones a partir de lo que ella tiene
 * publicado, porque un municipio con entregas puede no tener nada prometido y al
 * revés.
 *
 * `hrefFor` recibe `undefined` para la opción de «todos», que es la ausencia del
 * parámetro y no un valor especial: así la dirección sin filtros no arrastra
 * `?municipio=todos`, que habría que interpretar en la página y sería un valor
 * más que puede llegar mal escrito.
 */
export function FilterRow({
  label,
  allLabel,
  options,
  active,
  hrefFor,
}: {
  label: string;
  allLabel: string;
  options: FilterOption[];
  active: string | undefined;
  hrefFor: (value: string | undefined) => string;
}) {
  const all = { value: undefined as string | undefined, label: allLabel };

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <span className="w-16 shrink-0 text-[12px] text-faint">{label}</span>
      <nav aria-label={label} className="flex flex-wrap gap-1.5">
        {[all, ...options].map((option) => {
          const selected = option.value === active;

          return (
            <Link
              key={option.value ?? "todos"}
              href={hrefFor(option.value)}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex min-h-8 items-center rounded-full px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "bg-ink text-paper"
                  : "border border-line text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
