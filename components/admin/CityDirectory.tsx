"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DraftChip } from "@/components/ui/Chip";
import { SearchIcon } from "@/components/ui/icons";
import { field } from "@/components/ui/styles";
import { formatDate, plural } from "@/lib/format";
import { findTowns, foldName } from "@/lib/choco-towns";
import type { AdminCityRow } from "@/lib/types";

export function CityDirectory({
  cities,
  canCreate,
  writableIds,
}: {
  cities: AdminCityRow[];
  canCreate: boolean;
  writableIds: string[];
}) {
  const [query, setQuery] = useState("");
  const needle = foldName(query);
  const mine = useMemo(() => new Set(writableIds), [writableIds]);

  const visible = useMemo(
    () => (needle ? cities.filter((city) => foldName(city.name).includes(needle)) : cities),
    [cities, needle],
  );

  const toCreate = useMemo(() => {
    if (needle.length < 2 || !canCreate) return [];
    const taken = new Set(cities.map((city) => foldName(city.name)));
    return findTowns(query).filter((town) => !taken.has(foldName(town.name))).slice(0, 5);
  }, [cities, query, needle, canCreate]);

  return (
    <div className="mt-8">
      <label className="block">
        <span className={field.label}>Buscar</span>
        <span className="relative mt-2 block">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Quibdó, Bahía Solano, Unguía…"
            className={`${field.input} mt-0 pl-10`}
          />
        </span>
      </label>

      {toCreate.length > 0 && (
        <ul className="mt-4 space-y-2">
          {toCreate.map((town) => (
            <li key={town.name}>
              <Link
                href={`/admin/ciudades/nueva?nombre=${encodeURIComponent(town.name)}`}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4 text-sm text-ink transition-colors hover:border-line-strong"
              >
                <span>
                  Añadir <span className="font-medium">{town.name}</span>
                </span>
                <span className="shrink-0 text-[13px] text-muted">Ubicación lista</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-muted">
        {cities.length === 0
          ? "Todavía no hay municipios."
          : needle
            ? visible.length === 0
              ? "Ningún municipio coincide."
              : `${plural(visible.length, "municipio", "municipios")} de ${cities.length}.`
            : `${cities.filter((city) => city.published).length} de ${cities.length} publicados.`}
      </p>

      {visible.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
          {visible.map((city) => (
            <li key={city.id}>
              <Link
                href={`/admin/ciudades/${city.slug}`}
                className="flex min-h-14 items-center justify-between gap-4 p-4 transition-colors hover:bg-line"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl leading-tight text-ink">{city.name}</h2>
                    {!city.published && <DraftChip label="Sin publicar" />}
                    {!mine.has(city.id) && <DraftChip label="Solo lectura" />}
                  </div>
                  <p className="mt-1 text-xs text-faint">
                    {plural(city.photoCount, "foto", "fotos")} · actualizado{" "}
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
