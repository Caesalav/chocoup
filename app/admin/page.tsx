import Link from "next/link";
import { DraftChip } from "@/components/ui/Chip";
import { button, eyebrow, panel } from "@/components/ui/styles";
import { getAdminCities } from "@/lib/admin-data";
import { formatDate, plural } from "@/lib/format";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [cities, team] = await Promise.all([getAdminCities(), currentTeam()]);
  const pending = cities.reduce((total, city) => total + city.pendingOffers, 0);
  const published = cities.filter((city) => city.published).length;

  // La lista es la de todo el portal, también para quien documenta: hace falta
  // ver qué escribió otra persona esta mañana para no duplicar el trabajo. Lo que
  // cambia es dónde se puede escribir, y eso se dice en cada fila.
  const mine = cities.filter((city) => canWriteCity(team, city.id));

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>Panel del equipo</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Documentar el terreno</h1>
        </div>
        {team?.role === "coordinacion" && (
          <Link href="/admin/ciudades/nueva" className={button.primary}>
            Nuevo municipio
          </Link>
        )}
      </div>

      {pending > 0 && (
        <Link
          href="/admin/ofertas"
          className={`${panel} mt-6 flex items-center justify-between gap-4 p-4 transition-colors hover:border-line-strong`}
        >
          <div>
            <p className="font-medium text-ink">
              {plural(pending, "oferta sin revisar", "ofertas sin revisar")}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              Alguien ofreció recursos y todavía nadie los ha contactado.
            </p>
          </div>
          <span className="smallcaps shrink-0 text-[15px] text-accent">Revisar</span>
        </Link>
      )}

      {/* En terreno, con prisa y mala señal, nadie recuerda el orden. Aquí está. */}
      <ol className="mt-8 grid gap-4 border-y border-line py-5 sm:grid-cols-4">
        {[
          "Abre el municipio donde estás.",
          "Escribe qué pasó y sube fotos.",
          "Anota qué falta y los casos.",
          "Publícalo cuando esté listo.",
        ].map((label, index) => (
          <li key={label} className="flex items-start gap-3">
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] font-medium tabular-nums text-faint">
              {index + 1}
            </span>
            <span className="text-[13px] leading-snug text-muted">{label}</span>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-muted">
        {cities.length === 0
          ? "Todavía no hay municipios."
          : `${published} de ${cities.length} municipios publicados.`}
        {team?.role === "documentacion" && cities.length > 0 && (
          <>
            {" "}
            {mine.length === 0
              ? "Todavía no tienes ninguno asignado: pídeselo a coordinación."
              : `Puedes escribir en ${mine.length === 1 ? "uno" : mine.length}.`}
          </>
        )}
      </p>

      {cities.length === 0 ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Carga{" "}
          <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">supabase/seed.sql</code>{" "}
          para tener los municipios del Chocó con sus coordenadas listos, o crea uno a mano con el
          botón de arriba.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
          {cities.map((city) => (
            <li key={city.id}>
              <Link
                href={`/admin/ciudades/${city.slug}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl leading-tight text-ink">{city.name}</h2>
                    {!city.published && <DraftChip label="Sin publicar" />}
                    {!canWriteCity(team, city.id) && <DraftChip label="Solo lectura" />}
                    {city.pendingOffers > 0 && (
                      <span className="rounded-full bg-need-mid-soft px-2 py-0.5 text-[11px] font-medium text-need-mid-strong">
                        {plural(city.pendingOffers, "oferta", "ofertas")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-faint">
                    {city.photoCount} fotos · {plural(city.caseCount, "caso", "casos")} ·{" "}
                    {city.openNeeds} necesidades abiertas · actualizado{" "}
                    {formatDate(city.updated_at)}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-muted">Abrir</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
