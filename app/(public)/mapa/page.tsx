import type { Metadata } from "next";
import { CityRailCard } from "@/components/cards/CityRailCard";
import { CampaignCard } from "@/components/home/CampaignCard";
import { CampaignStrip } from "@/components/home/CampaignStrip";
import { ChocoMap } from "@/components/map/ChocoMap";
import { ColombiaLocator } from "@/components/map/ColombiaLocator";
import { MapIntro } from "@/components/map/MapIntro";
import { MapStatus } from "@/components/map/MapStatus";
import { MapViewTabs, parseMapView } from "@/components/map/MapViewTabs";
import { NeedsLegend } from "@/components/map/NeedsLegend";
import { screenTitle, shell } from "@/components/ui/styles";
import { byCampaignPriority, resolveCampaign } from "@/lib/campaign";
import { getCampaignFocusRow, getCaseCards, getCityCards } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa",
  description:
    "Los treinta municipios del Chocó coloreados por cuánto falta por cubrir. Toca uno documentado para ver qué ocurre allí.",
};

/**
 * El mapa a pantalla: Colombia, la leyenda al pie y las tarjetas al lado.
 *
 * El mosaico del Chocó vive solo aquí. En el inicio queda el recado del
 * momento y un enlace a esta vista; un segundo dibujo a media altura
 * repetía el oficio y marcaba un pueblo con un filete que no le
 * correspondía.
 *
 * Y por eso mismo hay dos vistas y no una. Quien pregunta «dónde queda» necesita
 * el país entero; quien ya lo sabe quiere el departamento y sus colores, y hasta
 * ahora tenía que aguantar el localizador de la apertura para llegar a él. Las
 * dos conviven sin repetirse porque no hacen el mismo trabajo: la apertura es un
 * saludo de segundo y medio que se ve una vez por sesión, se pierde si el
 * navegador no ejecuta JavaScript y no se puede enlazar; la vista de Colombia es
 * un mapa quieto que se comparte por WhatsApp, se puede mirar el tiempo que haga
 * falta y llega en el HTML. Sobre el localizador a secas —la vista de Colombia—
 * la apertura no se monta: Colombia disolviéndose sobre Colombia sí sería repetir.
 *
 * Ocupa el alto exacto de la pantalla menos la franja de aviso y lo que ocupe la
 * navegación (.screen-h) y no se desplaza: un mapa que se va hacia arriba cuando
 * intentas arrastrarlo se siente roto.
 */
type Props = {
  searchParams: Promise<{ ver?: string }>;
};

