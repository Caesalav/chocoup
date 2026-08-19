import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CaseActions, DONATIONS_ANCHOR } from "@/components/case/CaseActions";
import { CasePortrait } from "@/components/case/CasePortrait";
import { CaseMoneyTrack } from "@/components/case/CaseMoneyTrack";
import { BudgetItemList } from "@/components/case/BudgetItemList";
import { ChannelCheckNote } from "@/components/donations/ChannelCheckNote";
import { DonationChannelCard } from "@/components/donations/DonationChannelCard";
import { DonationLog } from "@/components/donations/DonationLog";
import { GeneralChannelNote } from "@/components/donations/GeneralChannelNote";
import { PhotoGallery } from "@/components/case/PhotoGallery";
import { ProgressTimeline } from "@/components/case/ProgressTimeline";
import { ShareLink } from "@/components/ShareLink";
import { SiteFooter } from "@/components/SiteFooter";
import { DraftChip } from "@/components/ui/Chip";
import { Logo } from "@/components/Logo";
import { BackIcon, ShareIcon } from "@/components/ui/icons";
import { button, iconOnPaper, iconOnPhoto, readable, screenTitle, shell } from "@/components/ui/styles";
import { getCasePage, getDonationLog } from "@/lib/data";
import { firstPendingItem } from "@/lib/budget";
import { situationPhotos } from "@/lib/case-photos";
import { caseDonation, channelOriginLabel } from "@/lib/donation-channel";
import { caseLead, formatDate, formatDay } from "@/lib/format";
import { moneyProgress } from "@/lib/money-progress";
import { savedFrame } from "@/lib/photo-frame";
import { donorLine, latestDonor, sampleDonationLog } from "@/lib/sample-donations";
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

  const { city, caseRecord, photos, budgetItems, budget, updates, generalChannel, lastUpdateOn } =
    data;
  const liveDonations = await getDonationLog({ caseId: caseRecord.id, limit: 12 });
  const sample = liveDonations.length === 0;
  const donations = sample
    ? sampleDonationLog({
        caseId: caseRecord.id,
        caseName: caseRecord.display_name,
        cityId: city.id,
        cityName: city.name,
        citySlug: city.slug,
      })
    : liveDonations;
  const gallery = situationPhotos(photos, caseRecord.portrait_photo_id, updates);
  const portrait = photos.find((photo) => photo.id === caseRecord.portrait_photo_id);
  const portraitPath = portrait?.storage_path ?? null;
  const caseHref = `/ciudades/${city.slug}/casos/${caseRecord.id}`;
  const offerHref = "/ofrecer/recurso";
  const donation = caseDonation(caseRecord, generalChannel);
  const channel = donation.channel;
  const progress = moneyProgress(budget);

  /**
   * El último aporte, SOLO SI ES REAL.
   *
   * La lista de abajo puede caer en filas de muestra cuando todavía no hay
   * ninguna confirmada, y ahí está bien: lleva su aviso pegado y sirve para ver
   * cómo queda. Este renglón no puede: sale arriba, en el bloque del avance, y
   * repetido en la barra fija, sin sitio para el aviso y en el punto de la
   * pantalla que más se lee. «Lucía Restrepo donó $1,5 M» sin nada al lado es
   * una donación inventada presentada como prueba social, y mientras no haya
   * pasarela ese sería el estado de TODAS las causas del portal en producción.
   *
   * Sin aportes reales no hay último aporte y el renglón no existe. Lo que ocupa
   * su sitio ya está escrito: la última compra y el canal.
   */
  const lastGive = sample ? null : latestDonor(donations);
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
            progress={progress}
            donation={donation}
            donateHref={`#${MONEY_ANCHOR}`}
            budgetHref={`${caseHref}#presupuesto`}
            offerHref={offerHref}
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

              A DÓNDE VA EL DINERO DE ESTA PERSONA. Es la sección que no puede
              faltar, y faltaba: el «Donar» de la barra llevaba al registro de
              donaciones —una lista de lo que han dado otros—, así que sin
              JavaScript la acción principal de la ficha no llevaba a ningún sitio
              donde se pudiera dar nada, y con JavaScript solo al pop-up del correo
              de Mercado Pago, que todavía no cobra. Mientras la pasarela no esté,
              el canal ES la forma de enviar dinero hoy.

              Y el rótulo de procedencia no es un adorno: es lo único que separa
              «esto es para ella» de «esto entra en el fondo del portal y se
              reparte», y las dos frases mandan a la misma llave desde la misma
              pantalla. La escribe `channelOriginLabel()`/`GeneralChannelNote` una
              sola vez. Ver el comentario largo de lib/donation-channel.ts, que es
              donde está la razón por la que esta función devuelve la procedencia
              junto con el canal y no el canal a secas. */}
          <section id={MONEY_ANCHOR} className="mt-10 scroll-mt-6">
            <h2 className={screenTitle}>Enviar dinero</h2>

            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              {channelOriginLabel(donation)}.
            </p>

            {donation.source === "general" && (
              <GeneralChannelNote caseName={caseRecord.display_name} className="mt-3" />
            )}

            {channel && (
              <>
                <div className="mt-5">
                  <DonationChannelCard channel={channel} />
                </div>
                {/* Desde cuándo nadie ha comprobado esto, pegado al canal y no en
                    otra parte de la página: es la mitad de lo que hace útil a la
                    otra. */}
                <ChannelCheckNote channel={channel} className="mt-3" />
              </>
            )}

            {donation.source === "ninguno" && (
              <>
                {/* «para {nombre}» y no «{nombre} no tiene»: los nombres de los
                    casos son frases enteras —«Yeison Córdoba y su hermana»— y con
                    el verbo detrás la concordancia se rompe en la mitad. */}
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  No tiene canal propio y el portal tampoco tiene canal general registrado. No
                  enseñamos el canal de otro. Lo que sí se puede hacer hoy es ofrecer un recurso
                  concreto.
                </p>
                <Link href={offerHref} className={`${button.secondary} mt-5 w-full`}>
                  Ofrecer un recurso en su lugar
                </Link>
              </>
            )}
          </section>

          <section id={DONATIONS_ANCHOR} className="mt-10 scroll-mt-6">
            <h2 className={screenTitle}>Donaciones recibidas</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Quién donó a {caseRecord.display_name} y cuánto. Si no autorizó su nombre, la fila
              dice que es anónima.
            </p>
            {sample && (
              <p className="mt-2 text-[12px] text-faint">
                Estas filas son de muestra, para ver cómo queda la lista. No son donaciones
                confirmadas.
              </p>
            )}
            <div className="mt-4">
              <DonationLog
                initial={donations}
                scope="case"
                caseId={sample ? undefined : caseRecord.id}
                limit={12}
                poll={!sample}
              />
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
