import Link from "next/link";
import { DraftChip } from "@/components/ui/Chip";
import { eyebrow } from "@/components/ui/styles";
import { getAdminCases, type AdminCaseRow } from "@/lib/admin-data";
import { MONEY_REVIEW_PATH } from "@/lib/admin-sections";
import { caseKindLabel } from "@/lib/constants";
import { formatDay, plural } from "@/lib/format";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * Casos: todas las causas del portal, de todos los municipios.
 *
 * Es la pantalla que faltaba. A una causa solo se llegaba entrando por su
 * municipio, que es el recorrido de quien la documenta por primera vez y no el de
 * quien vuelve: el jueves siguiente hay que escribir el avance de la familia
 * Klinger, y pasar por la ficha de Bahía Solano para encontrarla son dos pantallas
 * y una pregunta —«¿en qué pueblo estaba?»— que el panel puede contestar solo.
 *
 * LA FICHA DE UNA CAUSA NO SE HA MOVIDO: sigue en
 * /admin/ciudades/[slug]/casos/[id], que es la dirección que ya tenía y que hay
 * escrita en enlaces guardados y en `moneyDestinationsOf`. `activeAdminSection()`
 * la asigna a esta sección, así que la barra señala Casos mientras se edita una.
 * Cambiar la ruta habría sido una mudanza sin nada a cambio.
 *
 * Lo que enseña cada fila es lo que hace falta para ELEGIR, y nada más: quién es,
 * de dónde, qué es, qué le falta para salir publicada, cuánto le queda por cubrir
 * y cuándo se supo algo de ella por última vez. Lo que no está: el destino de su
 * dinero. Eso se repasa entero en `MONEY_REVIEW_PATH`, que es de coordinación, y
 * esta lista la ve también quien documenta.
 */
const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "sin-publicar", label: "Sin publicar" },
  { value: "sin-consentimiento", label: "Sin consentimiento" },
  { value: "sin-avance", label: "Sin avances" },
] as const;

/**
 * Los filtros son enlaces de verdad y no un desplegable con JavaScript, igual que
 * las bandejas de recursos: sin JavaScript siguen funcionando, y además cada uno
 * tiene su propia dirección, así que «las que no tienen consentimiento» se puede
 * guardar y compartir por el grupo.
 */
function matches(row: AdminCaseRow, filter: string): boolean {
  if (filter === "sin-publicar") return !row.published;
  if (filter === "sin-consentimiento") return !row.consent;
  if (filter === "sin-avance") return row.lastUpdateOn === null;
  return true;
}

type Props = { searchParams: Promise<{ filtro?: string }> };

export default async function AdminCasesPage({ searchParams }: Props) {
  const { filtro } = await searchParams;
  const active = FILTERS.some((filter) => filter.value === filtro) ? filtro! : "todas";

  const [cases, team] = await Promise.all([getAdminCases(), currentTeam()]);
  const rows = cases.filter((row) => matches(row, active));
  const cityCount = new Set(cases.map((row) => row.cityId)).size;

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-ink hover:underline">
        ← Panel del equipo
      </Link>

      <p className={`${eyebrow} mt-4`}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Casos</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Las causas documentadas de todos los municipios: su historia, su retrato, sus necesidades,
        su diario de avances y a dónde va su dinero. Una causa se abre desde aquí sin pasar por su
        pueblo, y se crea desde la ficha del municipio, que es donde se está cuando aparece.
      </p>
      {team?.role === "coordinacion" && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          El destino del dinero de cada una se cambia en su ficha, y todos juntos se repasan en{" "}
          <Link href={MONEY_REVIEW_PATH} className="text-accent hover:underline">
            a dónde va el dinero
          </Link>
          .
        </p>
      )}

      <nav aria-label="Filtros" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/casos?filtro=${filter.value}`}
            aria-current={active === filter.value ? "page" : undefined}
            className={`smallcaps inline-flex min-h-11 items-center rounded-full px-4 text-[15px] transition-colors ${
              active === filter.value
                ? "bg-accent text-paper"
                : "border border-line text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <p className="mt-6 text-sm text-muted">
        {cases.length === 0
          ? "Todavía no hay ninguna causa documentada. Se crean desde la ficha de su municipio."
          : active === "todas"
            ? `${plural(cases.length, "causa", "causas")} en ${plural(cityCount, "municipio", "municipios")}.`
            : `${plural(rows.length, "causa", "causas")} de ${cases.length}.`}
      </p>

      {cases.length > 0 && rows.length === 0 ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Ninguna causa cumple ese filtro, que aquí es una buena noticia.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
          {rows.map((row) => {
            const canWrite = canWriteCity(team, row.cityId);
            return (
              <li key={row.id}>
                <Link
                  href={`/admin/ciudades/${row.citySlug}/casos/${row.id}`}
                  className="flex min-h-14 items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl leading-tight text-ink">
                        {row.displayName}
                      </h2>
                      {!row.published && <DraftChip label="Sin publicar" />}
                      {!row.consent && <DraftChip label="Sin consentimiento" />}
                      {!canWrite && <DraftChip label="Solo lectura" />}
                    </div>

                    {/* Dos renglones y no cinco pastillas: de las siete cosas que
                        se leen aquí solo tres son avisos —lo que le falta para
                        salir— y las otras cuatro son datos. Con todo en pastillas
                        la fila se convierte en un montón donde no destaca nada, que
                        es justo lo contrario de elegir de un vistazo. */}
                    <p className="mt-1 text-xs text-faint">
                      {row.cityName}
                      {!row.cityPublished && " (municipio sin publicar)"} ·{" "}
                      {caseKindLabel(row.kind)} ·{" "}
                      {plural(row.openNeeds, "necesidad abierta", "necesidades abiertas")}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {row.lastUpdateOn
                        ? `Último avance el ${formatDay(row.lastUpdateOn)}`
                        : "Sin ningún avance escrito"}
                      {" · "}
                      {row.ownChannel ? "Canal propio" : "Recibe por el canal general"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted">{canWrite ? "Abrir" : "Leer"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
