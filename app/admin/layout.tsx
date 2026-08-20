import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminBottomNav } from "./AdminBottomNav";
import { AdminNav } from "./AdminNav";
import { SiteHeader } from "@/components/SiteHeader";
import { createSupabaseServerClient, getSessionEmail, getTeamSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel del equipo",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) redirect("/entrar");

  const team = await getTeamSession();
  if (!team) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-2xl flex-1 px-5 pb-16 pt-14">
          <h1 className="font-display text-3xl text-ink">Tu cuenta no tiene acceso</h1>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
            Entraste como <span className="text-ink">{email}</span>, pero ese correo no está en la
            lista del equipo. Pide a quien coordina que te invite desde el panel, en{" "}
            <span className="text-ink">Equipo</span>.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button type="submit" className="text-sm text-accent hover:underline">
              Salir y probar con otro correo
            </button>
          </form>
        </main>
      </>
    );
  }

  // Los dos contadores que la barra lleva desde siempre, colgados de donde vive
  // ahora cada cosa: las ofertas sin revisar en Verificación y el buzón en
  // «Sugerencias». Se cuentan aquí, en el layout, porque la barra se pinta en todas
  // las pantallas del panel y si cada una los pidiera por su cuenta habría un
  // número distinto según por dónde se entrara.
  //
  // Las ofertas que cuenta son las que las políticas dejan ver: en documentación,
  // solo las de sus municipios. El número de la barra no puede decir "3" y la
  // bandeja mostrar una.
  const supabase = await createSupabaseServerClient();
  const [{ count }, { count: inbox }] = await Promise.all([
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    supabase.from("feedback").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <SiteHeader className="hidden lg:block" />
      <AdminNav
        email={email}
        role={team.role}
        pendingOffers={count ?? 0}
        feedbackCount={inbox ?? 0}
      />
      <main className="flex-1 pb-[var(--nav-h)] lg:pb-0">{children}</main>
      <AdminBottomNav pendingOffers={count ?? 0} />
    </>
  );
}
