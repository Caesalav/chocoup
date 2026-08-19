import { deleteFeedback } from "@/app/admin/actions";
import { DangerSubmitButton } from "@/components/admin/SubmitButton";
import { FeedbackKindChip } from "@/components/ui/Chip";
import { eyebrow, panel } from "@/components/ui/styles";
import { getFeedback } from "@/lib/admin-data";
import { contactHref, formatDateTime } from "@/lib/format";
import { currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function FeedbackInboxPage() {
  const [notes, team] = await Promise.all([getFeedback(), currentTeam()]);
  const canDelete = team?.role === "coordinacion";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <p className={eyebrow}>Buzón del portal</p>
      <h1 className="mt-1 font-display text-3xl text-ink">Sugerencias y errores</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Lo que la gente escribe sobre el portal: un fallo o una función que echan de menos. No se
        publica. El contacto es opcional y solo lo ve el equipo.
      </p>
      {!canDelete && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Puedes leer las notas. Borrarlas lo hace coordinación, cuando ya no hacen falta.
        </p>
      )}

      {notes.length === 0 ? (
        <p className="mt-8 text-sm text-muted">El buzón está vacío.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {notes.map((note) => {
            const href = note.contact ? contactHref(note.contact) : null;

            return (
              <li key={note.id} className={`${panel} p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <FeedbackKindChip kind={note.kind} />
                  <span className="text-xs text-faint">{formatDateTime(note.created_at)}</span>
                  {note.page_path && (
                    <a
                      href={note.page_path}
                      className="text-xs text-muted hover:text-ink hover:underline"
                    >
                      {note.page_path}
                    </a>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {note.body}
                </p>

                {note.contact ? (
                  <p className="mt-3 text-sm text-ink">
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-accent hover:underline"
                      >
                        {note.contact}
                      </a>
                    ) : (
                      note.contact
                    )}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-faint">Sin contacto</p>
                )}

                {canDelete && (
                  <form action={deleteFeedback} className="mt-4">
                    <input type="hidden" name="id" value={note.id} />
                    <DangerSubmitButton confirmText="¿Borrar esta nota? No se puede deshacer.">
                      Borrar
                    </DangerSubmitButton>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
