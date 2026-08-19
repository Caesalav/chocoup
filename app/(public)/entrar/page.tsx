import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";
import { SetupNotice } from "@/components/SetupNotice";
import { alertBox } from "@/components/ui/styles";
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
    <div className="mx-auto max-w-md px-5 pb-8 pt-10 lg:pb-24 lg:pt-16">
      <Logo className="mb-6 text-[32px] text-ink" />
      <p className="text-[13px] text-faint">Equipo ChocóUp</p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink">Entrar al panel</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Escribe tu correo y tu contraseña.
      </p>

      {/* Este aviso llega de /auth/callback cuando falla un enlace de invitación
          o de recuperación. No dice «pide uno nuevo» porque desde aquí no se puede
          pedir: el portal entra con contraseña y los enlaces los manda
          coordinación desde Supabase. Prometer un botón que no existe deja a
          alguien esperando un correo que nadie va a enviar. */}
      {error && (
        <p role="alert" className={`${alertBox} mt-4`}>
          Ese enlace caducó o ya se usó. Pide a coordinación que te mande otro.
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
