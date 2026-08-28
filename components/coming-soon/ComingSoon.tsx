import { WaitlistForm } from "@/components/coming-soon/WaitlistForm";
import { PreviewUnlock } from "@/components/coming-soon/PreviewUnlock";
import { SupportSignup } from "@/components/coming-soon/SupportSignup";
import { Logo } from "@/components/Logo";
import { ChocoMap } from "@/components/map/ChocoMap";
import { MapStatus } from "@/components/map/MapStatus";
import { NeedsLegend } from "@/components/map/NeedsLegend";
import { CasesIcon, MapIcon, OfferIcon } from "@/components/ui/icons";
import type { MapPin } from "@/lib/choco-map";
import { SITE_NAME } from "@/lib/constants";
import { paintMunicipalities } from "@/lib/needs-scale";

/**
 * Un mapa de muestra: enseña la escala, no el estado real.
 *
 * Si pintáramos los municipios documentados, esta pantalla —la única que ve
 * quien llega antes del lanzamiento— publicaría el tablero que precisamente
 * todavía no es público. Los cuatro pueblos y los porcentajes son un ejemplo
 * didáctico, y la leyenda debajo lo dice.
 */
const LESSON_PINS: MapPin[] = [
  {
    id: "lesson-quibdo",
    name: "Quibdó",
    slug: "quibdo",
    lat: 5.6947,
    lng: -76.6611,
    progress: { total: 10, ratio: 0.05 },
  },
  {
    id: "lesson-istmina",
    name: "Istmina",
    slug: "istmina",
    lat: 5.1594,
    lng: -76.6853,
    progress: { total: 8, ratio: 0.45 },
  },
  {
    id: "lesson-bahia",
    name: "Bahía Solano",
    slug: "bahia-solano",
    lat: 6.2225,
    lng: -77.4028,
    progress: { total: 6, ratio: 0.75 },
  },
  {
    id: "lesson-condoto",
    name: "Condoto",
    slug: "condoto",
    lat: 5.0906,
    lng: -76.6469,
    progress: { total: 3, ratio: 1 },
  },
];

/**
 * El marcador de la muestra: las dos cifras que salen de esos cuatro pueblos y
 * de ningún otro sitio.
 *
 * Se cuentan repartiéndolos entre las treinta formas con la misma llamada que
 * hace el mosaico, así que el número de prioritarios y el rojo del dibujo no
 * pueden decir cosas distintas —es lo único que importa de un contador puesto al
 * lado de un color— y el denominador de los documentados es el de las formas que
 * se están dibujando y no un treinta escrito a mano.
 *
 * Del marcador del tablero falta la tercera cifra, lo resuelto, y falta a
 * propósito: es el dinero del portal contra su meta, y aquí las dos maneras de
 * ponerla son malas. La de verdad publica el tablero que esta misma pantalla
 * dice que todavía no es público; una inventada serían donaciones fingidas, y
 * eso no lo arregla ninguna nota al pie. Un color y un porcentaje de cobertura
 * se leen como una lección; un importe recaudado se lee como una cuenta.
 *
 * Por eso al marcador no se le pasan `goal` ni `donated` en vez de pasarle
 * ceros: la ausencia es lo único que significa «aquí el dinero no se enseña», y
 * un cero significaría que el portal no tiene meta, que es un dato suyo y no
 * está en esta pantalla para darlo.
 */
const LESSON_BOARD = paintMunicipalities(LESSON_PINS);
const LESSON_PRIORITY = LESSON_BOARD.filter(
  (shape) => shape.tier === "high",
).length;
const LESSON_DOCUMENTED = LESSON_BOARD.filter((shape) => shape.city).length;

/**
 * Qué va a ser esto, en tres palabras y no en tres tarjetas.
 *
 * Aquí había tres pasos con icono, titular y párrafo, y ocupaban media columna
 * por debajo del formulario. El objetivo de esta pantalla es que quepa entera
 * sin bajar, así que el manual del portal se queda en lo que de verdad añade:
 * las tres cosas que va a ser, dichas de corrido en la entradilla. Lo que
 * contaban los párrafos —cómo se lee el color, que el mapa solo cambia cuando
 * el equipo confirma— ya lo dice la leyenda del atlas, que está en la otra
 * columna y a la vista.
 */
const WHAT: { Icon: (props: { className?: string }) => React.ReactElement; label: string }[] = [
  { Icon: MapIcon, label: "Los 30 municipios" },
  { Icon: CasesIcon, label: "Casos con consentimiento" },
  { Icon: OfferIcon, label: "Comprobable" },
];

