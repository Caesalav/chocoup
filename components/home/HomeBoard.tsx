import Link from "next/link";
import { CampaignStrip } from "@/components/home/CampaignStrip";
import { blockDark } from "@/components/ui/styles";
import type { ResolvedCampaign } from "@/lib/campaign";

/**
 * El recado de la portada, sin el mapa.
 *
 * El mosaico del Chocó vive solo en /mapa: ahí cabe entero, con Colombia, la
 * leyenda y las tarjetas al lado. En el inicio un segundo dibujo repetía el
 * mismo oficio a media altura y además marcaba un pueblo —Quibdó— con un filete
 * que no le correspondía. Aquí queda el foco del momento, y el enlace a verlo
 * en su sitio.
 *
 * Es el bloque oscuro con cintas, y es el ÚNICO de la portada: es la pieza de más
 * peso del sistema y dos de ellas en la misma pantalla dejan a las dos sin ser la
 * principal. Va aquí y no en la tarjeta de estado porque lo que esta pieza dice
 * —a dónde mirar ahora— es lo primero que hay que leer al abrir el portal.
 *
 * El registro es el abierto: la portada es lo que se comparte por WhatsApp y
 * tiene que invitar a entrar. La ficha de una persona, dos pantallas más
 * adentro, no lleva nada de esto.
 */
export function HomeBoard({ campaign }: { campaign: ResolvedCampaign | null }) {
  return (
    <section className={`${blockDark} p-5 sm:p-6`} aria-label="El Chocó ahora">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-[20px] leading-none text-luz sm:text-[22px]">
            El Chocó ahora
          </h2>
          {campaign ? (
            <div className="mt-2.5">
              <CampaignStrip campaign={campaign} tone="oscuro" />
            </div>
          ) : (
            <p className="mt-2.5 text-[13px] text-luz/85">
              Los pueblos documentados y lo que falta se ven en el mapa.
            </p>
          )}
        </div>
        {/* La pastilla clara sobre el bloque oscuro: es la misma señal que usa la
            barra inferior para la pestaña abierta, y aquí es el único elemento
            pulsable del bloque, así que puede permitirse ser lo más claro. */}
        <Link
          href="/mapa"
          className="shrink-0 rounded-full bg-luz px-4 py-2 text-[13px] font-medium text-selva transition-[background-color,scale] duration-150 hover:bg-brote active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luz"
        >
          Ver el mapa
        </Link>
      </div>
    </section>
  );
}
