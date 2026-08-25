import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FoundationForm } from "@/components/admin/FoundationForm";
import { TownIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getFoundation } from "@/lib/admin-data";
import { FOUNDATIONS_PATH } from "@/lib/admin-sections";
import { contactHref, formatDate } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import { deleteFoundation } from "../actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * La ficha de una fundación.
 *
 * Coordinación edita; el resto del equipo lee. La diferencia se decide aquí y
 * la vuelve a decidir la RLS (0026), que es la que manda: quien documenta un
 * municipio necesita ver qué organización trabaja allí y cómo llamarla, y no
 * necesita poder cambiar su estado de verificación.
 */
export default async function FoundationPage({ params }: Props) {
  const { id } = await params;
  const [foundation, team] = await Promise.all([getFoundation(id), currentTeam()]);

  if (!foundation) notFound();

  const name = foundation.display_name.trim() || foundation.legal_name;
  const canEdit = team?.role === "coordinacion";
  const phoneHref = contactHref(foundation.phone);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref={FOUNDATIONS_PATH}
        backLabel="Fundaciones"
        title={name}
        Icon={TownIcon}
        description={`Se apuntó el ${formatDate(foundation.created_at)}.`}
      />

      {/* El contacto, arriba y fuera del formulario: es lo que se usa cuando se
          abre esta pantalla para llamar, y buscarlo entre campos editables es
          más lento que leerlo. */}
      <section className={`${panel} mt-6 p-4 sm:p-5`}>
        <p className="text-sm text-body">
          <span className="font-medium text-ink">{foundation.contact_name}</span>
          {" · "}
          <a href={`mailto:${foundation.email}`} className="text-accent hover:underline">
            {foundation.email}
          </a>
          {foundation.phone && (
            <>
              {" · "}
              {phoneHref ? (
                <a href={phoneHref} className="text-accent hover:underline">
                  {foundation.phone}
                </a>
              ) : (
                foundation.phone
              )}
            </>
          )}
        </p>
        {foundation.website && (
          <p className="mt-1 text-[13px]">
            <a
              href={foundation.website}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:underline"
            >
              {foundation.website}
            </a>
          </p>
        )}
      </section>

      {canEdit ? (
        <FoundationForm foundation={foundation} />
      ) : (
        <ReadOnly foundation={foundation} />
      )}

      {canEdit && (
        <form action={deleteFoundation} className="mt-10 border-t border-line pt-5">
          <input type="hidden" name="id" value={foundation.id} />
          <p className="text-[13px] leading-relaxed text-muted">
            Borrar no es lo mismo que descartar. Descartada se queda en la lista
            y se puede consultar; borrar es para lo que nunca debió entrar, como
            una prueba o una duplicada.
          </p>
          <button
            type="submit"
            className="mt-3 min-h-11 rounded-full border border-need-high px-5 text-[14px] font-medium text-need-high hover:bg-need-high-soft"
          >
            Borrar esta fundación
          </button>
        </form>
      )}

      <p className="mt-8 text-[13px] text-muted">
        <Link href={FOUNDATIONS_PATH} className="text-accent hover:underline">
          Volver a la lista
        </Link>
      </p>
    </div>
  );
}

/** Lo que ve quien documenta un municipio: los mismos datos, sin poder tocarlos. */
function ReadOnly({
  foundation,
}: {
  foundation: NonNullable<Awaited<ReturnType<typeof getFoundation>>>;
}) {
  const rows: [string, string][] = [
    ["Nombre legal", foundation.legal_name],
    ["NIT", foundation.nit || "Sin NIT"],
    ["Sede", foundation.city_name],
    ["Dónde trabaja", foundation.coverage],
    ["A qué se dedica", foundation.focus],
    ["Qué puede aportar", foundation.offering],
    ["Cuánta gente", foundation.team_size],
    ["Desde", foundation.founded_year],
    ["Lo que escribieron", foundation.message],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="mt-6">
      <p className="text-[13px] leading-relaxed text-muted">
        Revisar y editar una fundación es de coordinación. Aquí está lo que hay,
        para que puedas llamarla.
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className={`${panel} p-4`}>
            <dt className="text-[12px] font-medium uppercase tracking-wide text-faint">
              {label}
            </dt>
            <dd className="mt-1 text-[14px] leading-relaxed text-body">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