export function ComingSoon({ state }: { state: "recibido" | "correo" | null }) {
  return (
    <div className="lg:grid lg:h-svh lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,36rem)] lg:overflow-hidden">
      {/* El marco oscuro, y por qué el mapa va dentro de una hoja clara.
          
          Esta columna era papel sobre papel: el atlas flotaba sobre el mismo
          fondo que el resto de la página y la mitad izquierda de la pantalla se
          leía como un hueco. Ahora es un bloque macizo de `selva` con cintas
          —el gesto de la marca, el mismo de /ofrecer— y dentro una hoja de
          papel con el mapa.

          La hoja no es decoración: el atlas está DIBUJADO PARA PAPEL. Sus
          rótulos son `fill-muted` con filo de `paper` y el país es
          `fill-tierra`, así que puesto directamente sobre el verde oscuro los
          nombres de los pueblos dejarían de leerse. La leyenda y el marcador sí
          van sobre el marco, y por eso llevan `tone="oscuro"`, que es la
          variante que esas dos piezas ya traían. */}
      <section
        aria-label="Cómo se va a leer el mapa"
        className="map-board cintas relative overflow-hidden bg-selva px-4 pb-5 pt-5 sm:px-6 sm:pb-6 lg:flex lg:h-full lg:flex-col lg:p-7"
      >
        <p className="enters relative text-[13px] tracking-wide text-luz/70">
          {SITE_NAME}
        </p>

        <div className="enters enters-1 relative mt-4 h-[min(48svh,26rem)] overflow-hidden rounded-2xl bg-paper p-3 lg:mt-5 lg:h-0 lg:flex-1">
          <ChocoMap
            pins={LESSON_PINS}
            activeSlug="quibdo"
            className="size-full"
          />
        </div>

        <div className="enters enters-2 relative mt-4 pt-0.5">
          <NeedsLegend tone="oscuro" />
          <div className="mt-2">
            <MapStatus
              priority={LESSON_PRIORITY}
              documented={LESSON_DOCUMENTED}
              total={LESSON_BOARD.length}
              updatedAt={null}
              label="Marcador del mapa de muestra"
              tone="oscuro"
            />
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-luz/70">
            Un ejemplo de lectura con cifras de muestra, no el tablero real. El
            de verdad todavía no es público.
          </p>
        </div>
      </section>

      {/* `pb-12` y no `py-8`: la última pieza de esta columna es el botón de la
          vista previa, y con 32 px debajo queda tocando el filo inferior de la
          pantalla, que en un teléfono es justo donde se posa la barra de
          direcciones del navegador.

          El orden de esta columna cambió, y el motivo es lo único que importa
          de esta pantalla: antes iba titular, tres pasos explicando el portal,
          y al final un campo de correo para avisar cuando abriera. O sea que a
          quien llegaba ofreciendo ayuda se le pedía esperar. Ahora lo primero
          después del titular es apuntarse —voluntariado, profesión o recurso—,
          que es lo que el equipo puede usar hoy; el correo de aviso queda
          debajo, para quien no puede ofrecer nada todavía. */}
      {/* El aire de arriba y abajo depende del ALTO de la ventana, no del ancho.
          
          Esta columna tiene que caber entera sin bajar, y lo que decide si cabe
          es cuántos píxeles verticales hay: en un portátil de 1024×700 sobraban
          58 y en uno de 1280×800 no sobraba ninguno, con el mismo `lg:`. Con un
          único padding hay que elegir entre apretar las pantallas grandes o
          desbordar las pequeñas. Así que se aprieta por omisión y se suelta a
          partir de 820 px de alto, que es donde empieza a haber sitio. */}
      <section className="flex flex-col px-5 pb-12 pt-8 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-10 lg:py-5 lg:[@media(min-height:820px)]:py-10">
        {/* `lg:mt-auto` aquí y `lg:mb-auto` en la última pieza: así se centra la
            columna cuando sobra alto, sin usar `justify-center`.
            
            La diferencia solo se ve con el formulario abierto: en un contenedor
            que hace scroll, `justify-center` recorta por ARRIBA lo que no cabe y
            esa parte ya no se alcanza con la rueda. Un margen automático se
            resuelve a cero en cuanto el contenido desborda, así que centra
            mientras sobra sitio y se aparta cuando falta. */}
        <header className="enters lg:mt-auto">
          <div className="flex flex-wrap items-center gap-3">
            <Logo className="text-[24px] text-ink" />
            <p className="inline-flex items-center gap-2 rounded-full bg-brote px-3 py-1 text-[12px] font-medium text-ink">
              <span aria-hidden className="size-1.5 rounded-full bg-selva" />
              En construcción
            </p>
          </div>

          <h1 className="mt-3 font-display text-[28px] leading-[0.95] text-ink sm:text-[33px]">
            El tablero todavía no es público. La ayuda sí hace falta ya.
          </h1>
          <p className="mt-2.5 max-w-[38rem] text-[14px] leading-relaxed text-body">
            Un mapa compartido del Chocó después del terremoto: los treinta
            municipios, casos documentados con consentimiento y cada peso
            comprobable. Todavía no se puede entrar, pero el equipo ya está en
            campo.
          </p>
        </header>

        <div className="enters enters-1 mt-4">
          <SupportSignup />
        </div>

        <div className="enters enters-2 mt-3">
          <WaitlistForm state={state} />
        </div>

        {/* Las tres cosas que va a ser, en una fila. Eran tres tarjetas con
            párrafo y ocupaban media columna por debajo del pliegue. */}
        <ul className="enters enters-3 mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {WHAT.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5 text-[12px] text-muted">
              <Icon className="size-4 text-accent" />
              {label}
            </li>
          ))}
        </ul>

        {/* `shrink-0` en el envoltorio y no solo en el botón de dentro. La
            columna desborda en cuanto se abre uno de los cuatro formularios, y
            entonces el reparto del flex le come el alto a este hijo: es el mismo
            fallo que PreviewUnlock ya documenta —un botón sin alto no se puede
            pulsar— y al meterlo en un div para centrar la columna, el div se
            quedó sin la protección que el botón sí tenía. */}
        <div className="shrink-0 lg:mb-auto">
          <PreviewUnlock />
        </div>
      </section>
    </div>
  );
}
