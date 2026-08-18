import Link from "next/link";
import { BackIcon } from "@/components/ui/icons";
import { iconOnPaper } from "@/components/ui/styles";

type Props = {
  title: string;
  subtitle?: string;
  /** A dónde vuelve la flecha. Las secciones vuelven al inicio; las pantallas
   *  que son pestaña de la barra inferior no llevan flecha, porque una pestaña
   *  no vuelve a ningún sitio. */
  backHref?: string;
  backLabel?: string;
  /** Contador a la derecha del titular. Solo cuando la unidad se deduce del
   *  título: "Casos 8" se entiende, "Donaciones 5" no. */
  count?: number;
};

/**
 * Cabecera de las pantallas de sección, que no tienen foto de portada.
 *
 * La flecha va en una fila propia y el titular debajo, y no las dos cosas en
 * línea: con el titular al lado de la flecha, "Donaciones" y "Necesidades"
 * quedaban descentrados respecto del contenido de abajo, que empieza en el
 * margen. Así todo arranca de la misma vertical.
 *
 * En escritorio la flecha se retira. Lleva al inicio, y al inicio ya se va por
 * la marca de la cabecera, que está tres centímetros más arriba y en la misma
 * esquina: dos botones seguidos para lo mismo.
 */
export function ScreenHeader({ title, subtitle, backHref, backLabel, count }: Props) {
  return (
    <header className="enters">
      {backHref && (
        <Link href={backHref} aria-label={backLabel} className={`${iconOnPaper} lg:hidden`}>
          <BackIcon className="size-5" />
        </Link>
      )}

      <div
        className={`flex items-baseline justify-between gap-4 ${backHref ? "mt-4 lg:mt-0" : ""}`}
      >
        <h1 className="font-display text-[28px] leading-tight text-ink lg:text-[38px]">{title}</h1>
        {count !== undefined && (
          <span className="shrink-0 text-[15px] tabular-nums text-faint lg:text-[18px]">
            {count}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-muted lg:text-[15px]">
          {subtitle}
        </p>
      )}
    </header>
  );
}
