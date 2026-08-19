/**
 * La marca es el letrero del original: CHOCÓ y UP, sin guion, en grotesk extra
 * negra. El espacio entre las dos palabras es el del archivo; el color es lo
 * único que se añade.
 *
 * El «UP» va en `liana`, el verde vivo. En el original las dos mitades van del
 * mismo negro. Pintarlo de `accent` no se veía: al lado de `ink` son dos verdes
 * oscuros y el letrero parecía de un solo color. `liana` sí se parte. Va en un
 * <span> y no en una imagen: una foto negra sobre transparente no puede teñir
 * una mitad, y el marcado sí.
 *
 * Quien lo lea con un lector de pantalla oye el nombre de una pieza, no las
 * dos mitades: el `aria-label` cubre el letrero entero.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-brand inline-block whitespace-nowrap leading-none ${className}`}
      aria-label="Chocó Up"
    >
      CHOCÓ{" "}
      <span className="text-liana">UP</span>
    </span>
  );
}
