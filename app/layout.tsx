import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Instrument_Serif({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Mapa y registro de la situación en municipios del Chocó tras el terremoto: necesidades por zona, casos de personas y fundaciones con las que coordinar donaciones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-base text-body">
        <DemoBanner />
        {/* La cabecera flota sobre el lienzo, así que necesita este contexto. */}
        <div className="relative flex flex-1 flex-col">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
