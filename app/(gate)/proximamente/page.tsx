import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";
import { SITE_NAME } from "@/lib/constants";
import { countDonationLog, getDonationTotal } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pronto",
  description:
    "El tablero del Chocó todavía no es público. Un mapa compartido de lo que falta después del terremoto. Déjanos un correo y te avisamos cuando se abra.",
  openGraph: {
    title: `${SITE_NAME} · El tablero todavía no es público`,
    description:
      "Un mapa compartido de lo que falta en el Chocó después del terremoto. Avísame cuando se abra.",
  },
};

function parseSignupState(value: string | undefined): "recibido" | "correo" | null {
  if (value === "recibido") return "recibido";
  if (value === "correo") return "correo";
  return null;
}

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ avisos?: string }>;
}) {
  const [{ avisos }, donationCount, donationTotal] = await Promise.all([
    searchParams,
    countDonationLog(),
    getDonationTotal(),
  ]);

  return (
    <ComingSoon
      state={parseSignupState(avisos)}
      donationCount={donationCount}
      donationTotal={donationTotal}
    />
  );
}
