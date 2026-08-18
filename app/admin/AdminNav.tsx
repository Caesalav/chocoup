"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { teamRoleLabel } from "@/lib/constants";
import type { TeamRole } from "@/lib/types";

/**
 * El rol va junto al correo porque explica por adelantado por qué faltan
 * botones: quien documenta no ve "Nuevo municipio" ni la ficha de la fundación, y
 * sin decirlo en alguna parte eso se lee como una avería.
 *
 * "Dinero" y "Equipo" solo se pintan para coordinación. Esconderlos no protege
 * nada —la pantalla y sus acciones comprueban el rol en el servidor, y la base de
 * datos lo vuelve a comprobar—, pero ofrecer una puerta que solo puede devolver un
 * error tampoco ayuda.
 *
 * "Dinero" y no "Donaciones": en el portal público «Donaciones» es la pantalla de
 * las fundaciones y sus enlaces, y aquí detrás hay una cosa distinta —la llave a la
 * que transfiere quien dona, una para todo—. Dos entradas con el mismo rótulo y
 * distinto contenido es cómo se cambia la que no se quería cambiar.
 *
 * Es cliente por `usePathname`, y por lo mismo que las dos barras del portal
 * público: Next la pinta también en el servidor, así que el HTML ya llega con la
 * sección marcada y sin JavaScript se lee igual. Antes no marcaba ninguna, y como
 * «Panel» era el único en tinta parecía elegido siempre —estando en Ofertas, la
 * barra señalaba Panel—.
 */
const item = "smallcaps rounded-full px-3 py-1.5 text-[15px] transition-colors";
const idle = "text-muted hover:bg-line hover:text-ink";
/** La misma pastilla maciza con la que el portal público marca lo abierto. */
const open = "bg-ink text-paper";

export function AdminNav({
  email,
  role,
  pendingOffers,
}: {
  email: string;
  role: TeamRole;
  pendingOffers: number;
}) {
  const pathname = usePathname();
  // Exacto para el panel y por rama para el resto: la ficha de un municipio vive
  // en /admin/ciudades/… y no pertenece a Ofertas ni a Equipo, así que cuelga de
  // Panel, que es de donde se llega a ella.
  const active = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname.startsWith("/admin/ciudades")
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <nav aria-label="Secciones del panel" className="flex items-center gap-2">
          <Link
            href="/admin"
            aria-current={active("/admin") ? "page" : undefined}
            className={`${item} ${active("/admin") ? open : idle}`}
          >
            Panel
          </Link>
          <Link
            href="/admin/ofertas"
            aria-current={active("/admin/ofertas") ? "page" : undefined}
            className={`${item} flex items-center gap-2 ${active("/admin/ofertas") ? open : idle}`}
          >
            Ofertas
            {pendingOffers > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
                  active("/admin/ofertas")
                    ? "bg-paper/20 text-paper"
                    : "bg-need-mid-soft text-need-mid-strong"
                }`}
              >
                {pendingOffers}
              </span>
            )}
          </Link>
          {role === "coordinacion" && (
            <>
              <Link
                href="/admin/donaciones"
                aria-current={active("/admin/donaciones") ? "page" : undefined}
                className={`${item} ${active("/admin/donaciones") ? open : idle}`}
              >
                Dinero
              </Link>
              <Link
                href="/admin/equipo"
                aria-current={active("/admin/equipo") ? "page" : undefined}
                className={`${item} ${active("/admin/equipo") ? open : idle}`}
              >
                Equipo
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-faint sm:inline">
            {email} · {teamRoleLabel(role)}
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-xs text-muted hover:text-ink hover:underline">
              Salir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
