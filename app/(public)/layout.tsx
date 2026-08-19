import { BottomNav } from "@/components/nav/BottomNav";
import { FeedbackButton } from "@/components/FeedbackButton";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * El portal público es una pila de pantallas con la navegación en un borde.
 *
 * Cuál de los dos bordes lo decide el ancho, y nunca los dos a la vez: en el
 * móvil abajo, donde llega el pulgar y donde la puso el rediseño; a partir de
 * `lg` arriba, en la cabecera, porque una barra flotando sobre el filo inferior
 * de una pantalla de escritorio queda lejos de la mano y de la vista.
 *
 * El hueco de la barra lo pone aquí una sola vez (--nav-h) en lugar de
 * repetirlo en cada página, y se retira con ella; las pantallas que ocupan el
 * alto completo usan `.screen-h`, que descuenta la franja de aviso y lo que
 * ocupe la navegación en cada caso.
 *
 * El pie no está aquí a propósito: lo montan las páginas que son documento
 * —municipio, caso, secciones—, y no el inicio ni el mapa, que son pantallas.
 * El botón de sugerencias sí está, porque esas dos pantallas no tienen pie y
 * la barra de abajo ya está llena.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader className="hidden lg:block" />
      <main className="flex-1 pb-[var(--nav-h)] lg:pb-0">{children}</main>
      <FeedbackButton />
      <BottomNav />
    </>
  );
}
