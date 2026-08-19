import type { ReactNode } from "react";
import Link from "next/link";

/**
 * El bloque de la barra inferior: píldora de selva, pestaña abierta en luz.
 *
 * Lo usan el portal y el panel. Si cada uno escribiera las clases, acabaríamos
 * con dos barras que se parecen pero no son la misma pieza —y el equipo dejaría
 * de reconocer el portal al entrar a trabajar.
 */
export function Dock({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul
        className={`flex items-center gap-0.5 rounded-full bg-selva/95 p-1.5 shadow-float backdrop-blur ${
          wide ? "w-full max-w-xl" : ""
        }`}
      >
        {children}
      </ul>
    </nav>
  );
}

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
  /* Donar es `selva` con tinta `luz` en todo el portal. Aquí el suelo ya es
     `selva`, así que la pastilla se invierte —`luz` con tinta `selva`— para
     que se recorte; son los mismos dos colores, no un tercer verde. */
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-luz px-3.5 text-selva transition-colors hover:bg-panel-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz"
      >
        <Icon className="size-[20px] shrink-0" />
        <span className="text-[13px] font-medium">{label}</span>
      </Link>
    </li>
  );
}
