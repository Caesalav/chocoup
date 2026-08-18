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

  const { city, foundation, photos, zoneNeeds, cases } = data;

  // Quien no tiene este municipio asignado lo puede leer —hace falta, para no
  // duplicar el trabajo de otra persona— pero no se le ofrece ningún formulario:
  // la base de datos rechazaría cada guardado, y un panel lleno de campos que no
  // guardan es peor que un panel que dice que no.
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

        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">Qué pasó aquí</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {city.summary || "Todavía sin escribir."}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-ink">Casos</h2>
          <p className="mt-1 text-sm text-muted">
            {cases.length === 0
              ? "Todavía no hay casos en este municipio."
              : plural(cases.length, "caso registrado", "casos registrados")}
          </p>

          {cases.length > 0 && (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
              {cases.map((caseRecord) => (
                <li key={caseRecord.id}>
                  <Link
                    href={`/admin/ciudades/${city.slug}/casos/${caseRecord.id}`}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
                  >
                    <span className="min-w-0 font-medium text-ink">
                      {caseRecord.display_name}
                    </span>
                    <span className="shrink-0 text-sm text-muted">Leer</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <CityHeader city={city} />

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

          {/* Publicar saca a la calle fotos e historias de personas
              identificables, así que es de coordinación. Quien documenta no ve la
              casilla, y si mandara el campo la acción lo ignora y el disparador de
              la base de datos lo rechaza. */}
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
                  Mientras esté sin publicar, ni el municipio ni sus fotos, casos o necesidades son
                  visibles para el público.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              {city.published
                ? "Este municipio está publicado. Despublicarlo es de coordinación."
                : "Sin publicar: nada de este municipio se ve todavía en el portal. Publicarlo es de coordinación, avisa cuando esté listo."}
            </p>
          )}

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
          Una por municipio: es el canal de donación que aparece en la página pública. Para cambiar
          de fundación, quita esta y registra la nueva.
        </p>

        {/* Un solo formulario, y antes había uno más por cada «otra
            organización». No es una lista más corta: es que la base de datos ya no
            admite dos (0004), y ofrecer un formulario que guardara una segunda
            sería ofrecer un botón que devuelve un error de restricción con la
            familia delante.

            El enlace de donación es a dónde va el dinero de quien pulsa "Donar":
            el campo más delicado del portal, y por eso lo edita solo
            coordinación. Los datos de la fundación se levantan en terreno y se
            pasan por WhatsApp; registrarlos es un gesto de dos minutos y una
            responsabilidad de otro tamaño. */}
        {isCoordination ? (
          <div className="mt-4">
            <FoundationForm cityId={city.id} foundation={foundation ?? undefined} />
          </div>
        ) : (
          <div className={`${panel} mt-4 p-4`}>
            <p className="text-sm text-ink">{foundation?.name ?? "Todavía sin registrar"}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              La fundación y su enlace de donación los registra coordinación, porque de ahí sale el
              dinero. Manda los datos y el número de contacto por el grupo.
            </p>
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
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
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
              placeholder="Ej.: Daniela, madre soltera reconstruye sola su casa"
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

          <label className="block">
            <span className={field.label}>A dónde donarle dinero</span>
            <input
              name="donation_url"
              type="url"
              inputMode="url"
              className={field.input}
              placeholder="https://…  (opcional)"
            />
            <span className={field.hint}>
              Si lo dejas vacío, se usa el canal de la fundación del municipio. El retrato y las
              fotos de la situación se suben después, en la ficha del caso.
            </span>
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

      {/* Borrar un municipio se lleva por delante las fotos, los casos y las
          necesidades de gente real: es de coordinación. */}
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

/** La cabecera es la misma se pueda escribir o no, así que vive en un sitio. */
function CityHeader({ city, readOnly = false }: { city: City; readOnly?: boolean }) {
  return (
    <>
      <Link href="/admin" className="text-sm text-muted hover:text-ink hover:underline">
        ← Panel
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrow}>Municipio</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl text-ink">
            {city.name}
            {!city.published && <DraftChip label="Sin publicar" />}
            {readOnly && <DraftChip label="Solo lectura" />}
          </h1>
        </div>
        <Link
          href={`/ciudades/${city.slug}`}
          className="smallcaps text-[15px] text-accent hover:text-accent-strong"
        >
          Ver página pública
        </Link>
      </header>
    </>
  );
}
