import { WaitlistForm } from "@/components/coming-soon/WaitlistForm";
import { PreviewUnlock } from "@/components/coming-soon/PreviewUnlock";
import { Logo } from "@/components/Logo";
import { ChocoMap } from "@/components/map/ChocoMap";
import { NeedsLegend } from "@/components/map/NeedsLegend";
import { CasesIcon, MapIcon, OfferIcon } from "@/components/ui/icons";
import type { MapPin } from "@/lib/choco-map";
import { SITE_NAME } from "@/lib/constants";

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

const LESSONS = [
  {
    n: "1",
    Icon: MapIcon,
    title: "Un mapa de los treinta municipios",
    body: "El color dice cuánto falta por cubrir en cada pueblo. Gris no es que esté bien: es que todavía no hemos llegado.",
  },
  {
    n: "2",
    Icon: CasesIcon,
    title: "Casos reales, con consentimiento",
    body: "Personas, colegios, animales, fundaciones. El dinero entra por Mercado Pago, a la cuenta de ChocóUp, y queda registrado para cada causa.",
  },
  {
    n: "3",
    Icon: OfferIcon,
    title: "Ayudar sin fingir que ya llegó",
    body: "Quien puede ayudar lo ofrece. El color del mapa solo cambia cuando el equipo lo confirma.",
  },
] as const;

export function ComingSoon({ state }: { state: "recibido" | "correo" | null }) {
  return (
    <div className="lg:grid lg:h-[calc(100svh-var(--strip-h,0px))] lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,36rem)] lg:overflow-hidden">
      <section
        aria-label="Cómo se va a leer el mapa"
        className="map-board relative overflow-hidden bg-selva px-4 pb-5 pt-5 sm:px-6 sm:pb-6 lg:flex lg:h-full lg:flex-col lg:p-7"
      >
        <div className="cintas pointer-events-none absolute inset-0" aria-hidden />

        <p className="enters relative text-[13px] tracking-wide text-luz/80">
          {SITE_NAME}
        </p>

        <div className="enters enters-1 relative mt-4 h-[min(48svh,26rem)] overflow-hidden rounded-[1.75rem] bg-paper lg:mt-5 lg:h-0 lg:flex-1">
          <ChocoMap
            pins={LESSON_PINS}
            activeSlug="quibdo"
            className="size-full"
          />
        </div>

        <div className="enters enters-2 relative mt-4 rounded-2xl bg-paper/95 px-4 py-3">
          <NeedsLegend />
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            Un ejemplo de lectura, no el tablero real. El de verdad todavía no es
            público.
          </p>
        </div>
      </section>

      {/* `pb-12` y no `py-8`: la última pieza de esta columna es el botón de la
          vista previa, y con 32 px debajo queda tocando el filo inferior de la
          pantalla, que en un teléfono es justo donde se posa la barra de
          direcciones del navegador. */}
      <section className="flex flex-col px-5 pb-12 pt-8 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-10 lg:py-12">
        <header className="enters">
          <Logo className="text-[26px] text-ink" />

          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-brote px-3.5 py-1.5 text-[12px] font-medium text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-selva" />
            En construcción
          </p>

          <h1 className="mt-4 font-display text-[32px] leading-[0.95] text-ink sm:text-[40px] lg:text-[42px]">
            El tablero del Chocó todavía no es público
          </h1>
          <p className="mt-4 max-w-[36rem] text-[16px] leading-relaxed text-body">
            Después del terremoto, un mapa compartido: dónde falta, qué se ha cubierto y
            cómo ayudar. Lo estamos armando con el equipo en campo. Aún no se puede
            entrar.
          </p>
        </header>

        <ol className="enters enters-1 mt-6 space-y-4">
          {LESSONS.map(({ n, Icon, title, body }) => (
            <li key={n} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brote text-ink">
                <Icon className="size-5" />
                <span className="sr-only">Paso {n}. </span>
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-display text-[18px] leading-tight text-ink">{title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="enters enters-2 mt-8 lg:mt-auto lg:pt-8">
          <WaitlistForm state={state} />
        </div>

        <PreviewUnlock />
      </section>
    </div>
  );
}
