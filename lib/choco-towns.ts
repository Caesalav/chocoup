import { MUNICIPALITIES } from "@/lib/choco-texture";
import { unprojectFromMap } from "@/lib/choco-map";

/**
 * Los treinta municipios del Chocó, con un punto que cae sobre el mapa del
 * portal.
 *
 * El nombre es el del DANE. La coordenada, si la sabemos de la cabecera, es esa;
 * si no, el centro de la forma que ya dibuja el mapa. Así, al elegir «Unguía»
 * el pin se enciende en Unguía y no en un clic a ciegas.
 */

export type ChocoTown = {
  name: string;
  lat: number;
  lng: number;
};

/** Cabeceras que ya están medidas; el resto sale del contorno. */
const SEATS: Record<string, { lat: number; lng: number }> = {
  Quibdó: { lat: 5.6947, lng: -76.6611 },
  Istmina: { lat: 5.1594, lng: -76.6853 },
  Condoto: { lat: 5.0906, lng: -76.6469 },
  Tadó: { lat: 5.2656, lng: -76.5619 },
  "Bahía Solano": { lat: 6.2225, lng: -77.4028 },
  Nuquí: { lat: 5.7089, lng: -77.2708 },
  Bojayá: { lat: 6.5581, lng: -76.8869 },
  Riosucio: { lat: 7.4386, lng: -77.1181 },
  Acandí: { lat: 8.5122, lng: -77.2789 },
  "El Carmen de Atrato": { lat: 5.8967, lng: -76.1442 },
};

const DISPLAY: Record<string, string> = {
  "El Cantón Del San Pablo": "El Cantón del San Pablo",
  "Carmen Del Darién": "Carmen del Darién",
  "El Carmen De Atrato": "El Carmen de Atrato",
  "El Litoral Del San Juan": "El Litoral del San Juan",
  "San José Del Palmar": "San José del Palmar",
};

function pathCenter(d: string): { lat: number; lng: number } {
  const nums = [...d.matchAll(/-?\d+\.?\d*/g)].map((match) => Number(match[0]));
  let x = 0;
  let y = 0;
  let n = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    x += nums[i];
    y += nums[i + 1];
    n += 1;
  }
  return unprojectFromMap(x / n, y / n);
}

function displayName(raw: string): string {
  return DISPLAY[raw] ?? raw;
}

export const CHOCO_TOWNS: ChocoTown[] = MUNICIPALITIES.map((shape) => {
  const name = displayName(shape.name);
  const seat = SEATS[name];
  const point = seat ?? pathCenter(shape.d);
  return { name, lat: Number(point.lat.toFixed(4)), lng: Number(point.lng.toFixed(4)) };
}).sort((a, b) => a.name.localeCompare(b.name, "es"));

/** Quita tildes para buscar «Nuqui» y encontrar Nuquí. */
export function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function findTowns(query: string): ChocoTown[] {
  const needle = foldName(query);
  if (needle.length < 1) return CHOCO_TOWNS;
  return CHOCO_TOWNS.filter((town) => foldName(town.name).includes(needle));
}

export function townByName(name: string): ChocoTown | undefined {
  const needle = foldName(name);
  return CHOCO_TOWNS.find((town) => foldName(town.name) === needle);
}
