"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeedbackIcon } from "@/components/ui/icons";

/**
 * El acceso al buzón, a un dedo de distancia en cualquier pantalla.
 *
 * En el móvil va en el borde izquierdo de la barra, frente a buscar. Aquí solo
 * queda el de escritorio: abajo a la derecha, porque ahí no hay dock.
 *
 * En el propio buzón no hace falta.
 */
const INBOX = /^\/sugerencias(\/|$)/;

export function FeedbackButton() {
  const pathname = usePathname();
  if (INBOX.test(pathname)) return null;

  const href = `/sugerencias?desde=${encodeURIComponent(pathname)}`;

  return (
    <Link
      href={href}
      className="fixed bottom-5 right-5 z-30 hidden min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-panel-high/95 px-3.5 text-[13px] font-medium text-body shadow-card backdrop-blur transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] lg:inline-flex"
    >
      <FeedbackIcon className="size-4 shrink-0" />
      Sugerencias
    </Link>
  );
}
