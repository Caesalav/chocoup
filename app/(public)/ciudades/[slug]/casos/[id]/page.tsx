import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseActions } from "@/components/case/CaseActions";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { CaseViewTabs, parseCaseView } from "@/components/case/CaseViewTabs";
import { PersonBadge } from "@/components/case/PersonBadge";
import { TransferKey } from "@/components/donations/TransferKey";
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
import { getCasePage, getDonationKey } from "@/lib/data";
import { situationPhotos } from "@/lib/case-photos";
import { excerpt, externalUrl, formatDate, whatsappLink } from "@/lib/format";
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
  const [data, donationKey] = await Promise.all([getCasePage(slug, id), getDonationKey()]);
  if (!data) notFound();

  const { city, caseRecord, photos, needs, updates, foundation } = data;
  const gallery = situationPhotos(photos, caseRecord.portrait_photo_id, updates);
  const portrait = photos.find((photo) => photo.id === caseRecord.portrait_photo_id);
  const portraitPath = portrait?.storage_path ?? null;
  const openNeeds = needs.filter((need) => need.status !== "cubierta").length;
  const view = parseCaseView(ver);
  const caseHref = `/ciudades/${city.slug}/casos/${caseRecord.id}`;

  const ownDonate = externalUrl(caseRecord.donation_url);
  const foundationDonate = foundation ? externalUrl(foundation.donation_url) : "";
  const donate = ownDonate || foundationDonate;
  const moneyWhatsapp = foundation
    ? whatsappLink(
        foundation.whatsapp,
        `Hola, quiero enviar un aporte económico para ${caseRecord.display_name} en ${city.name}.`,
      )
    : "";

  /**
   * Qué se dice arriba de los botones, y hay que decir la verdad de los tres
   * casos. La última rama era hasta ahora inalcanzable —sin fundación no había
   * WhatsApp, y sin destino propio no había botón, así que la sección no se
   * pintaba— y con la llave sí se alcanza: es exactamente la situación del caso
   * real. No promete que el aporte vaya marcado a esta familia, porque una
   * transferencia a la llave del portal no lleva ninguna marca y decir lo
   * contrario sería lo único de esta pantalla que no podríamos sostener.
   */
  const moneyIntro = ownDonate
    ? `Canal indicado por el equipo para ${caseRecord.display_name}. Nada de lo que dones pasa por este portal.`
    : foundation
      ? `Se entrega a través de ${foundation.name}, que lo hace llegar a ${caseRecord.display_name}. Al escribir por WhatsApp ya va dicho que es para esta familia.`
      : `Todavía no hay un canal propio de ${caseRecord.display_name} ni fundación registrada en ${city.name}. Lo que hay es la llave del portal, común a todo el Chocó: la transferencia no va marcada a una familia.`;

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

                La sección entera desaparecía cuando no había ni destino propio ni
                fundación, y eso es justo lo que le pasaba al único caso real
                publicado: se leía su situación y no había a dónde mandar un peso.
                Ahora basta con que exista la llave del portal, que no depende de
                que nadie haya registrado una fundación en su municipio. */}
            {(donate || moneyWhatsapp || donationKey) && (
              <section className="lg:mt-8">
                <h2 className={screenTitle}>Enviar dinero</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{moneyIntro}</p>

                {(donate || moneyWhatsapp) && (
                  <div className="mt-5 flex flex-col gap-2.5">
                    {donate && (
                      <a
                        href={donate}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`${button.primary} w-full`}
                      >
                        Donar dinero
                      </a>
                    )}
                    {moneyWhatsapp && (
                      <a
                        href={moneyWhatsapp}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={`${donate ? button.secondary : button.primary} w-full`}
                      >
                        Coordinar por WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {donationKey && (
                  <div className="mt-5">
                    <TransferKey donationKey={donationKey} featured={!donate && !moneyWhatsapp} />
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
