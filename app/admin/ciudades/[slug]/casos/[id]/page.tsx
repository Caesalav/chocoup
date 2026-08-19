import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCase, saveCaseDonationChannel, updateCase } from "@/app/admin/actions";
import { ChannelCheck, channelCheckNote } from "@/components/admin/ChannelCheck";
import { DonationChannelForm } from "@/components/admin/DonationChannelForm";
import { BudgetManager } from "@/components/admin/BudgetManager";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { ProgressManager } from "@/components/admin/ProgressManager";
import { CaseFields } from "@/components/admin/CaseFields";
import { FormSection } from "@/components/admin/FormSection";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { DraftChip } from "@/components/ui/Chip";
import { CasesIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { getCasePage } from "@/lib/data";
import { caseDonation, channelCheck, channelOriginLabel } from "@/lib/donation-channel";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function AdminCasePage({ params }: Props) {
  const { slug, id } = await params;
  const [data, team] = await Promise.all([
    getCasePage(slug, id, { includeDrafts: true }),
    currentTeam(),
  ]);
  if (!data) notFound();

  const { city, caseRecord, photos, budgetItems, budget, updates, generalChannel } = data;
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

        <p className="mt-4 text-[13px] font-medium uppercase tracking-[0.12em] text-faint">
          Caso en {city.name}
        </p>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl text-ink">
          <CasesIcon className="size-8 shrink-0 text-accent" />
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
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-faint">
            Caso en {city.name}
          </p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2.5 font-display text-3xl text-ink">
            <CasesIcon className="size-8 shrink-0 text-accent" />
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
        <form action={updateCase} className="space-y-4">
          <input type="hidden" name="id" value={caseRecord.id} />

          <FormSection
            title="La ficha"
            hint="Lo que sale en público: nombre, tipo, frase de WhatsApp e historia. El retrato y el presupuesto van más abajo."
          >
            <CaseFields
              values={{
                case_kind: caseRecord.case_kind,
                display_name: caseRecord.display_name,
                household: caseRecord.household,
                summary: caseRecord.summary,
                story: caseRecord.story,
                consent_to_publish: caseRecord.consent_to_publish,
              }}
            />

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

            <SubmitButton>Guardar ficha</SubmitButton>
          </FormSection>
        </form>
      </section>

      {/* El canal de donación, fuera del formulario de arriba y con su propio
          botón. Dos motivos y los dos pesan: cambiar a dónde va el dinero de una
          persona no puede ser un efecto de guardar su historia, y este campo solo
          lo escribe coordinación mientras el resto de la ficha lo escribe también
          quien documenta este municipio. */}
      <div className="mt-10">
        <FormSection
          framed={false}
          title="A dónde va su dinero"
          hint={
            isCoordination
              ? `El canal de ${caseRecord.display_name}, que sale en su ficha pública. Sin canal propio, recibe por el general del portal —y la ficha lo dice con esas palabras.`
              : "A dónde va el dinero lo registra coordinación. Manda el dato por el grupo. Todo lo demás de esta ficha sí lo puedes guardar tú."
          }
        >
          <div className={`${panel} p-4`}>
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

          {isCoordination && (
            <DonationChannelForm
              action={saveCaseDonationChannel}
              id={caseRecord.id}
              row={caseRecord}
              owner={caseRecord.display_name}
            />
          )}
        </FormSection>
      </div>

      <div className="mt-10">
        <FormSection
          framed={false}
          title="Presupuesto"
          hint="La meta es la suma de los precios. Marca un ítem cuando ya se haya comprado con lo donado."
        >
          <BudgetManager
            cityId={city.id}
            caseId={caseRecord.id}
            items={budgetItems}
            donated={budget.donated}
          />
        </FormSection>
      </div>

      <div className="mt-10">
        <FormSection
          framed={false}
          title="Fotos"
          hint="El retrato es lo que sale en las tarjetas: la cara de una persona, la fachada de un colegio. El resto son fotos de la situación. El retrato se elige de entre las que ya subiste."
        >
          <PhotoManager
            cityId={city.id}
            caseId={caseRecord.id}
            photos={photos}
            portraitPhotoId={caseRecord.portrait_photo_id}
          />
        </FormSection>
      </div>

      <div className="mt-10">
        <FormSection
          framed={false}
          title="Seguimiento"
          hint="El historial del caso, en orden. Cada avance lleva título, qué se hizo y una fotografía."
        >
          <ProgressManager cityId={city.id} caseId={caseRecord.id} updates={updates} />
        </FormSection>
      </div>

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

