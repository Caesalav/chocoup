"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { alertBox, button, field } from "@/components/ui/styles";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      // Supabase contesta en inglés y con el mismo texto para correo que no
      // existe y contraseña equivocada. Se traduce sin desglosarlo: decir cuál
      // de los dos falló es decirle a un desconocido qué correos son del equipo.
      setMessage(
        /invalid login credentials/i.test(error.message)
          ? "Ese correo y esa contraseña no coinciden."
          : error.message,
      );
      return;
    }

    // Recarga completa en vez de router.push: la sesión acaba de escribirse en
    // una cookie y quien decide si se entra al panel es el servidor. El estado
    // "Entrando…" se queda puesto a propósito hasta que la página se va.
    window.location.assign("/admin");
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

      <label className="block">
        <span className={field.label}>Contraseña</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={field.input}
        />
      </label>

      {status === "error" && (
        <p role="alert" className={alertBox}>
          {message || "No pudimos entrar. Inténtalo de nuevo."}
        </p>
      )}

      <button type="submit" className={button.primary} disabled={status === "sending"}>
        {status === "sending" ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
