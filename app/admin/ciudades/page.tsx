import Link from "next/link";
import { DraftChip } from "@/components/ui/Chip";
import { button, eyebrow } from "@/components/ui/styles";
import { getAdminCities } from "@/lib/admin-data";
import { formatDate, plural } from "@/lib/format";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * Ciudades: llegar a un pueblo y contar qué pasó.
 *
 * Esta lista estaba dentro de /admin, que además se llamaba «Panel» como el panel
 * entero: la sección de los municipios y la puerta eran la misma pantalla, así que
 * no había forma de volver a la lista sin volver al principio de todo. Ahora la
 * puerta reparte y esto es la sección.
 *
 * Y aquí es donde vive el recordatorio del orden de trabajo, que también estaba en
 * la puerta. Allí describía el trabajo de una de las tres secciones como si fuera
 * el del panel entero; los cuatro pasos que enumera empiezan por «abre el
 * municipio donde estás», así que van justo encima de la lista de municipios.
 */
export default async function AdminCitiesPage() {
  const [cities, team] = await Promise.all([getAdminCities(), currentTeam()]);

  const published = cities.filter((city) => city.published).length;

  // La lista es la de todo el portal, también para quien documenta: hace falta
  // ver qué escribió otra persona esta mañana para no duplicar el trabajo. Lo que
  // cambia es dónde se puede escribir, y eso se dice en cada fila.
  const mine = cities.filter((city) => canWriteCity(team, city.id));

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-ink hover:underline">
        ← Panel del equipo
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>Panel del equipo</p>
          <h1 className="mt-1 font-display text-3xl text-ink">Ciudades</h1>
        </div>
        {team?.role === "coordinacion" && (
          <Link href="/admin/ciudades/nueva" className={button.primary}>
            Nuevo municipio
          </Link>
        )}
      </div>

      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Qué pasó en cada municipio, sus fotos y lo que falta en la zona. Las causas de cada uno se
        documentan desde su ficha, y todas juntas se ven en{" "}
        <Link href="/admin/casos" className="text-accent hover:underline">
          Casos
        </Link>
        .
      </p>

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
                className="flex min-h-14 items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
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
