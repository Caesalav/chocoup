import { countCoveredNeeds } from "./needs";
import type { Need, NeedStatus } from "./types";

/**
 * Cuánto ha avanzado un caso o un pueblo, según sus necesidades.
 *
 * Cubierta cuenta entera, parcial a la mitad: una familia a la que le llegó
 * parte de las tejas no está igual que el primer día, y la barra tiene que
 * moverse. Sin necesidades no hay barra —no se finge un 0 % ni un 100 %.
 *
 * El pueblo usa exactamente esta cuenta sobre el montón de todas las suyas,
 * de la zona y de cada caso. No se promedian barras: una causa chica ya
 * resuelta no puede dejar a medias un pueblo donde otra sigue con casi todo
 * pendiente. Ver `cityProgress`.
 */

export type CaseProgress = {
  total: number;
  covered: number;
  partial: number;
  open: number;
  /** 0–1. Cero si todavía no hay necesidades. */
  ratio: number;
};

const WEIGHT: Record<NeedStatus, number> = {
  abierta: 0,
  parcial: 0.5,
  cubierta: 1,
};

export function caseProgress(needs: Pick<Need, "status">[]): CaseProgress {
  const total = needs.length;
  const covered = countCoveredNeeds(needs);
  const partial = needs.filter((need) => need.status === "parcial").length;
  // `open` aquí es solo `abierta`, y es el único sitio del portal donde esa
  // palabra significa eso: la barra reparte el total en tres tramos y necesita
  // el que no ha empezado, aparte del que va a medias. Lo que cuenta el resto
  // del portal —`countOpenNeeds`, todo lo que no está cubierto— es la suma de
  // estos dos. Por eso este número no sale a ninguna pantalla.
  const open = total - covered - partial;
  const ratio =
    total === 0 ? 0 : needs.reduce((sum, need) => sum + WEIGHT[need.status], 0) / total;

  return { total, covered, partial, open, ratio };
}

/**
 * El avance de un municipio: las mismas pesas, el montón entero de lo que
 * falta allí. Es un alias a propósito —no hay una segunda fórmula— para que
 * el mapa, la ficha y la tarjeta no puedan volver a contar distinto.
 */
export function cityProgress(needs: Pick<Need, "status">[]): CaseProgress {
  return caseProgress(needs);
}

/** Cuánto sigue sin cubrir, 0–1. Sin necesidades, nada falta en el tablero. */
export function remainingRatio(progress: Pick<CaseProgress, "total" | "ratio">): number {
  if (progress.total === 0) return 0;
  return 1 - progress.ratio;
}

export function progressPercent(ratio: number): number {
  return Math.round(ratio * 100);
}
