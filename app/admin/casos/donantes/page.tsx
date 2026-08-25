import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { DonationReconcile } from "@/components/admin/DonationReconcile";
import { DonationIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getAdminDonations, getPaymentNotices } from "@/lib/admin-data";
import { formatCOP, formatDate, plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { AdminDonation, DonationStatus, PaymentNotice } from "@/lib/types";

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
 * Quién donó, cuánto, cuándo y a qué causa. Solo coordinación.
 *
 * Lee la tabla cerrada, no el registro público: aquí sí salen las pendientes,
 * el nombre aunque no se publique, y la referencia del pago. Un importe no se
 * puede teclear —0017 lo impide—: entra porque Mercado Pago lo dice, avisando
 * (webhook) o contestando (conciliación).
 *
 * ---------------------------------------------------------------------------
 * LAS TRES COSAS QUE ESTA PANTALLA APRENDIÓ EL 23 DE AGOSTO
 *
 * Ese día dos personas escribieron que habían donado y no aparecía nada. Había
 * ocho pagos cobrados en la pasarela, $1.125.000, y la tabla vacía. Esta
 * pantalla no servía para averiguarlo, y por tres motivos distintos:
 *
 *   1. NO ENSEÑABA EL FONDO. `getAdminDonations` descartaba toda fila sin causa
 *      resuelta, así que una donación al fondo general no llegaba aquí nunca.
 *   2. NO DECÍA CUÁNTO HAY. Sin un total, «faltan donaciones» no se puede ni
 *      formular: hay que poder comparar con el extracto de un vistazo.
 *   3. NO SABÍA LO QUE NO TENÍA. Una lista solo puede hablar de sus filas. Lo
 *      que hacía falta era la diferencia con la pasarela, y eso son las otras
 *      dos secciones: conciliar, y la bitácora de avisos.
 * ---------------------------------------------------------------------------
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

  const [rows, notices] = await Promise.all([getAdminDonations(), getPaymentNotices(30)]);

  const confirmed = rows.filter((row) => row.status === "confirmada");
  const confirmedCop = confirmed.reduce((sum, row) => sum + row.amount_cop, 0);

  const filtered = rows
    .filter((row) => (status ? row.status === status : true))
    .filter((row) => {
      if (!q) return true;
      const haystack = [
        row.donor_name,
        row.case_name ?? "Fondo general",
        row.city_name ?? "",
        row.payment_ref,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      if (sort === "importe") return b.amount_cop - a.amount_cop;
      return (b.settled_at ?? b.created_at).localeCompare(a.settled_at ?? a.created_at);
    });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/casos"
        backLabel="Casos"
        title="Donantes"
        Icon={DonationIcon}
        description="Quien donó, cuánto, cuándo y a qué causa. El registro público solo enseña las confirmadas, y el nombre solo si se autorizó."
      />

      {/* El total va arriba y antes de los filtros: es la cifra que se compara
          con el extracto de Mercado Pago, y es lo que convierte esta pantalla en
          algo con lo que se puede cuadrar. */}
      <section className={`${panel} mt-6 p-5`}>
        <p className="text-[13px] text-muted">Confirmado en el portal</p>
        <p className="mt-1 font-display text-[32px] leading-tight tabular-nums text-ink">
          {formatCOP(confirmedCop)}
        </p>
        <p className="mt-1 text-[13px] text-muted">
          {plural(confirmed.length, "donación confirmada", "donaciones confirmadas")}
          {rows.length !== confirmed.length && (
            <> · {rows.length - confirmed.length} en otro estado</>
          )}
        </p>
      </section>

      <DonationReconcile />

      <form className={`${panel} mt-6 p-4 sm:p-5`} action="/admin/casos/donantes" method="get">
        <label className="block">
          <span className="text-[12px] font-medium text-muted">Buscar</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nombre, causa, municipio, pago…"
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
          Ninguna con este filtro. Si esperabas una que sí se cobró, búscala
          arriba con «Conciliar con Mercado Pago».
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((row) => (
            <li key={row.id}>
              <DonationRow row={row} />
            </li>
          ))}
        </ul>
      )}

      <NoticeLog notices={notices} />
    </div>
  );
}

