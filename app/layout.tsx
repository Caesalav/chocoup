import type { Metadata } from "next";
import { Bricolage_Grotesque, Outfit } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { isDemoMode } from "@/lib/supabase/env";
import "./globals.css";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Mapa y registro de la situación en municipios del Chocó tras el terremoto: necesidades por zona y casos documentados, cada uno con el canal por el que recibe donaciones.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      {/* El color del papel lo pinta <html> y aquí no se repite, para que no haya
          dos sitios donde cambiarlo. has-strip da alto a la franja de aviso para que
          las pantallas a alto completo lo descuenten.

          La navegación no vive aquí: la monta cada zona. El portal público
          (app/(public)/layout.tsx) pone la barra inferior en el móvil y la
          cabecera a partir de `lg`, nunca las dos; el panel del equipo monta la
          suya. Este archivo solo envuelve a los dos. */}
      <body className={`flex min-h-full flex-col text-body ${isDemoMode() ? "has-strip" : ""}`}>
        <DemoBanner />
        <div className="relative flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
