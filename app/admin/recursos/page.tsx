import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { OfferCard } from "@/components/admin/OfferCard";
import { PledgeIcon, SearchIcon } from "@/components/ui/icons";
import { button, field } from "@/components/ui/styles";
import { getNeedOptions, getOffers } from "@/lib/admin-data";
import { SIGNUPS_PATH } from "@/lib/admin-sections";
import { NEED_CATEGORIES } from "@/lib/constants";
import { plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { OfferStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "pendiente", label: "Sin revisar" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "rechazada", label: "Negadas" },
  { value: "retirada", label: "Retiradas" },
  { value: "todas", label: "Todas" },
] as const;

type Props = {
  searchParams: Promise<{ estado?: string; q?: string; etiqueta?: string }>;
};

function matchesQuery(
  offer: Awaited<ReturnType<typeof getOffers>>[number],
  q: string,
  tag: string,
) {
  if (tag && offer.category !== tag) return false;
  if (!q) return true;
  const haystack = [
    offer.resource,
    offer.offerer_name,
    offer.offerer_contact,
    offer.message,
    offer.cities?.name,
    offer.cases?.display_name,
    offer.needs?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default async function ResourcesPage({ searchParams }: Props) {
  const { estado, q: rawQ, etiqueta } = await searchParams;
  const active = FILTERS.some((filter) => filter.value === estado) ? estado! : "pendiente";
  const status = active === "todas" ? undefined : (active as OfferStatus);
  const q = (rawQ ?? "").trim().toLowerCase().slice(0, 80);
  const tag = NEED_CATEGORIES.some((item) => item.value === etiqueta) ? etiqueta! : "";

  const [allOffers, needOptions, team] = await Promise.all([
    getOffers(status),
    getNeedOptions(),
    currentTeam(),
  ]);

  const offers = allOffers.filter((offer) => matchesQuery(offer, q, tag));
  const pending = active === "pendiente" ? allOffers.length : (await getOffers("pendiente")).length;

  const queryFor = (next: { estado?: string; q?: string; etiqueta?: string }) => {
    const params = new URLSearchParams();
    const nextEstado = next.estado ?? active;
    if (nextEstado !== "pendiente") params.set("estado", nextEstado);
    const nextQ = next.q ?? q;
    if (nextQ) params.set("q", nextQ);
    const nextTag = next.etiqueta === undefined ? tag : next.etiqueta;
    if (nextTag) params.set("etiqueta", nextTag);
    const qs = params.toString();
    return qs ? `/admin/recursos?${qs}` : "/admin/recursos";
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin"
        backLabel="Panel del equipo"
        title="Verificación de recursos"
        Icon={PledgeIcon}
        description={
          <>
            Llama, comprueba que es legítimo y acepta o niega. Eso decide qué se publica en{" "}
            <Link href="/ofrecido" className="text-accent hover:underline">
              el muro
            </Link>
            . El nombre solo sale si la persona lo autorizó y tú ya aceptaste.
            {team?.role !== "documentacion" && (
              <>
                {" "}
                Los correos de avisos están en{" "}
                <Link href={SIGNUPS_PATH} className="text-accent hover:underline">
                  la lista
                </Link>
                .
              </>
            )}
          </>
        }
        actions={
          <Link href="/admin/recursos/nuevo" className={button.primary}>
            Añadir recurso
          </Link>
        }
      />

      <div className="mt-8 rounded-xl border border-line bg-panel p-4 sm:p-5">
        <form action="/admin/recursos" method="get">
          {active !== "pendiente" && <input type="hidden" name="estado" value={active} />}
          {tag && <input type="hidden" name="etiqueta" value={tag} />}
          <label className="block">
            <span className={field.label}>Buscar</span>
            <span className="relative mt-2 block">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Nombre, recurso, municipio, caso…"
                enterKeyHint="search"
                className={`${field.input} mt-0 pl-10`}
              />
            </span>
          </label>
        </form>

        <nav aria-label="Bandejas" className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={queryFor({ estado: filter.value })}
              aria-current={active === filter.value ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[14px] transition-colors ${
                active === filter.value
                  ? "bg-accent text-paper"
                  : "border border-line text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {filter.label}
              {filter.value === "pendiente" && pending > 0 && (
                <span
                  className={`tabular-nums ${
                    active === "pendiente" ? "text-paper/80" : "text-need-mid-strong"
                  }`}
                >
                  {pending}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href={queryFor({ etiqueta: "" })}
            className={`rounded-full px-3 py-1.5 text-[12px] ${
              !tag ? "bg-ink text-paper" : "border border-line text-muted hover:text-ink"
            }`}
          >
            Todas las etiquetas
          </Link>
          {NEED_CATEGORIES.map((item) => (
            <Link
              key={item.value}
              href={queryFor({ etiqueta: item.value })}
              className={`rounded-full px-3 py-1.5 text-[12px] ${
                tag === item.value
                  ? "bg-ink text-paper"
                  : "border border-line text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted">
        {offers.length === 0
          ? q || tag
            ? "Ningún recurso coincide con esa búsqueda."
            : "No hay recursos en esta bandeja."
          : `${plural(offers.length, "recurso", "recursos")}${
              q || tag ? " que coinciden" : ""
            }.`}
      </p>

      {offers.length > 0 && (
        <ul className="mt-4 space-y-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} needOptions={needOptions} />
          ))}
        </ul>
      )}
    </div>
  );
}
