"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CasePortrait } from "@/components/case/CasePortrait";
import { DraftChip, UrgentChip } from "@/components/ui/Chip";
import { SearchIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { foldName } from "@/lib/choco-towns";
import { caseKindLabel } from "@/lib/constants";
import { progressPercent } from "@/lib/case-progress";
import { formatDay, formatCOP, plural } from "@/lib/format";
import type { AdminCaseRow } from "@/lib/admin-case";

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "sin-publicar", label: "Sin publicar" },
  { value: "sin-consentimiento", label: "Sin consentimiento" },
  { value: "sin-avance", label: "Sin avances" },
] as const;

const SORTS = [
  { value: "reciente", label: "Más recientes" },
  { value: "antiguo", label: "Más antiguas" },
  { value: "necesidades-mas", label: "Más ítems pendientes" },
  { value: "necesidades-menos", label: "Menos ítems pendientes" },
  { value: "avance-mas", label: "Mayor avance" },
  { value: "avance-menos", label: "Menor avance" },
  { value: "presupuesto-mas", label: "Mayor presupuesto" },
  { value: "presupuesto-menos", label: "Menor presupuesto" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];
type Sort = (typeof SORTS)[number]["value"];

/**
 * El directorio de causas: buscar, filtrar y ordenar en un solo bloque.
 *
 * Antes eran cuatro pastillas sueltas sobre una lista de nombres. Quien llega
 * el jueves a escribir un avance trae un pueblo o un apellido, no un estado de
 * publicación, y ordenar por lo que falta —necesidades, avance, tamaño del
 * plan— es cómo se decide por cuál empezar. El retrato, la barra y los
 * recursos que aún faltan van en la tarjeta para no tener que abrirla a ciegas.
 */
export function CaseDirectory({
  cases,
  writableIds,
}: {
  cases: AdminCaseRow[];
  writableIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("reciente");
  const mine = useMemo(() => new Set(writableIds), [writableIds]);

  const visible = useMemo(() => {
    const words = foldName(query).split(/\s+/).filter(Boolean);
    return cases
      .filter((row) => matchesFilter(row, filter))
      .filter((row) => matchesQuery(row, words))
      .sort((a, b) => compareCases(a, b, sort));
  }, [cases, query, filter, sort]);

  const cityCount = new Set(visible.map((row) => row.cityId)).size;

  return (
    <div className="mt-8">
      <div className={`${panel} p-4 sm:p-5`}>
        <label className="block">
          <span className={field.label}>Buscar</span>
          <span className="relative mt-2 block">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Daniela, Quibdó, tejas…"
              className={`${field.input} mt-0 pl-10`}
            />
          </span>
        </label>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <nav aria-label="Estado" className="flex flex-wrap gap-2">
            {FILTERS.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => setFilter(entry.value)}
                aria-pressed={filter === entry.value}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] transition-colors ${
                  filter === entry.value
                    ? "bg-accent text-paper"
                    : "border border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </nav>

          <label className="block lg:w-72">
            <span className={field.label}>Ordenar</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className={field.select}
            >
              {SORTS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">
        {cases.length === 0
          ? "Todavía no hay ninguna causa documentada."
          : visible.length === 0
            ? query || filter !== "todas"
              ? "Ninguna causa coincide."
              : "Todavía no hay ninguna causa documentada."
            : query || filter !== "todas"
              ? `${plural(visible.length, "causa", "causas")} de ${cases.length}.`
              : `${plural(visible.length, "causa", "causas")} en ${plural(cityCount, "municipio", "municipios")}.`}
      </p>

      {visible.length > 0 && (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {visible.map((row) => (
            <li key={row.id}>
              <CaseCard row={row} canWrite={mine.has(row.cityId)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseCard({ row, canWrite }: { row: AdminCaseRow; canWrite: boolean }) {
  const percent = progressPercent(row.progress.ratio);
  const shown = row.resources.slice(0, 3);
  const extra = row.resources.length - shown.length;

  return (
    <Link
      href={`/admin/ciudades/${row.citySlug}/casos/${row.id}`}
      className={`${panel} flex h-full gap-3.5 p-3.5 transition-colors hover:border-line-strong hover:bg-line`}
    >
      <CasePortrait
        name={row.displayName}
        caseKind={row.kind}
        path={row.portraitPath}
        frame={row.portraitFrame}
        className="size-[4.5rem] shrink-0 rounded-full text-[24px] sm:size-20 sm:text-[26px]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-[18px] leading-tight text-ink sm:text-xl">
            {row.displayName}
          </h2>
          {!row.published && <DraftChip label="Sin publicar" />}
          {!row.consent && <DraftChip label="Sin consentimiento" />}
          {!canWrite && <DraftChip label="Solo lectura" />}
        </div>

        <p className="mt-1 truncate text-[13px] text-muted">
          {row.cityName}
          {!row.cityPublished && " (municipio sin publicar)"} · {caseKindLabel(row.kind)}
        </p>

        {row.progress.total > 0 ? (
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[12px] text-muted">
                {formatCOP(row.progress.covered)} de {formatCOP(row.progress.total)}
              </p>
              <p className="shrink-0 text-[12px] tabular-nums text-ink">{percent} %</p>
            </div>
            <div
              role="img"
              aria-label={`${percent} por ciento del plan cubierto`}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas"
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : (
          <p className="mt-2.5 text-[12px] text-faint">Todavía no hay un plan de recursos.</p>
        )}

        {shown.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {shown.map((resource) => (
              <li key={`${resource.category}-${resource.title}`} className="flex items-baseline gap-2 text-[13px]">
                <span className="min-w-0 truncate text-body">
                  {resource.title}
                  {resource.quantity ? ` · ${resource.quantity}` : ""}
                </span>
                {resource.urgent && <UrgentChip />}
              </li>
            ))}
            {extra > 0 && (
              <li className="text-[12px] text-faint">
                {extra === 1 ? "1 recurso más" : `${extra} recursos más`}
              </li>
            )}
          </ul>
        )}

        <p className="mt-2 text-[12px] text-faint">
          {row.lastUpdateOn ? `Último avance el ${formatDay(row.lastUpdateOn)}` : "Sin ningún avance escrito"}
          {" · "}
          {row.ownChannel ? "Canal propio" : "Canal general"}
          {" · "}
          {canWrite ? "Abrir" : "Leer"}
        </p>
      </div>
    </Link>
  );
}

function matchesFilter(row: AdminCaseRow, filter: Filter): boolean {
  if (filter === "sin-publicar") return !row.published;
  if (filter === "sin-consentimiento") return !row.consent;
  if (filter === "sin-avance") return row.lastUpdateOn === null;
  return true;
}

function matchesQuery(row: AdminCaseRow, words: string[]): boolean {
  if (words.length === 0) return true;
  const haystack = foldName(
    [
      row.displayName,
      row.cityName,
      row.household,
      row.summary,
      ...row.resources.map((resource) => `${resource.title} ${resource.quantity}`),
    ].join(" "),
  );
  return words.every((word) => haystack.includes(word));
}

function compareCases(a: AdminCaseRow, b: AdminCaseRow, sort: Sort): number {
  const byName = () => a.displayName.localeCompare(b.displayName, "es");

  if (sort === "reciente") return b.createdAt.localeCompare(a.createdAt) || byName();
  if (sort === "antiguo") return a.createdAt.localeCompare(b.createdAt) || byName();
  if (sort === "necesidades-mas") return b.openNeeds - a.openNeeds || byName();
  if (sort === "necesidades-menos") return a.openNeeds - b.openNeeds || byName();
  if (sort === "presupuesto-mas") return b.progress.total - a.progress.total || byName();
  if (sort === "presupuesto-menos") return a.progress.total - b.progress.total || byName();

  const progressOf = (row: AdminCaseRow) => (row.progress.total === 0 ? -1 : row.progress.ratio);
  if (sort === "avance-mas") return progressOf(b) - progressOf(a) || byName();
  return progressOf(a) - progressOf(b) || byName();
}
