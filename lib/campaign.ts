import { remainingRatio } from "./case-progress";
import type { CaseCard, CityCardData } from "./types";

/**
 * El foco del momento: a dónde mira todo el mundo ahora.
 *
 * Hay dos capas, a propósito. El mapa siempre pinta dónde falta más. Encima,
 * coordinación puede marcar un pueblo o una causa —como Arrowhead marca el
 * planeta de la semana—. Si no marca nada, o marca uno que el público no ve,
 * el aviso cae en el más atrasado. Sin eso, cada quien iría a un sitio distinto
 * y no se sentiría el efecto.
 *
 * La fila vive en `public.campaign_focus` (supabase/migrations/0018_tablero.sql).
 * Vacía es un estado válido: entonces manda el mapa.
 */

export type CampaignFocusRow = {
  city_id: string | null;
  case_id: string | null;
  note: string;
};

export const EMPTY_FOCUS: CampaignFocusRow = {
  city_id: null,
  case_id: null,
  note: "",
};

export type ResolvedCampaign = {
  source: "editorial" | "automatic";
  city: CityCardData;
  caseId: string | null;
  caseName: string | null;
  note: string;
};

export function remainingOf(city: Pick<CityCardData, "progress">): number {
  return remainingRatio(city.progress);
}

/** El pueblo documentado donde más falta, o nulo si no falta nada en ninguno. */
export function mostBehind(cities: CityCardData[]): CityCardData | null {
  const open = cities.filter((city) => remainingOf(city) > 0);
  if (open.length === 0) return null;
  return [...open].sort((a, b) => {
    const diff = remainingOf(b) - remainingOf(a);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "es");
  })[0];
}

export function resolveCampaign(
  row: CampaignFocusRow,
  cities: CityCardData[],
  cases: Pick<CaseCard, "id" | "display_name" | "city_id">[],
): ResolvedCampaign | null {
  const editorial = row.city_id ? cities.find((city) => city.id === row.city_id) : undefined;
  if (editorial) {
    const focused = row.case_id
      ? cases.find((entry) => entry.id === row.case_id && entry.city_id === editorial.id)
      : undefined;
    return {
      source: "editorial",
      city: editorial,
      caseId: focused?.id ?? null,
      caseName: focused?.display_name ?? null,
      note: row.note.trim(),
    };
  }

  const automatic = mostBehind(cities);
  if (!automatic) return null;

  return {
    source: "automatic",
    city: automatic,
    caseId: null,
    caseName: null,
    note: "",
  };
}

/**
 * El orden del tablero: el foco primero, después lo más atrasado.
 * El listado alfabético se queda en /municipios, que es un directorio.
 */
export function byCampaignPriority(
  cities: CityCardData[],
  focusCityId: string | null,
): CityCardData[] {
  return [...cities].sort((a, b) => {
    if (focusCityId) {
      if (a.id === focusCityId) return -1;
      if (b.id === focusCityId) return 1;
    }
    const diff = remainingOf(b) - remainingOf(a);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "es");
  });
}

export function campaignHref(campaign: ResolvedCampaign): string {
  if (campaign.caseId) return `/ciudades/${campaign.city.slug}/casos/${campaign.caseId}`;
  return `/ciudades/${campaign.city.slug}`;
}
