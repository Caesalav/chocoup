import Link from "next/link";
import { updateOffer } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { CategoryChip, OfferStatusChip } from "@/components/ui/Chip";
import { eyebrow, field, panel } from "@/components/ui/styles";
import { getNeedOptions, getOffers } from "@/lib/admin-data";
import { OFFER_STATUSES } from "@/lib/constants";
import { contactHref, formatDateTime, formatDay } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { OfferStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "todas", label: "Todas" },
] as const;

type Props = { searchParams: Promise<{ estado?: string }> };

export default async function OffersPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const active = FILTERS.some((filter) => filter.value === estado) ? estado! : "pendiente";
  const status = active === "todas" ? undefined : (active as OfferStatus);

  const [offers, needOptions, team] = await Promise.all([
    getOffers(status),
    getNeedOptions(),
    currentTeam(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className={eyebrow}>Ofertas del público</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Recursos ofrecidos</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Cada oferta trae un contacto que solo ve el equipo. Al aceptarla, escríbele y ponla en
        contacto con la fundación del municipio o con la familia.
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Cuando la ayuda llegue de verdad, anota el día. Eso —y solo eso— es lo que la publica en el{" "}
        <Link href="/ayudas" className="text-accent hover:underline">
          registro de ayudas
        </Link>
        . Ahí sale qué era, el mes y el municipio: no el día que anotas aquí, no a qué caso fue, no
        el contacto, y el nombre de quien la dio solo si lo autorizó.
      </p>
      {team?.role === "documentacion" && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Aquí ves las ofertas de los municipios que tienes asignados. Las que llegan sin municipio
          las reparte coordinación.
        </p>
      )}

      <nav className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/ofertas?estado=${filter.value}`}
            className={`smallcaps rounded-full px-4 py-1.5 text-[15px] transition-colors ${
              active === filter.value
                ? "bg-accent text-paper"
                : "border border-line text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {offers.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No hay ofertas en esta bandeja.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {offers.map((offer) => {
            const href = contactHref(offer.offerer_contact);

            return (
              <li key={offer.id} className={`${panel} p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <OfferStatusChip status={offer.status} />
                  <CategoryChip category={offer.category} />
                  {offer.delivered_on && (
                    <span className="text-xs text-accent-strong">
                      Llegó el {formatDay(offer.delivered_on)}
                    </span>
                  )}
                  <span className="text-xs text-faint">{formatDateTime(offer.created_at)}</span>
                </div>

                <h2 className="mt-2 font-display text-xl leading-tight text-ink">
                  {offer.resource}
                </h2>

                <p className="mt-1 text-sm text-ink">
                  {offer.offerer_name} ·{" "}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-accent hover:underline"
                    >
                      {offer.offerer_contact}
                    </a>
                  ) : (
                    <span className="text-muted">{offer.offerer_contact}</span>
                  )}
                </p>

                {offer.message && (
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
                    {offer.message}
                  </p>
                )}

                <dl className="mt-3 space-y-1 text-xs text-muted">
                  {offer.needs && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0">Necesidad</dt>
                      <dd className="text-ink">{offer.needs.title}</dd>
                    </div>
                  )}
                  {offer.cases && (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0">Caso</dt>
                      <dd className="text-ink">{offer.cases.display_name}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0">Municipio</dt>
                    <dd className="text-ink">
                      {offer.cities ? (
                        <Link
                          href={`/admin/ciudades/${offer.cities.slug}`}
                          className="hover:underline"
                        >
                          {offer.cities.name}
                        </Link>
                      ) : (
                        "Sin municipio"
                      )}
                    </dd>
                  </div>
                </dl>

                <form action={updateOffer} className="mt-4 space-y-3 border-t border-line pt-3">
                  <input type="hidden" name="id" value={offer.id} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className={field.label}>Estado</span>
                      <select name="status" defaultValue={offer.status} className={field.select}>
                        {OFFER_STATUSES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className={field.label}>Vincular a necesidad</span>
                      <select
                        name="need_id"
                        defaultValue={offer.need_id ?? "sin-vinculo"}
                        className={field.select}
                      >
                        <option value="sin-vinculo">Sin vincular</option>
                        {offer.needs && !needOptions.some((need) => need.id === offer.needs?.id) && (
                          <option value={offer.needs.id}>{offer.needs.title} (cubierta)</option>
                        )}
                        {needOptions.map((need) => (
                          <option key={need.id} value={need.id}>
                            {need.cityName}
                            {need.caseName ? ` · ${need.caseName}` : ""} · {need.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* La fecha es lo único que convierte una promesa en una ayuda
                      registrada. Va con máximo de hoy: el registro público es de
                      lo que ya llegó, no de lo que va a llegar. El día exacto se
                      queda en esta bandeja; fuera solo sale el mes. */}
                  <label className="block">
                    <span className={field.label}>¿Qué día llegó?</span>
                    <input
                      type="date"
                      name="delivered_on"
                      max={today}
                      defaultValue={offer.delivered_on ?? ""}
                      className={field.input}
                    />
                    <span className={field.hint}>
                      Déjalo vacío mientras siga siendo una promesa. Al poner fecha, la oferta queda
                      como aceptada y la entrega sale en el registro público con el mes, no con el
                      día. Lo que sí se publica tal cual es el texto de la oferta: si ese texto
                      señala a una persona concreta, háblalo antes de marcarla.
                    </span>
                  </label>

                  <label className="block">
                    <span className={field.label}>Notas del equipo</span>
                    <textarea
                      name="team_notes"
                      rows={2}
                      defaultValue={offer.team_notes}
                      className={field.textarea}
                      placeholder="Quién llamó, qué se acordó, cuándo llega"
                    />
                  </label>

                  {/* La autorización la marca quien ofrece, en su formulario, y el
                      equipo no la puede marcar por ella. Al revés sí: alguien
                      llama y pide que le quiten el nombre, y eso tiene que poder
                      hacerse en el momento. */}
                  {offer.publish_name ? (
                    <label className={field.checkboxRow}>
                      <input type="checkbox" name="revoke_name" className={field.checkbox} />
                      <span>
                        Quitar su nombre del registro público
                        <span className="mt-0.5 block text-xs text-muted">
                          Autorizó aparecer como{" "}
                          <span className="text-ink">{offer.offerer_name}</span>. Marca esto si pide
                          que lo quitemos.
                        </span>
                      </span>
                    </label>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted">
                      No autorizó que se publique su nombre, así que la entrega aparecerá sin él.
                      Solo puede autorizarlo la persona, desde el formulario.
                    </p>
                  )}

                  <SubmitButton variant="secondary">Guardar</SubmitButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
