import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseActions, DONATIONS_ANCHOR } from "@/components/case/CaseActions";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CaseMoneyTrack } from "@/components/case/CaseMoneyTrack";
import { BudgetItemList } from "@/components/case/BudgetItemList";
import { DonationLog } from "@/components/donations/DonationLog";
import { MercadoPagoCheckout } from "@/components/donations/MercadoPagoCheckout";
import { PhotoGallery } from "@/components/case/PhotoGallery";
import { ProgressTimeline } from "@/components/case/ProgressTimeline";
import { ShareLink } from "@/components/ShareLink";
import { SiteFooter } from "@/components/SiteFooter";
import { DraftChip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { BackIcon, ShareIcon } from "@/components/ui/icons";
import { iconOnPaper, iconOnPhoto, readable, screenTitle, shell } from "@/components/ui/styles";
import { SITE_NAME } from "@/lib/constants";
import { getCasePage, getDonationLog } from "@/lib/data";
import { firstPendingItem } from "@/lib/budget";
import { situationPhotos } from "@/lib/case-photos";
import { caseLead, formatDate, formatDay } from "@/lib/format";
import { moneyProgress } from "@/lib/money-progress";
import { savedFrame } from "@/lib/photo-frame";
import { donorLine, latestDonor } from "@/lib/sample-donations";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * El ancla de la sección del dinero.
 *
 * Se escribe una vez porque la escriben dos: el `id` de la sección y el `href`
 * del «Donar» de la barra fija, que sin JavaScript es un salto de verdad hasta
 * aquí. Escrito a mano en los dos sitios, el día que uno cambie el otro se
 * convierte en un enlace que no lleva a ninguna parte, y el que se rompe es el
 * botón principal de la pantalla para quien no tiene JavaScript.
 */
const MONEY_ANCHOR = "enviar-dinero";

type Props = {
  params: Promise<{ slug: string; id: string }>;
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

export default async function CasePage({ params }: Props) {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id);
  if (!data) notFound();

  const { city, caseRecord, photos, budgetItems, budget, updates, lastUpdateOn } = data;
  const donations = await getDonationLog({ caseId: caseRecord.id, limit: 12 });
  const gallery = situationPhotos(photos, caseRecord.portrait_photo_id, updates);
  const portrait = photos.find((photo) => photo.id === caseRecord.portrait_photo_id);
  const portraitPath = portrait?.storage_path ?? null;
  const caseHref = `/ciudades/${city.slug}/casos/${caseRecord.id}`;
  const progress = moneyProgress(budget);

  /**
   * El último renglón del avance solo si hay donaciones confirmadas. La lista
   * de abajo enseña las mismas filas: no se inventan nombres para llenar.
   */
  const lastGive = latestDonor(donations);
  const donorHref = `#${DONATIONS_ANCHOR}`;
  const shareUrl = await absoluteUrl(`/ciudades/${city.slug}/casos/${caseRecord.id}`);
  const shareTitle = `${caseRecord.display_name} · ${city.name}, Chocó`;
  const purchased = budgetItems.filter((item) => item.purchased).length;

  return (
    <div className="max-lg:pb-10">
      <div className="relative h-[52svh] min-h-[360px]">
        {gallery.length > 0 ? (
          <PhotoGallery photos={gallery} showCaption={false} className="size-full" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 bg-land">
            <Logo className="text-[22px] text-contour" />
            <p className="px-10 text-center text-[13px] leading-snug text-muted">
              Este caso todavía no tiene fotografías publicadas.
            </p>
          </div>
        )}

        {/* La fila no recibe el dedo y los dos mandos sí. Su caja cruza la foto de
            lado a lado y mide 60 px de alto: entera se comía todo lo que pasara
            por esa franja —el arrastre del carrete y, desde que las barras del
            indicador se pueden pulsar, las barras mismas, que caen justo ahí—. Es
            lo que ya hacía el titular de abajo, que nació con la clase puesta. */}
        <div
          className={`${shell} pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between pt-4`}
        >
          <Link
            href={`/ciudades/${city.slug}`}
            aria-label={`Volver a ${city.name}`}
            className={`pointer-events-auto ${gallery.length > 0 ? iconOnPhoto : iconOnPaper}`}
          >
            <BackIcon className="size-5" />
          </Link>

          <ShareLink
            url={shareUrl}
            title={shareTitle}
            className={`pointer-events-auto ${gallery.length > 0 ? iconOnPhoto : iconOnPaper}`}
          >
            <ShareIcon className="size-5" />
            <span className="sr-only">Compartir este caso</span>
          </ShareLink>
        </div>

        <div className={`${shell} pointer-events-none absolute inset-x-0 bottom-[5.75rem]`}>
          <h1
            className={`font-display text-[26px] leading-[1.15] lg:text-[34px] ${readable} ${
              gallery.length > 0 ? "text-paper" : "text-ink"
            }`}
          >
            {caseRecord.display_name}
          </h1>
        </div>
      </div>

      <div className="relative -mt-7 rounded-t-[28px] bg-paper pt-[4.25rem]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <CasePortrait
            name={caseRecord.display_name}
            caseKind={caseRecord.case_kind}
            path={portraitPath}
            frame={portrait ? savedFrame(portrait) : null}
            eager
            className="size-24 rounded-full text-[28px] ring-[4px] ring-paper lg:size-28 lg:text-[34px]"
          />
        </div>

        <div className={shell}>
          {!caseRecord.published && (
            <p className="mb-3 text-center">
              <DraftChip label="Sin publicar" />
            </p>
          )}

          <CaseActions
            caseName={caseRecord.display_name}
            caseId={caseRecord.id}
            progress={progress}
            donateHref={`#${MONEY_ANCHOR}`}
            budgetHref={`${caseHref}#presupuesto`}
            shareUrl={shareUrl}
            shareTitle={shareTitle}
            donorLabel={lastGive ? donorLine(lastGive) : null}
            donorHref={donorHref}
          >
            {budget.goal > 0 ? (
              <CaseMoneyTrack progress={progress} nextUp={firstPendingItem(budgetItems)} />
            ) : (
              <p className="text-[14px] leading-relaxed text-muted">
                Todavía no hay un presupuesto anotado para esta causa: el equipo ya la documentó y
                está cerrando precios.
              </p>
            )}

            {lastGive && (
              <p className="mt-3">
                <a
                  href={donorHref}
                  className="inline-flex min-h-8 max-w-full items-center text-[13px] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  <span className="truncate">{donorLine(lastGive)}</span>
                  <span aria-hidden> ›</span>
                </a>
              </p>
            )}
          </CaseActions>

          {budgetItems.length > 0 && (
            <details
              id="presupuesto"
              className="mt-6 rounded-2xl border border-line bg-panel-high open:pb-1"
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span>En qué se ha invertido</span>
                <span className="text-[13px] font-normal tabular-nums text-faint">
                  {purchased}/{budgetItems.length}
                </span>
              </summary>
              <div className="border-t border-line px-2 py-2">
                <BudgetItemList items={budgetItems} framed={false} />
              </div>
            </details>
          )}

          {caseRecord.story && (
            <div
              className={`mt-8 space-y-4 text-[15px] leading-relaxed text-body lg:text-[17px] ${readable}`}
            >
              {caseRecord.story.split(/\n\s*\n/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          <p className="mt-4 text-[12px] text-faint">
            {lastUpdateOn
              ? `Actualizado el ${formatDay(lastUpdateOn)}`
              : `Documentado el ${formatDate(caseRecord.created_at)}`}
          </p>

          {updates.length > 0 && (
            <details className="mt-8 rounded-2xl border border-line bg-panel-high">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span>Seguimiento</span>
                <span className="text-[13px] font-normal tabular-nums text-faint">
                  {updates.length}
                </span>
              </summary>
              <div className={`border-t border-line px-4 py-4 ${readable}`}>
                <ProgressTimeline updates={updates} />
              </div>
            </details>
          )}

          {/* --------------------------- Enviar dinero -----------------------

              El «Donar» de la barra, sin JavaScript, es un ancla hasta aquí. El
              cobro es Mercado Pago, a la cuenta del portal: no hay teléfono ni
              llave de cada causa. La preferencia lleva `caso:{id}` para que el
              registro sepa a quién se donó y el equipo pueda repartir. */}
          <section id={MONEY_ANCHOR} className="mt-10 scroll-mt-6">
            <h2 className={screenTitle}>Enviar dinero</h2>

            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              El dinero entra por Mercado Pago, a la cuenta de {SITE_NAME}. Queda registrado para
              esta causa, y el equipo lo reparte después.
            </p>

            <div className="mt-5 rounded-3xl border border-line bg-panel-high shadow-card p-5">
              <MercadoPagoCheckout
                heading={`Donar a ${caseRecord.display_name}`}
                caseId={caseRecord.id}
                showHeading={false}
              />
            </div>
          </section>

          <section id={DONATIONS_ANCHOR} className="mt-10 scroll-mt-6">
            <h2 className={screenTitle}>Donaciones recibidas</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Quién donó a {caseRecord.display_name} y cuánto.
            </p>
            <div className="mt-4">
              <DonationLog
                initial={donations}
                scope="case"
                caseId={caseRecord.id}
                limit={12}
                poll
              />
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
