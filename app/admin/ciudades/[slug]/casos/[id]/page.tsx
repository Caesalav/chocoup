import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCase, saveCaseDonationChannel, updateCase } from "@/app/admin/actions";
import { ChannelCheck, channelCheckNote } from "@/components/admin/ChannelCheck";
import { DonationChannelForm } from "@/components/admin/DonationChannelForm";
import { NeedsManager } from "@/components/admin/NeedsManager";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ProgressManager } from "@/components/admin/ProgressManager";
import { CaseProgressBar } from "@/components/case/CaseProgressBar";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { CategoryChip, DraftChip, OfferStatusChip } from "@/components/ui/Chip";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getOffersForCase } from "@/lib/admin-data";
import { CASE_KINDS } from "@/lib/constants";
import { getCasePage } from "@/lib/data";
import { caseDonation, channelCheck, channelOriginLabel } from "@/lib/donation-channel";
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

  const { city, caseRecord, photos, needs, updates, generalChannel } = data;
  const isCoordination = team?.role === "coordinacion";

  // El canal que esta ficha tiene delante, con su procedencia y su comprobación.
  // Se resuelve con las mismas funciones que la ficha pública y no con una lectura
  // suelta de las columnas: `caseDonation()` es la que sabe que un caso sin canal
  // propio recibe por el general, y su firma obliga a escribir de quién es. El
  // panel no puede saber menos que la pantalla que publica.
  const donation = caseDonation(caseRecord, generalChannel);
  const check = donation.channel ? channelCheck(donation.channel) : null;

  // Sin este municipio asignado, la historia se lee pero no se toca. Y se lee
  // porque quien llega detrás necesita saber qué se documentó ya de esta familia.
  if (!canWriteCity(team, city.id)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <CaseCrumbs slug={city.slug} cityName={city.name} />

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
      <CaseCrumbs slug={city.slug} cityName={city.name} />

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

          {/* «Nombre de la persona o familia» era el rótulo de cuando una causa
              solo podía ser una persona. Desde 0016 puede ser un colegio o un
              animal, y el nombre de un colegio no es el de una familia. */}
          <label className="block">
            <span className={field.label}>El nombre con el que aparece</span>
            <input
              name="display_name"
              required
              defaultValue={caseRecord.display_name}
              className={field.input}
            />
            <span className={field.hint}>
              De una persona, el nombre con el que acepta aparecer: si prefiere no dar el completo,
              solo el primero. De un colegio o un animal, cómo se le llama en el pueblo.
            </span>
          </label>

          {/* Qué es la causa. Lo escribe quien documenta, como el resto de la
              ficha: es lo que se ve en terreno. No hay opción vacía porque no hay
              causa sin tipo —la base de datos pone 'persona' por omisión, que es lo
              que son todas las escritas hasta hoy— y porque un «elige uno» dejaría
              la ficha sin guardar por una pregunta cuya respuesta ya sabemos.

              Lo que decide de verdad este campo es el hueco del retrato cuando no
              hay foto: para una persona son sus iniciales y para un colegio serían
              dos letras donde tenía que haber una escuela. Ver 0016. */}
          <label className="block">
            <span className={field.label}>¿Qué es esta causa?</span>
            <select name="case_kind" defaultValue={caseRecord.case_kind} className={field.select}>
              {CASE_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
            <span className={field.hint}>
              Cambia el nombre del campo de arriba y lo que se dibuja mientras no haya retrato: de
              una persona se ponen sus iniciales, y de un colegio o un animal la palabra.
            </span>
          </label>

          <label className="block">
            <span className={field.label}>Composición del hogar</span>
            <input
              name="household"
              defaultValue={caseRecord.household}
              className={field.input}
            />
          </label>

          {/* La frase que viaja por WhatsApp. Va ENCIMA de la situación y no debajo
              porque se escribe mirando la historia, y quien baja hasta aquí después
              de escribir ocho párrafos ya la tiene hecha en la cabeza. */}
          <label className="block">
            <span className={field.label}>La frase que resume esto</span>
            <input
              name="summary"
              // 120 y lo impone también la base de datos, porque un `maxlength` no
              // viaja en una llamada a la API. Aquí sirve para que no se escriba de
              // más y se pierda al guardar.
              maxLength={120}
              defaultValue={caseRecord.summary}
              className={field.input}
              placeholder="Daniela reconstruye sola su casa con sus dos hijas, en Quibdó."
            />
            <span className={field.hint}>
              Es la frase que sale en la vista previa de WhatsApp cuando alguien comparte este
              enlace, que es como se mueve esto. Caben 120 caracteres. Si la dejas vacía no pasa
              nada: la tarjeta y la vista previa siguen recortando la situación de abajo, pero ese
              corte cae donde cae, a veces a mitad de una palabra.
            </span>
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

        {/* Lo primero, y para los dos roles: de quién es el canal que esta ficha
            está publicando, y desde cuándo nadie lo ha comprobado. Es la misma
            frase que lee quien dona, escrita por la misma función; con dos
            redacciones la del panel acabaría siendo la optimista.

            La comprobación se escribe aquí y no solo en el repaso del dinero
            porque es donde se va a cambiar el canal: quien abre esta ficha para
            tocar la llave tiene que ver de un vistazo que la que hay lleva cinco
            meses sin mirarse. */}
        <div className={`${panel} mt-3 p-4`}>
          <p className="text-sm text-ink">{channelOriginLabel(donation)}</p>
          {donation.channel && (
            <>
              <p className="mt-2.5">
                <ChannelCheck check={check} />
              </p>
              <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
                {donation.source === "general"
                  ? `Es el canal general del portal, no el de ${caseRecord.display_name}: se cambia y se comprueba en el repaso del dinero. ${channelCheckNote(check)}`
                  : channelCheckNote(check)}
              </p>
            </>
          )}
        </div>

        {isCoordination ? (
          <>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
              El canal de {caseRecord.display_name}, que sale en su ficha pública. Puede ser una
              llave de transferencia, un enlace de recaudación o un número de contacto.{" "}
              <span className="text-ink">
                Sin canal propio, recibe por el canal general del portal
              </span>
              , y su ficha lo dice con esas palabras: no lo presenta como si fuera suyo. Poner uno
              aquí es decir que el dinero de esta persona va directo a ella y a nadie más.
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
          <p className="mt-3 max-w-prose text-xs leading-relaxed text-muted">
            A dónde va el dinero de esta causa lo registra coordinación, porque quien edita ese
            campo puede desviar donaciones de una persona con nombre y cara publicados. Y por lo
            mismo lo de comprobarlo: escribir que un destino está comprobado sin haberlo
            comprobado es escribir la frase con la que alguien decide fiarse. Manda el dato por el
            grupo. Todo lo demás de esta ficha sí lo puedes guardar tú.
          </p>
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
        {/* «La cara de esta persona» era de cuando una causa solo podía ser una
            persona. Sigue siendo una cara en la mayoría, y en un colegio es su
            fachada; el rótulo tiene que valer para las cuatro. */}
        <p className="mt-1 text-sm text-muted">
          El retrato es lo que sale en las tarjetas: la cara de una persona, la fachada de un
          colegio. El resto son fotos de la situación: la casa, el barrio, lo que se ve. El retrato
          se elige de entre las que ya subiste; no va en un archivo aparte.
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
        <h2 className="font-display text-2xl text-ink">Qué le falta</h2>
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
          Ofertas que alguien mandó para esta causa. Se leen aquí para saber qué viene en camino
          antes de prometerle nada; se aceptan, se niegan y se anota el día que llegan en{" "}
          <Link href="/admin/recursos" className="text-accent hover:underline">
            recursos ofrecidos
          </Link>
          .
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
 * Los dos sitios de los que se puede venir, y a los dos se puede volver.
 *
 * La ficha de una causa vive en la ruta de su municipio y pertenece a la sección
 * de Casos, así que un solo enlace de vuelta se equivoca la mitad de las veces:
 * quien entró por /admin/casos a escribir el avance del jueves no quiere aterrizar
 * en la ficha de Bahía Solano, y quien estaba documentando ese pueblo sí. Las dos
 * migas van juntas y en ese orden —primero la sección, después el municipio— que es
 * el de la barra de arriba.
 */
function CaseCrumbs({ slug, cityName }: { slug: string; cityName: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
      <Link href="/admin/casos" className="hover:text-ink hover:underline">
        ← Casos
      </Link>
      <span className="text-faint">·</span>
      <Link href={`/admin/ciudades/${slug}`} className="hover:text-ink hover:underline">
        {cityName}
      </Link>
    </p>
  );
}

/**
 * Las ofertas de esta causa, en lectura.
 *
 * No repite las acciones de la bandeja a propósito: dos sitios donde aceptar o
 * negar la misma oferta son dos sitios donde dejarla a medias, y el que manda
 * tiene que ser uno. Aquí se responde a "qué le han ofrecido" y desde ahí se va a
 * resolverlo.
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
        Todavía nadie ha ofrecido nada para esta causa.
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
