import Link from "next/link";
import type { Metadata } from "next";
import { CaseRow } from "@/components/cards/CaseRow";
import { CityRow } from "@/components/cards/CityRow";
import { OfferRow } from "@/components/cards/OfferRow";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { NeedsList } from "@/components/NeedsList";
import { SearchIcon } from "@/components/ui/icons";
import { card, cardGrid, screenTitle, shell } from "@/components/ui/styles";
import { searchPortal } from "@/lib/data";
import { plural } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar",
  description: "Busca un municipio, una familia o algo que puedas aportar.",
};

/** Atajos para quien abre el buscador sin saber qué escribir. */
const SUGGESTIONS = ["Quibdó", "techo", "agua", "medicinas", "transporte"];

type Props = { searchParams: Promise<{ q?: string }> };

/**
 * Buscador sin JavaScript: un formulario GET que recarga la página con ?q=.
 *
 * Se comparte y se vuelve atrás como cualquier otra dirección, y funciona con la
 * señal del Chocó, que es la razón de todo lo demás en este portal. Un buscador
 * que filtra mientras escribes se sentiría más moderno y dejaría de funcionar en
 * cuanto la página tarde en hidratarse.
 */
export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPortal(query) : null;
  const total = results
    ? results.cities.length + results.cases.length + results.needs.length + results.offers.length
    : 0;

  return (
    <div className={`${shell} pt-4 lg:pt-10`}>
      <ScreenHeader
        title="Buscar"
        subtitle="Un municipio, una familia, o algo que puedas aportar."
      />

      {/* El campo no crece con la página: una caja de una línea de 1400 px de
          ancho parece un error, y lo que se escribe aquí son dos palabras. */}
      <form className="enters enters-1 mt-5 max-w-2xl">
        <label className="relative block">
          <span className="sr-only">Qué buscas</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Quibdó, tejas, agua…"
            enterKeyHint="search"
            className="min-h-13 w-full rounded-full border border-line-strong bg-panel-high py-3 pl-12 pr-4 text-base text-ink shadow-card placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </label>
      </form>

      {!results && (
        <div className="enters enters-2 mt-6">
          <p className="text-[13px] text-muted">O empieza por aquí:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((term) => (
              <li key={term}>
                <Link
                  href={`/buscar?q=${encodeURIComponent(term)}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line-strong bg-panel-high px-4 text-[14px] text-body transition-[border-color,color,scale] duration-150 hover:border-accent hover:text-ink active:scale-95"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results && (
        <div className="mt-6">
          <p className="text-[13px] text-muted">
            {total === 0
              ? `Nada coincide con «${query}».`
              : `${plural(total, "resultado", "resultados")} para «${query}».`}
          </p>

          {total === 0 && (
            <p className={`${card} mt-4 max-w-[68ch] p-5 text-[14px] leading-relaxed text-muted`}>
              Prueba con el nombre del municipio, con lo que necesitas dar —tejas, agua,
              transporte— o con el apellido de una familia.
            </p>
          )}

          {results.cities.length > 0 && (
            <section className="mt-7">
              <h2 className={screenTitle}>Municipios</h2>
              <ul className={`mt-4 ${cardGrid}`}>
                {results.cities.map((city) => (
                  <li key={city.id}>
                    <CityRow city={city} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.cases.length > 0 && (
            <section className="mt-7">
              <h2 className={screenTitle}>Casos</h2>
              <ul className={`mt-4 ${cardGrid}`}>
                {results.cases.map((caseCard) => (
                  <li key={caseCard.id}>
                    <CaseRow caseCard={caseCard} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.needs.length > 0 && (
            <section className="mt-7">
              <h2 className={screenTitle}>Necesidades</h2>
              <div className="mt-4">
                <NeedsList needs={results.needs} showOrigin />
              </div>
            </section>
          )}

          {/* Va último de los cuatro, que es el único sitio donde no engaña. Quien
              busca «tejas» encuentra la necesidad de un techo y una promesa de 600
              tejas, y mezcladas en la misma tira las dos parecen lo mismo: aquí
              abajo y con el rótulo delante se lee que son otra cosa.

              Y aun así lleva su renglón de aviso, porque los otros tres grupos no
              lo necesitan. Un municipio y un caso son sitios y personas, una
              necesidad dice sola que falta; una oferta suelta entre resultados es
              la única que se puede leer como un hecho cumplido. La pastilla de
              cada fila remata lo que este renglón empieza.

              La lista se queda en la columna de lectura en vez de ir a la rejilla
              de arriba: la fila de una oferta está dibujada para eso —lo que se
              ofrece es una frase entera, no un nombre— y en tres columnas se parte
              por donde no debe. */}
          {results.offers.length > 0 && (
            <section className="mt-7">
              <h2 className={screenTitle}>Lo que se ha ofrecido</h2>
              <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-muted">
                Prometido y todavía sin llegar. Que alguien lo haya ofrecido no cierra la necesidad
                que va arriba:{" "}
                <Link href="/ofrecido" className="text-accent hover:underline">
                  el registro entero
                </Link>{" "}
                lo explica.
              </p>
              <ul className="mt-4 max-w-[68ch] space-y-3">
                {results.offers.map((offer) => (
                  <li key={offer.id}>
                    <OfferRow record={offer} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
