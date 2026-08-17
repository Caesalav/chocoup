/**
 * Los tres pasos del portal, siempre a la vista.
 *
 * Quien llega desde un WhatsApp no sabe qué es esto ni qué se espera de él. Tres
 * frases cortas numeradas responden lo único que importa: qué sigue después.
 */

const STEPS = [
  { title: "Mira qué falta", detail: "Toca un pueblo en el mapa." },
  { title: "Elige a quién ayudar", detail: "Al pueblo entero o a una familia." },
  { title: "Deja tu contacto", detail: "El equipo te escribe." },
] as const;

export function Steps({ compact = false }: { compact?: boolean }) {
  return (
    <ol className={compact ? "flex flex-col gap-2.5" : "grid gap-4 sm:grid-cols-3"}>
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3">
          <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] font-medium tabular-nums text-faint">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] leading-tight text-body">{step.title}</span>
            <span className="block text-[12px] leading-snug text-faint">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
