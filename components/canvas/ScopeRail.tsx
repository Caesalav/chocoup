import Link from "next/link";
import { SCOPES, canvasHref, type Scope } from "@/lib/canvas-filters";

/**
 * Raíl vertical de ámbito. Etiquetas rotadas con un punto delante, como el
 * conmutador de secciones de la referencia. Distingue si la necesidad es del
 * municipio o de una familia concreta, que es el eje real de nuestros datos.
 */
export function ScopeRail({
  scope,
  category,
  orientation = "vertical",
}: {
  scope: Scope;
  category: string;
  orientation?: "vertical" | "horizontal";
}) {
  const vertical = orientation === "vertical";

  return (
    <nav
      aria-label="A quién ayudar"
      className={vertical ? "flex flex-col items-center gap-8" : "flex items-center gap-6"}
    >
      {/* Un raíl sin rótulo es un acertijo: se dice para qué sirve. */}
      {vertical && (
        <span className="rail-label text-[9px] uppercase tracking-[0.2em] text-faint/70">
          A quién ayudar
        </span>
      )}
      {SCOPES.map((option) => {
        const active = option.value === scope;
        return (
          <Link
            key={option.value}
            href={canvasHref(option.value, category)}
            className={`group flex items-center gap-2.5 ${vertical ? "flex-col" : ""}`}
            aria-current={active ? "true" : undefined}
          >
            <span
              className={`size-1.5 shrink-0 rounded-full transition-colors ${
                active ? "bg-amber" : "bg-faint group-hover:bg-body"
              }`}
            />
            <span
              className={`text-[10px] font-medium uppercase tracking-[0.18em] transition-colors ${
                vertical ? "rail-label" : ""
              } ${active ? "text-amber" : "text-faint group-hover:text-body"}`}
            >
              {option.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
