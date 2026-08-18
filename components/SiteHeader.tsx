"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { activeHref, DONATE, SECTIONS, TABS, type Destination } from "@/components/nav/destinations";
import { shell } from "@/components/ui/styles";

/**
 * La navegación de escritorio.
 *
 * Es el mismo mapa que la barra inferior del móvil, repartido como cabe arriba:
 * la marca es el inicio, las secciones van a la izquierda y a la derecha
 * quedan las acciones —situarse, buscar, ofrecer— y el botón de donar.
 *
 * Aquí van en palabras y abajo en iconos, que es lo que pide cada sitio: en una
 * barra de 60 px cabe un dibujo, en una cabecera de 1400 cabe el nombre. Lo que
 * sí es idéntico es la marca de lo abierto —una pastilla maciza, la misma que
 * usan la barra del móvil y las pestañas del municipio—, con la salvedad de que
 * sobre papel la pastilla es de tinta y sobre la barra oscura es de papel.
 *
 * Es cliente por `usePathname`, pero Next la pinta también en el servidor: el
 * HTML llega con los enlaces puestos y la sección marcada, así que sin
 * JavaScript funciona igual.
 */

/** Las secciones de la cabecera, sin donar: eso va como botón a la derecha. */
const HEADER_SECTIONS = SECTIONS.filter((item) => item.href !== DONATE.href);

/** Las acciones, que son las de la barra inferior menos el inicio: eso ya lo es
 *  la marca, y repetirlo al lado sería el mismo enlace dos veces. */
const ACTIONS = TABS.filter((tab) => tab.href !== "/");

const item =
  "flex min-h-10 items-center rounded-full px-3.5 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const idle = "text-body hover:bg-line hover:text-ink";
const open = "bg-ink font-medium text-paper";

export function SiteHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const branch = activeHref(pathname, [...SECTIONS, ...ACTIONS]);
  const atHome = pathname === "/";
  // Donar sale de la fila de secciones y va como botón, así que su estado
  // abierto se marca aquí y no en `branch`.
  const onDonate = branch === DONATE.href;

  const links = (items: readonly Destination[]) =>
    items.map(({ href, label }) => (
      <li key={href}>
        <Link
          href={href}
          aria-current={href === branch ? "page" : undefined}
          className={`${item} ${href === branch ? open : idle}`}
        >
          {label}
        </Link>
      </li>
    ));

  return (
    <header
      className={`sticky top-0 z-40 h-[var(--head-h)] border-b border-line bg-paper/90 backdrop-blur ${className}`}
    >
      <div className={`${shell} flex h-full items-center gap-6`}>
        <Link
          href="/"
          aria-current={atHome ? "page" : undefined}
          className="group flex shrink-0 items-center gap-2 text-[22px] leading-none"
        >
          <Logo
            className={`h-[1.05em] w-auto shrink-0 transition-colors ${
              atHome ? "text-accent" : "text-ink group-hover:text-accent"
            }`}
          />
          <span className="font-display text-ink">
            Chocó<span className="text-accent">-up</span>
          </span>
        </Link>

        <nav aria-label="Secciones del portal" className="hidden lg:block">
          <ul className="flex items-center gap-1">{links(HEADER_SECTIONS)}</ul>
        </nav>

        <nav aria-label="Acciones" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-1">
            {links(ACTIONS)}
            <li>
              <Link
                href={DONATE.href}
                aria-current={onDonate ? "page" : undefined}
                className={`${item} bg-accent font-medium text-paper hover:bg-accent-strong hover:text-paper`}
              >
                {DONATE.label}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Menú sin JavaScript para cuando la cabecera es lo único que hay: el
            panel del equipo la monta a cualquier ancho, y ahí sí puede quedarse
            estrecha. En el portal público no llega a verse nunca —por debajo de
            `lg` manda la barra inferior— pero el panel es una web y no una app.

            El desplegable va opaco y por encima de todo: cae sobre la tabla del
            panel y no puede leerse a través. */}
        <details className="group relative ml-auto lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-line-strong bg-panel-high [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <span className="relative block h-2.5 w-4">
              <span className="absolute inset-x-0 top-0 h-px bg-body" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-body" />
            </span>
          </summary>
          <ul className="absolute right-0 z-50 mt-3 flex w-60 flex-col gap-0.5 rounded-2xl border border-line bg-panel-high p-2 shadow-float">
            {links([...HEADER_SECTIONS, ...ACTIONS, DONATE])}
          </ul>
        </details>
      </div>
    </header>
  );
}
