import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCase, updateCase } from "@/app/admin/actions";
import { NeedsManager } from "@/components/admin/NeedsManager";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { DraftChip } from "@/components/ui/Chip";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getCasePage } from "@/lib/data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function AdminCasePage({ params }: Props) {
  const { slug, id } = await params;
  const data = await getCasePage(slug, id, { includeDrafts: true });
  if (!data) notFound();

  const { city, caseRecord, photos, needs } = data;

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
            className="smallcaps text-[15px] text-amber hover:text-amber-bright"
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

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fotos del caso</h2>
        <div className="mt-4">
          <PhotoManager cityId={city.id} caseId={caseRecord.id} photos={photos} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Qué necesita esta familia</h2>
        <p className="mt-1 text-sm text-muted">
          Estas necesidades aparecen en la página del caso, con su propio botón para ofrecer
          recursos.
        </p>
        <div className="mt-4">
          <NeedsManager cityId={city.id} caseId={caseRecord.id} needs={needs} />
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
