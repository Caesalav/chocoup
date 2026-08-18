import Link from "next/link";
import { SECTIONS } from "@/components/nav/destinations";

/**
 * Los cuatro accesos con icono de la referencia, que aquí son las cuatro
 * maneras de entrar al mismo material: por municipio, por lo que hace falta,
 * por las personas o por dónde va el dinero.
 *
 * No repiten la barra inferior. Allí están las acciones que se hacen desde
 * cualquier pantalla —inicio, mapa, buscar, ofrecer—; aquí, las secciones.
 *
 * En escritorio dejan de ser un icono con su palabra debajo y se vuelven
 * tarjetas de verdad: cuatro chapitas de 64 px repartidas por 1400 px de ancho
 * se quedan flotando, con más papel entre ellas que dentro. La misma pieza,
 * tumbada y con marco.
 */

/** El envoltorio de escritorio: la receta de `cardLink` con `lg:` delante. No
 *  puede reutilizarla tal cual porque el móvil no lleva tarjeta ninguna. */
const asCard =
  "lg:gap-4 lg:rounded-2xl lg:border lg:border-line lg:bg-panel-high lg:p-4 lg:shadow-card lg:transition-[translate,scale,box-shadow,border-color] lg:duration-150 lg:hover:-translate-y-1 lg:hover:border-line-strong lg:hover:shadow-lift lg:active:translate-y-0 lg:active:scale-[0.97] lg:active:shadow-press";

/** Dentro de la tarjeta el icono pierde su marco y su sombra: dos cajas con
 *  filete, una dentro de otra, ensucian el borde a 1400 px. */
const chipInCard =
  "lg:mx-0 lg:size-12 lg:rounded-xl lg:border-transparent lg:bg-canvas lg:shadow-none lg:group-hover:translate-y-0 lg:group-hover:shadow-none";

export function SectionLinks() {
  return (
    <ul className="grid grid-cols-4 gap-2 lg:gap-4">
      {SECTIONS.map(({ href, label, Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className={`group flex flex-col items-center gap-2 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:flex-row ${asCard}`}
          >
            <span
              className={`mx-auto flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-panel-high text-body shadow-card transition-[translate,scale,box-shadow,border-color,color] duration-150 group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:text-ink group-hover:shadow-lift group-active:translate-y-0 group-active:scale-[0.96] group-active:shadow-press ${chipInCard}`}
            >
              <Icon className="size-[22px]" />
            </span>
            <span className="text-center text-[11px] leading-tight text-muted transition-colors group-hover:text-ink lg:text-left lg:text-[16px] lg:font-medium lg:text-ink">
              {label}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
