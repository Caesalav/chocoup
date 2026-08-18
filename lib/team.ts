import { getTeamSession } from "./supabase/server";
import { isDemoMode } from "./supabase/env";
import { demoTeamSession } from "./demo-data";
import type { TeamSession } from "./types";

/**
 * Quién está usando el panel y qué puede tocar.
 *
 * Con datos de muestra hay una sesión inventada de coordinación para poder
 * recorrer el panel entero sin base de datos; en cuanto hay claves, la respuesta
 * la da Postgres a partir del correo del token.
 */
export async function currentTeam(): Promise<TeamSession | null> {
  if (isDemoMode()) return demoTeamSession();
  return getTeamSession();
}

export function isCoordination(session: TeamSession | null): boolean {
  return session?.role === "coordinacion";
}

/**
 * La misma regla que `private.can_write_city` en la migración 0002, escrita aquí
 * para no ofrecer formularios que la base de datos va a rechazar. Es una copia,
 * y las copias se separan: si una cambia, hay que cambiar la otra, y la que
 * decide de verdad es la de la base de datos.
 *
 * El municipio nulo —una oferta que no apunta a ningún sitio— es de
 * coordinación, igual que allí.
 */
export function canWriteCity(session: TeamSession | null, cityId: string | null): boolean {
  if (!session) return false;
  if (session.role === "coordinacion") return true;
  return cityId !== null && session.cityIds.includes(cityId);
}
