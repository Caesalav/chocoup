import { isDemoMode } from "@/lib/supabase/env";

/**
 * Aviso permanente mientras el portal funciona con datos de muestra. Va arriba
 * del todo y en flujo normal: el contenido inventado no debe poder confundirse
 * con documentación real en ninguna pantalla.
 *
 * Nombra los retratos aparte de los paisajes porque son la parte que más se puede
 * confundir: un paisaje de archivo se lee como ilustración, pero la cara de una
 * persona en la tarjeta de un caso se lee como esa persona. Decir solo «paisajes
 * del Chocó» dejaba de ser cierto en cuanto la demostración tuvo retratos.
 *
 * Su alto es fijo y lo publica en --strip-h (ver globals.css) porque hay
 * pantallas que miden "ventana menos franja" —hoy el mapa, con `.screen-h`—; si
 * creciera libremente, lo que va anclado abajo se saldría de la vista.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="relative z-50 h-[var(--strip-h)] overflow-hidden border-b border-line bg-panel">
      <p className="mx-auto flex h-full max-w-[1400px] items-center gap-2.5 px-5 text-[11px] leading-relaxed text-faint sm:px-8">
        <span className="size-1.5 shrink-0 rounded-full bg-accent" />
        <span>
          <span className="text-body">Datos de muestra.</span> Municipios, casos, necesidades y
          ofertas son inventados. Las fotos son de archivo: los paisajes no son del terremoto y las
          personas de los retratos no son de aquí. Nada se guarda.
        </span>
      </p>
    </div>
  );
}
