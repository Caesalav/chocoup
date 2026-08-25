import { WaitlistForm } from "@/components/coming-soon/WaitlistForm";
import { PreviewUnlock } from "@/components/coming-soon/PreviewUnlock";
import { SupportSignup } from "@/components/coming-soon/SupportSignup";
import { DonationsAnchor } from "@/components/coming-soon/DonationsAnchor";
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
 * Qué va a ser esto, en tres renglones.
 *
 * Estaba escrito como tres pasos con un icono grande cada uno y ocupaba media
 * columna. Ahora la columna la manda el formulario de apuntarse, así que esto
 * se cuenta corto y debajo: quien llega a ofrecer ayuda no necesita el manual
 * del portal antes de dejar su nombre, y quien sí quiere saber qué es esto lo
 * lee después sin haber tenido que bajar por delante de tres tarjetas.
 */
const LESSONS = [
  {
    Icon: MapIcon,
    title: "Un mapa de los treinta municipios",
    body: "El color dice cuánto falta en cada pueblo. Gris no es que esté bien: es que todavía no hemos llegado.",
  },
  {
    Icon: CasesIcon,
    title: "Casos reales, con consentimiento",
    body: "Personas, colegios, animales y fundaciones. El dinero entra por Mercado Pago y queda registrado para cada causa.",
  },
  {
    Icon: OfferIcon,
    title: "Ayudar sin fingir que ya llegó",
    body: "El color del mapa solo cambia cuando el equipo confirma lo que se hizo.",
  },
] as const;

export function ComingSoon({
  state,
  donationCount = 0,
  donationTotal = 0,
}: {
  state: "recibido" | "correo" | null;
  /** Para el ancla `#donaciones`, a la que apunta el correo de agradecimiento. */
  donationCount?: number;
  donationTotal?: number;
}) {
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
      <section className="flex flex-col px-5 pb-12 pt-8 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-10 lg:py-12">
        <header className="enters">
          <Logo className="text-[26px] text-ink" />

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-brote px-3.5 py-1.5 text-[12px] font-medium text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-selva" />
            En construcción
          </p>

          <h1 className="mt-4 font-display text-[32px] leading-[0.95] text-ink sm:text-[40px] lg:text-[42px]">
            El tablero todavía no es público. La ayuda sí hace falta ya.
          </h1>
          <p className="mt-4 max-w-[36rem] text-[16px] leading-relaxed text-body">
            Después del terremoto estamos armando un mapa compartido del Chocó:
            dónde falta, qué se ha cubierto y quién lo hizo. Todavía no se puede
            entrar, pero el equipo ya está en campo y puede usar lo que ofrezcas
            desde hoy.
          </p>
        </header>

        <div className="enters enters-1 mt-7">
          <SupportSignup />
        </div>

        <div className="enters enters-2 mt-5">
          <WaitlistForm state={state} />
        </div>

        {/* El aterrizaje del botón «Ver el registro de donaciones» de los
            correos ya enviados. Va después del formulario porque no es una
            acción: es una respuesta para quien llega buscándola. */}
        <div className="enters enters-2 mt-5">
          <DonationsAnchor count={donationCount} totalCop={donationTotal} />
        </div>

        <ul className="enters enters-3 mt-8 space-y-3.5 border-t border-line pt-6">
          <li className="text-[13px] font-medium uppercase tracking-wide text-faint">
            Qué va a ser esto
          </li>
          {LESSONS.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brote text-ink">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] font-medium leading-tight text-ink">
                  {title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <PreviewUnlock />
      </section>
    </div>
  );
}
