import Link from "next/link";
import { canvasHref, type CategoryOption, type Scope } from "@/lib/canvas-filters";

/**
 * Lista de categorías donde la activa se convierte en el titular de la página,
 * con el número entre paréntesis en volado. Es el recurso central de la
 * referencia: no hay título aparte del menú, el menú es el título.
 */
export function CategoryList({
  options,
  active,
  scope,
}: {
  options: CategoryOption[];
  active: string;
  scope: Scope;
}) {
  return (
    <nav aria-label="Categorías de necesidad">
      <ul className="flex flex-col gap-3">
        {options.map((option) => {
          const isActive = option.value === active;

          if (isActive) {
            return (
              <li key={option.value} className="py-1">
                <h1 className="font-display text-4xl leading-[1.05] text-ink sm:text-[42px]">
                  {option.label}
                  <sup className="ml-1.5 align-super text-[0.42em] font-normal text-muted">
                    ({option.count})
                  </sup>
                </h1>
              </li>
            );
          }

          return (
            <li key={option.value}>
              <Link
                href={canvasHref(scope, option.value)}
                className="group flex items-baseline gap-2 text-[15px] text-muted transition-colors hover:text-ink"
              >
                <span>{option.label}</span>
                <span className="text-xs text-faint transition-colors group-hover:text-muted">
                  {option.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
