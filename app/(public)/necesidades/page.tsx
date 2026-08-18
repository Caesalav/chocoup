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
