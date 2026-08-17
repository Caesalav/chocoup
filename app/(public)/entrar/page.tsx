import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { SetupNotice } from "@/components/SetupNotice";
import { eyebrow } from "@/components/ui/styles";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-5 pb-20 pt-32">
      <p className={eyebrow}>Equipo Chuc-up</p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink">Entrar al panel</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Escribe tu correo y te enviamos un enlace de acceso. Sin contraseñas.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-amber-soft px-3.5 py-2.5 text-sm text-amber">
          El enlace caducó o ya se usó. Pide uno nuevo.
        </p>
      )}

      {isSupabaseConfigured() ? (
        <LoginForm />
      ) : (
        <div className="mt-6">
          <SetupNotice />
        </div>
      )}
    </div>
  );
}
