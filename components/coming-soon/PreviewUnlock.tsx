"use client";

import { useActionState, useState } from "react";
import { unlockPreview, type PreviewState } from "@/app/(gate)/proximamente/actions";
import { alertBox, button, field } from "@/components/ui/styles";

/**
 * El punto discreto de la landing: sin etiqueta, casi del color del papel.
 * Abre un campo de clave. Quien no lo busca no lo ve.
 */
export function PreviewUnlock() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PreviewState, FormData>(unlockPreview, null);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Continuar"
        onClick={() => setOpen(true)}
        className="mt-10 size-2 rounded-full bg-ink/[0.07] transition-colors hover:bg-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
    );
  }

  return (
    <form action={action} className="mt-8 max-w-[16rem]">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-0"
      />
      <label className="block">
        <span className="sr-only">Clave</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={field.input}
          placeholder="Clave"
        />
      </label>
      {state && "error" in state && <p className={`${alertBox} mt-2`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={`${button.ghost} mt-2`}>
        {pending ? "Abriendo…" : "Entrar"}
      </button>
    </form>
  );
}
