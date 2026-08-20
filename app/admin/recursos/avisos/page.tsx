import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PledgeIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getNewsletterSignups } from "@/lib/admin-data";
import { formatDate, plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; orden?: string }>;
};

/**
 * Los correos de quien pidió que le contemos cómo avanza esto.
 *
 * ESTABA DEBAJO DEL REPASO DEL DINERO, y estaba ahí por una razón que no era una:
 * «la pantalla ya existe y su condición de entrada es la misma». Con ese criterio,
 * la única pantalla del panel que tiene cerrojo acaba siendo el cajón de todo lo
 * que solo puede ver coordinación, y la pregunta «¿a dónde va el dinero?» se
 * contesta en una pantalla que además lleva una lista de correos dentro.
 *
 * Cae en Recursos ofrecidos, y es la única de las mudanzas que hubo que pensar. No
 * es de un municipio ni de una causa, así que Ciudades y Casos no la admiten. Lo
 * que la coloca es de dónde viene: la escribe la misma gente y en el mismo gesto
 * que las ofertas —quien deja su correo en «Quiero ayudar» está diciendo lo mismo
 * que quien ofrece unas tejas, con menos concreción—, así que la sección de lo que
 * llega de fuera es donde alguien la va a buscar. Ver lib/admin-sections.ts.
 *
 * Sigue siendo solo de coordinación, que es lo que manda su política (0015), y esa
 * comprobación no se ha aflojado al mudarla: la de abajo es la primera de dos, y la
 * que decide es la base de datos, que no le concede la lectura a nadie más.
 */
export default async function SignupsPage({ searchParams }: Props) {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader
          backHref="/admin/recursos"
          backLabel="Verificación"
          title="Esta lista es de coordinación"
          Icon={PledgeIcon}
        />
        <p className="mt-8 max-w-prose text-[14px] leading-relaxed text-muted">
          Son correos de personas que pidieron novedades del portal, y no pertenecen a ningún
          municipio: no hay asignación que los haga de nadie. La base de datos no le concede la
          lectura a ninguna cuenta fuera de coordinación, ni para contarlos.
        </p>
        <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-muted">
          Las ofertas de tus municipios sí las ves, en{" "}
          <Link href="/admin/recursos" className="text-accent hover:underline">
            verificación de recursos
          </Link>
          .
        </p>
      </div>
    );
  }

  const signups = await getNewsletterSignups();
  const { q: rawQ, orden: rawSort } = await searchParams;
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);
  const newestFirst = rawSort !== "antiguos";
  const rows = signups
    .filter((row) => (q ? row.email.toLowerCase().includes(q) : true))
    .sort((a, b) =>
      newestFirst
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/recursos"
        backLabel="Verificación"
        title="Correos para los avisos"
        Icon={PledgeIcon}
        description="Quien deja su correo en la página de bloqueo o en «Quiero ayudar» pide que le contemos cómo avanza la plataforma, y nada más. No es el contacto de una oferta."
      />

      {signups.length === 0 ? (
        <p className={`${panel} mt-6 p-4 text-sm leading-relaxed text-muted`}>
          Todavía no se ha apuntado nadie.
        </p>
      ) : (
        <>
          <form className={`${panel} mt-6 p-4`} action="/admin/recursos/avisos" method="get">
            <label className="block">
              <span className="text-[12px] font-medium text-muted">Buscar</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="nombre@correo.com"
                className="mt-2 w-full rounded-lg border border-line-strong bg-panel-high px-3.5 py-2.5 text-base text-ink"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-[12px] font-medium text-muted">Orden</span>
              <select
                name="orden"
                defaultValue={newestFirst ? "recientes" : "antiguos"}
                className="select-chevron mt-2 block w-full appearance-none rounded-lg border border-line-strong bg-panel-high py-2.5 pl-3.5 pr-10 text-base text-ink"
              >
                <option value="recientes">Más recientes</option>
                <option value="antiguos">Más antiguos</option>
              </select>
            </label>
            <button type="submit" className="mt-4 text-[14px] font-medium text-accent hover:underline">
              Filtrar
            </button>
          </form>
          <p className="mt-6 text-sm text-muted">
            {plural(rows.length, "correo apuntado", "correos apuntados")}
            {q ? " con este filtro" : ""}
          </p>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-panel">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-3.5"
              >
                <span className="min-w-0 break-all font-mono text-[13px] text-ink">
                  {row.email}
                </span>
                <span className="shrink-0 text-xs text-faint">{formatDate(row.created_at)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
