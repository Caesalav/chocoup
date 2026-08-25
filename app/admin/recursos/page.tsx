import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PledgeIcon, SearchIcon } from "@/components/ui/icons";
import { field, panel } from "@/components/ui/styles";
import { getSupportOffers } from "@/lib/admin-data";
import { SIGNUPS_PATH } from "@/lib/admin-sections";
import { NEED_CATEGORIES } from "@/lib/constants";
import { contactHref, formatDate, plural } from "@/lib/format";
import { FOUNDATIONS_PATH } from "@/lib/admin-sections";
import { OFFER_KINDS, type OfferKind } from "@/lib/support";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string; q?: string; lugar?: string; orden?: string; categoria?: string }>;
};

/**
 * `OfferKind` y no `SupportOfferKind`: las fundaciones no entran en esta
 * bandeja. Sus filas están en otra tabla (0026) y se gestionan en su propia
 * pantalla, así que una pestaña aquí enseñaría siempre cero.
 */
function isKind(value: string | undefined): value is OfferKind {
  return value === "voluntario" || value === "profesion" || value === "recurso";
}

function isSort(value: string | undefined): value is "fecha" | "nombre" | "lugar" | "oferta" {
  return value === "fecha" || value === "nombre" || value === "lugar" || value === "oferta";
}

export default async function ResourcesPage({ searchParams }: Props) {
  const { tab, q: rawQ, lugar: rawPlace, orden: rawSort, categoria: rawCategory } = await searchParams;
  const kind: OfferKind = isKind(tab) ? tab : "voluntario";
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);
  const place = (rawPlace ?? "").trim().toLowerCase().slice(0, 80);
  const sort = isSort(rawSort) ? rawSort : "fecha";
  const category = (rawCategory ?? "").trim();

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
  const rows = byKind[kind]
    .filter((row) => {
      if (place && !row.city_name.toLowerCase().includes(place)) return false;
      if (kind === "recurso" && category && row.category !== category) return false;
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
    })
    .sort((a, b) => {
      if (sort === "nombre") return a.person_name.localeCompare(b.person_name, "es");
      if (sort === "lugar") return a.city_name.localeCompare(b.city_name, "es");
      if (sort === "oferta") {
        const left = kind === "profesion" ? a.profession : kind === "recurso" ? a.resource : a.skills;
        const right = kind === "profesion" ? b.profession : kind === "recurso" ? b.resource : b.skills;
        return left.localeCompare(right, "es");
      }
      return b.created_at.localeCompare(a.created_at);
    });

  const queryFor = (next: {
    tab?: string;
    q?: string;
    lugar?: string;
    orden?: string;
    categoria?: string;
  }) => {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? kind;
    if (nextTab !== "voluntario") params.set("tab", nextTab);
    const nextQ = next.q ?? q;
    if (nextQ) params.set("q", nextQ);
    const nextPlace = next.lugar ?? place;
    if (nextPlace) params.set("lugar", nextPlace);
    const nextSort = next.orden ?? sort;
    if (nextSort !== "fecha") params.set("orden", nextSort);
    const nextCategory = next.categoria ?? category;
    if (nextCategory) params.set("categoria", nextCategory);
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
        Lo que la gente deja en /ofrecer. No se acepta ni se niega: se busca y se llama. Las{" "}
        <Link href={FOUNDATIONS_PATH} className="text-accent hover:underline">
          fundaciones
        </Link>{" "}
        van aparte, porque esas sí se revisan y se editan. Los avisos de correo siguen en{" "}
        <Link href={SIGNUPS_PATH} className="text-accent hover:underline">
          avisos
        </Link>
        .
      </p>

      <nav aria-label="Tipo de oferta" className="mt-8 flex flex-wrap gap-2">
        {OFFER_KINDS.map((entry) => (
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
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={field.label}>Orden</span>
            <select name="orden" defaultValue={sort} className={field.select}>
              <option value="fecha">Más recientes</option>
              <option value="nombre">Nombre</option>
              <option value="lugar">Lugar</option>
              <option value="oferta">Lo ofrecido</option>
            </select>
          </label>
          {kind === "recurso" ? (
            <label className="block">
              <span className={field.label}>Categoría</span>
              <select name="categoria" defaultValue={category} className={field.select}>
                <option value="">Todas</option>
                {NEED_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="categoria" value="" />
          )}
        </div>
        <button type="submit" className="mt-4 text-[14px] font-medium text-accent hover:underline">
          Filtrar
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {plural(rows.length, "oferta", "ofertas")}
        {q || place || category ? " con este filtro" : ` en ${OFFER_KINDS.find((entry) => entry.value === kind)?.label.toLowerCase()}`}
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
