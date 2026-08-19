"use client";

import { usePathname } from "next/navigation";
import { Dock, DockIcon } from "@/components/nav/Dock";
import { HomeIcon } from "@/components/ui/icons";
import { ADMIN_HOME, ADMIN_SECTIONS, activeAdminSection } from "@/lib/admin-sections";

/**
 * La misma barra inferior del portal, con las tres secciones del equipo.
 *
 * Abajo en el móvil, donde llega el pulgar; a partir de `lg` la sustituye la
 * barra de arriba, igual que en ChocóUp. Inicio es la puerta del panel.
 */
export function AdminBottomNav({ pendingOffers }: { pendingOffers: number }) {
  const pathname = usePathname();
  const section = activeAdminSection(pathname);
  const atHome = pathname === ADMIN_HOME;

  return (
    <Dock label="Secciones del panel">
      <DockIcon href={ADMIN_HOME} label="Inicio" active={atHome}>
        <HomeIcon className="size-[22px] shrink-0" />
      </DockIcon>
      {ADMIN_SECTIONS.map((item) => (
        <DockIcon
          key={item.key}
          href={item.href}
          label={item.label}
          active={section === item.key}
          badge={item.key === "recursos" ? pendingOffers : undefined}
        >
          <item.Icon className="size-[22px] shrink-0" />
        </DockIcon>
      ))}
    </Dock>
  );
}
