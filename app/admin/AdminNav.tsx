"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_SECTIONS, ADMIN_UTILITIES, activeAdminSection } from "@/lib/admin-sections";
import { teamRoleLabel } from "@/lib/constants";
import type { TeamRole } from "@/lib/types";

/**
 * La barra del panel: tres secciones y, al lado de la cuenta, lo que no es
 * ninguna de las tres.
 *
 * Tenía cinco entradas y la primera se llamaba «Panel», igual que el panel
 * entero, con la lista de municipios metida dentro. El reparto de ahora y el
 * razonamiento de por qué son estas tres y no otras están escritos una vez en
 * lib/admin-sections.ts; aquí no se repiten ni se decide nada: se recorre
 * `ADMIN_SECTIONS`. Escribir las pastillas a mano era lo que dejaba que la barra
 * y la puerta se separaran, y una barra que ofrece una sección que la puerta no
 * nombra es una barra que miente sobre cómo está organizado esto.
 *
 * EN LA PASTILLA VA `label` Y NO `title`, que es para lo que existe ese campo. La
 * tercera sección se llama «Verificación, aceptación o negación de los recursos
 * ofrecidos»: 56 caracteres que en versalitas espaciadas no caben en ninguna barra
 * de ningún teléfono. El nombre entero se escribe donde hay sitio —la puerta y el
 * titular de su propia pantalla— y aquí va el corto.
 *
 * Y aun con el corto, las tres pastillas no caben en una línea de 390 px: solo
 * «Recursos ofrecidos» son unos 175 px con su contador. Así que la barra ENVUELVE
 * en vez de desplazarse en horizontal, y esa es la decisión: un carrusel lateral
 * mete la tercera sección detrás de un gesto que no se ve, y en un panel de tres
 * secciones esconder una es esconder un tercio del trabajo. Dos renglones en un
 * móvil no cuestan nada, y el panel es una web —no hay barra inferior de la que
 * tirar—, así que la barra puede ocupar el alto que necesite.
 *
 * Es cliente por `usePathname`, y por lo mismo que las dos barras del portal
 * público: Next la pinta también en el servidor, así que el HTML ya llega con la
 * sección marcada y sin JavaScript se lee igual. Quién decide cuál está abierta es
 * `activeAdminSection()`, que resuelve por rama: la ficha de una causa vive en
 * /admin/ciudades/…/casos/… y pertenece a Casos, y sin esa excepción editar una
 * causa dejaría la barra señalando Ciudades.
 *
 * «Dinero» y «Equipo» ya no son entradas propias. Esconder algo no protege nada
 * —la pantalla y sus acciones comprueban el rol en el servidor, y la base de datos
 * lo vuelve a comprobar— pero ofrecer una puerta que solo puede devolver un error
 * tampoco ayuda: `coordinationOnly` es lo único que queda de aquello, y el repaso
 * del dinero se alcanza desde Casos, que es de donde cuelga.
 */
const item =
  "smallcaps inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] whitespace-nowrap transition-colors";
const idle = "text-muted hover:bg-line hover:text-ink";
/** La misma pastilla maciza con la que el portal público marca lo abierto. */
const open = "bg-ink text-paper";

/**
 * El contador de lo que falta por revisar, dentro de su pastilla.
 *
 * Cambia de color cuando la sección está abierta porque sobre la pastilla maciza
 * el lavado cálido se pierde. Es el mismo par de tonos que tenía la barra vieja.
 */
function Counter({ value, isOpen }: { value: number; isOpen: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
        isOpen ? "bg-paper/20 text-paper" : "bg-need-mid-soft text-need-mid-strong"
      }`}
    >
      {value}
    </span>
  );
}

export function AdminNav({
  email,
  role,
  pendingOffers,
  feedbackCount,
}: {
  email: string;
  role: TeamRole;
  pendingOffers: number;
  feedbackCount: number;
}) {
  const pathname = usePathname();
  const active = activeAdminSection(pathname);

  // Los contadores que la barra ya avisaba, colgados de donde vive ahora cada
  // cosa: las ofertas sin revisar en Recursos y el buzón en Sugerencias. Se
  // escriben así, por clave, para que añadir una sección no obligue a tocar el
  // recorrido de abajo.
  const counters: Partial<Record<(typeof ADMIN_SECTIONS)[number]["key"], number>> = {
    recursos: pendingOffers,
  };

  return (
    <div className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-2 sm:px-8">
        <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1.5">
          {ADMIN_SECTIONS.map((section) => {
            const isOpen = active === section.key;
            const count = counters[section.key] ?? 0;
            return (
              <Link
                key={section.key}
                href={section.href}
                aria-current={isOpen ? "page" : undefined}
                // El nombre entero en el título: es la única forma de que quien
                // solo ve «Recursos ofrecidos» pueda leer de qué van las tres
                // palabras que faltan sin entrar a la pantalla.
                title={section.title}
                className={`${item} ${isOpen ? open : idle}`}
              >
                {section.label}
                {count > 0 && <Counter value={count} isOpen={isOpen} />}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {ADMIN_UTILITIES.map((utility) => {
            if (utility.coordinationOnly && role !== "coordinacion") return null;
            const isOpen = pathname === utility.href || pathname.startsWith(`${utility.href}/`);
            return (
              <Link
                key={utility.href}
                href={utility.href}
                aria-current={isOpen ? "page" : undefined}
                className={`inline-flex min-h-11 items-center gap-2 text-[13px] transition-colors ${
                  isOpen ? "text-ink underline" : "text-muted hover:text-ink hover:underline"
                }`}
              >
                {utility.label}
                {utility.href === "/admin/sugerencias" && feedbackCount > 0 && (
                  <Counter value={feedbackCount} isOpen={false} />
                )}
              </Link>
            );
          })}

          <span className="hidden text-xs text-faint lg:inline">
            {email} · {teamRoleLabel(role)}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center text-[13px] text-muted transition-colors hover:text-ink hover:underline"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
