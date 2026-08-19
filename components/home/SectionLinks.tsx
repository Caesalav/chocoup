import Link from "next/link";
import { SECTIONS } from "@/components/nav/destinations";

/**
 * Los dos accesos con icono del inicio: por municipio o por las personas.
 *
 * Donar no entra aquí: ya está en la barra, con su lima. No repiten la barra
 * inferior. Allí están las acciones que se hacen desde cualquier pantalla
 * —inicio, mapa, buscar, ofrecer—; aquí, las secciones.
 *
 * En el móvil la baldosa de `brote` ocupa todo el hueco de su columna: dos
 * cuadraditos centrados dejan el ancho vacío. En escritorio se vuelven tarjetas
 * de papel con la baldosa adentro, que es lo que cabe a 1400 px.
 *
 * El glifo va en `selva`, 9,52:1 sobre el brote. El filete de `selva` al 20 %
 * está para que la baldosa tenga forma sobre el papel —la frontera de brote
 * contra el papel es de 1,30:1.
 */

const HOME_SECTIONS = SECTIONS.filter((item) => item.href !== "/donaciones");

export function SectionLinks() {
  return (
    <ul className="grid grid-cols-2 gap-2 lg:gap-4">
      {HOME_SECTIONS.map(({ href, label, Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-selva/20 bg-brote px-3 py-5 text-selva shadow-card transition-[translate,scale,box-shadow,border-color,background-color] duration-150 hover:-translate-y-0.5 hover:border-selva/40 hover:bg-liana hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0 active:scale-[0.97] active:shadow-press lg:flex-row lg:gap-4 lg:border-line lg:bg-panel-high lg:p-4 lg:shadow-card lg:hover:-translate-y-1 lg:hover:border-line-strong lg:hover:bg-panel-high lg:hover:shadow-lift lg:active:scale-[0.97] lg:active:shadow-press"
          >
            <span className="flex size-[22px] shrink-0 items-center justify-center lg:size-12 lg:rounded-xl lg:border lg:border-selva/20 lg:bg-brote lg:text-selva">
              <Icon className="size-[22px]" />
            </span>
            <span className="text-center text-[14px] font-medium leading-tight lg:text-left lg:text-[16px] lg:text-ink">
              {label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
