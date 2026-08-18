import { Photo } from "@/components/ui/Photo";
import { formatDay } from "@/lib/format";
import type { CaseUpdate } from "@/lib/types";

/**
 * El historial público de un caso, del primero al último.
 *
 * Cada paso es una tarjeta: la foto a la izquierda, la fecha y lo que se hizo a
 * la derecha. La guía de la izquierda —la raya y el punto— es lo que dice que
 * esto ocurrió en orden, no un listado de recados sueltos.
 */
export function ProgressTimeline({ updates }: { updates: CaseUpdate[] }) {
  if (updates.length === 0) return null;

  return (
    <ol className="relative border-l border-line pl-4">
      {updates.map((update) => (
        <li key={update.id} className="relative pb-3 last:pb-0">
          <span
            aria-hidden
            className="absolute top-5 -left-[1.3125rem] size-2 rounded-full border-2 border-paper bg-accent"
          />
          <article className="flex gap-3 rounded-2xl border border-line bg-panel p-2">
            <Photo
              path={update.photoPath}
              frame={update.photoFrame}
              alt={update.title}
              className="size-[4.75rem] shrink-0 rounded-xl sm:size-[5.25rem]"
            />
            <div className="min-w-0 flex-1 py-0.5">
              <p className="text-[11px] text-faint">{formatDay(update.happened_on)}</p>
              <h3 className="mt-0.5 font-display text-[15px] leading-snug text-ink">
                {update.title}
              </h3>
              {update.body && (
                <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-muted">
                  {update.body}
                </p>
              )}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
