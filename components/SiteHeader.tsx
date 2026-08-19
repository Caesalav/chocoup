"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { NavSearch, SearchTabLink, useNavSearch } from "@/components/nav/NavSearch";
import { activeHref, DONATE, SECTIONS, TABS, type Destination } from "@/components/nav/destinations";
import { shell } from "@/components/ui/styles";

/**
 * La navegación de escritorio.
 *
 * Es el mismo mapa que la barra inferior del móvil, repartido como cabe arriba:
 * la marca es el inicio, las secciones van a la izquierda y a la derecha
 * quedan las acciones —situarse, buscar, ofrecer— y el botón de donar.
 *
 * Buscar convierte esta fila en un campo. Cancelar la devuelve.
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

const HEADER_SECTIONS = SECTIONS.filter((item) => item.href !== DONATE.href);

const ACTIONS = TABS.filter((tab) => tab.href !== "/");

const item =
  "flex min-h-10 items-center rounded-full px-3.5 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const idle = "text-body hover:bg-line hover:text-ink";
const openClass = "bg-selva font-medium text-luz";
const donateClass = `${item} bg-selva font-medium text-luz hover:bg-accent-strong`;

export function SiteHeader({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const search = useNavSearch();
  const branch = activeHref(pathname, [...SECTIONS, ...ACTIONS]);
  const atHome = pathname === "/";
  const onDonate = branch === DONATE.href;

  const links = (items: readonly Destination[]) =>
    items.map(({ href, label }) => {
      if (href === "/buscar") {
        return (
          <li key={href}>
            <SearchTabLink
              href={href}
              label={label}
              onOpen={search.openSearch}
              className={`${item} ${idle}`}
            >
              {label}
            </SearchTabLink>
          </li>
        );
      }
      if (href === DONATE.href) {
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={onDonate ? "page" : undefined}
              className={donateClass}
            >
              {label}
            </Link>
          </li>
        );
      }
      return (
        <li key={href}>
          <Link
            href={href}
            aria-current={href === branch ? "page" : undefined}
            className={`${item} ${href === branch ? openClass : idle}`}
          >
            {label}
          </Link>
        </li>
      );
    });

  return (
    <header
      className={`sticky top-0 z-40 h-[var(--head-h)] border-b border-line bg-paper/90 backdrop-blur ${className}`}
    >
      <div className={`${shell} flex h-full items-center gap-6`}>
        <Link
          href="/"
          aria-current={atHome ? "page" : undefined}
          className="shrink-0"
        >
          <Logo className="text-[24px] text-ink" />
        </Link>

        {search.open ? (
          <NavSearch variant="header" onClose={search.closeSearch} />
        ) : (
          <>
            <nav aria-label="Secciones del portal" className="hidden lg:block">
              <ul className="flex items-center gap-1">{links(HEADER_SECTIONS)}</ul>
            </nav>

            <nav aria-label="Acciones" className="ml-auto hidden lg:block">
              <ul className="flex items-center gap-1">{links([...ACTIONS, DONATE])}</ul>
            </nav>
          </>
        )}

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
