import { shortCOP } from "@/lib/money-progress";
import type { DonationLogEntry } from "@/lib/types";

/**
 * Donaciones de muestra para ver el registro lleno mientras la pasarela no cobra.
 *
 * No se escriben en la base: viven solo en esta pantalla, rotuladas como muestra.
 * El día que `donation_log` traiga filas de verdad, estas no se pintan.
 */
export function sampleDonationLog(input: {
  caseId: string;
  caseName: string;
  cityId: string;
  cityName: string;
  citySlug: string;
}): DonationLogEntry[] {
  const { caseId, caseName, cityId, cityName, citySlug } = input;
  const stamp = (daysAgo: number, hour: number, minute: number) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    date.setUTCHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  const row = (
    id: string,
    amount_cop: number,
    donor_name: string | null,
    daysAgo: number,
    hour: number,
    minute: number,
  ): DonationLogEntry => ({
    id: `muestra-${id}`,
    amount_cop,
    donated_at: stamp(daysAgo, hour, minute),
    donor_name,
    publish_name: Boolean(donor_name),
    case_id: caseId,
    case_name: caseName,
    city_id: cityId,
    city_name: cityName,
    city_slug: citySlug,
  });

  return [
    row("1", 150_000, "Lucía Restrepo", 0, 14, 20),
    row("2", 80_000, null, 1, 9, 5),
    row("3", 250_000, "Andrés Palacios", 2, 18, 40),
    row("4", 50_000, "Paola Mosquera", 3, 11, 12),
    row("5", 500_000, "Marta Hinestroza", 5, 16, 30),
    row("6", 1_000_000, null, 8, 8, 0),
    row("7", 1_170_000, "Carlos Vélez", 12, 19, 45),
  ];
}

/** La última donación con nombre, o la última anónima si no hay ninguna firmada. */
export function latestDonor(entries: DonationLogEntry[]): DonationLogEntry | null {
  return entries[0] ?? null;
}

/** «Lucía Restrepo donó $150 mil», el renglón de la referencia. */
export function donorLine(entry: DonationLogEntry): string {
  const amount = shortCOP(entry.amount_cop);
  return entry.donor_name ? `${entry.donor_name} donó ${amount}` : `Alguien donó ${amount}`;
}
