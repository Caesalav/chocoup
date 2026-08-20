/**
 * El mapa no es una lámina: late.
 *
 * El rojo de broadcast no se usa. En este mosaico el cálido ya significa
 * urgencia, y un LIVE rojo se leería como «prioritario». El chip es tinta
 * con `luz` —el HUD del atlas, no un bloque de selva— y el punto es `brote`,
 * para que se recorte del chip sin usar el rojo de la escala.
 *
 * Visualmente dice Live —la convención de lo que está ocurriendo ahora—. Quien
 * lo oye con un lector oye «En vivo». El aro se apaga si piden menos movimiento;
 * el punto se queda, que es lo que dice el estado.
 */
export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute top-2 left-0 z-30 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold tracking-wide text-luz shadow-card ${className}`}
      aria-label="En vivo"
    >
      <span aria-hidden className="live-led relative size-1.5 rounded-full bg-brote" />
      <span aria-hidden>Live</span>
    </span>
  );
}
