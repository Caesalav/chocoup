import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PledgeIcon, SearchIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { getSupportOffers } from "@/lib/admin-data";
import { SIGNUPS_PATH } from "@/lib/admin-sections";
import { NEED_CATEGORIES } from "@/lib/constants";
import { contactHref, formatDate, plural } from "@/lib/format";
import { SUPPORT_KINDS } from "@/lib/support";
import type { SupportOfferKind } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string; q?: string; lugar?: string }>;
};

function isKind(value: string | undefined): value is SupportOfferKind {
  return value === "voluntario" || value === "profesion" || value === "recurso";
}

export default async function ResourcesPage({ searchParams }: Props) {
  const { tab, q: rawQ, lugar: rawPlace } = await searchParams;
  const kind: SupportOfferKind = isKind(tab) ? tab : "voluntario";
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);
  const place = (rawPlace ?? "").trim().toLowerCase().slice(0, 80);

  const [volunteers, professions, resources] = await Promise.all([
    getSupportOffers("voluntario"),
    getSupportOffers("profesion"),
    getSupportOffers("recurso"),
  ]);

  const byKind = { voluntario: volunteers, profesion: professions, recurso: resources };
  const counts = {
    voluntario: volunteers.length,
    profesion: professions.length,
    recurso: resources.length,
  };
  const rows = byKind[kind].filter((row) => {
    if (place && !row.city_name.toLowerCase().includes(place)) return false;
    if (!q) return true;
    const haystack = [
      row.person_name,
      row.contact,
      row.email,
      row.city_name,
      row.message,
      row.skills,
      row.profession,
      row.resource,
      row.availability,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const queryFor = (next: { tab?: string; q?: string; lugar?: string }) => {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? kind;
    if (nextTab !== "voluntario") params.set("tab", nextTab);
    const nextQ = next.q ?? q;
    if (nextQ) params.set("q", nextQ);
    const nextPlace = next.lugar ?? place;
    if (nextPlace) params.set("lugar", nextPlace);
    const qs = params.toString();
    return qs ? `/admin/recursos?${qs}` : "/admin/recursos";
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin"
        backLabel="Panel"
        title="Ofertas recibidas"
        Icon={PledgeIcon}
      />
      <p className="mt-3 max-w-prose text-[14px] leading-relaxed text-muted">
        Lo que la gente deja en /ofrecer. No se acepta ni se niega: se busca y se llama. Los avisos
        de correo siguen en{" "}
        <Link href={SIGNUPS_PATH} className="text-accent hover:underline">
          avisos
        </Link>
        .
      </p>

      <nav aria-label="Tipo de oferta" className="mt-8 flex flex-wrap gap-2">
        {SUPPORT_KINDS.map((entry) => (
          <Link
            key={entry.value}
            href={queryFor({ tab: entry.value })}
            aria-current={kind === entry.value ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 text-[14px] ${
              kind === entry.value
                ? "bg-ink text-paper"
                : "border border-line text-muted hover:text-ink"
            }`}
          >
            {entry.label}
            <span className={`ml-2 tabular-nums ${kind === entry.value ? "text-paper/70" : "text-faint"}`}>
              {counts[entry.value]}
            </span>
          </Link>
        ))}
      </nav>

      <form className={`${panel} mt-6 p-4 sm:p-5`} action="/admin/recursos" method="get">
        <input type="hidden" name="tab" value={kind} />
        <label className="block">
          <span className={field.label}>Buscar</span>
          <span className="relative mt-2 block">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nombre, teléfono, tejas, médica…"
              className={`${field.input} mt-0 pl-10`}
            />
          </span>
        </label>
        <label className="mt-4 block">
          <span className={field.label}>Lugar</span>
          <input
            type="search"
            name="lugar"
            defaultValue={place}
            placeholder="Quibdó, Medellín…"
            className={field.input}
          />
        </label>
        <button type="submit" className="mt-4 text-[14px] font-medium text-accent hover:underline">
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {plural(rows.length, "oferta", "ofertas")}
        {q || place ? " con este filtro" : ` en ${SUPPORT_KINDS.find((entry) => entry.value === kind)?.label.toLowerCase()}`}
      </p>

      {rows.length === 0 ? (
        <p className={`${panel} mt-4 p-5 text-sm text-muted`}>Todavía no hay nada en esta pestaña.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className={`${panel} p-4`}>
              <p className="text-[12px] text-faint">{formatDate(row.created_at)}</p>
              <h2 className="mt-1 font-display text-[20px] leading-tight text-ink">{row.person_name}</h2>
              <p className="mt-1 text-sm text-muted">
                {contactHref(row.contact) ? (
                  <a href={contactHref(row.contact)!} className="text-accent hover:underline">
                    {row.contact}
                  </a>
                ) : (
                  row.contact
                )}
                {row.email && ` · ${row.email}`}
                {row.city_name && ` · ${row.city_name}`}
              </p>
              {kind === "voluntario" && (
                <p className="mt-3 text-[14px] leading-relaxed text-body">
                  {row.skills}
                  {row.availability && ` · ${row.availability}`}
                  {row.has_transport && " · Tiene transporte"}
                </p>
              )}
              {kind === "profesion" && (
                <p className="mt-3 text-[14px] leading-relaxed text-body">
                  {row.profession}
                  {row.modality && ` · ${row.modality}`}
                  {row.experience && `. ${row.experience}`}
                </p>
              )}
              {kind === "recurso" && (
                <p className="mt-3 text-[14px] leading-relaxed text-body">
                  {row.resource}
                  {row.quantity && ` · ${row.quantity}`}
                  {row.condition && ` · ${row.condition}`}
                  {row.category &&
                    ` · ${NEED_CATEGORIES.find((item) => item.value === row.category)?.label ?? row.category}`}
                  {row.can_deliver && " · Puede llevarlo"}
                </p>
              )}
              {row.message && (
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{row.message}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
