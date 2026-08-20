"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { personInitials } from "@/components/case/PersonBadge";
import {
  DONATION_LOG_LIMIT,
  DONATION_LOG_POLL_MS,
  type DonationLogSort,
} from "@/lib/donation-log";
import { formatCOP, timeAgo } from "@/lib/format";
import type { DonationLogEntry } from "@/lib/types";

type Scope = "portal" | "city" | "case";

/**
 * Aquí había doce nombres inventados —«Lucía Restrepo», «Hernán Palacios»— con
 * los que se rellenaba la fila que llegaba sin firmar, para que el registro se
 * pudiera diseñar sin quedarse en un muro de anónimas. Se fueron el día que el
 * webhook empezó a escribir donaciones de verdad, y hay que dejar escrito por
 * qué, porque volver a ponerlos es fácil y la pantalla se ve mejor con ellos.
 *
 * Una donación anónima es la de alguien que NO marcó la casilla que autoriza
 * publicar su nombre. Ponerle uno inventado no es una decisión de diseño: es el
 * portal afirmando quién dio ese dinero. Y hace algo peor que mentir sobre una
 * fila —dinamita las demás—: si un nombre de esta lista puede ser un relleno,
 * ninguno de los otros vale como prueba de nada, y este registro existe
 * exactamente para que se pueda comprobar a dónde va el dinero.
 *
 * Sin nombre se dice que no hay nombre. La regla está escrita tres veces en el
 * camino de este dato: la casilla del formulario, `publish_name` en la tabla
 * (0017) y el `case` sin `else` de la vista (0021), que devuelve nulo para que
 * la plantilla diga «anónima». Esta es la plantilla.
 */
const ANONYMOUS = "Donación anónima";

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
 * pueblo. El nombre sale primero; el importe y cuánto hace van en la misma
 * línea, con la inicial al lado: es la fila de la referencia, sin tarjeta.
 */
export function DonationLog({
  initial,
  scope,
  caseId,
  cityId,
  limit = DONATION_LOG_LIMIT,
  sort = "recientes",
  poll = true,
}: {
  initial: DonationLogEntry[];
  scope: Scope;
  caseId?: string;
  cityId?: string;
  limit?: number;
  sort?: DonationLogSort;
  /** Apagar el sondeo cuando la lista es de muestra y no hay API que la llene. */
  poll?: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [polled, setPolled] = useState<DonationLogEntry[] | null>(null);

  if (initial !== snapshot) {
    setSnapshot(initial);
    setPolled(null);
  }

  const rows = polled ?? initial;

  useEffect(() => {
    if (!poll) return;
    const params = new URLSearchParams({ limite: String(limit) });
    if (caseId) params.set("caso", caseId);
    if (cityId) params.set("ciudad", cityId);
    if (sort === "generosas") params.set("orden", sort);

    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const response = await fetch(`/api/donaciones?${params.toString()}`);
        if (!response.ok) return;
        const body = (await response.json()) as { donations?: DonationLogEntry[] };
        setPolled(body.donations ?? []);
      } catch {
        // Una caída de red no borra lo que ya se veía.
      }
    };

    const timer = window.setInterval(tick, DONATION_LOG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [caseId, cityId, limit, poll, sort]);

  if (rows.length === 0) {
    return (
      <p className="text-[14px] leading-relaxed text-muted">
        Todavía no hay donaciones confirmadas. Cuando entre la primera, aparecerá aquí.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line" aria-live="polite">
      {rows.map((row) => (
        <li key={row.id}>
          <DonationEntry row={row} scope={scope} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Recientes o las que más pusieron. Vive en la URL para que se pueda compartir
 * y para que, sin JavaScript, el enlace siga recortando la lista.
 */
export function DonationLogSortNav({ active }: { active: DonationLogSort }) {
  const items: { id: DonationLogSort; label: string; href: string }[] = [
    { id: "recientes", label: "Recientes", href: "/#donaciones" },
    { id: "generosas", label: "Más generosas", href: "/?donaciones=generosas#donaciones" },
  ];

  return (
    <nav aria-label="Orden de las donaciones" className="mt-4 flex gap-2">
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected
                ? "bg-ink font-medium text-paper"
                : "border border-line bg-panel-high text-body hover:border-line-strong hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function donorInitial(name: string): string {
  return personInitials(name).slice(0, 1) || name.trim().charAt(0).toUpperCase();
}

function DonationEntry({ row, scope }: { row: DonationLogEntry; scope: Scope }) {
  const named = row.donor_name?.trim() ?? "";
  const who = named || ANONYMOUS;

  return (
    <article className="flex gap-3 py-3.5">
      {/* Sin nombre, el círculo se queda sin letra. Es lo que hay: la inicial de
          «Donación anónima» sería una A que se lee como el nombre de alguien. */}
      <span
        aria-hidden
        className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-land font-display text-[14px] text-ink"
      >
        {named ? donorInitial(named) : ""}
      </span>

      <div className="min-w-0 flex-1">
        <h3
          className={`text-[15px] leading-snug ${
            named ? "font-medium text-ink" : "text-muted"
          }`}
        >
          {who}
        </h3>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-display text-[17px] leading-snug tabular-nums text-ink">
          {formatCOP(row.amount_cop)}
          <span className="font-sans text-[12px] font-normal text-faint" suppressHydrationWarning>
            {timeAgo(row.donated_at)}
          </span>
        </p>

        {/* A dónde fue. En la ficha de una causa no se repite su nombre, y en un
            municipio no se nombra el pueblo. Al fondo general no se le pone
            enlace a la causa que no tiene: se dice lo que es y se remite a la
            página donde se explica qué hace el equipo con ese dinero. */}
        {scope !== "case" && row.destination === "fondo" && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Al{" "}
            <Link href="/donaciones" className="text-body underline-offset-2 hover:underline">
              fondo general
            </Link>
          </p>
        )}

        {scope !== "case" && row.destination === "causa" && row.case_id && (
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
    </article>
  );
}
