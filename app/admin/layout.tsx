import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminNav } from "./AdminNav";
import { getOffers } from "@/lib/admin-data";
import { createSupabaseServerClient, getSessionEmail, isTeamMember } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del equipo",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Con datos de muestra no hay sesión que comprobar: el panel se puede recorrer
  // para ver cómo es, y cualquier intento de guardar avisa de que no persiste.
  if (isDemoMode()) {
    const pending = (await getOffers("pendiente")).length;
    return (
      <>
        {/* La cabecera del portal flota encima, así que el panel arranca debajo. */}
        <div className="pt-[68px]">
          <AdminNav email="muestra@chuc-up" pendingOffers={pending} />
        </div>
        <main className="flex-1">{children}</main>
      </>
    );
  }

  const email = await getSessionEmail();
  if (!email) redirect("/entrar");

  if (!(await isTeamMember())) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-5 pb-16 pt-28">
        <h1 className="font-display text-3xl text-ink">Tu cuenta no tiene acceso</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          Entraste como <span className="text-ink">{email}</span>, pero ese correo no está en la
          lista del equipo. Pide que lo añadan a{" "}
          <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">
            private.team_members
          </code>{" "}
          en Supabase.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button type="submit" className="text-sm text-amber hover:underline">
            Salir y probar con otro correo
          </button>
        </form>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendiente");

  return (
    <>
      <div className="pt-[68px]">
        <AdminNav email={email} pendingOffers={count ?? 0} />
      </div>
      <main className="flex-1">{children}</main>
    </>
  );
}
