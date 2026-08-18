/** Iniciales de las dos primeras palabras con peso, saltando los enlaces. */
export function personInitials(name: string): string {
  const skip = new Set(["de", "del", "la", "las", "los", "y", "el"]);
  return name
    .split(/\s+/)
    .filter((word) => word.length > 1 && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/*
 * Aquí había un `PersonPortrait` que dibujaba las iniciales de una familia y que
 * ya no llamaba nadie. Lo que hace ese trabajo es `CasePortrait`, que además sabe
 * pintar el retrato cuando lo hay; dos versiones del mismo hueco eran dos sitios
 * donde arreglar la próxima vez y solo uno en pantalla.
 */

/**
 * Quién hay detrás de un caso, donde la referencia pone al dueño y al anfitrión
 * del alojamiento.
 *
 * En lugar de la foto de perfil van las iniciales: no tenemos retratos del
 * equipo ni de la gente de las fundaciones, y una silueta genérica repetida dos
 * veces dice menos que dos letras.
 */
export function PersonBadge({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-[13px] font-medium text-muted"
      >
        {personInitials(name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-tight text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-faint">{role}</span>
      </span>
    </div>
  );
}
