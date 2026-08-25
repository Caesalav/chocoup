import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TownIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { getFoundations } from "@/lib/admin-data";
import { NEED_CATEGORIES } from "@/lib/constants";
import { formatDate, plural } from "@/lib/format";
import { FOUNDATIONS_PATH } from "@/lib/admin-sections";
import type { Foundation, FoundationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<FoundationStatus, string> = {
  pendiente: "Pendiente",
  verificada: "Verificada",
  descartada: "Descartada",
};

/** Pendiente llama la atención; descartada se apaga. Verificada es lo normal. */
const STATUS_TONE: Record<FoundationStatus, string> = {
  pendiente: "bg-need-high-soft text-need-high",
  verificada: "bg-brote text-selva",
  descartada: "bg-canvas text-faint",
};

type Props = {
  searchParams: Promise<{ estado?: string; q?: string }>;
};

function isStatus(value: string | undefined): value is FoundationStatus {
  return value === "pendiente" || value === "verificada" || value === "descartada";
}

/**
 * Las fundaciones que se han apuntado, para revisarlas.
 *
 * No es la bandeja de ofertas y por eso no vive dentro de ella: aquí cada fila
 * se abre, se corrige y se marca. La lista existe para contestar una pregunta
 * que la bandeja no puede —«¿qué organizaciones tenemos comprobadas y dónde
 * trabajan?»—, así que lo primero que se ve de cada una es su estado y su
 * cobertura, no cuándo escribió.
 */
export default async function FoundationsPage({ searchParams }: Props) {
  const { estado, q: rawQ } = await searchParams;
  const status = isStatus(estado) ? estado : "";
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);

  const all = await getFoundations();
  const counts = {
    pendiente: all.filter((row) => row.status === "pendiente").length,
    verificada: all.filter((row) => row.status === "verificada").length,
    descartada: all.filter((row) => row.status === "descartada").length,
  };

  const rows = all
    .filter((row) => (status ? row.status === status : true))
    .filter((row) => {
      if (!q) return true;
      return [
        row.legal_name,
        row.display_name,
        row.nit,
        row.contact_name,
        row.email,
        row.city_name,
        row.coverage,
        row.focus,
        row.offering,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/recursos"
        backLabel="Ofertas"
        title="Fundaciones"
        Icon={TownIcon}
        description="Organizaciones y colectivos que se ofrecen a ayudar. Se comprueban, se editan y se marcan. No reciben dinero por el portal."
      />

      <nav aria-label="Estado" className="mt-8 flex flex-wrap gap-2">
        {[
          { value: "", label: "Todas", count: all.length },
          { value: "pendiente", label: "Pendientes", count: counts.pendiente },
          { value: "verificada", label: "Verificadas", count: counts.verificada },
          { value: "descartada", label: "Descartadas", count: counts.descartada },
        ].map((tab) => {
          const href = tab.value
            ? `${FOUNDATIONS_PATH}?estado=${tab.value}`
            : FOUNDATIONS_PATH;
          const selected = status === tab.value;
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] ${
                selected ? "bg-ink text-paper" : "border border-line text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 tabular-nums ${selected ? "text-paper/70" : "text-faint"}`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <form className={`${panel} mt-6 p-4 sm:p-5`} action={FOUNDATIONS_PATH} method="get">
        {status && <input type="hidden" name="estado" value={status} />}
        <label className="block">
          <span className={field.label}>Buscar</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nombre, NIT, municipio, lo que ofrecen…"
            className={field.input}
          />
        </label>
        <button type="submit" className="mt-4 text-[14px] font-medium text-accent hover:underline">
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {plural(rows.length, "fundación", "fundaciones")}
        {q || status ? " con este filtro" : ""}
      </p>

      {rows.length === 0 ? (
        <p className={`${panel} mt-4 p-5 text-sm leading-relaxed text-muted`}>
          Todavía no se ha apuntado ninguna. El formulario está en la landing y en
          /ofrecer, en «Fundación».
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <FoundationRow foundation={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FoundationRow({ foundation }: { foundation: Foundation }) {
  const name = foundation.display_name.trim() || foundation.legal_name;
  const category = NEED_CATEGORIES.find((item) => item.value === foundation.category);

  return (
    <Link
      href={`${FOUNDATIONS_PATH}/${foundation.id}`}
      className={`${panel} block p-4 transition-colors hover:border-line-strong`}
    >
      <p className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
            STATUS_TONE[foundation.status]
          }`}
        >
          {STATUS_LABEL[foundation.status]}
        </span>
        <span className="text-[12px] text-faint">{formatDate(foundation.created_at)}</span>
      </p>

      <h2 className="mt-1.5 font-display text-[20px] leading-tight text-ink">{name}</h2>
      {foundation.display_name.trim() && (
        <p className="text-[12px] text-faint">{foundation.legal_name}</p>
      )}

      <p className="mt-1 text-sm text-muted">
        {foundation.contact_name}
        {foundation.city_name && ` · ${foundation.city_name}`}
        {category && ` · ${category.label}`}
        {foundation.nit ? ` · NIT ${foundation.nit}` : " · sin NIT"}
      </p>

      {foundation.offering && (
        <p className="mt-2 text-[14px] leading-relaxed text-body">{foundation.offering}</p>
      )}
      {foundation.coverage && (
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Trabaja en {foundation.coverage}
        </p>
      )}
    </Link>
  );
}
