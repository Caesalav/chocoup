import Link from "next/link";
import type { Metadata } from "next";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { NeedsList } from "@/components/NeedsList";
import { SiteFooter } from "@/components/SiteFooter";
import { card, shell } from "@/components/ui/styles";
import { getNeedCards } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Necesidades",
  description:
    "Todo lo que hace falta en los municipios documentados del Chocó, con lo urgente primero.",
};

export default async function NeedsPage() {
  const needs = await getNeedCards();

  return (
    <>
      <div className={`${shell} pt-4 lg:pt-10`}>
        {/* El contador dice cuántas hay en la lista, no cuántas están abiertas.
            Contaba las abiertas —20— con las 22 tarjetas debajo, y un número
            junto a un titular se lee como "esto es lo que hay": quien cuenta lo
            que ve encuentra otra cosa. Las abiertas ya salen en el inicio. */}
        <ScreenHeader
          title="Necesidades"
          subtitle="Todo lo registrado, con lo urgente primero y lo cubierto al final. Cada una dice de qué municipio y de qué caso sale."
          backHref="/"
          backLabel="Volver al inicio"
          count={needs.length}
        />

        {/* El puente hacia lo prometido, y va aquí porque es donde está la
            intención: quien recorre esta lista está decidiendo qué dar, y sin este
            renglón lo hace sin saber que a lo mejor lo que falta no es la cosa
            sino el transporte de una cosa que ya ofreció alguien.

            Dice además lo que tiene que decir para no restarle autoridad a esta
            pantalla. Un enlace a secas a «lo que se ha ofrecido» invita justo a la
            conclusión que hay que evitar —«esto ya lo está dando alguien, no hago
            falta»—, y una necesidad prometida sigue abierta porque una promesa no
            es una entrega. De las dos listas, la que manda sobre el estado real es
            ésta. */}
        <p className="enters mt-4 max-w-[68ch] text-[13px] leading-relaxed text-muted">
          Puede que algo de esto ya lo haya prometido alguien:{" "}
          <Link href="/ofrecido" className="text-accent hover:underline">
            lo que se ha ofrecido
          </Link>{" "}
          lo lleva anotado, y ahí se ve qué le falta a cada promesa para llegar. Aparezca o no, una
          necesidad sigue abierta hasta que el equipo comprueba que llegó.
        </p>

        <div className="enters enters-1 mt-6">
          {needs.length === 0 ? (
            <p className={`${card} p-5 text-[14px] leading-relaxed text-muted`}>
              Todavía no hay necesidades registradas.
            </p>
          ) : (
            <NeedsList needs={needs} showOrigin />
          )}
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
