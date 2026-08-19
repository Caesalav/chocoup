import type { ReactNode } from "react";
import { panel } from "@/components/ui/styles";

/**
 * Un bloque de formulario: un título, una línea de para qué sirve, y los
 * campos. Sin esa caja cada pantalla del panel era un río de etiquetas, y no
 * se veía dónde acaba una decisión y empieza la siguiente.
 */
export function FormSection({
  title,
  hint,
  children,
  framed = true,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  /** Con marco, para un formulario. Sin él, cuando los hijos ya son tarjetas. */
  framed?: boolean;
}) {
  return (
    <section className={framed ? `${panel} p-5 sm:p-6` : undefined}>
      <h2 className="font-display text-[20px] leading-tight text-ink">{title}</h2>
      {hint && (
        <p className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-muted">{hint}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
