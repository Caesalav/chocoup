import { MUNICIPALITIES } from "./choco-texture";

/**
 * Escala de color del mapa y cruce entre municipios del DANE y ciudades
 * documentadas.
 *
 * El color sale de `openNeeds` y de nada más. Es el único número que el equipo
 * mantiene al día desde el panel, así que es el único que puede colorear un mapa
 * sin mentir: la leyenda dice "necesidades abiertas" y no "gravedad" porque eso
 * es literalmente lo que se está contando.
 */

export type NeedsTier = "blank" | "none" | "low" | "mid" | "high";

/**
 * Tramos anchos y pocos: con cuatro municipios documentados, una escala continua
 * daría cuatro tonos indistinguibles y sugeriría una precisión que no tenemos.
 *
 * Sin dato no hay tono: los 26 municipios que nadie ha visitado quedan en gris,
 * que es distinto de haber ido y no encontrar nada abierto (`none`).
 */
export function needsTier(openNeeds: number | undefined): NeedsTier {
  if (openNeeds === undefined) return "blank";
  if (openNeeds <= 0) return "none";
  if (openNeeds <= 3) return "low";
  if (openNeeds <= 6) return "mid";
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
  { tier: "none", label: "0" },
  { tier: "low", label: "1–3" },
  { tier: "mid", label: "4–6" },
  { tier: "high", label: "7 o más" },
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

/** Lo que la escala necesita de una ciudad: cómo se llama y qué tiene abierto. */
type Documented = { name: string; openNeeds?: number };

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
      tier: needsTier(city?.openNeeds),
      city,
    };
  });
}
