import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DonationIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getAdminDonations } from "@/lib/admin-data";
import { formatCOP, formatDate, plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { DonationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<DonationStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  fallida: "Fallida",
  reembolsada: "Reembolsada",
};

type Props = {
  searchParams: Promise<{ q?: string; estado?: string; orden?: string }>;
};

/**
 * Quién donó, a qué causa y cuánto. Solo coordinación.
 *
 * Lee la tabla cerrada, no el registro público: aquí sí salen las pendientes,
 * el nombre aunque no se publique, y la referencia del pago. Un importe no se
 * puede teclear a mano —0017 lo impide—: entra cuando Mercado Pago lo confirma.
 */
export default async function DonorsPage({ searchParams }: Props) {
  const session = await currentTeam();

  if (session?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader
          backHref="/admin/casos"
          backLabel="Casos"
          title="Esta lista es de coordinación"
          Icon={DonationIcon}
        />
        <p className="mt-8 max-w-prose text-[14px] leading-relaxed text-muted">
          Son importes y nombres de quien donó. La base de datos no le concede la
          lectura a ninguna cuenta fuera de coordinación.
        </p>
      </div>
    );
  }

  const { q: rawQ, estado: rawStatus, orden: rawSort } = await searchParams;
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);
  const status = isStatus(rawStatus) ? rawStatus : "";
  const sort = rawSort === "importe" ? "importe" : "fecha";

  const rows = await getAdminDonations();
  const filtered = rows
    .filter((row) => (status ? row.status === status : true))
    .filter((row) => {
      if (!q) return true;
      const haystack = [row.donor_name, row.case_name, row.city_name, row.payment_ref]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      if (sort === "importe") return b.amount_cop - a.amount_cop;
      return b.created_at.localeCompare(a.created_at);
    });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/casos"
        backLabel="Casos"
        title="Donantes"
        Icon={DonationIcon}
        description="Quien donó, a qué causa y en qué estado lo dejó el cobro. El registro público solo enseña las confirmadas, y el nombre solo si se autorizó."
      />

      <form className={`${panel} mt-6 p-4 sm:p-5`} action="/admin/casos/donantes" method="get">
        <label className="block">
          <span className="text-[12px] font-medium text-muted">Buscar</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nombre, causa, municipio…"
            className="mt-2 w-full rounded-lg border border-line bg-panel-high px-3 py-2.5 text-[15px] text-ink"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Estado</span>
            <select
              name="estado"
              defaultValue={status}
              className="select-chevron mt-2 block w-full appearance-none rounded-lg border border-line bg-panel-high py-2.5 pl-3.5 pr-10 text-[15px] text-ink"
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Orden</span>
            <select
              name="orden"
              defaultValue={sort}
              className="mt-2 w-full rounded-lg border border-line bg-panel-high px-3 py-2.5 text-[15px] text-ink"
            >
              <option value="fecha">Más recientes</option>
              <option value="importe">Mayor importe</option>
            </select>
          </label>
        </div>
        <button type="submit" className="mt-4 text-[14px] font-medium text-accent hover:underline">
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {plural(filtered.length, "donación", "donaciones")}
        {q || status ? " con este filtro" : ""}
      </p>

      {filtered.length === 0 ? (
        <p className={`${panel} mt-4 p-5 text-sm leading-relaxed text-muted`}>
          Todavía no ha llegado ninguna por la pasarela. Un importe no se teclea
          aquí: entra cuando Mercado Pago lo confirma.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((row) => (
            <li key={row.id} className={`${panel} p-4`}>
              <p className="text-[12px] text-faint">
                {formatDate(row.settled_at ?? row.created_at)} · {STATUS_LABEL[row.status]}
              </p>
              <p className="mt-1 font-display text-[20px] leading-tight text-ink">
                {formatCOP(row.amount_cop)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {row.donor_name.trim()
                  ? row.publish_name
                    ? row.donor_name
                    : `${row.donor_name} (no se publica)`
                  : "Anónima"}
              </p>
              <p className="mt-1 text-[13px] text-body">
                <Link
                  href={`/admin/ciudades/${row.city_slug}/casos/${row.case_id}`}
                  className="text-accent hover:underline"
                >
                  {row.case_name}
                </Link>
                {` · ${row.city_name}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function isStatus(value: string | undefined): value is DonationStatus {
  return (
    value === "pendiente" ||
    value === "confirmada" ||
    value === "fallida" ||
    value === "reembolsada"
  );
}
