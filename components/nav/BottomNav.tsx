"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeHref, DONATE, TABS } from "@/components/nav/destinations";

/**
 * Barra inferior fija.
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
    <nav
      aria-label="Secciones del portal"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="flex items-center gap-0.5 rounded-full bg-ink/95 p-1.5 shadow-float backdrop-blur">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === branch;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex h-12 w-11 items-center justify-center rounded-full transition-[background-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper ${
                  active
                    ? "bg-paper text-ink"
                    : "text-paper/65 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                <Icon className="size-[22px] shrink-0" />
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={DONATE.href}
            aria-current={onDonate ? "page" : undefined}
            className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-accent px-3.5 text-paper transition-colors hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            <DONATE.Icon className="size-[20px] shrink-0" />
            <span className="text-[13px] font-medium">{DONATE.label}</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
