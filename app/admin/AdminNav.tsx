"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ADMIN_SECTIONS, ADMIN_UTILITIES, activeAdminSection } from "@/lib/admin-sections";
import { teamRoleLabel } from "@/lib/constants";
import type { TeamRole } from "@/lib/types";

/**
 * Navegación del panel: abajo en el móvil (la misma píldora del portal) y
 * arriba en escritorio (estas pastillas). El móvil lleva además una franja
 * corta con la marca y Salir, porque ahí no está la cabecera pública.
 */
const item =
  "smallcaps inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] whitespace-nowrap transition-colors";
const idle = "text-muted hover:bg-line hover:text-ink";
const open = "bg-ink text-paper";

function Counter({ value, isOpen }: { value: number; isOpen: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
        isOpen ? "bg-paper/20 text-paper" : "bg-need-mid-soft text-need-mid-strong"
      }`}
    >
      {value}
    </span>
  );
}

export function AdminNav({
  email,
  role,
  pendingOffers,
  feedbackCount,
}: {
  email: string;
  role: TeamRole;
  pendingOffers: number;
  feedbackCount: number;
}) {
  const pathname = usePathname();
  const active = activeAdminSection(pathname);

  const counters: Partial<Record<(typeof ADMIN_SECTIONS)[number]["key"], number>> = {
    recursos: pendingOffers,
  };

  const utilityLinks = () =>
    ADMIN_UTILITIES.map((utility) => {
      if (utility.coordinationOnly && role !== "coordinacion") return null;
      const isOpen = pathname === utility.href || pathname.startsWith(`${utility.href}/`);
      return (
        <Link
          key={utility.href}
          href={utility.href}
          aria-current={isOpen ? "page" : undefined}
          className={`inline-flex min-h-11 items-center gap-2 text-[13px] transition-colors ${
            isOpen ? "text-ink underline" : "text-muted hover:text-ink hover:underline"
          }`}
        >
          {utility.label}
          {utility.href === "/admin/sugerencias" && feedbackCount > 0 && (
            <Counter value={feedbackCount} isOpen={false} />
          )}
        </Link>
      );
    });

  const signOut = () => (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="inline-flex min-h-11 items-center text-[13px] text-muted transition-colors hover:text-ink hover:underline"
      >
        Salir
      </button>
    </form>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-12 items-center justify-between gap-3 border-b border-line bg-paper/90 px-5 backdrop-blur lg:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-1.5 text-[18px] leading-none">
          <Logo className="h-[0.95em] w-auto shrink-0 text-accent" />
          <span className="font-display text-ink">
            Chocó<span className="text-accent">-up</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {utilityLinks()}
          {signOut()}
        </div>
      </div>

      <div className="hidden border-b border-line bg-panel lg:block">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-2 sm:px-8">
          <nav aria-label="Secciones del panel" className="flex flex-wrap items-center gap-1.5">
            {ADMIN_SECTIONS.map((section) => {
              const isOpen = active === section.key;
              const count = counters[section.key] ?? 0;
              return (
                <Link
                  key={section.key}
                  href={section.href}
                  aria-current={isOpen ? "page" : undefined}
                  title={section.title}
                  className={`${item} ${isOpen ? open : idle}`}
                >
                  <section.Icon className="size-4 shrink-0" />
                  {section.label}
                  {count > 0 && <Counter value={count} isOpen={isOpen} />}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {utilityLinks()}
            <span className="hidden text-xs text-faint lg:inline">
              {email} · {teamRoleLabel(role)}
            </span>
            {signOut()}
          </div>
        </div>
      </div>
    </>
  );
}
