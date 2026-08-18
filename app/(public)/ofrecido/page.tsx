import Link from "next/link";
import type { Metadata } from "next";
import { OfferRow } from "@/components/cards/OfferRow";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { RegistryTabs } from "@/components/registry/RegistryTabs";
import { SiteFooter } from "@/components/SiteFooter";
import { FilterRow, type FilterOption } from "@/components/ui/FilterRow";
import { card, shell } from "@/components/ui/styles";
import { needCategoryLabel, OFFER_STATES, offerStateLabel } from "@/lib/constants";
import { getOfferRecords } from "@/lib/data";
import { plural } from "@/lib/format";
import type { OfferRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lo que se ha ofrecido",
  description:
    "Lo que alguien ha ofrecido a los municipios documentados del Chocó y todavía no ha llegado: qué es, para qué municipio y si el equipo ya lo confirmó. Sin publicar el contacto de nadie.",
};

/**
 * El registro de lo prometido.
 *
 * El portal contaba la historia en dos tiempos —lo que falta y lo que llegó— y le
 * faltaba el de en medio. Una ferretería ofrece 600 tejas y no cubre el
 * transporte; una empresa de logística tiene un camión que sube vacío. Las dos
 * cosas entraban por `/ofrecer`, las veía el equipo en su bandeja y no volvían a
 * existir en público hasta que alguien anotaba una fecha de entrega, así que
 * cruzarlas dependía de que una persona se acordara de las dos a la vez. Esta
 * pantalla existe para que se puedan leer juntas.
 *
 * Y de ahí sale su problema, que es el contrario del de `/ayudas`. Allí todo lo
 * que se publica ya pasó; aquí nada ha pasado todavía, y una lista de promesas
 * puesta con la misma cara que una de hechos se lee como un marcador: alguien ve
 * «600 tejas ofrecidas» y concluye que el techo está resuelto. Tres piezas cargan
 * con eso y ninguna es un descargo legal: el texto de arriba, que dice que las
 * necesidades siguen mandando sobre el estado real; la pastilla de cada fila, que
 * dice cuánto se puede contar con ella; y la atenuación de lo que lleva semanas
 * esperando, que es la que evita que el muro parezca vivo entero.
 *
 * Lo que no se publica —el contacto, el mensaje largo, el caso al que apunta— no
 * está recortado aquí: no existe en la vista que alimenta la página. Esta
 * plantilla no puede filtrar nada ni deshacer el recorte del texto, y eso es
 * deliberado. Ver supabase/migrations/0012_registro_de_lo_ofrecido.sql.
 */
type Props = {
  searchParams: Promise<{ municipio?: string; tipo?: string; estado?: string }>;
};

