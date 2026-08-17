/**
 * Clases compartidas en vez de una librería de componentes: el portal tiene
 * pocos patrones y muchos formularios, y así se mantienen consistentes sin
 * añadir una capa de abstracción que haya que aprender.
 *
 * Los controles miden al menos 44 px de alto porque casi todo el uso en campo
 * será con el pulgar.
 */

/**
 * Todo control responde al dedo: cambia de color al pasar por encima y se hunde
 * un punto al pulsarlo. Es la señal más básica de "sí, te oí", y en conexiones
 * lentas es lo único que confirma que algo está pasando.
 */
const pressable =
  "transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:opacity-50 disabled:active:scale-100";

export const button = {
  primary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-base hover:bg-amber-bright ${pressable}`,
  secondary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel/70 px-6 py-3 text-sm font-medium text-body backdrop-blur hover:border-ink/40 hover:text-ink ${pressable}`,
  ghost: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-line hover:text-ink ${pressable}`,
  danger: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-transparent px-4 py-2 text-sm font-medium text-amber hover:border-amber hover:bg-amber-soft ${pressable}`,
};

export const field = {
  label: "block text-[11px] font-medium uppercase tracking-[0.14em] text-faint",
  input:
    "mt-2 block w-full rounded-lg border border-line-strong bg-panel/60 px-3.5 py-2.5 text-base text-ink placeholder:text-faint/70 focus:border-amber focus:bg-panel focus:outline-none",
  textarea:
    "mt-2 block w-full rounded-lg border border-line-strong bg-panel/60 px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-faint/70 focus:border-amber focus:bg-panel focus:outline-none",
  select:
    "mt-2 block w-full appearance-none rounded-lg border border-line-strong bg-panel/60 px-3.5 py-2.5 text-base text-ink focus:border-amber focus:outline-none",
  hint: "mt-2 text-xs leading-relaxed text-faint",
  checkboxRow:
    "flex items-start gap-3 rounded-lg border border-line bg-panel/50 px-3.5 py-3 text-sm text-body",
  checkbox: "mt-0.5 size-5 shrink-0 accent-amber",
};

/** Panel flotante: translúcido y desenfocado sobre el lienzo. */
export const panel = "rounded-xl border border-line bg-panel/70 backdrop-blur-md";

/** Panel algo más claro, para lo que debe leerse en primer plano. */
export const panelHigh = "rounded-xl border border-line-strong bg-panel-high/80 backdrop-blur-md";

export const sectionTitle = "font-display text-3xl leading-tight text-ink sm:text-4xl";

export const eyebrow =
  "text-[11px] font-medium uppercase tracking-[0.18em] text-faint";

/** Etiqueta en versalitas, el recurso tipográfico de la referencia. */
export const navLabel = "smallcaps text-[15px] text-body transition-colors hover:text-ink";
