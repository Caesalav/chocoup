/**
 * Los degradados de la paleta, para el SVG.
 *
 * Un `fill-accent` de Tailwind pinta un plano, y el mapa no puede usar
 * `background-image`. Estos degradados viven dentro de cada dibujo y usan las
 * mismas paradas que `--fill-*` en globals.css, para que el Chocó del localizador
 * y el botón Donar sean el mismo verde con volumen.
 */
export function PaletteFillDefs() {
  return (
    <defs>
      <linearGradient id="fill-accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--accent-lit)" />
        <stop offset="46%" stopColor="var(--color-accent)" />
        <stop offset="100%" stopColor="var(--accent-deep)" />
      </linearGradient>
      <linearGradient id="fill-need-blank" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--need-blank-lit)" />
        <stop offset="100%" stopColor="var(--need-blank-deep)" />
      </linearGradient>
      <linearGradient id="fill-need-none" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--need-none-lit)" />
        <stop offset="100%" stopColor="var(--need-none-deep)" />
      </linearGradient>
      <linearGradient id="fill-need-low" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--need-low-lit)" />
        <stop offset="46%" stopColor="var(--color-need-low)" />
        <stop offset="100%" stopColor="var(--need-low-deep)" />
      </linearGradient>
      <linearGradient id="fill-need-mid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--need-mid-lit)" />
        <stop offset="46%" stopColor="var(--color-need-mid)" />
        <stop offset="100%" stopColor="var(--need-mid-deep)" />
      </linearGradient>
      <linearGradient id="fill-need-high" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--need-high-lit)" />
        <stop offset="46%" stopColor="var(--color-need-high)" />
        <stop offset="100%" stopColor="var(--need-high-deep)" />
      </linearGradient>
    </defs>
  );
}
