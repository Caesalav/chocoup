import { shortCOP } from "@/lib/money-progress";
import type { DonationLogEntry } from "@/lib/types";

/** La última donación con nombre, o la última anónima si no hay ninguna firmada. */
export function latestDonor(entries: DonationLogEntry[]): DonationLogEntry | null {
  return entries[0] ?? null;
}

/** «Lucía Restrepo donó $150 mil», el renglón de la referencia. */
export function donorLine(entry: DonationLogEntry): string {
  const amount = shortCOP(entry.amount_cop);
  return entry.donor_name ? `${entry.donor_name} donó ${amount}` : `Alguien donó ${amount}`;
}
