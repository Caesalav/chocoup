"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { button, field } from "@/components/ui/styles";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="mt-6 rounded-xl border border-line bg-panel/70 p-5">
        <h2 className="font-display text-xl text-ink">Revisa tu correo</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Enviamos un enlace de acceso a <span className="text-ink">{email}</span>. Ábrelo en este
          mismo teléfono o computador: el enlace solo funciona en el navegador desde el que lo
          pediste.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className={`${button.secondary} mt-4`}
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className={field.label}>Correo del equipo</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={field.input}
          placeholder="tu@correo.com"
        />
      </label>

      {status === "error" && (
        <p role="alert" className="rounded-lg bg-amber-soft px-3.5 py-2.5 text-sm text-amber">
          {message || "No pudimos enviar el enlace. Revisa el correo e inténtalo de nuevo."}
        </p>
      )}

      <button type="submit" className={button.primary} disabled={status === "sending"}>
        {status === "sending" ? "Enviando…" : "Enviar enlace de acceso"}
      </button>
    </form>
  );
}
