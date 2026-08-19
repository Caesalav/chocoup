import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseBigCard } from "@/components/cards/CaseBigCard";
import { CityLead } from "@/components/city/CityLead";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { DonationLog } from "@/components/donations/DonationLog";
import { ChocoMap } from "@/components/map/ChocoMap";
import { PhotoGrid } from "@/components/PhotoGrid";
import { ShareLink } from "@/components/ShareLink";
import { SiteFooter } from "@/components/SiteFooter";
import { Photo } from "@/components/ui/Photo";
import { DraftChip } from "@/components/ui/Chip";
import { BackIcon, ShareIcon } from "@/components/ui/icons";
import {
  card,
  iconOnPaper,
  iconOnPhoto,
  pillOnPhoto,
  screenTitle,
  shell,
} from "@/components/ui/styles";
import { getCityPage, getDonationLog } from "@/lib/data";
import { excerpt, formatDate, plural } from "@/lib/format";
import { mergeBudget } from "@/lib/budget";
import { moneyProgress } from "@/lib/money-progress";
import { savedFrame } from "@/lib/photo-frame";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCityPage(slug);
  if (!data) return { title: "Municipio no encontrado" };
  return {
    title: data.city.name,
    description: data.city.summary ? excerpt(data.city.summary, 155) : undefined,
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCityPage(slug);
  if (!data) notFound();

  const { city, photos, cases } = data;
  const donations = await getDonationLog({ cityId: city.id, limit: 12 });
  const budget = mergeBudget(cases.map((row) => row.budget));

  /**
   * El porcentaje del municipio, sobre lo mismo que mide el anillo de la barra
   * que tiene justo debajo.
   *
   * Iba sobre `budget.ratio`, que es lo recaudado cuando hay algo recaudado y lo
   * gastado cuando no. Al lado de una barra que cuenta lo entregado, eso ponía
   * dos porcentajes «de la meta» distintos en la misma pantalla, que es
   * exactamente el descuadre por el que existen las reglas de lib/needs.ts y
   * lib/contributions.ts. Nulo cuando todavía no se ha comprado nada: entonces no
   * hay porcentaje que dar y la frase se queda en los ítems pendientes.
   */
  const percentLabel = (() => {
    const percent = moneyProgress(budget).percent;
    return percent === null ? null : `${percent} % entregado`;
  })();

  const cover = photos[0]?.storage_path ?? null;
  const shareUrl = await absoluteUrl(`/ciudades/${city.slug}`);

  return (
    <div className="relative">
      {cover ? (
        <section className="relative isolate">
          <div className="absolute inset-0 overflow-hidden">
            <Photo path={cover} frame={savedFrame(photos[0])} alt="" eager className="size-full" />
            <span aria-hidden className="veil-t absolute inset-x-0 top-0 h-40" />
            <span aria-hidden className="veil-hero absolute inset-0" />
          </div>

          <div className="relative flex min-h-[72svh] flex-col pt-4">
            <div className={`${shell} flex items-center justify-between gap-3`}>
              <Link
                href="/municipios"
                aria-label="Todos los municipios"
                className={iconOnPhoto}
              >
                <BackIcon className="size-5" />
              </Link>

              <ShareLink
                url={shareUrl}
                title={`${city.name}, Chocó · ${
                  percentLabel ?? plural(budget.pendingItems, "ítem pendiente", "ítems pendientes")
                }`}
                className={iconOnPhoto}
              >
                <ShareIcon className="size-5" />
                <span className="sr-only">Compartir {city.name}</span>
              </ShareLink>
            </div>

            <header className={`${shell} mt-auto pt-24 lg:pb-2`}>
              <h1 className="font-display text-[32px] leading-none text-paper lg:text-[46px]">
                {city.name}, <span className="text-paper/65">Chocó</span>
              </h1>
              <p className="mt-2.5 text-[14px] text-paper/85">
                {percentLabel && `${percentLabel} · `}
                {plural(budget.pendingItems, "ítem pendiente", "ítems pendientes")}
                {cases.length > 0 && ` · ${plural(cases.length, "caso", "casos")}`}
              </p>
              {budget.goal > 0 && (
                <div className="mt-4 max-w-sm">
                  <CaseProgressBar budget={budget} compact tone="photo" />
                </div>
              )}
              {!city.published && (
                <p className="mt-3">
                  <span className={pillOnPhoto}>Sin publicar</span>
                </p>
              )}
              <CityLead summary={city.summary} onPhoto />
              <p className="mt-4 text-[12px] text-paper/70">
                Actualizado el {formatDate(city.updated_at)}
              </p>
            </header>

            {/* El aire de abajo no es respiración: es el hueco que necesita la
                hoja de contenido para montarse encima sin comerse el carrete.
                Sube 28 px, así que aquí hacen falta más de 28. */}
            {photos.length > 0 && (
              <div className="mt-6 pb-14">
                <PhotoGrid photos={photos} overlay />
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className={`${shell} relative pt-4 lg:pt-8`}>
          <div className="flex items-center justify-between gap-3">
            <Link href="/municipios" aria-label="Todos los municipios" className={iconOnPaper}>
              <BackIcon className="size-5" />
            </Link>

            <ShareLink
              url={shareUrl}
              title={`${city.name}, Chocó · ${
                percentLabel ?? plural(budget.pendingItems, "ítem pendiente", "ítems pendientes")
              }`}
              className={iconOnPaper}
            >
              <ShareIcon className="size-5" />
              <span className="sr-only">Compartir {city.name}</span>
            </ShareLink>
          </div>

          <header className="mt-10">
            <h1 className="font-display text-[32px] leading-none text-ink lg:text-[46px]">
              {city.name}, <span className="text-faint">Chocó</span>
            </h1>
            <p className="mt-2.5 text-[14px] text-muted">
              {percentLabel && `${percentLabel} · `}
              {plural(budget.pendingItems, "ítem pendiente", "ítems pendientes")}
              {cases.length > 0 && ` · ${plural(cases.length, "caso", "casos")}`}
            </p>
            {budget.goal > 0 && (
              <div className="mt-4 max-w-sm">
                <CaseProgressBar budget={budget} compact />
              </div>
            )}
            {!city.published && (
              <p className="mt-3">
                <DraftChip label="Sin publicar" />
              </p>
            )}
            <CityLead summary={city.summary} />
            <p className="mt-4 text-[12px] text-faint">
              Actualizado el {formatDate(city.updated_at)}
            </p>
          </header>

          {photos.length > 0 && (
            <div className="mt-6">
              <PhotoGrid photos={photos} />
            </div>
          )}
        </div>
      )}

      {/* La hoja de contenido sube y se monta sobre la foto con las dos esquinas
          de arriba redondeadas. No es un remate: es la transición entre el
          encabezado fotográfico y el documento, y lo que dice que lo de arriba y
          lo de abajo son dos planos y no una página que cambia de color a la
          mitad. Se monta la hoja encima —y no se curva la foto por abajo— porque
          lo que avanza es el contenido; la foto se queda donde está, entera y
          detrás. La ficha de un caso hace exactamente esto mismo.

          Sin foto de portada no hay nada sobre lo que montarse y la curva
          desaparece: una esquina redondeada contra el papel no sería una
          transición, sería un adorno. */}
      <div className={cover ? "relative -mt-7 rounded-t-[28px] bg-paper pt-7" : ""}>
        {/* En el móvil todo esto es una pila y hay que bajar hasta el final para
            encontrar a la fundación. En escritorio se parte en dos: a la
            izquierda el documento —lo que se lee: fotos, personas, lo que hace
            falta— y a la derecha lo que se hace —donar, situarse, ofrecer—, que
            deja de estar al fondo y pasa a acompañar la lectura entera.

            El orden del HTML no cambia, así que en el móvil sigue siendo la
            misma pila y en el mismo orden. */}
        <div
          className={`${shell} lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12`}
        >
          <div className="lg:col-start-1 lg:row-start-1">
            {/* Aquí había una tira con todas las fotos de todos los casos del
                municipio, sueltas y en su propia sección. Se fue: cada una de
                esas fotos es de una persona concreta, que dio su consentimiento
                para que se contara SU situación, y amontonadas fuera de su ficha
                se leían como un muestrario de daños del pueblo. Ahora van dentro
                de la tarjeta de quien es, en la sección de personas. */}
            <section className="mt-4">
              <h2 className={screenTitle}>Causas</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted lg:text-[15px]">
                Las personas, colegios y demás causas documentadas en {city.name}.
              </p>
              <div className="mt-6">
                {cases.length === 0 ? (
                  <p className={`${card} max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
                    Todavía no hay casos publicados de este municipio. Solo publicamos un caso
                    cuando la persona da su consentimiento.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cases.map((caseRecord) => (
                      <li key={caseRecord.id}>
                        <CaseBigCard caseRecord={caseRecord} citySlug={city.slug} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="mt-12">
              <h2 className={screenTitle}>Donaciones a {city.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted lg:text-[15px]">
                Lo que ha llegado a las causas de este municipio. Si quien donó no autorizó su
                nombre, la fila dice que es anónima.
              </p>
              <div className="mt-4">
                <DonationLog
                  initial={donations}
                  scope="city"
                  cityId={city.id}
                  limit={12}
                />
              </div>
            </section>
          </div>

          <div className="mt-14 lg:col-start-2 lg:row-start-1 lg:mt-0">
            {/* Aquí estaba la tarjeta de la fundación madre y, debajo, el canal
                del municipio. Los dos se fueron con 0015 y esta columna dejó de
                ser una pantalla de dinero.

                No se sustituyen por un canal del pueblo con otro nombre, y ese es
                el fondo del cambio: el dinero va a una causa concreta —una
                persona, un colegio, un animal, una fundación—, y se pide en su
                ficha, con su historia delante. Un botón de donar aquí volvería a
                pedir para «Quibdó», que no es nadie a quien se le pueda entregar
                nada. Lo que queda en esta columna es lo que sí se puede hacer
                mirando un municipio entero: situarlo, ofrecer un recurso y ver lo
                que ya llegó. */}
            <section aria-label={`Cómo ayudar en ${city.name}`}>
              <div className={`${card} p-5`}>
                <p className="text-[12px] text-accent-strong">Cómo ayudar aquí</p>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  El dinero no se envía a un municipio: se envía a una causa concreta. Abre
                  cualquiera de {city.name} y su ficha dice a dónde va lo que le mandes.
                </p>
              </div>
            </section>

            <section className="mt-12">
              <h2 className={screenTitle}>Dónde queda</h2>
              <div className={`${card} mt-4 flex items-center gap-5 p-4`}>
                <ChocoMap
                  pins={[
                    { id: city.id, name: city.name, slug: city.slug, lat: city.lat, lng: city.lng },
                  ]}
                  activeSlug={city.slug}
                  bare
                  className="h-auto w-20 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[14px] leading-relaxed text-muted">
                    {city.name} dentro del departamento del Chocó.
                  </p>
                  <p className="mt-1.5 text-[12px] tabular-nums text-faint">
                    {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                  </p>
                  <Link
                    href="/mapa"
                    className="mt-2 inline-block text-[13px] text-accent-strong hover:text-accent"
                  >
                    Ver el mapa entero
                  </Link>
                </div>
              </div>
            </section>

            <Link
              href="/ofrecer"
              className="mt-12 flex min-h-13 w-full items-center justify-center rounded-full bg-accent px-6 text-[15px] font-medium text-paper transition-[background-color,scale] duration-150 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ofrecer ayuda
            </Link>

            {/* La otra mitad del botón de arriba: lo que se puede dar y lo que ya
                llegó, uno debajo del otro. El enlace se pinta siempre y no solo
                cuando hay entregas, porque saberlo costaría una consulta más y
                el registro filtrado ya dice con claridad que aún no hay ninguna.
                Es la única puerta del municipio hacia sus ayudas: hasta ahora se
                llegaba en el sentido contrario y no había vuelta. */}
            <Link
              href={`/ayudas?municipio=${city.slug}`}
              className="mt-3 flex min-h-11 w-full items-center justify-center text-[14px] text-accent-strong hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ver lo que ya llegó a {city.name}
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