/**
 * Una donación como se lee para conciliar.
 *
 * El destino se dice siempre, y cuando es el fondo se dice con palabras y sin
 * enlace: aquí había un `<Link>` a `/admin/ciudades/${city_slug}/casos/${case_id}`
 * escrito sin comprobar nada, que en una donación al fondo —las dos columnas
 * nulas— habría apuntado a `/admin/ciudades/null/casos/null`.
 */
function DonationRow({ row }: { row: AdminDonation }) {
  return (
    <article className={`${panel} p-4`}>
      <p className="text-[12px] text-faint">
        {formatDate(row.settled_at ?? row.created_at)} · {STATUS_LABEL[row.status]}
        {row.source === "conciliacion" && " · conciliada"}
      </p>
      <p className="mt-1 font-display text-[20px] leading-tight tabular-nums text-ink">
        {formatCOP(row.amount_cop)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {row.donor_name.trim()
          ? row.publish_name
            ? row.donor_name
            : `${row.donor_name} (no se publica)`
          : "Anónima"}
      </p>

      {row.destination === "fondo" ? (
        <p className="mt-1 text-[13px] text-body">Al fondo general</p>
      ) : row.case_id && row.city_slug ? (
        <p className="mt-1 text-[13px] text-body">
          <Link
            href={`/admin/ciudades/${row.city_slug}/casos/${row.case_id}`}
            className="text-accent hover:underline"
          >
            {row.case_name}
          </Link>
          {row.city_name && ` · ${row.city_name}`}
        </p>
      ) : (
        /* Una donación a una causa cuya causa no se pudo leer. No debería
           ocurrir —la clave ajena lo impide—, y si ocurre hay que verlo aquí y
           no en una lista que la descarta en silencio, que es lo que hacía. */
        <p className="mt-1 text-[13px] text-need-high">
          A una causa que no se pudo leer. Referencia del pago: {row.payment_ref}
        </p>
      )}
    </article>
  );
}

/**
 * Los últimos avisos que llegaron de la pasarela (0025).
 *
 * Es la sección que contesta «¿llegó el aviso de este pago?», que el 23 de
 * agosto no se podía contestar de ninguna forma. Va al final porque solo se
 * mira cuando algo no cuadra, y sin recortar por estado: un aviso rechazado es
 * exactamente el que hay que ver.
 */
function NoticeLog({ notices }: { notices: PaymentNotice[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-[20px] leading-tight text-ink">
        Avisos de la pasarela
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-muted">
        Cada llamada de Mercado Pago al portal, con lo que se hizo con ella. Sin
        nombres ni correos: identificadores, horas y resultados.
      </p>

      {notices.length === 0 ? (
        <p className={`${panel} mt-4 p-5 text-sm leading-relaxed text-muted`}>
          Todavía no ha entrado ningún aviso desde que se puso la bitácora. Si
          hay pagos cobrados y esto sigue vacío, la pasarela no está llamando al
          portal: revisa la URL de notificaciones en el panel de Mercado Pago.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {notices.map((notice) => (
            <li key={notice.id} className="rounded-lg border border-line bg-panel-high p-3">
              <p className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                <span className="font-medium text-ink">{notice.outcome}</span>
                <span className="text-faint">{formatDate(notice.received_at)}</span>
                <span
                  className={
                    notice.signature === "valida" ? "text-muted" : "text-need-high"
                  }
                >
                  firma {notice.signature}
                </span>
              </p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                {notice.payment_ref ? `pago ${notice.payment_ref}` : "sin identificador"}
                {notice.kind && ` · ${notice.kind}`}
                {notice.detail && ` · ${notice.detail}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
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
