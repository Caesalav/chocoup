import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseActions } from "@/components/case/CaseActions";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { CaseViewTabs, parseCaseView } from "@/components/case/CaseViewTabs";
import { PersonBadge } from "@/components/case/PersonBadge";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
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
import { donationChannel } from "@/lib/donation-channel";
import { excerpt, formatDate, whatsappLink } from "@/lib/format";
import { savedFrame } from "@/lib/photo-frame";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ ver?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id);
  if (!data) return { title: "Caso no encontrado" };
  return {
    title: `${data.caseRecord.display_name} · ${data.city.name}`,
    description: data.caseRecord.story ? excerpt(data.caseRecord.story, 155) : undefined,
  };
}

export default async function CasePage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { ver } = await searchParams;
  const data = await getCasePage(slug, id);
  if (!data) notFound();

  const { city, caseRecord, photos, needs, updates, foundation } = data;
  const gallery = situationPhotos(photos, caseRecord.portrait_photo_id, updates);
  const portrait = photos.find((photo) => photo.id === caseRecord.portrait_photo_id);
  const portraitPath = portrait?.storage_path ?? null;
  const openNeeds = needs.filter((need) => need.status !== "cubierta").length;
  const view = parseCaseView(ver);
  const caseHref = `/ciudades/${city.slug}/casos/${caseRecord.id}`;

  /**
   * El canal de esta familia, y solo el suyo.
   *
   * Aquí caía antes el enlace de la fundación del municipio cuando el caso no
   * traía el suyo, y después la llave del portal cuando no había ni fundación.
   * Las dos herencias se han ido. El dinero que alguien manda leyendo esta
   * pantalla lo manda para esta persona: hacerlo caer en un destino que nadie
   * eligió para ella —y sin decirlo— es el daño más grande que puede hacer esta
   * ficha, y no se nota mirándola.
   *
   * Sin canal propio no hay canal, y la sección lo dice con palabras en vez de
   * desaparecer. Que no se pinte nada dejaría a quien llega desde un WhatsApp
   * pensando que no ha buscado bien.
   */
  const channel = donationChannel(caseRecord);

  /**
   * Escribirle a la fundación del municipio no es un canal: es una conversación.
   * Nadie transfiere nada al abrir un WhatsApp, así que ofrecerlo no manda dinero
   * a ningún sitio en silencio —que es lo que se acaba de quitar—, y con una
   * persona al otro lado es lo único que hoy puede resolver el caso de una
   * familia sin canal. Va rotulado como lo que es y nunca dentro del bloque del
   * canal.
   */
  const moneyWhatsapp = foundation
    ? whatsappLink(
        foundation.whatsapp,
        `Hola, quiero enviar un aporte económico para ${caseRecord.display_name} en ${city.name}.`,
      )
    : "";

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
                la ficha era un reportaje de la casa; con ella es una persona. */}
            <div className={`flex items-end gap-4 ${readable}`}>
              <CasePortrait
                name={caseRecord.display_name}
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

            <p className="mt-2 text-[14px] leading-snug text-muted">
              <Link
                href={`/ciudades/${city.slug}`}
                className="text-body underline-offset-2 hover:underline"
              >
                {city.name}
              </Link>
              {caseRecord.household && ` · ${caseRecord.household}`}
            </p>

            {needs.length > 0 && (
              <div className={`mt-5 ${readable}`}>
                <CaseProgressBar needs={needs} />
              </div>
            )}

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

            <p className="mt-4 text-[12px] text-faint">
              Actualizado el {formatDate(caseRecord.updated_at)}
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

            {/* Donde la referencia pone al dueño del edificio y al anfitrión.
                «Quién lo documentó» no existe en la base de datos y no se
                inventa: lo que sí sabemos es qué fundación responde por el caso
                y quién es la persona de contacto allí. */}
            {foundation && (
              <div className={`${card} mt-7 flex max-w-[68ch] flex-wrap gap-x-6 gap-y-4 p-4`}>
                <PersonBadge name={foundation.name} role="Fundación madre" />
                {foundation.contact_name && (
                  <PersonBadge
                    name={foundation.contact_name}
                    role={`Contacto en ${city.name}`}
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-10 lg:col-start-2 lg:row-start-1 lg:mt-0">
            <CaseActions
              offerHref={`/ofrecer?case=${caseRecord.id}`}
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              whatsapp={moneyWhatsapp}
              whatsappLabel={
                foundation
                  ? `Escribir a ${foundation.name} por WhatsApp`
                  : "Escribir por WhatsApp"
              }
            />

            {/* ----------------------------- Dinero ---------------------------

                La sección se pinta siempre, tenga canal o no. Sin canal decía
                antes el silencio: la sección entera desaparecía y la ficha se leía
                como si el dinero no fuera parte de esto. Decirlo con palabras es
                más honesto y además es accionable —quien lea que todavía no hay a
                dónde enviarle puede ofrecer un recurso, que sí funciona hoy—. */}
            <section className="lg:mt-8">
              <h2 className={screenTitle}>Enviar dinero</h2>

              {channel ? (
                <>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">
                    {channel.kind === "telefono"
                      ? `El número de contacto para ${caseRecord.display_name}. Nada de lo que dones pasa por este portal.`
                      : `El canal que el equipo registró para ${caseRecord.display_name}. Nada de lo que dones pasa por este portal.`}
                  </p>
                  <div className="mt-5">
                    <DonationChannelCard channel={channel} featured={!moneyWhatsapp} />
                  </div>
                </>
              ) : (
                /* «para {nombre}» y no «{nombre} no tiene»: los nombres de los
                   casos son frases enteras —«Yeison Córdoba y su hermana»— y con
                   el verbo detrás la concordancia se rompe en la mitad. */
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  Todavía no hay un canal de donación propio para {caseRecord.display_name}, así
                  que aquí no hay a dónde transferir.{" "}
                  {foundation
                    ? `Se puede coordinar un aporte con ${foundation.name}, que trabaja en ${city.name}.`
                    : `Tampoco hay una fundación registrada en ${city.name} con la que coordinarlo.`}{" "}
                  No enseñamos el canal de otro: el dinero acabaría en un sitio que nadie eligió
                  para esta familia.
                </p>
              )}

              {moneyWhatsapp && (
                <a
                  href={moneyWhatsapp}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${channel ? button.secondary : button.primary} mt-5 w-full`}
                >
                  Coordinar por WhatsApp con {foundation!.name}
                </a>
              )}

              {!channel && !moneyWhatsapp && (
                <Link href={`/ofrecer?case=${caseRecord.id}`} className={`${button.secondary} mt-5 w-full`}>
                  Ofrecer un recurso en su lugar
                </Link>
              )}
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
