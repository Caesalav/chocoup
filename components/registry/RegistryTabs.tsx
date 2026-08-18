import Link from "next/link";

export type RegistryView = "ofrecido" | "ayudas";

/**
 * Lo prometido delante y lo entregado detrás, que es el orden en que pasan las
 * cosas: alguien ofrece unas tejas y semanas más tarde el equipo anota que
 * llegaron. Leído del revés, el registro parecería empezar por el final.
 *
 * Las direcciones van a secas, sin arrastrar el filtro que se estuviera mirando:
 * cada lista filtra por lo suyo y con las opciones que ella tiene, así que pasar
 * el municipio de una a la otra abriría la vecina ya recortada por algo que allí
 * puede no haber ofrecido nadie. La pestaña lleva al registro entero.
 */
const TABS: { id: RegistryView; label: string; href: string }[] = [
  { id: "ofrecido", label: "Lo que se ha ofrecido", href: "/ofrecido" },
  { id: "ayudas", label: "Ayudas que llegaron", href: "/ayudas" },
];

/**
 * El conmutador de los dos registros: lo que está prometido y lo que llegó.
 *
 * Son dos enlaces normales, sin estado de cliente, por las razones de siempre en
 * este portal —sin JavaScript funciona igual, y cada mitad se puede pegar en un
 * WhatsApp— y por una de aquí: estas dos pestañas son dos pantallas de verdad y
 * no dos vistas de una, así que la pestaña abierta *es* la dirección. No hay nada
 * que interpretar ni un valor por defecto que inventarse, y por eso este archivo
 * no trae el `parse…` que llevan el mapa y las donaciones, donde la vista viaja
 * en un parámetro.
 *
 * **Sin contadores, a diferencia del resto de los conmutadores.** Los de un
 * municipio y los de donaciones llevan número porque la página ya había contado
 * lo que iba a pintar justo debajo. Aquí cada pestaña apunta a la *otra* página:
 * poner «Ayudas que llegaron 12» en `/ofrecido` obliga a esa pantalla a cargar y
 * contar unas entregas que no va a enseñar, y lo mismo al revés. Una consulta por
 * pantalla para un adorno, y encima duplicada, porque el número que importa ya lo
 * imprime cada lista sobre sí misma. Si algún día hacen falta, el sitio de esa
 * decisión es este archivo y no las dos páginas.
 *
 * Las etiquetas van enteras y no recortadas a una palabra: «Ofrecido» a secas
 * queda a una letra de «Ofrecer», que es la acción de la barra de abajo, y quien
 * llega de un enlace no tiene por qué distinguir el registro del formulario por
 * una vocal. El precio son dos nombres largos en dos pastillas, y de ahí sale el
 * resto de la maqueta: ocupa el ancho en el móvil, se corta en `sm`, y el relleno
 * de los lados va apretado abajo y normal arriba para que «Lo que se ha ofrecido»
 * quepa de un renglón también en un teléfono de 360 px. Si algún día no cabe, cae
 * centrado y con el interlineado corto en vez de desbordar la pastilla.
 */
export function RegistryTabs({ active }: { active: RegistryView }) {
  return (
    <nav
      aria-label="Lo ofrecido y lo que llegó"
      className="grid grid-cols-2 rounded-full border border-line bg-panel-high p-1 shadow-card sm:max-w-lg"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-full px-2 text-center text-[13px] font-medium leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 sm:text-[14px] ${
              selected ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
