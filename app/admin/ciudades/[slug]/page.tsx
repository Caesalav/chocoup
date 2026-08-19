import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCity, updateCity } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FormSection } from "@/components/admin/FormSection";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { TownPicker } from "@/components/admin/TownPicker";
import { DangerSubmitButton, SubmitButton } from "@/components/admin/SubmitButton";
import { DraftChip } from "@/components/ui/Chip";
import { TownIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { getCityPage } from "@/lib/data";
import { canWriteCity, currentTeam } from "@/lib/team";
import type { City } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminCityPage({ params }: Props) {
  const { slug } = await params;
  const [data, team] = await Promise.all([
    getCityPage(slug, { includeDrafts: true }),
    currentTeam(),
  ]);
  if (!data) notFound();

  const { city, photos } = data;
  const canWrite = canWriteCity(team, city.id);
  const isCoordination = team?.role === "coordinacion";

  if (!canWrite) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <CityHeader city={city} readOnly />
        <p className={`${panel} mt-6 p-4 text-sm leading-relaxed text-muted`}>
          Este municipio no está entre los que tienes asignados, así que lo puedes leer pero no
          escribir en él. Si te toca documentarlo, pídeselo a quien coordina.
        </p>
        <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-muted">
          {city.summary || "Todavía sin descripción."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <CityHeader city={city} />

      <form action={updateCity} className="mt-8">
        <input type="hidden" name="id" value={city.id} />
        <FormSection
          title="El municipio"
          hint="Nombre, punto en el mapa y qué se cuenta de este pueblo. Los casos se documentan en Casos."
        >
          <TownPicker defaultName={city.name} defaultLat={city.lat} defaultLng={city.lng} />

          <label className="block">
            <span className={field.label}>Descripción</span>
            <textarea
              name="summary"
              rows={6}
              defaultValue={city.summary}
              className={field.textarea}
              placeholder="Lo que se ve: daños, quién vive aquí, qué está funcionando. Separa párrafos con una línea en blanco."
            />
          </label>

          {isCoordination ? (
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
                  Mientras esté sin publicar, ni el municipio ni sus fotos o casos son visibles.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              {city.published
                ? "Este municipio está publicado. Despublicarlo es de coordinación."
                : "Sin publicar. Publicarlo es de coordinación."}
            </p>
          )}

          <SubmitButton>Guardar municipio</SubmitButton>
        </FormSection>
      </form>

      <div className="mt-10">
        <FormSection
          framed={false}
          title="Fotos"
          hint="Las de la situación del pueblo. El retrato de una familia va en su caso."
        >
          <PhotoManager cityId={city.id} photos={photos} />
        </FormSection>
      </div>

      {isCoordination && (
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
      )}
    </div>
  );
}

function CityHeader({ city, readOnly = false }: { city: City; readOnly?: boolean }) {
  return (
    <AdminHeader
      backHref="/admin/ciudades"
      backLabel="Ciudades"
      title={city.name}
      Icon={TownIcon}
      badge={
        <>
          {!city.published && <DraftChip label="Sin publicar" />}
          {readOnly && <DraftChip label="Solo lectura" />}
        </>
      }
      actions={
        <Link
          href={`/ciudades/${city.slug}`}
          className="smallcaps text-[15px] text-accent hover:text-accent-strong"
        >
          Ver página pública
        </Link>
      }
    />
  );
}
