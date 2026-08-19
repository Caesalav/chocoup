import type { ReactNode } from "react";
import Link from "next/link";

/**
 * El bloque de la barra inferior: píldora de selva, pestaña abierta en luz.
 *
 * Lo usan el portal y el panel. Si cada uno escribiera las clases, acabaríamos
 * con dos barras que se parecen pero no son la misma pieza —y el equipo dejaría
 * de reconocer el portal al entrar a trabajar.
 *
 * `leading` y `trailing` son mandos que no son sección: van a los bordes, no
 * dentro de la píldora. La píldora se queda en el centro; los dos círculos de
 * papel la equilibran, cada uno a `px-3` de su filo.
 */
export function Dock({
  label,
  children,
  wide = false,
  leading,
  trailing,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="relative flex items-center justify-center">
        {leading && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2">{leading}</div>
        )}
        <nav aria-label={label}>
          <ul
            className={`flex items-center gap-0.5 rounded-full bg-selva/95 p-1.5 shadow-float backdrop-blur ${
              wide ? "w-full max-w-xl" : ""
            }`}
          >
            {children}
          </ul>
        </nav>
        {trailing && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </div>
  );
}

/** Círculo de papel a la altura de la píldora: un mando, no una pestaña. */
export const dockTool =
  "flex size-[3.75rem] shrink-0 items-center justify-center rounded-full border border-line bg-panel-high text-selva shadow-float transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function DockIcon({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        title={label}
        className={`relative flex h-12 w-11 items-center justify-center rounded-full transition-[background-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz ${
          active ? "bg-luz text-selva" : "text-luz/65 hover:bg-luz/15 hover:text-luz"
        }`}
      >
        {children}
        {badge != null && badge > 0 && (
          <span
            className={`absolute right-0 top-0 min-w-4 rounded-full px-1 text-center text-[9px] font-medium tabular-nums leading-4 ${
              active ? "bg-selva text-luz" : "bg-brote text-selva"
            }`}
          >
            {badge > 99 ? "99" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}

export function DockAction({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-brote px-3.5 text-selva transition-colors hover:bg-liana focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz"
      >
        <Icon className="size-[20px] shrink-0" />
        <span className="text-[13px] font-medium">{label}</span>
      </Link>
    </li>
  );
}
