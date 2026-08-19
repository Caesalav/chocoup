/**
 * El mapa no es una lámina: late.
 *
 * El rojo de broadcast no se usa. En este mosaico el cálido ya significa
 * urgencia, y un LIVE rojo se leería como «prioritario». El punto es el mismo
 * `accent` del dato de actualizado en el inicio: verde que se puede leer, no
 * lima de donar.
 *
 * Visualmente dice Live —la convención de lo que está ocurriendo ahora—. Quien
 * lo oye con un lector oye «En vivo». El aro se apaga si piden menos movimiento;
 * el punto se queda, que es lo que dice el estado.
 */
export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute top-2 left-0 z-30 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-medium text-ink shadow-card backdrop-blur ${className}`}
      aria-label="En vivo"
    >
      <span aria-hidden className="live-led relative size-1.5 rounded-full bg-accent" />
      <span aria-hidden>Live</span>
    </span>
  );
}
