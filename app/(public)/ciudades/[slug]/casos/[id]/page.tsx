import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseActions } from "@/components/case/CaseActions";
import { CaseKindChip } from "@/components/case/CaseKindChip";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { CaseViewTabs, parseCaseView } from "@/components/case/CaseViewTabs";
import { ChannelCheckNote } from "@/components/donations/ChannelCheckNote";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
import { GeneralChannelNote } from "@/components/donations/GeneralChannelNote";
import { PhotoGallery } from "@/components/case/PhotoGallery";
import { ProgressTimeline } from "@/components/case/ProgressTimeline";
import { NeedsList } from "@/components/NeedsList";
import { ShareLink } from "@/components/ShareLink";
import { SiteFooter } from "@/components/SiteFooter";
import { DraftChip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { BackIcon, ShareIcon } from "@/components/ui/icons";
import {
  button,
  card,
  iconOnPaper,
  iconOnPhoto,
  readable,
  screenTitle,
  shell,
} from "@/components/ui/styles";
import { getCasePage } from "@/lib/data";
import { situationPhotos } from "@/lib/case-photos";
import { caseDonation, channelOriginLabel } from "@/lib/donation-channel";
import { caseLead, formatDate, formatDay } from "@/lib/format";
import { countOpenNeeds } from "@/lib/needs";
import { savedFrame } from "@/lib/photo-frame";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * El ancla de la sección del dinero.
 *
 * Se escribe una vez porque la escriben dos: el `id` de la sección y el `href` del
 * botón «Donar» de la barra fija, que sin JavaScript es un salto de verdad hasta
 * aquí. Escrito a mano en los dos sitios, el día que uno cambie el otro se convierte
 * en un enlace que no lleva a ninguna parte, y el que se rompe es el botón principal
 * de la pantalla para quien no tiene JavaScript, o sea para nadie que lo note.
 */
const MONEY_ANCHOR = "enviar-dinero";

type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ ver?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id);
  if (!data) return { title: "Caso no encontrado" };

  /**
   * Esta descripción es la frase que WhatsApp enseña en la vista previa cuando
   * alguien pega el enlace, y ese es el sitio donde de verdad importa: es el primer
   * contacto de casi todo el mundo con esta familia. Con el recorte a pelo de la
   * historia, ese primer contacto era media oración cortada donde cayera.
   *
   * `caseLead()` pone el resumen escrito a mano si lo hay, y si no sigue recortando,
   * que es lo mismo que hacía antes: `cases.summary` está vacío en casi todas las
   * causas y exigirlo habría dejado a una familia sin publicar por una frase de
   * redacción.
   *
   * Los 155 se quedan como estaban. El resumen no llega nunca a esa medida —la base
   * de datos lo corta en 120— así que el número solo manda cuando lo que hay es la
   * historia, que es exactamente el caso de antes.
   */
  const lead = caseLead(data.caseRecord, 155);

  return {
    title: `${data.caseRecord.display_name} · ${data.city.name}`,
    description: lead || undefined,
  };
}

