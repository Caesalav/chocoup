"use client";

import { useActionState } from "react";
import { submitFeedback, type FeedbackFormState } from "./actions";
import { FEEDBACK_KINDS } from "@/lib/constants";
import { alertBox, button, field } from "@/components/ui/styles";

/**
 * El formulario del buzón: dos opciones, un recuadro y un contacto opcional.
 *
 * No son pasos. En /ofrecer hay que preguntar tres cosas distintas y ahí sí
 * vale ir de a una; aquí la persona ya sabe qué quiere decir y lo único que
 * hay que no hacer es ponerle un trámite delante.
 */
export function FeedbackForm({ pagePath }: { pagePath: string }) {
  const [state, action, pending] = useActionState<FeedbackFormState, FormData>(
    submitFeedback,
    null,
  );

  return (
    <form action={action} className="relative mt-8">
      {/* Campo trampa para bots: invisible y sin foco por teclado. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-0"
      />
      <input type="hidden" name="page_path" value={pagePath} />

      <fieldset>
        <legend className={field.label}>¿Qué quieres contar?</legend>
        <ul className="mt-3 flex flex-wrap gap-2">
          {FEEDBACK_KINDS.map((option) => (
            <li key={option.value}>
              <label className="flex min-h-11 cursor-pointer items-center rounded-full border border-line-strong bg-panel-high px-4 text-[14px] text-body has-checked:border-ink has-checked:bg-ink has-checked:text-paper">
                <input
                  type="radio"
                  name="kind"
                  value={option.value}
                  required
                  className="sr-only"
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="mt-6 block">
        <span className={field.label}>El mensaje</span>
        <textarea
          name="body"
          required
          minLength={4}
          maxLength={2000}
          rows={6}
          className={field.textarea}
          placeholder="Qué viste, en qué pantalla, o qué echas de menos."
        />
      </label>

      <label className="mt-6 block">
        <span className={field.label}>Un teléfono o un correo, si quieres respuesta</span>
        <input
          name="contact"
          maxLength={200}
          className={field.input}
          placeholder="No es obligatorio"
          autoComplete="off"
        />
        <span className={field.hint}>
          Solo lo ve el equipo. Si lo dejas vacío, igual leemos el mensaje.
        </span>
      </label>

      {state?.error && <p className={`${alertBox} mt-5`}>{state.error}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" disabled={pending} className={button.primary}>
          {pending ? "Enviando…" : "Enviar"}
        </button>
        <p className="text-[13px] text-faint">No se publica. Lo lee el equipo.</p>
      </div>
    </form>
  );
}
