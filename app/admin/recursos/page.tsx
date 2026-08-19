import Link from "next/link";
import { OfferCard } from "@/components/admin/OfferCard";
import { eyebrow, panel } from "@/components/ui/styles";
import { getNeedOptions, getOffers } from "@/lib/admin-data";
import { SIGNUPS_PATH } from "@/lib/admin-sections";
import { plural } from "@/lib/format";
import { currentTeam } from "@/lib/team";
import type { OfferStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Verificación, aceptación o negación de los recursos ofrecidos.
 *
 * El nombre largo es el de la sección y dice las tres cosas que se hacen aquí. Y
 * dice también algo que no es archivar: esta lista se valida para garantizar su
 * legitimidad y para saber qué mostrar, así que aceptar o negar no es ordenar una
 * bandeja, es decidir qué sale al muro público y con qué nombre.
 *
 * Es la única de las tres secciones cuyo trabajo no lo decide el equipo: llega
 * cuando llega, trae el teléfono de una persona ajena, y se resuelve el mismo día.
 * De ahí que la pantalla esté hecha de acciones y no de campos. El detalle de cómo
 * se resuelve una oferta en pocos toques está en `OfferCard`.
 */
const FILTERS = [
  { value: "pendiente", label: "Sin revisar" },
  { value: "aceptada", label: "Aceptadas" },
  { value: "rechazada", label: "Negadas" },
  { value: "retirada", label: "Retiradas" },
  { value: "todas", label: "Todas" },
] as const;

/**
 * «Retiradas» tiene bandeja propia y no se queda dentro de «Todas», porque una
 * baja de un toque tiene que poder deshacerse: sin este filtro, lo que se quita
 * del muro solo se vuelve a encontrar rebuscando en la lista entera, y un botón
 * que esconde lo que toca se usa con miedo. Va detrás de «Negadas» y delante de
 * «Todas», que es el recorrido de una oferta.
 *
 * La primera se llama «Sin revisar» y no «Pendientes» —el nombre del estado— porque
 * es lo que hay que hacer y no cómo se llama la columna: son las que están
 * publicadas en el muro sin que nadie las haya leído. Lleva además el número, que
 * es la respuesta a «¿qué me queda?» sin entrar en ninguna pestaña.
 *
 * «Negadas» y no «Rechazadas», que es como se llama el estado en la base de datos:
 * la palabra de esta sección es negar —está en su nombre y en su descripción— y los
 * botones dicen «Negar». La pastilla de cada tarjeta dice lo mismo desde que
 * `OFFER_STATUSES` (lib/constants.ts) lleva «Negada» como etiqueta de
 * `rechazada`; el valor guardado no cambió, porque es el de la base y nadie lo lee.
 * Aquí no queda ninguna costura: el nombre de la sección, la pestaña, el botón y la
 * pastilla dicen la misma palabra.
 */
type Props = { searchParams: Promise<{ estado?: string }> };

export default async function ResourcesPage({ searchParams }: Props) {
  const { estado } = await searchParams;
  const active = FILTERS.some((filter) => filter.value === estado) ? estado! : "pendiente";
  const status = active === "todas" ? undefined : (active as OfferStatus);

  const [offers, needOptions, team] = await Promise.all([
    getOffers(status),
    getNeedOptions(),
    currentTeam(),
  ]);

  // Cuántas quedan sin revisar, que es la pregunta con la que se abre esto y tiene
  // que poder contestarse desde cualquier pestaña. Con la bandeja de pendientes
  // abierta —que es donde se cae por omisión, o sea casi siempre— la lista de
  // arriba ya son ellas y no hace falta preguntar dos veces; en las otras cuatro se
  // paga una consulta más, y se paga aquí y no en un `Promise.all` que la haría
  // siempre.
  const pending = active === "pendiente" ? offers.length : (await getOffers("pendiente")).length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <Link href="/admin" className="text-sm text-muted hover:text-ink hover:underline">
        ← Panel del equipo
      </Link>

      <p className={`${eyebrow} mt-4`}>Panel del equipo</p>
      <h1 className="mt-1 font-display text-3xl leading-tight text-ink">
        Verificación, aceptación o negación de los recursos ofrecidos
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        Cada oferta trae un contacto que solo ve el equipo. Llama o escribe, comprueba que es
        legítimo, y acepta o niega: <span className="text-ink">eso decide qué se publica</span>.
        Cuando la ayuda llegue de verdad, anótalo.
      </p>

      {/* Los tres párrafos que estaban aquí seguidos, en tres renglones.
          Explicaban qué se publica de una oferta sin que nadie la haya leído, y esa
          información hay que tenerla ANTES de tocar el primer botón: no se puede
          esconder detrás de un desplegable. Pero tampoco puede ser lo primero y lo
          más largo de la pantalla, porque entonces se lee una vez y nunca más, y lo
          que hay debajo son decisiones sobre datos de gente. Tres frases con lo que
          cada una publica y dónde. */}
      <ul className={`${panel} mt-4 space-y-2 p-4 text-sm leading-relaxed text-muted`}>
        <li>
          <span className="text-ink">En cuanto entra</span>, sale publicada en{" "}
          <Link href="/ofrecido" className="text-accent hover:underline">
            lo que se ha ofrecido
          </Link>
          : el texto, su tipo, el municipio y el día. No el contacto, no el mensaje, no el caso al
          que apunta. Nadie la lee antes, así que si algo no debería estar ahí, quítalo del muro.
        </li>
        <li>
          <span className="text-ink">Su nombre</span> solo sale si la persona lo autorizó{" "}
          <span className="text-ink">y además</span> tú ya aceptaste la oferta. Las dos cosas, y en
          ese orden.
        </li>
        <li>
          <span className="text-ink">Anotar el día que llegó</span> es lo único que la publica en el{" "}
          <Link href="/ayudas" className="text-accent hover:underline">
            registro de ayudas
          </Link>
          . Ahí sale qué era, el mes y el municipio: no el día que anotas aquí, no a qué caso fue,
          no el contacto.
        </li>
      </ul>

      {team?.role === "documentacion" ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Aquí ves las ofertas de los municipios que tienes asignados. Las que llegan sin municipio
          las reparte coordinación.
        </p>
      ) : (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Los correos de quien se apunta a los avisos están en{" "}
          <Link href={SIGNUPS_PATH} className="text-accent hover:underline">
            la lista de avisos
          </Link>
          : llegan del mismo formulario y de la misma gente, con menos concreción, y no son el
          contacto de ninguna oferta.
        </p>
      )}

      <nav aria-label="Bandejas" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/recursos?estado=${filter.value}`}
            aria-current={active === filter.value ? "page" : undefined}
            className={`smallcaps inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] transition-colors ${
              active === filter.value
                ? "bg-accent text-paper"
                : "border border-line text-muted hover:border-line-strong hover:text-ink"
            }`}
          >
            {filter.label}
            {filter.value === "pendiente" && pending > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
                  active === "pendiente"
                    ? "bg-paper/20 text-paper"
                    : "bg-need-mid-soft text-need-mid-strong"
                }`}
              >
                {pending}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <p className="mt-5 text-sm text-muted">
        {pending === 0
          ? "No queda nada sin revisar."
          : `${plural(pending, "oferta sin revisar", "ofertas sin revisar")}, y están publicadas mientras esperan.`}
      </p>

      {offers.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No hay ofertas en esta bandeja.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} needOptions={needOptions} />
          ))}
        </ul>
      )}
    </div>
  );
}