export default async function MapPage({ searchParams }: Props) {
  const [{ ver }, cities, cases, focusRow] = await Promise.all([
    searchParams,
    getCityCards(),
    getCaseCards(),
    getCampaignFocusRow(),
  ]);
  const view = parseMapView(ver);
  const campaign = resolveCampaign(focusRow, cities, cases);
  const ranked = byCampaignPriority(cities, campaign?.city.id ?? null);

  const updatedAt =
    cities.map((city) => city.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null;
  const openNeeds = cities.reduce((sum, city) => sum + city.openNeeds, 0);
  // Se suman los de cada municipio y no se vuelven a contar en global: un caso
  // pertenece a un solo pueblo, así que las dos cuentas dan lo mismo y sumar es
  // lo que garantiza que el total y las tarjetas del costado no puedan
  // separarse. Ver `countOpenCases` en lib/needs.ts.
  const openCases = cities.reduce((sum, city) => sum + city.openCases, 0);

  const pins = cities.map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    lat: city.lat,
    lng: city.lng,
    progress: city.progress,
  }));

  // El Chocó es dos veces y media más alto que ancho, así que el dibujo lo
  // limita el alto y no el ancho: cada línea de texto que se le pone encima o
  // debajo se la quita al mapa directamente. De ahí que el titular sea una
  // línea, el subtítulo otra y la leyenda vaya pegada al pie.
  //
  // Esa misma proporción es lo que hacía de esta la peor pantalla en
  // escritorio: por alta que sea la ventana, el departamento nunca pasa de unos
  // 500 px de ancho y el resto era papel en blanco a los dos lados. En vez de
  // estirar el mapa —que no da más de sí— el hueco se llena con lo que el mapa
  // no puede decir: qué municipios son los de color y cómo están. El mapa
  // conserva el alto entero, que es su única medida.
  return (
    <div
      className={`${shell} screen-h flex flex-col pt-3 lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:gap-x-12 lg:pb-6 lg:pt-6`}
    >
      <header className="enters shrink-0 lg:col-start-1 lg:row-start-1">
        <h1 className="font-display text-[22px] leading-tight text-ink lg:text-[30px]">
          Mapa del Chocó
        </h1>
        {view === "colombia" ? (
          <p className="mt-1 text-[12px] leading-snug text-muted lg:mt-2 lg:text-[14px]">
            Dónde queda el departamento dentro del país.
          </p>
        ) : campaign ? (
          <CampaignStrip
            campaign={campaign}
            className="mt-1 text-[12px] leading-snug lg:mt-2 lg:text-[14px]"
          />
        ) : (
          <p className="mt-1 text-[12px] leading-snug text-muted lg:mt-2 lg:text-[14px]">
            Los treinta municipios, coloreados por cuánto falta por cubrir.
          </p>
        )}
        <div className="mt-2.5 lg:mt-4">
          <MapViewTabs active={view} />
        </div>
      </header>

      <div className="enters enters-1 relative mt-2 min-h-0 flex-1 lg:col-start-1 lg:row-start-2 lg:mt-4">
        {view === "colombia" ? (
          <ColombiaLocator named className="size-full" />
        ) : (
          <>
            <ChocoMap
              pins={pins}
              hrefFor={(pin) => `/ciudades/${pin.slug}`}
              className="size-full"
            />
            <MapIntro />
          </>
        )}
      </div>

      <div className="enters enters-2 shrink-0 border-t border-line pt-2.5 lg:col-start-1 lg:row-start-3 lg:mt-4">
        {/* La leyenda es de la escala de color, así que en la vista de Colombia no
            tiene nada que explicar: ahí manda la única cosa que el localizador no
            puede dibujar, con qué limita el departamento. */}
        {view === "colombia" ? (
          <p className="text-[12px] leading-relaxed text-muted">
            El Chocó ocupa el noroeste de Colombia. Limita al oeste con el océano Pacífico, al
            norte con Panamá y al sur con el Valle del Cauca.
          </p>
        ) : (
          <NeedsLegend />
        )}
        <div className="mt-2">
          <MapStatus
            municipios={cities.length}
            openCases={openCases}
            openNeeds={openNeeds}
            updatedAt={updatedAt}
          />
        </div>
      </div>

      {/* Solo en escritorio, y no porque sobre sitio: en el móvil este listado ya
          existe y se llama /municipios. Aquí es el vecino del mapa —el color de
          la forma y la tarjeta del municipio, uno al lado del otro— y en una
          pantalla de 390 px no habría dónde ponerlo sin quitárselo al dibujo. */}
      <aside className="enters enters-2 hidden lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:flex lg:min-h-0 lg:flex-col">
        {campaign && (
          <div className="mb-6">
            <CampaignCard campaign={campaign} />
          </div>
        )}
        <h2 className={screenTitle}>Municipios documentados</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Los documentados salen en color, del más atrasado al más cubierto. Gris es que
          nadie ha llegado todavía; un pueblo visitado sin casos abiertos va en verde.
        </p>
        <ul className="mt-5 grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4 overflow-y-auto">
          {ranked.map((city) => (
            <li key={city.id}>
              <CityRailCard city={city} featured={city.id === campaign?.city.id ? campaign.source : undefined} />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
