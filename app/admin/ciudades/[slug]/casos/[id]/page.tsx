import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCase, saveCaseDonationChannel, updateCase } from "@/app/admin/actions";
import { DonationChannelForm } from "@/components/admin/DonationChannelForm";
import { NeedsManager } from "@/components/admin/NeedsManager";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ProgressManager } from "@/components/admin/ProgressManager";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { CategoryChip, DraftChip, OfferStatusChip } from "@/components/ui/Chip";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getOffersForCase } from "@/lib/admin-data";
import { getCasePage } from "@/lib/data";
import { contactHref, formatDay } from "@/lib/format";
import { canWriteCity, currentTeam } from "@/lib/team";
import type { OfferWithContext } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function AdminCasePage({ params }: Props) {
  const { slug, id } = await params;
  const [data, team, offers] = await Promise.all([
    getCasePage(slug, id, { includeDrafts: true }),
    currentTeam(),
    getOffersForCase(id),
  ]);
  if (!data) notFound();

  const { city, caseRecord, photos, needs, updates } = data;
  const isCoordination = team?.role === "coordinacion";

  // Sin este municipio asignado, la historia se lee pero no se toca. Y se lee
  // porque quien llega detrás necesita saber qué se documentó ya de esta familia.
  if (!canWriteCity(team, city.id)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Link
          href={`/admin/ciudades/${city.slug}`}
          className="text-sm text-muted hover:text-ink hover:underline"
        >
          ← {city.name}
        </Link>

        <p className={`${eyebrow} mt-4`}>Caso en {city.name}</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl text-ink">
          {caseRecord.display_name}
          <DraftChip label="Solo lectura" />
        </h1>

        <p className={`${panel} mt-6 p-4 text-sm leading-relaxed text-muted`}>
          {city.name} no está entre los municipios que tienes asignados. Pide que te lo asignen si
          te toca documentar aquí.
        </p>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted">
          {caseRecord.story || "Todavía sin escribir."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link
        href={`/admin/ciudades/${city.slug}`}
        className="text-sm text-muted hover:text-ink hover:underline"
      >
        ← {city.name}
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrow}>Caso en {city.name}</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl text-ink">
            {caseRecord.display_name}
            {!caseRecord.published && <DraftChip label="Sin publicar" />}
          </h1>
        </div>
        {caseRecord.published && city.published && (
          <Link
            href={`/ciudades/${city.slug}/casos/${caseRecord.id}`}
            className="smallcaps text-[15px] text-accent hover:text-accent-strong"
          >
            Ver página pública
          </Link>
        )}
      </header>

      <section className="mt-8">
        <form action={updateCase} className={`${panel} space-y-4 p-5`}>
          <input type="hidden" name="id" value={caseRecord.id} />

          <label className="block">
            <span className={field.label}>Nombre de la persona o familia</span>
            <input
              name="display_name"
              required
              defaultValue={caseRecord.display_name}
              className={field.input}
            />
          </label>

          <label className="block">
            <span className={field.label}>Composición del hogar</span>
            <input
              name="household"
              defaultValue={caseRecord.household}
              className={field.input}
            />
          </label>

          <label className="block">
            <span className={field.label}>Situación</span>
            <textarea
              name="story"
              rows={8}
              defaultValue={caseRecord.story}
              className={field.textarea}
              placeholder="Separa párrafos con una línea en blanco."
            />
          </label>

          <label className={field.checkboxRow}>
            <input
              type="checkbox"
              name="consent_to_publish"
              defaultChecked={caseRecord.consent_to_publish}
              className={field.checkbox}
            />
            <span>
              La persona dio su consentimiento para publicar su caso y sus fotos
            </span>
          </label>

          <label className={field.checkboxRow}>
            <input
              type="checkbox"
              name="published"
              defaultChecked={caseRecord.published}
              className={field.checkbox}
            />
            <span>
              Publicar este caso
              <span className="mt-0.5 block text-xs text-muted">
                Requiere consentimiento y que el municipio esté publicado.
              </span>
            </span>
          </label>

          <SubmitButton>Guardar caso</SubmitButton>
        </form>
      </section>

      {/* El canal de donación, fuera del formulario de arriba y con su propio
          botón. Dos motivos y los dos pesan: cambiar a dónde va el dinero de una
          persona no puede ser un efecto de guardar su historia, y este campo solo
          lo escribe coordinación mientras el resto de la ficha lo escribe también
          quien documenta este municipio. */}
      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">A dónde va su dinero</h2>
        {isCoordination ? (
          <>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
              El canal de {caseRecord.display_name}, que sale en su ficha pública. Puede ser una
              llave de transferencia, un enlace de recaudación o un número de contacto.{" "}
              <span className="text-ink">
                Sin canal propio, su ficha dice que todavía no hay a dónde enviarle
              </span>
              : no se usa el del municipio ni el de su fundación, porque el dinero acabaría en un
              sitio que nadie eligió para ella.
            </p>
            <div className="mt-4">
              <DonationChannelForm
                action={saveCaseDonationChannel}
                id={caseRecord.id}
                row={caseRecord}
                owner={caseRecord.display_name}
              />
            </div>
          </>
        ) : (
          <div className={`${panel} mt-4 p-4`}>
            <p className="text-sm text-ink">
              {caseRecord.donation_key ||
                caseRecord.donation_url ||
                caseRecord.donation_phone ||
                "Todavía sin canal"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              A dónde va el dinero de esta familia lo registra coordinación, porque quien edita
              ese campo puede desviar donaciones de una persona con nombre y cara publicados.
              Manda el dato por el grupo. Todo lo demás de esta ficha sí lo puedes guardar tú.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Progreso</h2>
        <p className="mt-1 text-sm text-muted">
          La barra sale de las necesidades: cubierta llena, parcial a la mitad. Lo que el público
          ve es lo mismo.
        </p>
        <div className={`${panel} mt-4 p-5`}>
          {needs.length === 0 ? (
            <p className="text-sm text-muted">
              Todavía no hay necesidades. Añádelas abajo: sin ellas no hay barra que mostrar.
            </p>
          ) : (
            <CaseProgressBar needs={needs} />
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fotos</h2>
        <p className="mt-1 text-sm text-muted">
          El retrato es la cara de esta persona en las tarjetas. El resto son fotos de la
          situación: la casa, el barrio, lo que se ve. El retrato se elige de entre las que ya
          subiste; no va en un archivo aparte.
        </p>
        <div className="mt-4">
          <PhotoManager
            cityId={city.id}
            caseId={caseRecord.id}
            photos={photos}
            portraitPhotoId={caseRecord.portrait_photo_id}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Qué necesita esta familia</h2>
        <p className="mt-1 text-sm text-muted">
          Estas necesidades aparecen en la página del caso, con su propio botón para ofrecer
          recursos, y son las que mueven la barra de progreso.
        </p>
        <div className="mt-4">
          <NeedsManager cityId={city.id} caseId={caseRecord.id} needs={needs} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Seguimiento</h2>
        <p className="mt-1 text-sm text-muted">
          El historial del caso, en orden. Cada avance lleva título, qué se hizo y una
          fotografía: el plano, el arquitecto, los materiales, lo que ya está listo.
        </p>
        <div className="mt-4">
          <ProgressManager cityId={city.id} caseId={caseRecord.id} updates={updates} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Lo que le han ofrecido</h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          Ofertas que alguien mandó para esta familia. Se leen aquí para saber qué viene en camino
          antes de prometerle nada; se gestionan en la{" "}
          <Link href="/admin/ofertas" className="text-accent hover:underline">
            bandeja de ofertas
          </Link>
          , que es donde se anota el día que llega.
        </p>
        <div className="mt-4">
          <CaseOffers offers={offers} />
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <form action={deleteCase}>
          <input type="hidden" name="id" value={caseRecord.id} />
          <input type="hidden" name="city_slug" value={city.slug} />
          <DangerSubmitButton
            confirmText={`¿Borrar el caso de ${caseRecord.display_name}? No se puede deshacer.`}
          >
            Borrar caso
          </DangerSubmitButton>
        </form>
      </section>
    </div>
  );
}

/**
 * Las ofertas de esta familia, en lectura.
 *
 * No repite el formulario de la bandeja a propósito: dos sitios donde cambiar el
 * estado de la misma oferta son dos sitios donde dejarla a medias, y el que
 * manda tiene que ser uno. Aquí se responde a "qué le han ofrecido" y desde ahí
 * se va a gestionarlo.
 *
 * El contacto sí se muestra, porque es lo que hace útil la pantalla: quien está
 * con la familia puede llamar a quien ofreció sin salir a buscarlo. Y solo llega
 * aquí quien tiene el municipio asignado, que es lo mismo que exige la política
 * de lectura de la tabla.
 */
function CaseOffers({ offers }: { offers: OfferWithContext[] }) {
  if (offers.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong bg-panel px-3.5 py-3 text-sm text-muted">
        Todavía nadie ha ofrecido nada para esta familia.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {offers.map((offer) => {
        const href = contactHref(offer.offerer_contact);

        return (
          <li key={offer.id} className={`${panel} p-4`}>
            <div className="flex flex-wrap items-center gap-2">
              <OfferStatusChip status={offer.status} />
              <CategoryChip category={offer.category} />
              {offer.delivered_on && (
                <span className="text-xs text-accent-strong">
                  Llegó el {formatDay(offer.delivered_on)}
                </span>
              )}
            </div>

            <p className="mt-2 font-medium leading-snug text-ink">{offer.resource}</p>

            <p className="mt-1 text-sm text-muted">
              {offer.offerer_name} ·{" "}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:underline"
                >
                  {offer.offerer_contact}
                </a>
              ) : (
                offer.offerer_contact
              )}
            </p>

            {offer.needs && (
              <p className="mt-1.5 text-xs text-faint">Para: {offer.needs.title}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
