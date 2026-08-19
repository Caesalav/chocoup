"use client";

import { usePathname } from "next/navigation";
import { Dock, DockAction, DockIcon } from "@/components/nav/Dock";
import { NavSearch, SearchTabLink, useNavSearch } from "@/components/nav/NavSearch";
import { activeHref, DONATE, TABS } from "@/components/nav/destinations";

/**
 * Barra inferior fija del portal.
 *
 * Es cliente por `usePathname`, pero Next la pinta también en el servidor: el
 * HTML ya llega con la pestaña correcta marcada y con los enlaces puestos, así
 * que sin JavaScript la barra funciona igual. Nada aquí depende de hidratar.
 *
 * Buscar no es una pantalla: abre el campo en esta misma barra. Sin JavaScript
 * el enlace sigue yendo a /buscar.
 *
 * La pestaña activa es un círculo de papel. Donar va aparte, siempre con su
 * nombre, para que no haya que aprenderse un quinto dibujo.
 *
 * Se retira a partir de `lg`, donde los mismos destinos los lleva la cabecera:
 * una barra flotando sobre el borde inferior de una pantalla de 1080 px de alto
 * está lejos del ratón y lejos de la vista, y con las dos a la vez el portal
 * navegaría por duplicado.
 */
const CASE_PATH = /^\/ciudades\/[^/]+\/casos\//;

export function BottomNav() {
  const pathname = usePathname();
  const search = useNavSearch();

  if (CASE_PATH.test(pathname)) return null;

  if (search.open) {
    return <NavSearch variant="dock" onClose={search.closeSearch} />;
  }

  const onDonate = pathname === DONATE.href || pathname.startsWith(`${DONATE.href}/`);
  const branch = onDonate ? null : (activeHref(pathname, TABS) ?? "/");

  return (
    <Dock label="Secciones del portal">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === branch && href !== "/buscar";
        const icon = <Icon className="size-[22px] shrink-0" />;
        if (href === "/buscar") {
          return (
            <li key={href}>
              <SearchTabLink
                href={href}
                label={label}
                onOpen={search.openSearch}
                className="relative flex h-12 w-11 items-center justify-center rounded-full text-luz/65 transition-[background-color,color] duration-200 hover:bg-luz/15 hover:text-luz focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz"
              >
                {icon}
              </SearchTabLink>
            </li>
          );
        }
        return (
          <DockIcon key={href} href={href} label={label} active={active}>
            {icon}
          </DockIcon>
        );
      })}
      <DockAction href={DONATE.href} label={DONATE.label} active={onDonate} Icon={DONATE.Icon} />
    </Dock>
  );
}
