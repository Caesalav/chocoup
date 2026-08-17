import Link from "next/link";
import { notFound } from "next/navigation";
import { createCase, deleteCity, updateCity } from "@/app/admin/actions";
import { FoundationForm } from "@/components/admin/FoundationForm";
import { NeedsManager } from "@/components/admin/NeedsManager";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { LocationPicker } from "@/components/map/LocationPicker";
import { DraftChip } from "@/components/ui/Chip";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getCityPage } from "@/lib/data";
import { plural } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminCityPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCityPage(slug, { includeDrafts: true });
  if (!data) notFound();

  const { city, foundations, photos, zoneNeeds, cases } = data;
  const primary = foundations.find((foundation) => foundation.is_primary);
  const others = foundations.filter((foundation) => !foundation.is_primary);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-ink hover:underline">
        ← Panel
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrow}>Municipio</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl text-ink">
            {city.name}
            {!city.published && <DraftChip label="Sin publicar" />}
          </h1>
        </div>
        <Link
          href={`/ciudades/${city.slug}`}
          className="smallcaps text-[15px] text-amber hover:text-amber-bright"
        >
          Ver página pública
        </Link>
      </header>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Datos del municipio</h2>
        <form action={updateCity} className={`${panel} mt-4 space-y-4 p-5`}>
          <input type="hidden" name="id" value={city.id} />

          <label className="block">
            <span className={field.label}>Nombre</span>
            <input name="name" required defaultValue={city.name} className={field.input} />
          </label>

          <label className="block">
            <span className={field.label}>Qué pasó aquí</span>
            <textarea
              name="summary"
              rows={6}
              defaultValue={city.summary}
              className={field.textarea}
              placeholder="Lo que estamos viendo: daños, población afectada, qué está funcionando y qué no. Separa párrafos con una línea en blanco."
            />
          </label>

          <div>
            <span className={field.label}>Ubicación</span>
            <div className="mt-1.5">
              <LocationPicker initialLat={city.lat} initialLng={city.lng} />
            </div>
          </div>

          <label className={field.checkboxRow}>
            <input
              type="checkbox"
              name="published"
              defaultChecked={city.published}
              className={field.checkbox}
            />
            <span>
              Publicar en el portal
              <span className="mt-0.5 block text-xs text-muted">
                Mientras esté sin publicar, ni el municipio ni sus fotos, casos o necesidades son
                visibles para el público.
              </span>
            </span>
          </label>

          <SubmitButton>Guardar municipio</SubmitButton>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fotos de la situación</h2>
        <p className="mt-1 text-sm text-muted">
          Las fotos generales del municipio. Las de cada familia van dentro de su caso.
        </p>
        <div className="mt-4">
          <PhotoManager cityId={city.id} photos={photos} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fundación madre</h2>
        <p className="mt-1 text-sm text-muted">
          Es el canal de donación que aparece en la página pública.
        </p>
        <div className="mt-4">
          <FoundationForm cityId={city.id} foundation={primary} />
        </div>

        {others.length > 0 && (
          <div className="mt-4 space-y-4">
            <h3 className="text-sm font-medium text-muted">Otras organizaciones</h3>
            {others.map((foundation) => (
              <FoundationForm key={foundation.id} cityId={city.id} foundation={foundation} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Necesidades de la zona</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que hace falta en el municipio en general, no de una familia concreta.
        </p>
        <div className="mt-4">
          <NeedsManager cityId={city.id} needs={zoneNeeds} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Casos</h2>
        <p className="mt-1 text-sm text-muted">
          {cases.length === 0
            ? "Todavía no hay casos en este municipio."
            : plural(cases.length, "caso registrado", "casos registrados")}
        </p>

        {cases.length > 0 && (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel/60">
            {cases.map((caseRecord) => (
              <li key={caseRecord.id}>
                <Link
                  href={`/admin/ciudades/${city.slug}/casos/${caseRecord.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-ink">{caseRecord.display_name}</h3>
                      {!caseRecord.published && <DraftChip label="Sin publicar" />}
                      {!caseRecord.consent_to_publish && <DraftChip label="Sin consentimiento" />}
                    </div>
                    <p className="mt-0.5 text-xs text-faint">
                      {caseRecord.openNeeds} necesidades abiertas
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted">Editar</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form action={createCase} className={`${panel} mt-4 space-y-4 p-5`}>
          <input type="hidden" name="city_id" value={city.id} />
          <input type="hidden" name="city_slug" value={city.slug} />

          <h3 className="font-medium text-ink">Nuevo caso</h3>

          <label className="block">
            <span className={field.label}>Nombre de la persona o familia</span>
            <input
              name="display_name"
              required
              className={field.input}
              placeholder="Ej.: Familia Mosquera Palacios"
            />
            <span className={field.hint}>
              Usa el nombre con el que la persona acepta aparecer. Si prefiere no dar su nombre
              completo, pon solo el primero.
            </span>
          </label>

          <label className="block">
            <span className={field.label}>Composición del hogar</span>
            <input
              name="household"
              className={field.input}
              placeholder="Ej.: 5 personas, 2 niños, una adulta mayor"
            />
          </label>

          <label className="block">
            <span className={field.label}>Situación</span>
            <textarea
              name="story"
              rows={5}
              className={field.textarea}
              placeholder="Qué le pasó, dónde está durmiendo, qué perdió, qué necesita con urgencia."
            />
          </label>

          <label className={field.checkboxRow}>
            <input type="checkbox" name="consent_to_publish" className={field.checkbox} />
            <span>
              La persona dio su consentimiento para publicar su caso y sus fotos
              <span className="mt-0.5 block text-xs text-muted">
                Sin esta casilla el caso se guarda, pero no se puede publicar.
              </span>
            </span>
          </label>

          <SubmitButton pendingLabel="Creando…">Crear caso</SubmitButton>
        </form>
      </section>

      <section className="mt-12 border-t border-line pt-6">
        <form action={deleteCity}>
          <input type="hidden" name="id" value={city.id} />
          <DangerSubmitButton
            confirmText={`¿Borrar ${city.name} con sus fotos, casos y necesidades? No se puede deshacer.`}
          >
            Borrar municipio
          </DangerSubmitButton>
        </form>
      </section>
    </div>
  );
}
