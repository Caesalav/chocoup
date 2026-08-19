"use client";

import { usePathname } from "next/navigation";
import { Dock, DockAction, DockIcon } from "@/components/nav/Dock";
import { activeHref, DONATE, TABS } from "@/components/nav/destinations";

/**
 * Barra inferior fija del portal.
 *
 * Es cliente por `usePathname`, pero Next la pinta también en el servidor: el
 * HTML ya llega con la pestaña correcta marcada y con los enlaces puestos, así
 * que sin JavaScript la barra funciona igual. Nada aquí depende de hidratar.
 *
 * La pestaña activa es un círculo de papel. Donar va aparte, siempre con su
 * nombre, para que no haya que aprenderse un quinto dibujo.
 *
 * Se retira a partir de `lg`, donde los mismos destinos los lleva la cabecera:
 * una barra flotando sobre el borde inferior de una pantalla de 1080 px de alto
 * está lejos del ratón y lejos de la vista, y con las dos a la vez el portal
 * navegaría por duplicado.
 */
/** La pantalla de un caso monta su propia barra abajo. */
const CASE_PATH = /^\/ciudades\/[^/]+\/casos\//;

export function BottomNav() {
  const pathname = usePathname();

  // Dos barras fijas apiladas se comen un tercio de un móvil. En el caso manda
  // la suya, que lleva la acción por la que se entra ahí.
  if (CASE_PATH.test(pathname)) return null;

  // Inicio hace además de rama por defecto: un municipio se alcanza desde varios
  // sitios y no pertenece a ninguna pestaña, pero una barra sin nada marcado
  // parece rota. Con esto siempre hay una etiqueta a la vista. Donar es pieza
  // aparte: si se lo deja caer al inicio, el botón verde parecería apagado.
  const onDonate = pathname === DONATE.href || pathname.startsWith(`${DONATE.href}/`);
  const branch = onDonate ? null : (activeHref(pathname, TABS) ?? "/");

  return (
    <Dock label="Secciones del portal">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === branch;
        return (
          <DockIcon key={href} href={href} label={label} active={active}>
            <Icon className="size-[22px] shrink-0" />
          </DockIcon>
        );
      })}
      <DockAction href={DONATE.href} label={DONATE.label} active={onDonate} Icon={DONATE.Icon} />
    </Dock>
  );
}
