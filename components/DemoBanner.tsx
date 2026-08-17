import { isDemoMode } from "@/lib/supabase/env";

/**
 * Aviso permanente mientras el portal funciona con datos de muestra. Va arriba
 * del todo y en flujo normal: el contenido inventado no debe poder confundirse
 * con documentación real en ninguna pantalla.
 */
export function DemoBanner() {
  if (!isDemoMode()) return null;

  return (
    <div className="relative z-50 border-b border-line bg-panel">
      <p className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-5 py-2 text-[11px] leading-relaxed text-faint sm:px-8">
        <span className="size-1.5 shrink-0 rounded-full bg-amber" />
        <span>
          <span className="text-body">Datos de muestra.</span> Municipios, casos, necesidades y
          ofertas son inventados. Las fotos son paisajes del Chocó, no del terremoto. Nada se
          guarda.
        </span>
      </p>
    </div>
  );
}
