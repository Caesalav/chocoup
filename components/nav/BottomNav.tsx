"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dock, DockAction, DockIcon, dockTool } from "@/components/nav/Dock";
import { NavSearch, SearchTabLink, useNavSearch } from "@/components/nav/NavSearch";
import { activeHref, DONATE, FEEDBACK, TABS } from "@/components/nav/destinations";
import { FeedbackIcon, SearchIcon } from "@/components/ui/icons";

/**
 * Barra inferior fija del portal.
 *
 * Es cliente por `usePathname`, pero Next la pinta también en el servidor: el
 * HTML ya llega con la pestaña correcta marcada y con los enlaces puestos, así
 * que sin JavaScript la barra funciona igual. Nada aquí depende de hidratar.
 *
 * Buscar no es una pantalla: abre el campo encima de esta misma barra. Sin
 * JavaScript el enlace sigue yendo a /buscar. El mando va al borde derecho, y
 * Sugerencias al izquierdo: dos círculos de papel que equilibran la píldora.
 * Inicio, Mapa y Ofrecer son destinos; esos dos son herramientas.
 *
 * La pestaña activa es un círculo de papel. Donar va aparte, siempre con su
 * nombre, para que no haya que aprenderse un dibujo más.
 *
 * Se retira a partir de `lg`, donde los mismos destinos los lleva la cabecera:
 * una barra flotando sobre el borde inferior de una pantalla de 1080 px de alto
 * está lejos del ratón y lejos de la vista, y con las dos a la vez el portal
 * navegaría por duplicado.
 */
const CASE_PATH = /^\/ciudades\/[^/]+\/casos\//;
const INBOX = /^\/sugerencias(\/|$)/;

export function BottomNav() {
  const pathname = usePathname();
  const search = useNavSearch();

  if (CASE_PATH.test(pathname)) return null;

  if (search.open) {
    return <NavSearch variant="dock" onClose={search.closeSearch} />;
  }

  const onDonate = pathname === DONATE.href || pathname.startsWith(`${DONATE.href}/`);
  const places = TABS.filter((tab) => tab.href !== "/buscar");
  const branch = onDonate ? null : (activeHref(pathname, places) ?? "/");

  return (
    <Dock
      label="Secciones del portal"
      leading={
        INBOX.test(pathname) ? undefined : (
          <Link
            href={`${FEEDBACK.href}?desde=${encodeURIComponent(pathname)}`}
            aria-label={FEEDBACK.label}
            title={FEEDBACK.label}
            className={dockTool}
          >
            <FeedbackIcon className="size-[22px] shrink-0" />
          </Link>
        )
      }
      trailing={
        <SearchTabLink
          href="/buscar"
          label="Buscar"
          onOpen={search.openSearch}
          className={dockTool}
        >
          <SearchIcon className="size-[22px] shrink-0" />
        </SearchTabLink>
      }
    >
      {places.map(({ href, label, Icon }) => (
        <DockIcon key={href} href={href} label={label} active={href === branch}>
          <Icon className="size-[22px] shrink-0" />
        </DockIcon>
      ))}
      <DockAction href={DONATE.href} label={DONATE.label} active={onDonate} Icon={DONATE.Icon} />
    </Dock>
  );
}
