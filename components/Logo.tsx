/**
 * La marca es el letrero: CHOCÓ-UP en grotesk extra negra, como el original.
 *
 * El «UP» lleva el verde de lo que se hace (`accent`). En el original iba del
 * mismo blanco que el resto; el color es lo que lo parte y lo que lo ata a la
 * paleta. Va en un <span> y no en una imagen: una foto blanca sobre negro no
 * sobrevive al papel, y un SVG de dos rellenos sí.
 *
 * Quien lo lea con un lector de pantalla oye el nombre de una pieza, no las
 * dos mitades: el `aria-label` cubre el letrero entero.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-brand inline-block whitespace-nowrap leading-none ${className}`}
      aria-label="Chocó-up"
    >
      CHOCÓ-
      <span className="text-accent">UP</span>
    </span>
  );
}
