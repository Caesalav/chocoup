import Link from "next/link";
import { CaseRow } from "@/components/cards/CaseRow";
import { CityRailCard } from "@/components/cards/CityRailCard";
import { HomeBoard } from "@/components/home/HomeBoard";
import { ProgressCard } from "@/components/home/ProgressCard";
import { SectionLinks } from "@/components/home/SectionLinks";
import { Logo } from "@/components/Logo";
import { screenTitle, shell } from "@/components/ui/styles";
import { byCampaignPriority, resolveCampaign } from "@/lib/campaign";
import { SITE_NAME } from "@/lib/constants";
import { getCampaignFocusRow, getCaseCards, getCityCards, getPortalTotals } from "@/lib/data";
import { relativeDays } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Cuántos casos caben en el inicio antes de que deje de ser una portada. */
const CASES_ON_HOME = 4;

export default async function HomePage() {
  const [cities, cases, totals, focusRow] = await Promise.all([
    getCityCards(),
    getCaseCards(),
    getPortalTotals(),
    getCampaignFocusRow(),
  ]);
  const campaign = resolveCampaign(focusRow, cities, cases);
  const ranked = byCampaignPriority(cities, campaign?.city.id ?? null);

  return (
    <div className={`${shell} pt-4 lg:pt-8`}>
      {/* Donde la referencia pone el avatar de quien ha iniciado sesión va la
          marca: este portal es público y no tiene cuentas. Y donde pone la
          campana de notificaciones va un dato, porque lo primero que hay que
          saber al abrir esto es si sigue vivo.

          La marca es el <h1> de la página. El inicio arranca directo con la
          tarjeta grande, sin titular, igual que la referencia, y un h1 oculto
          diciendo lo mismo que el logotipo sería texto de más para quien usa
          lector de pantalla.

          En escritorio la marca ya está en la cabecera, así que aquí se queda
          solo para el lector de pantalla: verla dos veces en la misma esquina
          sería un tropiezo, y quitar el h1 dejaría la portada sin encabezado
          para quien la recorre a saltos.

          Y con la marca fuera, la pastilla de "actualizado" se quedaba sola
          flotando en la esquina derecha de una franja vacía: sin nada enfrente
          había dejado de ser el contrapeso de la marca para ser un rótulo
          suelto. En escritorio se retira de aquí y el dato reaparece dentro de
          la tarjeta de estado, que es donde ya vive todo lo demás que se cuenta
          del registro. En el móvil se queda: es lo primero que hay que saber al
          abrir esto, y allí sí tiene la marca al lado. */}
      <header className="enters flex items-center justify-between gap-4 lg:justify-end">
        <h1 className="flex items-center gap-2 text-[22px] leading-none lg:sr-only">
          <Logo className="h-[1.05em] w-auto shrink-0 text-ink" />
          <span className="font-display text-ink">
            Chocó<span className="text-accent">-up</span>
          </span>
          <span className="sr-only">
            , documentación de la situación en el Chocó tras el terremoto
          </span>
        </h1>

        {totals.updatedAt && (
          <p className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-panel-high px-3.5 py-2 text-[12px] text-muted shadow-card lg:hidden">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {relativeDays(totals.updatedAt)}
          </p>
        )}
      </header>

      {/* Municipios. En el móvil es un carrusel: desplazamiento y ajuste de CSS,
          sin una línea de JavaScript, que se arrastra con el dedo y planta cada
          tarjeta en su sitio. Los márgenes negativos lo sacan del ancho de la
          página para que la siguiente asome por el borde, que es lo que dice que
          hay más.

          A partir de `sm` deja de ser carrusel y se abre entero. Un carrusel es
          la manera de enseñar cinco cosas por un hueco de una, y en cuanto caben
          todas se convierte en lo contrario: esconder con un gesto lo que ya
          cabía a la vista.

          El recado va encima: a dónde mirar ahora. El mapa entero está en su
          propia pantalla. Las tarjetas son el detalle de los pueblos. */}
      <div className="enters enters-1 mt-5">
        <HomeBoard campaign={campaign} />
      </div>

      {ranked.length > 0 && (
        <ul
          aria-label="Municipios documentados"
          className="no-scrollbar enters enters-1 -mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4"
        >
          {ranked.map((city) => (
            <li
              key={city.id}
              className="w-[calc(100vw-3.5rem)] max-w-[420px] shrink-0 snap-start sm:w-auto sm:max-w-none"
            >
              <CityRailCard city={city} featured={city.id === campaign?.city.id ? campaign.source : undefined} />
            </li>
          ))}
        </ul>
      )}

      <div className="enters enters-2 mt-6 lg:mt-10">
        <SectionLinks />
      </div>

      {/* Abajo, dos columnas: la lista de casos ocupa el ancho y el estado del
          registro se va a un costado. Uno detrás de otro, el resumen quedaba
          entre dos listas y partía la lectura en dos; al lado se lee como lo que
          es, la nota al margen de todo lo que hay debajo.

          La rejilla solo se arma si hay casos: con la lista vacía, la columna de
          la izquierda no existiría y el resumen acabaría descolgado a la
          derecha del papel. */}
      <div
        className={`mt-5 lg:mt-12 ${
          cases.length > 0
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-12"
            : ""
        }`}
      >
        <div className="enters enters-2 lg:col-start-2 lg:row-start-1">
          <ProgressCard totals={totals} />
        </div>

        {cases.length > 0 && (
          <section className="enters enters-3 mt-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className={screenTitle}>Casos documentados</h2>
              {cases.length > CASES_ON_HOME && (
                <Link
                  href="/casos"
                  className="shrink-0 text-[13px] text-accent-strong transition-colors hover:text-accent"
                >
                  Ver todos
                </Link>
              )}
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {cases.slice(0, CASES_ON_HOME).map((caseCard) => (
                <li key={caseCard.id}>
                  <CaseRow caseCard={caseCard} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* El aviso de consentimiento no puede vivir solo en el pie de las
            páginas interiores: el inicio es lo que se comparte por WhatsApp y
            mucha gente no pasa de aquí. */}
        <p className="mt-8 text-[12px] leading-relaxed text-faint lg:col-start-2 lg:row-start-2 lg:mt-6">
          {SITE_NAME} publica los casos con el consentimiento de cada persona. Las donaciones van
          al canal de cada caso, o al canal general cuando no tiene uno propio, y no pasan por
          este portal.
        </p>
      </div>
    </div>
  );
}
