import type { Metadata } from "next";
import { CityRailCard } from "@/components/cards/CityRailCard";
import { CampaignCard } from "@/components/home/CampaignCard";
import { CampaignStrip } from "@/components/home/CampaignStrip";
import { ChocoMap } from "@/components/map/ChocoMap";
import { ColombiaLocator } from "@/components/map/ColombiaLocator";
import { LiveBadge } from "@/components/map/LiveBadge";
import { MapIntro } from "@/components/map/MapIntro";
import { MapStatus } from "@/components/map/MapStatus";
import { MapViewTabs, parseMapView } from "@/components/map/MapViewTabs";
import { NeedsLegend } from "@/components/map/NeedsLegend";
import { screenTitle, shell } from "@/components/ui/styles";
import { byCampaignPriority, resolveCampaign } from "@/lib/campaign";
import {
  getCampaignFocusRow,
  getCaseCards,
  getCityCards,
  getPortalTotals,
} from "@/lib/data";
import { paintMunicipalities, TIER_FILL } from "@/lib/needs-scale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mapa",
  description:
    "Los treinta municipios del Chocó coloreados por cuánto falta por cubrir. Toca uno documentado para ver qué ocurre allí.",
};

/**
 * El mapa a pantalla: Colombia, la leyenda y el marcador al pie, las tarjetas al
 * lado.
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
  const [{ ver }, cities, cases, focusRow, totals] = await Promise.all([
    searchParams,
    getCityCards(),
    getCaseCards(),
    getCampaignFocusRow(),
    getPortalTotals(),
  ]);
  const view = parseMapView(ver);
  const campaign = resolveCampaign(focusRow, cities, cases);
  const ranked = byCampaignPriority(cities, campaign?.city.id ?? null);

  const pins = cities.map((city) => ({
    id: city.id,
    name: city.name,
    slug: city.slug,
    lat: city.lat,
    lng: city.lng,
    progress: city.progress,
  }));

  // El marcador reparte los pueblos entre las formas otra vez, con la misma
  // llamada y los mismos datos que el mosaico: así el número de prioritarios y
  // el rojo del dibujo no pueden decir cosas distintas, que es lo único que
  // importa de un contador puesto al lado de un color.
  //
  // El denominador de los documentados sale de aquí por lo mismo
  // —`paintMunicipalities` devuelve las treinta del DANE pase lo que pase—, y el
  // numerador de las ciudades: documentado es tener ficha, y si alguna no casara
  // con su forma el que está mal es el cruce de nombres, no la cuenta.
  const painted = paintMunicipalities(pins);
  const priority = painted.filter((shape) => shape.tier === "high").length;

  // Y las mismas treinta formas viajan a la vista de Colombia, donde el Chocó
  // deja de ser un relleno plano. El color va resuelto y el localizador no lo
  // busca por su cuenta a propósito: a ese componente lo importa también la
  // apertura, que es JavaScript de cliente. El motivo entero está en
  // `MosaicPiece`, en components/map/ColombiaLocator.tsx.
  const mosaic = painted.map((shape) => ({
    id: shape.id,
    d: shape.d,
    fill: TIER_FILL[shape.tier],
    tier: shape.tier,
  }));

  // El Chocó es dos veces y media más alto que ancho, así que el dibujo lo
  // limita el alto y no el ancho: cada línea de texto que se le pone encima o
  // debajo se la quita al mapa directamente. De ahí que el titular sea una
  // línea, el subtítulo otra, y la leyenda y el marcador vayan pegados al pie en
  // renglones de 11 px.
  //
  // Esa misma proporción es lo que hacía de esta la peor pantalla en
  // escritorio: por alta que sea la ventana, el departamento nunca pasa de unos
  // 500 px de ancho y el resto era papel en blanco a los dos lados. En vez de
  // estirar el mapa —que no da más de sí— el hueco se llena con lo que el mapa
  // no puede decir: qué municipios son los de color y cómo están. El mapa
  // conserva el alto entero, que es su única medida.
  return (
    <div
      className={`map-board ${shell} screen-h flex flex-col pt-3 lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-x-12 lg:pb-6 lg:pt-6`}
    >
      {/* Atlas: el campo entero es el Pacífico. Colombia asoma a la derecha
          en el gris de las superficies hundidas; el Chocó es el único sitio
          con color de dato. Sin cintas y sin selva: ese verde competía con
          el rojo, el naranja y el oro, y pintaba de bosque el agua. La tinta
          es `ink` sobre `mar`. El mapa no va en una ventana de papel: esa
          caja hacía del océano y del país el mismo beige. */}
      <div className="map-stage enters relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl bg-mar px-4 py-4 lg:h-full lg:px-5 lg:py-5">
        <LiveBadge className="top-4 right-4 left-auto lg:top-5 lg:right-5" />
        <header className="shrink-0">
          <h1 className="font-display text-[22px] leading-tight text-ink lg:text-[30px]">
            Mapa del Chocó
          </h1>
          {view === "colombia" ? (
            /* Los tres vecinos, en el renglón que la vista ya gastaba en decir de
               qué iba. Cuál es la vista lo dicen las pestañas, y dónde queda lo
               dibuja el mapa; lo que no cabe en un país de 168 px de ancho son los
               nombres de al lado, así que este es el sitio donde de verdad hacen
               falta. Van aquí y no al pie porque ahí ya está la leyenda: en esta
               pantalla el dibujo se lleva el alto que sobra, y una línea de más
               abajo se le resta al departamento —24 px a 360 × 640—, mientras que
               esta ya estaba escrita y cabe en un renglón desde 320 px de ventana
               (251 de 280 px de caja). */
            <p className="mt-1 text-[12px] leading-snug text-muted lg:mt-2 lg:text-[14px]">
              Entre Panamá, el Pacífico y el Valle del Cauca.
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

        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden lg:mt-4">
          {view === "colombia" ? (
            <ColombiaLocator named mosaic={mosaic} className="size-full" />
          ) : (
            <>
              <ChocoMap
                pins={pins}
                hrefFor={(pin) => `/ciudades/${pin.slug}`}
                activeSlug={campaign?.city.slug}
                className="size-full"
              />
              <MapIntro />
            </>
          )}
        </div>

        <div className="enters enters-2 mt-3 shrink-0 border-t border-ink/10 pt-2.5 lg:mt-4">
          {/* La leyenda va en las dos vistas porque en las dos hay los mismos cinco
              colores que explicar: desde que el Chocó dentro del país es su mosaico
              y no un relleno plano, una vista sin leyenda serían treinta piezas de
              color sin decir de qué. Y con ella viene su filtro, que es CSS del
              tablero (`.map-board:has(.legend-step…)`) y no lógica de esta página.
              Cuesta 24 px de dibujo en el móvil y 43,5 en escritorio, contra el
              párrafo de tres renglones que ocupaba este sitio.

              Y el filtro se ve a ese tamaño, que era la duda: el departamento se
              dibuja aquí a 45 px de ancho y la mitad de sus piezas son bandas de
              cuatro píxeles o menos, pero bajar una a 0,22 la deja sobre el gris de
              «sin documentar», o sea que el salto de color es de 49 a 68 de ΔE
              según el tramo —veinte veces el umbral de 2,3— y en pantalla se
              conserva casi entero hasta en las bandas más finas: medido en las
              treinta formas, el tramo que menos se mueve pasa de 40,5 de ΔE en el
              interior de una pieza a 31,4 en una banda de tres píxeles, 21,8 en una
              de dos y 9,2 en una astilla de uno. */}
          <NeedsLegend />
          <div className="mt-2">
            <MapStatus
              priority={priority}
              documented={cities.length}
              total={painted.length}
              goal={totals.budget.goal}
              donated={totals.budget.donated}
              updatedAt={totals.updatedAt}
            />
          </div>
        </div>
      </div>

      {/* Solo en escritorio, y no porque sobre sitio: en el móvil este listado ya
          existe y se llama /municipios. Aquí es el vecino del mapa —el color de
          la forma y la tarjeta del municipio, uno al lado del otro— y en una
          pantalla de 390 px no habría dónde ponerlo sin quitárselo al dibujo. */}
      <aside className="enters enters-2 hidden lg:flex lg:min-h-0 lg:flex-col">
        {campaign && (
          <div className="mb-6">
            <CampaignCard campaign={campaign} />
          </div>
        )}
        <h2 className={screenTitle}>Municipios documentados</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Los documentados salen en color, del más atrasado al más cubierto.
          Gris es que nadie ha llegado todavía; un pueblo visitado sin casos
          abiertos va en verde.
        </p>
        <ul className="mt-5 grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4 overflow-y-auto">
          {ranked.map((city) => (
            <li key={city.id}>
              <CityRailCard
                city={city}
                featured={
                  city.id === campaign?.city.id ? campaign.source : undefined
                }
              />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
