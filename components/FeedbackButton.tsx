"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeedbackIcon } from "@/components/ui/icons";

/**
 * El acceso al buzón, a un dedo de distancia en cualquier pantalla.
 *
 * No va en la barra de navegación: esa fila ya está llena y «Sugerencias» no es
 * una sección del material. Tampoco vive solo en el pie, porque el inicio y el
 * mapa no lo montan. Así que es un botón suelto, a la izquierda del móvil —a la
 * derecha está Donar— y abajo a la derecha en escritorio.
 *
 * En la ficha de un caso se retira en el móvil: ahí ya hay una barra fija de
 * acciones. En escritorio esa barra se sienta al lado del nombre, así que el
 * botón sí cabe. En el propio buzón no hace falta.
 */
const INBOX = /^\/sugerencias(\/|$)/;
const CASE = /^\/ciudades\/[^/]+\/casos\//;

export function FeedbackButton() {
  const pathname = usePathname();
  if (INBOX.test(pathname)) return null;

  const href = `/sugerencias?desde=${encodeURIComponent(pathname)}`;
  const onCase = CASE.test(pathname);

  return (
    <Link
      href={href}
      className={`fixed bottom-[calc(var(--nav-h)+0.4rem)] left-3 z-30 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-panel-high/95 px-3.5 text-[13px] font-medium text-body shadow-card backdrop-blur transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:bottom-5 lg:left-auto lg:right-5 ${
        onCase ? "max-lg:hidden" : ""
      }`}
    >
      <FeedbackIcon className="size-4 shrink-0" />
      Sugerencias
    </Link>
  );
}
