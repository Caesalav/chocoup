import Link from "next/link";
import type { Metadata } from "next";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { RegistryTabs } from "@/components/registry/RegistryTabs";
import { SiteFooter } from "@/components/SiteFooter";
import { FilterRow, type FilterOption } from "@/components/ui/FilterRow";
import { card, shell } from "@/components/ui/styles";
import { needCategoryLabel } from "@/lib/constants";
import { getAidRecords } from "@/lib/data";
import { formatMonth, plural } from "@/lib/format";
import type { AidRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registro de ayudas",
  description:
    "Las ayudas que ya llegaron a los municipios documentados del Chocó: de qué tipo era cada una, en qué mes llegó y a qué municipio. Sin publicar quién ayuda, salvo autorización, ni a qué persona fue.",
};

/**
 * El registro de ayudas: público, anónimo y de trazo grueso.
 *
 * Público porque cualquiera tiene que poder comprobar qué llegó de verdad, y esa
 * comprobación es lo que sostiene que valga la pena mandar algo. Anónimo porque
 * quien ayuda no tiene por qué pagar su gesto con su nombre, y menos con su
 * teléfono: aquí solo aparece el nombre de quien lo autorizó al enviar la oferta,
 * y el contacto no aparece nunca —no está ni en la vista que alimenta esta
 * página—.
 *
 * Grueso porque el detalle fino describiría a personas: la vista pública da el
 * tipo de ayuda, el mes y el municipio, nunca qué era exactamente, ni el día, ni
 * el caso. Esta plantilla no recorta nada, solo puede pintar lo que existe; si
 * algún día hace falta el dato exacto para algo, la respuesta no es tocar esta
 * página sino no publicarlo.
 *
 * Solo entra lo entregado. Lo prometido, lo aceptado y lo que va en camino no
 * salen: una lista de intenciones publicada como si fueran hechos sería peor que
 * no tener lista.
 *
 * El texto de arriba no es un descargo legal, es la mitad de la pantalla. Sin él
 * esto se lee como un ranking de donantes o como el marcador de una campaña, que
 * es exactamente lo que no es. Y sin la parte del trazo grueso se lee como una
 * lista a medio hacer.
 */
type Props = { searchParams: Promise<{ municipio?: string; tipo?: string }> };