export default async function OfferLogPage({ searchParams }: Props) {
  const [{ municipio, tipo, estado }, all] = await Promise.all([searchParams, getOfferRecords()]);

  const cities = cityOptions(all);
  const categories = categoryOptions(all);
  const states = stateOptions(all);

  // Un filtro que no está en los datos se ignora en vez de dejar la lista vacía,
  // igual que en /ayudas y con más razón que allí: aquí las filas caducan solas a
  // las ocho semanas, así que un enlace que alguien pegó en un WhatsApp puede
  // apuntar a un municipio que ya no tiene nada prometido sin que nadie haya
  // tocado nada.
  const city = cities.some((option) => option.value === municipio) ? municipio : undefined;
  const category = categories.some((option) => option.value === tipo) ? tipo : undefined;
  const state = states.some((option) => option.value === estado) ? estado : undefined;

  const records = all.filter(
    (record) =>
      (!city || cityValueOf(record) === city) &&
      (!category || record.category === category) &&
      (!state || record.state === state),
  );

  // Con cuatro promesas los filtros estorban más de lo que ayudan, y una fila de
  // una sola opción no filtra nada.
  const showFilters =
    all.length > 3 && (cities.length > 1 || categories.length > 1 || states.length > 1);
  const filtered = Boolean(city || category || state);

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Lo que se ha ofrecido"
          subtitle="Lo que alguien ha prometido y todavía no ha llegado. Cada oferta dice qué es, para qué municipio y si el equipo ya habló con quien la ofrece."
          backHref="/"
          backLabel="Volver al inicio"
        />

        <div className="enters mt-5">
          <RegistryTabs active="ofrecido" />
        </div>

        <div className={`${card} enters enters-1 mt-5 max-w-[68ch] p-4`}>
          <p className="text-[14px] leading-relaxed text-body">
            Aquí está lo que alguien ha ofrecido y todavía no ha llegado a ningún sitio. Está para
            que se pueda cruzar: unas tejas que no tienen transporte y un camión que sube vacío son
            dos ofertas distintas, y por separado no sirven.
          </p>
          {/* El párrafo que sostiene la pantalla. Sin él, esta lista es un
              marcador de campaña, y con el enlace al otro registro al lado no hay
              que explicar dos veces la diferencia: se puede ir a ver. */}
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">Esto es lo prometido, no lo que llegó.</span> Ninguna de
            estas cosas está todavía en un municipio. Una oferta de 600 tejas no arregla ningún
            techo hasta que las tejas están puestas, y de aquí a eso hay un transporte que hay que
            pagar, un río que hay que subir y una conversación que a lo mejor no acaba en nada. Lo
            que sí llegó se anota en{" "}
            <Link href="/ayudas" className="text-accent hover:underline">
              ayudas que llegaron
            </Link>
            , y en cuanto una de estas promesas llega, sale de esta lista y aparece en esa.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">Las necesidades siguen mandando.</span> Que algo aparezca
            ofrecido aquí no cambia el estado de ninguna necesidad: eso lo cambia el equipo cuando
            comprueba que llegó. Si en{" "}
            <Link href="/necesidades" className="text-accent hover:underline">
              necesidades
            </Link>{" "}
            algo sigue abierto, sigue haciendo falta, aunque en esta lista haya alguien
            ofreciéndolo. Cuando las dos pantallas no digan lo mismo, la que va por delante es
            aquélla.
          </p>
          {/* Las dos palabras de la pastilla se explican una vez y aquí, no fila
              por fila: son la mitad de lo que hay que saber para leer la lista, y
              en una tarjeta de tres renglones no cabe la aclaración sin tapar lo
              que se ofrece. */}
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">«Sin confirmar» y «confirmada» no son lo mismo.</span> Sin
            confirmar quiere decir que alguien lo ofreció por el portal y que todavía nadie del
            equipo ha hablado con esa persona: nadie ha comprobado que exista, ni que siga
            disponible, ni que se pueda mover. Confirmada quiere decir que esa conversación ya pasó.
            Lo que lleva semanas esperando respuesta se apaga y lo dice, porque una promesa de hace
            un mes que nadie ha contestado no vale lo que la de ayer.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">Aquí no está el contacto de nadie.</span> Ni el teléfono ni
            el correo de quien ofrece, y si alguien los escribió dentro de su descripción, salen
            tapados. El nombre tampoco aparece mientras la oferta esté sin confirmar, y después solo
            si esa persona lo autorizó. Si puedes completar algo de esta lista —el transporte que le
            falta, la mitad que no cubre—, ofrécelo en{" "}
            <Link href="/ofrecer" className="text-accent hover:underline">
              ofrecer ayuda
            </Link>{" "}
            y el equipo cruza las dos.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            La lista se limpia sola: lo que lleva más de dos meses ofrecido desaparece de aquí sin
            que nadie lo borre, porque una promesa de hace tres meses que nadie ha confirmado ya no
            es información. Tampoco está todo lo que se ofrece al Chocó, solo lo que pasó por este
            portal.
          </p>
        </div>

        {showFilters && (
          <div className="mt-6 max-w-[68ch] space-y-2.5">
            {cities.length > 1 && (
              <FilterRow
                label="Municipio"
                allLabel="Todos"
                options={cities}
                active={city}
                hrefFor={(value) => offerHref({ municipio: value, tipo: category, estado: state })}
              />
            )}
            {categories.length > 1 && (
              <FilterRow
                label="Tipo"
                allLabel="Todos"
                options={categories}
                active={category}
                hrefFor={(value) => offerHref({ municipio: city, tipo: value, estado: state })}
              />
            )}
            {states.length > 1 && (
              <FilterRow
                label="Estado"
                allLabel="Todas"
                options={states}
                active={state}
                hrefFor={(value) => offerHref({ municipio: city, tipo: category, estado: value })}
              />
            )}
          </div>
        )}

        {all.length === 0 ? (
          <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
            Ahora mismo no hay nada ofrecido esperando llegar. Lo que hace falta está en{" "}
            <Link href="/necesidades" className="text-accent hover:underline">
              necesidades
            </Link>
            .
          </p>
        ) : records.length === 0 ? (
          <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
            Con ese filtro no hay ninguna oferta.{" "}
            <Link href="/ofrecido" className="text-accent hover:underline">
              Ver el registro entero
            </Link>
            .
          </p>
        ) : (
          <>
            {/* Filtrando se dice cuántas de cuántas: si no, una lista de dos
                entradas se lee como que solo hay dos promesas en pie. */}
            {/* El orden solo se anuncia si hay dos cosas que ordenar: «1 oferta,
                de la más reciente a la más antigua» describe una lista que no
                existe. */}
            <p className="mt-6 text-[13px] text-faint">
              {filtered
                ? `${records.length} de ${all.length} ofertas`
                : plural(records.length, "oferta", "ofertas")}
              {records.length > 1 ? ", de la más reciente a la más antigua." : "."}
            </p>

            <ul className="enters enters-2 mt-3 max-w-[68ch] space-y-3">
              {records.map((record) => (
                <li key={record.id}>
                  <OfferRow record={record} />
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-8 max-w-[68ch] text-[14px] leading-relaxed text-muted">
          Lo que sigue haciendo falta está en{" "}
          <Link href="/necesidades" className="text-accent hover:underline">
            necesidades
          </Link>
          , y desde ahí se puede ofrecer algo concreto contra lo que falta.
        </p>
      </div>

      <SiteFooter />
    </>
  );
}

// ---------------------------------------------------------------------------
// Filtros
//
// Por municipio, por tipo y por estado, que son las tres cosas por las que
// alguien llega a esta lista: lo que puede ayudar a un pueblo concreto, lo que
// es de su ramo, y lo que ya está confirmado.
//
// El de estado es el que no tiene `/ayudas`, y es el que más se va a usar en los
// dos sentidos: quien viene a contar con algo mira lo confirmado, y quien viene a
// completar una oferta busca justo lo que lleva semanas parado.
//
// Las opciones se calculan de lo que hay publicado, no de las listas del portal:
// un municipio sin nada prometido no se ofrece para dejar la pantalla vacía. Por
// eso los filtros no viajan entre las dos pestañas del registro —lo explica
// `RegistryTabs`—: las opciones de una no tienen por qué existir en la otra.
// ---------------------------------------------------------------------------

/** El cajón de lo que no se ofreció a un municipio concreto: un flete, un cupo. */
const SIN_MUNICIPIO = "sin-municipio";

const cityValueOf = (record: OfferRecord) => record.city_slug ?? SIN_MUNICIPIO;

function cityOptions(records: OfferRecord[]): FilterOption[] {
  const seen = new Map<string, string>();
  for (const record of records) {
    seen.set(cityValueOf(record), record.city_name ?? "Sin municipio");
  }
  return [...seen]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

function categoryOptions(records: OfferRecord[]): FilterOption[] {
  return [...new Set(records.map((record) => record.category))]
    .map((value) => ({ value, label: needCategoryLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/**
 * Los estados que haya, en el orden de `OFFER_STATES` y no por alfabeto.
 *
 * Es una escala de dos peldaños y no una lista de nombres: leída «Sin confirmar,
 * Confirmada» va de menos fiable a más, que es lo que la fila está midiendo. Por
 * orden alfabético saldría al revés y sin ninguna razón que lo explique.
 */
function stateOptions(records: OfferRecord[]): FilterOption[] {
  const present = new Set<string>(records.map((record) => record.state));
  return OFFER_STATES.filter((option) => present.has(option.value)).map((option) => ({
    value: option.value,
    label: offerStateLabel(option.value),
  }));
}

/** Los tres filtros conviven en la dirección: elegir uno no borra los otros. */
function offerHref(next: { municipio?: string; tipo?: string; estado?: string }): string {
  const params = new URLSearchParams();
  if (next.municipio) params.set("municipio", next.municipio);
  if (next.tipo) params.set("tipo", next.tipo);
  if (next.estado) params.set("estado", next.estado);
  const query = params.toString();
  return query ? `/ofrecido?${query}` : "/ofrecido";
}
