import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AID_LOG, SECTIONS, TABS } from "@/components/nav/destinations";
import { shell } from "@/components/ui/styles";
import { SITE_NAME } from "@/lib/constants";

/**
 * El pie, que en el móvil es solo la letra pequeña.
 *
 * En escritorio recoge además el mapa entero de destinos. No es adorno de
 * relleno: la cabecera está sesenta pantallas más arriba en la ficha de un
 * municipio, y quien termina de leer un documento largo tiene que poder seguir
 * sin volver al principio. Debajo de `lg` no aparece, porque ahí la barra
 * inferior está a un dedo de distancia todo el rato.
 *
 * El mapa entero incluye el registro de ayudas, que no está en ninguna barra: es
 * el único sitio de la navegación donde caben destinos que no son ni sección ni
 * acción.
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className={`${shell} py-12 lg:flex lg:gap-16`}>
        <div className="lg:max-w-[60ch]">
          <Logo className="mb-6 h-9 w-auto text-faint" />
          <p className="max-w-prose text-sm leading-relaxed text-muted">
            {SITE_NAME} documenta la situación en municipios del Chocó tras el terremoto. Las fotos
            y los casos se publican con el consentimiento de las personas afectadas. El dinero no
            pasa por aquí: se transfiere a la llave del portal o por el canal de la fundación de
            cada municipio.
          </p>
          <p className="mt-4 max-w-prose text-xs leading-relaxed text-faint">
            Si encuentras un dato incorrecto o quieres que retiremos una publicación, escríbenos por
            el canal de la fundación de la ciudad correspondiente.
          </p>
        </div>

        <nav aria-label="Todo el portal" className="ml-auto hidden shrink-0 lg:flex lg:gap-16">
          {[[...SECTIONS, AID_LOG], TABS].map((group, index) => (
            <ul key={index} className="flex flex-col gap-2.5">
              {group.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>
    </footer>
  );
}