export default async function AidLogPage({ searchParams }: Props) {
  const [{ municipio, tipo }, all] = await Promise.all([searchParams, getAidRecords()]);

  const cities = cityOptions(all);
  const categories = categoryOptions(all);

  // Un filtro que no está en los datos se ignora en vez de dejar la lista vacía:
  // estas direcciones se pegan en WhatsApp y el municipio puede haberse
  // despublicado, o quedarse sin entregas, desde que alguien copió el enlace.
  const city = cities.some((option) => option.value === municipio) ? municipio : undefined;
  const category = categories.some((option) => option.value === tipo) ? tipo : undefined;

  const records = all.filter(
    (record) =>
      (!city || cityValueOf(record) === city) && (!category || record.category === category),
  );

  // Con tres entregas los filtros estorban más de lo que ayudan, y una fila de
  // una sola opción no filtra nada: no se pinta lo que no sirve todavía.
  const showFilters = all.length > 3 && (cities.length > 1 || categories.length > 1);
  const filtered = Boolean(city || category);

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        <ScreenHeader
          title="Ayudas que llegaron"
          subtitle="Una por una, con el tipo de ayuda, el mes en que llegó y el municipio al que llegó."
          backHref="/"
          backLabel="Volver al inicio"
        />

        {/* Las pestañas van pegadas al titular y no debajo del texto que viene
            ahora, que en el móvil es una pantalla entera de párrafos: quien llega
            aquí desde un WhatsApp tiene que ver que hay otra mitad —lo prometido—
            antes de leerse todo eso, o se irá creyendo que el portal solo anota lo
            que ya llegó. Entran con la cabecera y sin retardo propio porque se leen
            como parte de ella, y así el escalonado de abajo no hay que renumerarlo. */}
        <div className="enters mt-5">
          <RegistryTabs active="ayudas" />
        </div>

        <div className={`${card} enters enters-1 mt-5 max-w-[68ch] p-4`}>
          <p className="text-[14px] leading-relaxed text-body">
            Aquí se anota cada ayuda cuando el equipo confirma que llegó al municipio. Está para que
            cualquiera pueda comprobar qué se ha recibido de verdad.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">El detalle es grueso a propósito.</span> De cada ayuda se
            publica de qué tipo era —agua, techo, medicinas—, en qué mes llegó y a qué municipio. No
            qué era exactamente, no el día y no a qué caso ni a qué familia fue. No es que falte el
            dato: el equipo lo tiene completo y lo necesita para trabajar, pero publicar quién
            recibió qué convierte una lista de ayudas en la descripción de la situación de personas
            concretas. Quien aparece en un caso dio permiso para contar lo que le pasó y publicar sus
            fotos, no para que se publique lo que recibe.
          </p>
          {/* Este párrafo es el que explica por qué el tipo y no la frase. Sin él,
              «Medicinas» donde antes había una descripción se lee como una lista a
              medio hacer, y la decisión que hay detrás es lo contrario de un
              descuido. */}
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">Tampoco la descripción de la ayuda.</span> Quien ofrece algo
            lo describe con sus palabras, y esas palabras cuentan cosas: «tratamiento para la
            tensión, tres meses» al lado de una ficha que dice que a una señora se le acabaron las
            pastillas señala a esa señora sin nombrarla, y en un municipio pequeño eso alcanza. Con
            el tipo de ayuda se puede comprobar igual que algo llegó, y no queda nadie descrito.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-body">
            <span className="text-ink">No es un ranking ni una campaña.</span> No hay totales de
            dinero, no se ordena por quién dio más y nadie aparece con nombre salvo que lo
            autorizara al ofrecer su ayuda. Los datos de contacto de quien ayuda no se publican
            nunca.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Tampoco está todo lo que llega al Chocó: solo lo que pasó por este portal. El dinero
            que se dona por el canal de una causa se rinde allí, no aquí. Y lo prometido o en
            camino no aparece hasta que llega. Si hace falta el detalle de una entrega concreta,
            se puede pedir en{" "}
            <Link href="/sugerencias" className="text-accent hover:underline">
              sugerencias
            </Link>
            .
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
                hrefFor={(value) => aidHref({ municipio: value, tipo: category })}
              />
            )}
            {categories.length > 1 && (
              <FilterRow
                label="Tipo"
                allLabel="Todos"
                options={categories}
                active={category}
                hrefFor={(value) => aidHref({ municipio: city, tipo: value })}
              />
            )}
          </div>
        )}

        {all.length === 0 ? (
          <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
            Todavía no hay ninguna ayuda registrada. Cuando la primera llegue a un municipio,
            aparecerá aquí.
          </p>
        ) : records.length === 0 ? (
          <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
            Con ese filtro no hay ninguna entrega.{" "}
            <Link href="/ayudas" className="text-accent hover:underline">
              Ver el registro entero
            </Link>
            .
          </p>
        ) : (
          <>
            {/* Filtrando se dice cuántas de cuántas: si no, una lista de dos
                entradas se lee como que solo han llegado dos ayudas en total. */}
            <p className="mt-6 text-[13px] text-faint">
              {filtered
                ? `${records.length} de ${all.length}`
                : plural(records.length, "ayuda registrada", "ayudas registradas")}
              {filtered ? " entregas" : ""}, del mes más reciente al más antiguo.
            </p>

            {/* La lista se queda en la columna de lectura, como todo lo demás de
                esta pantalla. Cada entrada son tres renglones cortos desde que no
                se publica la descripción, y estirados a 1400 px se leían como
                tarjetas a medio rellenar. */}
            <ul className="enters enters-2 mt-3 max-w-[68ch] space-y-3">
              {records.map((record) => (
                <li key={record.id}>
                  <AidEntry record={record} />
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
          , y desde ahí se puede ofrecer algo concreto.
        </p>
      </div>

      <SiteFooter />
    </>
  );
}

/**
 * Una entrega.
 *
 * El titular es el tipo de ayuda. Ahí iba la frase de quien la ofreció, con la
 * categoría de etiqueta encima; ahora la categoría es todo lo que se publica de
 * qué llegó, así que ocupa el sitio que tenía la frase en vez de quedarse de
 * pastilla sobre una tarjeta sin titular. Es una de nueve palabras y se va a
 * repetir por la pantalla: eso es la forma de este dato, no un descuido de la
 * maquetación.
 *
 * El destino es el municipio, con su enlace: es lo que se puede decir sin contar
 * a quién le llegó. Si además iba contra una necesidad del municipio se nombra, y
 * ahora es lo único concreto que queda en la tarjeta: una necesidad de zona la
 * escribe el equipo y no es de nadie en particular. Las de un caso no llegan hasta
 * aquí. Y cuando no hay municipio —un flete, un cupo de carga que sostiene el
 * trabajo entero— se dice eso mismo, en vez de dejar el hueco.
 */
function AidEntry({ record }: { record: AidRecord }) {
  return (
    <article className={`${card} p-4`}>
      {/* El mes va pegado al titular y no al filo derecho de la tarjeta: es su
          fecha, y a 1400 px de ancho, separado por un metro de blanco, deja de
          leerse como suya. Es lo mismo que le pasaba a la cuenta de necesidades
          abiertas en la ficha de un caso. */}
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="font-display text-[17px] leading-snug text-ink">
          {needCategoryLabel(record.category)}
        </h2>
        <span className="text-[12px] text-faint">{formatMonth(record.delivered_month)}</span>
      </div>

      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        {record.city_name && record.city_slug ? (
          <>
            Llegó a{" "}
            <Link
              href={`/ciudades/${record.city_slug}`}
              className="text-body underline-offset-2 hover:underline"
            >
              {record.city_name}
            </Link>
          </>
        ) : (
          "No fue a un municipio concreto: sostiene el trabajo en todos"
        )}
        {record.need_title && (
          <>
            {", para "}
            <span className="text-body">{record.need_title}</span>
          </>
        )}
      </p>

      {/* Sin nombre es lo normal, así que se dice sin dramatismo y en gris: una
          entrega anónima no vale menos que una firmada. */}
      <p className="mt-2 text-[12px] text-faint">
        {record.offerer_name ? `Lo dio ${record.offerer_name}` : "Quien lo dio prefiere no aparecer"}
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Filtros
//
// Por municipio y por tipo, que son las dos únicas cosas que esta pantalla
// publica de una entrega. No hay filtro por caso ni por persona, y no es un
// hueco: ese dato no existe en la vista que alimenta la página. Filtrar solo
// puede recortar lo que ya está publicado, nunca abrir nada nuevo.
//
// Las opciones se calculan de las entregas que hay, no de la lista de municipios
// del portal: un municipio sin ninguna ayuda registrada no tiene por qué
// ofrecerse para dejar la pantalla vacía.
// ---------------------------------------------------------------------------

/** El cajón de las entregas que no fueron a un municipio concreto. */
const SIN_MUNICIPIO = "sin-municipio";

const cityValueOf = (record: AidRecord) => record.city_slug ?? SIN_MUNICIPIO;

function cityOptions(records: AidRecord[]): FilterOption[] {
  const seen = new Map<string, string>();
  for (const record of records) {
    seen.set(cityValueOf(record), record.city_name ?? "Sin municipio");
  }
  return [...seen]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

function categoryOptions(records: AidRecord[]): FilterOption[] {
  return [...new Set(records.map((record) => record.category))]
    .map((value) => ({ value, label: needCategoryLabel(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/** Los dos filtros conviven en la dirección: elegir uno no borra el otro. */
function aidHref(next: { municipio?: string; tipo?: string }): string {
  const params = new URLSearchParams();
  if (next.municipio) params.set("municipio", next.municipio);
  if (next.tipo) params.set("tipo", next.tipo);
  const query = params.toString();
  return query ? `/ayudas?${query}` : "/ayudas";
}
