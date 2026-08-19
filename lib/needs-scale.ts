import { MUNICIPALITIES } from "./choco-texture";

/**
 * Escala de color del mapa y cruce entre municipios del DANE y ciudades
 * documentadas.
 *
 * El color sale de cuánto falta por cubrir —el inverso del avance de
 * `cityProgress`— y de nada más. Un pueblo documentado donde ya no falta nada
 * no es gris: el gris es «nadie ha ido». Mezclarlos diría que Quibdó, resuelto,
 * está igual que un municipio al que el equipo no ha llegado.
 *
 * El avance lo calcula lib/case-progress.ts sobre el montón de necesidades del
 * pueblo. Aquí solo se reparte ese resto en tramos, para que la leyenda, el
 * punto de la tarjeta y la forma en el mapa digan lo mismo.
 */

export type NeedsTier = "blank" | "none" | "low" | "mid" | "high";

/**
 * Tramos anchos y pocos: una escala continua daría treinta rojos
 * indistinguibles y sugeriría una precisión que el tablero no tiene.
 *
 * `progress` nulo es «nadie ha documentado». Cero necesidades, o todas
 * cubiertas, es `none`: se fue, y ahora mismo no falta nada. Esas dos cosas
 * no pueden parecerse.
 */
export function needsTier(
  progress: { total: number; ratio: number } | undefined,
): NeedsTier {
  if (!progress) return "blank";
  const remaining = progress.total === 0 ? 0 : 1 - progress.ratio;
  if (remaining <= 0) return "none";
  if (remaining <= 1 / 3) return "low";
  if (remaining <= 2 / 3) return "mid";
  return "high";
}

export const TIER_FILL: Record<NeedsTier, string> = {
  blank: "fill-need-blank",
  none: "fill-need-none",
  low: "fill-need-low",
  mid: "fill-need-mid",
  high: "fill-need-high",
};

/** El mismo tono como punto, para la leyenda y las tarjetas del listado. */
export const TIER_DOT: Record<NeedsTier, string> = {
  blank: "bg-need-blank",
  none: "bg-need-none",
  low: "bg-need-low",
  mid: "bg-need-mid",
  high: "bg-need-high",
};

export const NEEDS_LEGEND: { tier: NeedsTier; label: string }[] = [
  { tier: "none", label: "Nada falta" },
  { tier: "low", label: "Falta poco" },
  { tier: "mid", label: "A medias" },
  { tier: "high", label: "Prioritario" },
  { tier: "blank", label: "Sin documentar" },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Nombres que no casan solos.
 *
 * El DANE nombra el municipio y la gente nombra la cabecera: quien documenta
 * escribe "Bellavista" o "Pie de Pató" porque es el pueblo al que llegó. La
 * tabla va de lo que se escribe a lo que dice el DANE, y solo tiene las
 * cabeceras que se llaman distinto que su municipio; añadir una ciudad cuyo
 * nombre ya coincide no exige tocar nada de aquí.
 */
const ALIASES: Record<string, string> = {
  animas: "union panamericana",
  andagoya: "medio san juan",
  bete: "medio atrato",
  bellavista: "bojaya",
  "boca de pepe": "medio baudo",
  "ciudad mutis": "bahia solano",
  curbarado: "carmen del darien",
  docordo: "el litoral del san juan",
  "el canton de san pablo": "el canton del san pablo",
  "el carmen del darien": "carmen del darien",
  "las animas": "union panamericana",
  managru: "el canton del san pablo",
  paimado: "rio quito",
  "pie de pato": "alto baudo",
  pizarro: "bajo baudo",
  "santa rita": "rio iro",
  yuto: "atrato",
};

const matchKey = (name: string) => {
  const key = normalize(name);
  return ALIASES[key] ?? key;
};

/** Lo que la escala necesita de una ciudad: cómo se llama y cuánto le falta. */
type Documented = { name: string; progress?: { total: number; ratio: number } };

export type PaintedMunicipality<T> = {
  id: string;
  name: string;
  d: string;
  tier: NeedsTier;
  /** La ciudad documentada que cae en esta forma, o null si nadie ha ido. */
  city: T | null;
};

/**
 * Reparte las ciudades documentadas entre las 30 formas del departamento.
 *
 * Devuelve las 30 siempre y en el orden del DANE: el mapa se dibuja entero
 * pase lo que pase, y un municipio que no case simplemente sale en gris en vez
 * de dejar un agujero en el mosaico.
 */
export function paintMunicipalities<T extends Documented>(cities: T[]): PaintedMunicipality<T>[] {
  const byName = new Map(cities.map((city) => [matchKey(city.name), city]));

  return MUNICIPALITIES.map((shape) => {
    const city = byName.get(matchKey(shape.name)) ?? null;
    return {
      id: shape.id,
      name: shape.name,
      d: shape.d,
      tier: needsTier(city?.progress),
      city,
    };
  });
}