export default async function CasePage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { ver } = await searchParams;
  const data = await getCasePage(slug, id);
  if (!data) notFound();

  const { city, caseRecord, photos, needs, updates, generalChannel, lastUpdateOn } = data;
  const gallery = situationPhotos(photos, caseRecord.portrait_photo_id, updates);
  const portrait = photos.find((photo) => photo.id === caseRecord.portrait_photo_id);
  const portraitPath = portrait?.storage_path ?? null;
  // La misma cuenta que la tarjeta de esta persona en la ficha del municipio y
  // en /casos, que es de donde llega quien está leyendo esto. La pestaña de
  // abajo dice cuántas filas tiene la lista —cubiertas incluidas—, y esa
  // diferencia la explica la barra de avance, que está entre las dos. Ver
  // lib/needs.ts.
  const openNeeds = countOpenNeeds(needs);
  const view = parseCaseView(ver);
  const caseHref = `/ciudades/${city.slug}/casos/${caseRecord.id}`;
  const offerHref = `/ofrecer?case=${caseRecord.id}`;

  /**
   * El canal que se enseña aquí, Y DE QUIÉN ES.
   *
   * Las dos cosas llegan juntas y no por comodidad: el destino del dinero es el
   * campo más peligroso del portal, y el daño que puede hacer esta pantalla no es
   * quedarse sin canal, es enseñar uno haciendo creer que es el de esta persona.
   * `caseDonation()` devuelve la procedencia con el canal justamente para que no
   * se pueda pintar lo uno sin lo otro.
   *
   * Los tres estados se dicen con palabras y ninguno desaparece de la pantalla:
   * el suyo, el general —rotulado como general, con lo que eso significa— y
   * ninguno, que sigue existiendo mientras el portal no tenga canal general
   * registrado.
   *
   * Y de aquí sale además QUÉ OFRECE LA BARRA FIJA. Con `ninguno` no hay a dónde
   * transferir, así que la barra no dice «Donar»: dice «Ofrecer un recurso», que es
   * lo que esta página sí puede cumplir. Lo decide `CaseActions` con este mismo
   * valor, no un `if` de aquí.
   */
  const donation = caseDonation(caseRecord, generalChannel);

  /**
   * El canal a secas, para lo que se pinta igual venga de donde venga.
   *
   * La tarjeta y la antigüedad de la comprobación se escriben UNA VEZ para el canal
   * propio y para el general: son la misma pieza y lo que cambia es la frase de
   * arriba, que es la que dice de quién es. Escritas dos veces —una por rama, como
   * estaban— la nota de comprobación habría entrado solo en la rama que alguien
   * estaba mirando ese día.
   */
  const channel = donation.channel;

  const shareUrl = await absoluteUrl(`/ciudades/${city.slug}/casos/${caseRecord.id}`);
  const shareTitle = `${caseRecord.display_name} · ${city.name}, Chocó`;

  return (
    <div>
      {/* Galería a sangre. Cuando el caso no tiene fotos —pasa, y hay familias
          que no quieren— el hueco no finge una: es una superficie hundida con la
          marca, del alto justo para que los mandos tengan dónde apoyarse. */}
      <div className="relative h-[52svh] min-h-[360px]">
        {gallery.length > 0 ? (
          <PhotoGallery photos={gallery} className="size-full" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 bg-land">
            <Logo className="h-7 w-auto text-contour" />
            <p className="px-10 text-center text-[13px] leading-snug text-muted">
              Este caso todavía no tiene fotografías publicadas.
            </p>
          </div>
        )}

        <div className={`${shell} absolute inset-x-0 top-0 flex items-center justify-between pt-4`}>
          <Link
            href={`/ciudades/${city.slug}`}
            aria-label={`Volver a ${city.name}`}
            className={gallery.length > 0 ? iconOnPhoto : iconOnPaper}
          >
            <BackIcon className="size-5" />
          </Link>

          <ShareLink
            url={shareUrl}
            title={shareTitle}
            className={gallery.length > 0 ? iconOnPhoto : iconOnPaper}
          >
            <ShareIcon className="size-5" />
            <span className="sr-only">Compartir este caso</span>
          </ShareLink>
        </div>
      </div>

      {/* El contenido sube sobre la foto con la esquina redonda. En la referencia
          esta mitad es oscura porque la imagen sigue por detrás; aquí el tema es
          claro y sobre una foto de móvil mal iluminada el texto largo en blanco
          se vuelve ilegible, así que a partir de aquí manda el papel. */}
      <div className="relative -mt-7 rounded-t-[28px] bg-paper pt-7">
        {/* Dos columnas en escritorio: a la izquierda la historia —que es a lo
            que se viene— y a la derecha lo que se puede hacer con ella. En el
            móvil eso iba en fila y la barra de acciones tenía que ir anclada
            abajo porque, si no, quien llega desde un WhatsApp no la ve nunca.
            Aquí caben las dos cosas a la vez y no hace falta anclar nada.

            El orden del HTML es el mismo que tenía, así que en el móvil la
            pantalla no se mueve ni un píxel. */}
        <div
          className={`${shell} lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-12`}
        >
          <div className="lg:col-start-1 lg:row-start-1">
            {/* El retrato se planta a caballo entre la galería y el papel: es
                la cara de quien vive esto, no una foto más del lote. Sin ella
                la ficha era un reportaje de la casa; con ella es una persona.

                Esta fila sigue teniendo los dos hijos que tenía —el retrato y el
                nombre— y eso hay que conservarlo aunque parezca de maquetación: va
                `items-end`, así que la altura del bloque de texto es lo que decide
                cuánto sube el retrato por encima del papel. Metiendo aquí el
                municipio o la pastilla del tipo, el bloque crece y el retrato deja
                de estar a caballo: se hunde en el papel y el efecto desaparece sin
                que nada se rompa. Por eso todo lo demás va debajo. */}
            <div className={`flex items-end gap-4 ${readable}`}>
              <CasePortrait
                name={caseRecord.display_name}
                caseKind={caseRecord.case_kind}
                path={portraitPath}
                frame={portrait ? savedFrame(portrait) : null}
                eager
                className="-mt-[4.25rem] size-[5.75rem] rounded-full text-[28px] ring-[3px] ring-paper lg:size-28 lg:text-[34px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="min-w-0 font-display text-[22px] leading-tight text-ink lg:text-[32px]">
                    {caseRecord.display_name}
                  </h1>
                  {openNeeds > 0 && (
                    <p className="shrink-0 whitespace-nowrap pt-1">
                      <span className="font-display text-[22px] tabular-nums text-need-mid-strong">
                        {openNeeds}
                      </span>
                      <span className="text-[13px] text-faint"> abiertas</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------- El titular -------------------------

                La barra de avance estaba después del nombre Y del municipio, o sea
                a un renglón de distancia de donde está ahora. Ese renglón importa
                porque lo que la barra contesta —cómo va esto— es la segunda
                pregunta de quien abre la ficha, justo detrás de quién es, y lo que
                estaba en medio era una etiqueta de sitio.

                Debajo de la barra van qué mide y de quién es el canal, y después el
                municipio, que baja un puesto. Perder la línea de «Quibdó · 4
                personas» pegada al nombre cuesta algo, y se paga a gusto: el
                municipio sigue estando antes de la historia, y a cambio lo que se
                lee con el pulgar todavía lejos del botón «Donar» es de qué habla
                esta barra y a dónde va el dinero. Esas dos, leídas después de
                donar, no sirven de nada. */}
            {needs.length > 0 && (
              <div className={`mt-4 ${readable}`}>
                <CaseProgressBar needs={needs} />
                {/* La frase que impide leer la barra como dinero, y va aquí y no
                    dentro de `CaseProgressBar` porque solo hace falta aquí: la
                    misma barra se pinta en la tarjeta de un municipio y en el
                    panel, y en ninguna de las dos hay un botón de donar a la
                    vista con el que se pueda confundir. Escrita en el componente
                    sería una advertencia repetida en sitios donde nadie tenía la
                    duda, y una advertencia que sale siempre deja de leerse. */}
                <p className="mt-2 text-[12px] leading-relaxed text-faint">
                  Mide necesidades cubiertas, no dinero recaudado: el portal no recauda nada y
                  nada de lo que se dona pasa por aquí.
                </p>
              </div>
            )}

            {/* De quién es el canal, ARRIBA y no solo en la sección del dinero.
                Quien pulsa «Donar» en la barra fija llega al pop-up sin haber
                bajado por la página, y ese es justo el recorrido de quien abre esto
                desde un WhatsApp: si «recibe por el canal general» solo estuviera
                escrito ahí abajo, no lo habría leído nadie de los que donan
                deprisa. La frase la escribe `channelOriginLabel()` una sola vez.

                Y es un enlace al ancla, no un rótulo: dice poco a propósito —una
                línea— y lo que falta está a un toque. Va con altura de mando aunque
                sea texto pequeño, porque se pulsa con el pulgar.

                El subrayado es permanente y no de `hover:`, que es lo que hacen los
                demás enlaces de texto del portal. Aquí no valía: los otros van
                metidos en una frase y en otro color que el texto de alrededor —el
                nombre del municipio en `body` sobre `muted`—, así que se ven aunque
                nadie pase el ratón por encima. Este es una línea sola, del color de
                la letra pequeña que tiene arriba, y sin subrayado no hay NADA que
                diga que se puede pulsar; en un móvil, además, el `hover:` no existe.
                Va en el gris del filete, que es lo bastante flojo para no pesar más
                que la barra que tiene encima. */}
            <p className="mt-3">
              <a
                href={`#${MONEY_ANCHOR}`}
                className="inline-flex min-h-8 items-center text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink"
              >
                {channelOriginLabel(donation)}
              </a>
            </p>

            {/* Qué es esta causa y de dónde. La pastilla del tipo se calla cuando
                es una persona, y esa decisión vive dentro de `CaseKindChip`. */}
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px] leading-snug text-muted">
              <CaseKindChip caseKind={caseRecord.case_kind} />
              <span className="min-w-0">
                <Link
                  href={`/ciudades/${city.slug}`}
                  className="text-body underline-offset-2 hover:underline"
                >
                  {city.name}
                </Link>
                {caseRecord.household && ` · ${caseRecord.household}`}
              </span>
            </p>

            {!caseRecord.published && (
              <p className="mt-3">
                <DraftChip label="Sin publicar" />
              </p>
            )}

            {caseRecord.story && (
              <div
                className={`mt-5 space-y-4 text-[15px] leading-relaxed text-body lg:text-[17px] ${readable}`}
              >
                {caseRecord.story.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {/* «Actualizado el …» iba con `cases.updated_at`, y esa columna dice
                otra cosa: se mueve cuando alguien corrige una tilde de la historia,
                así que la ficha afirmaba que había noticias de esta familia el día
                en que se arregló una errata. Ahora es la fecha del último avance
                del diario (`lastUpdateOn`), que es cuándo pasó algo de verdad.

                Y sin diario NO SE RELLENA EL HUECO con `updated_at`. Una causa
                recién documentada no tiene avances —es lo normal, no un caso raro—
                y lo honesto ahí no es una fecha peor: es otra frase. «Documentado
                el …» con `created_at` dice exactamente lo que sabemos, que es que
                el equipo estuvo allí ese día y todavía no hay nada nuevo que
                contar. Ver `lastUpdateOn` en lib/case-updates.ts. */}
            <p className="mt-4 text-[12px] text-faint">
              {lastUpdateOn
                ? `Actualizado el ${formatDay(lastUpdateOn)}`
                : `Documentado el ${formatDate(caseRecord.created_at)}`}
            </p>

            {/* Necesidades y diario en pestañas: si el seguimiento crece, lo que
                falta no puede quedar bajo cinco fotos. La vista por omisión es
                lo que se puede cubrir hoy. */}
            <div className="mt-8">
              <CaseViewTabs
                href={caseHref}
                active={view}
                needsCount={needs.length}
                updateCount={updates.length}
              />
            </div>

            {view === "necesidades" ? (
              <section className="mt-6" aria-label="Qué necesita">
                <p className="text-[13px] leading-relaxed text-muted lg:text-[15px]">
                  Lo concreto, tal y como lo pidió la familia. Cubrir una mueve la barra de
                  arriba.
                </p>
                <div className="mt-4">
                  <NeedsList
                    needs={needs}
                    emptyLabel="Todavía no hemos registrado necesidades concretas de este caso."
                  />
                </div>
              </section>
            ) : (
              <section className="mt-6" aria-label="Seguimiento">
                <p className="text-[13px] leading-relaxed text-muted lg:text-[15px]">
                  De lo primero a lo último.
                </p>
                <div className={`mt-5 ${readable}`}>
                  {updates.length > 0 ? (
                    <ProgressTimeline updates={updates} />
                  ) : (
                    <p className={`${card} p-5 text-[14px] leading-relaxed text-muted`}>
                      Todavía no hay pasos publicados en el seguimiento de este caso.
                    </p>
                  )}
                </div>
              </section>
            )}

          </div>

          {/* ------------------------ La columna de hacer ---------------------

              Se queda pegada a la ventana a partir de `lg`. La historia de una
              familia son diez o quince pantallas de escritorio, y la barra fija
              —que es lo que resuelve esto en el móvil— desaparece justo aquí:
              leyendo el diario, «Donar» y el canal quedaban tres pantallas más
              arriba y no había forma de volver sin perder el sitio.

              Dos cosas la hacen funcionar y las dos son fáciles de perder:

                * `lg:items-start` en la rejilla de arriba. Sin él, la celda estira
                  el bloque hasta el alto de la fila —o sea el de la historia— y un
                  `sticky` no tiene por dónde moverse: se queda quieto y parece que
                  no está puesto.
                * El alto máximo y el desbordamiento. Una columna más alta que la
                  ventana, pegada por arriba, no se puede acabar de leer nunca:
                  queda por debajo del filo y el scroll de la página ya no la mueve.
                  Con el tope y `overflow-y-auto`, cuando no cabe se recorre por su
                  cuenta, y cuando cabe —que es lo normal— no aparece ninguna barra
                  de desplazamiento. Las medidas descuentan la cabecera fija de
                  escritorio (--head-h) y dejan el mismo aire arriba y abajo. */}
          <div className="mt-10 lg:sticky lg:top-[calc(var(--head-h)+1.5rem)] lg:col-start-2 lg:row-start-1 lg:mt-0 lg:max-h-[calc(100svh-var(--head-h)-3rem)] lg:overflow-y-auto">
            <CaseActions
              caseName={caseRecord.display_name}
              donation={donation}
              donateHref={`#${MONEY_ANCHOR}`}
              offerHref={offerHref}
              shareUrl={shareUrl}
              shareTitle={shareTitle}
            />

            {/* ----------------------------- Dinero ---------------------------

                La sección se pinta siempre, y lo que cambia es qué dice de quién
                es el canal. Ese rótulo no es un adorno: es lo único que separa
                «esto es para ella» de «esto entra en el fondo del portal y se
                reparte», y las dos frases mandan a la misma llave desde la misma
                pantalla. Ver components/donations/GeneralChannelNote.tsx.

                Es también el destino del «Donar» de la barra: con JavaScript ese
                botón abre el pop-up, y sin JavaScript salta aquí, donde el canal
                está escrito entero. `scroll-mt-6` no está para esquivar la barra
                fija —la barra va abajo y el salto deja la sección arriba, así que
                nunca la tapa; el hueco que reserva para ella lo pone el `pb` del
                layout— sino para que el titular no quede pegado al filo de la
                pantalla, que se lee como si la página estuviera cortada. En `lg`
                no hace falta ninguna compensación: aquí la columna es `sticky` y ya
                arranca por debajo de la cabecera. */}
            <section id={MONEY_ANCHOR} className="scroll-mt-6 lg:mt-8">
              <h2 className={screenTitle}>Enviar dinero</h2>

              {donation.source === "propio" && (
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  {donation.channel.kind === "telefono"
                    ? `El número de contacto para ${caseRecord.display_name}. Nada de lo que dones pasa por este portal.`
                    : `El canal que el equipo registró para ${caseRecord.display_name}. Nada de lo que dones pasa por este portal.`}
                </p>
              )}

              {donation.source === "general" && (
                <GeneralChannelNote caseName={caseRecord.display_name} className="mt-2" />
              )}

              {channel && (
                <>
                  {/* La versión normal y no la grande, que es lo que dice el
                      propio componente: en una columna de 24 rem, una llave a 34
                      px se parte a mitad de palabra y un destino de dinero
                      cortado en dos renglones es justo lo que no se puede leer
                      con prisa. La grande se queda para /donaciones y para el
                      pop-up, donde el canal ocupa el ancho. */}
                  <div className="mt-5">
                    <DonationChannelCard channel={channel} />
                  </div>
                  {/* Desde cuándo nadie ha comprobado esto, pegado al canal y no
                      en otra parte de la página: es la mitad de lo que hace útil
                      a la otra. La misma frase va dentro del pop-up, y la escribe
                      un solo componente. */}
                  <ChannelCheckNote channel={channel} className="mt-3" />
                </>
              )}

              {donation.source === "ninguno" && (
                <>
                  {/* «para {nombre}» y no «{nombre} no tiene»: los nombres de los
                      casos son frases enteras —«Yeison Córdoba y su hermana»— y
                      con el verbo detrás la concordancia se rompe en la mitad. */}
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">
                    Ahora mismo no hay a dónde transferir para {caseRecord.display_name}: no tiene
                    canal propio y el portal tampoco tiene canal general registrado. No enseñamos
                    el canal de otro. Lo que sí se puede hacer hoy es ofrecer un recurso concreto.
                  </p>
                  <Link href={offerHref} className={`${button.secondary} mt-5 w-full`}>
                    Ofrecer un recurso en su lugar
                  </Link>
                </>
              )}
            </section>

            {/* --------------------------- Ofrecer ----------------------------

                Esto estaba en la barra fija y ha bajado aquí, porque el dinero le
                quitó el sitio. No desaparece y no se queda solo dentro de la lista
                de necesidades: allí cada enlace ofrece PARA UNA COSA CONCRETA —unas
                tejas, un viaje— y quien llega con un camión que sube vacío no sabe
                a qué fila de la lista apuntarlo. Esta puerta es la de «puedo algo,
                dime qué falta».

                Solo cuando hay canal. Sin él, la barra fija sigue siendo esta misma
                acción y la sección de arriba ya la ofrece con su propia frase:
                repetirla aquí serían tres botones idénticos en media pantalla. */}
            {donation.source !== "ninguno" && (
              <section className="mt-8">
                <h2 className={screenTitle}>Ofrecer un recurso</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  Si lo que puedes dar no es dinero —un viaje, unas tejas, un día de trabajo—,
                  cuéntalo y el equipo lo cruza con lo que falta en esta ficha.
                </p>
                <Link href={offerHref} className={`${button.secondary} mt-5 w-full`}>
                  Ofrecer un recurso
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
