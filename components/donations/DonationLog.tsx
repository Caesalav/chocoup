"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { personInitials } from "@/components/case/PersonBadge";
import { card } from "@/components/ui/styles";
import { DONATION_LOG_LIMIT, DONATION_LOG_POLL_MS } from "@/lib/donation-log";
import { formatCOP, timeAgo } from "@/lib/format";
import type { DonationLogEntry } from "@/lib/types";

type Scope = "portal" | "city" | "case";

/**
 * El registro de donaciones confirmadas.
 *
 * El primer pintado sale del servidor. Después pregunta cada quince segundos
 * si ha entrado una nueva: el público no puede suscribirse a la tabla de
 * donaciones, y esta es la vía que sí puede usar. Sin JavaScript se queda
 * la lista del primer pintado, que es cierta en el instante en que se abrió
 * la página.
 *
 * `scope` recorta lo que ya se sabe por estar en esa pantalla: en la ficha
 * de una causa no se repite su nombre, y en un municipio no se nombra el
 * pueblo. El nombre, el importe y cuánto hace salen siempre, en ese orden,
 * con la inicial al lado: es la fila de la referencia.
 */
export function DonationLog({
  initial,
  scope,
  caseId,
  cityId,
  limit = DONATION_LOG_LIMIT,
  poll = true,
}: {
  initial: DonationLogEntry[];
  scope: Scope;
  caseId?: string;
  cityId?: string;
  limit?: number;
  /** Apagar el sondeo cuando la lista es de muestra y no hay API que la llene. */
  poll?: boolean;
}) {
  const [rows, setRows] = useState(initial);

  useEffect(() => {
    if (!poll) return;
    const params = new URLSearchParams({ limite: String(limit) });
    if (caseId) params.set("caso", caseId);
    if (cityId) params.set("ciudad", cityId);

    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const response = await fetch(`/api/donaciones?${params.toString()}`);
        if (!response.ok) return;
        const body = (await response.json()) as { donations?: DonationLogEntry[] };
        setRows(body.donations ?? []);
      } catch {
        // Una caída de red no borra lo que ya se veía.
      }
    };

    const timer = window.setInterval(tick, DONATION_LOG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [caseId, cityId, limit, poll]);

  if (rows.length === 0) {
    return (
      <p className={`${card} p-5 text-[14px] leading-relaxed text-muted`}>
        Todavía no hay donaciones confirmadas. Cuando entre la primera, aparecerá
        aquí.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-live="polite">
      {rows.map((row) => (
        <li key={row.id}>
          <DonationEntry row={row} scope={scope} />
        </li>
      ))}
    </ul>
  );
}

function donorInitial(name: string | null): string {
  if (!name) return "";
  return personInitials(name).slice(0, 1) || name.trim().charAt(0).toUpperCase();
}

function DonationEntry({ row, scope }: { row: DonationLogEntry; scope: Scope }) {
  const named = Boolean(row.donor_name);
  const who = row.donor_name || "Donación anónima";
  const initial = donorInitial(row.donor_name);

  return (
    <article className={`${card} p-3.5`}>
      <div className="flex gap-3">
        <span
          aria-hidden={!named}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-land font-display text-[15px] text-ink"
        >
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-snug text-ink">{who}</h3>
          <p className="mt-0.5 font-display text-[17px] leading-snug tabular-nums text-ink">
            {formatCOP(row.amount_cop)}
          </p>
          <p className="mt-0.5 text-[12px] text-faint" suppressHydrationWarning>
            {timeAgo(row.donated_at)}
          </p>

          {scope !== "case" && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Para{" "}
              <Link
                href={`/ciudades/${row.city_slug}/casos/${row.case_id}`}
                className="text-body underline-offset-2 hover:underline"
              >
                {row.case_name}
              </Link>
              {scope === "portal" && (
                <>
                  {" · "}
                  <Link
                    href={`/ciudades/${row.city_slug}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {row.city_name}
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
