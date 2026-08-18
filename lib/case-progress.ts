import type { Need, NeedStatus } from "./types";

/**
 * Cuánto ha avanzado un caso, según sus necesidades.
 *
 * Cubierta cuenta entera, parcial a la mitad: una familia a la que le llegó
 * parte de las tejas no está igual que el primer día, y la barra tiene que
 * moverse. Sin necesidades no hay barra —no se finge un 0 % ni un 100 %.
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
  const covered = needs.filter((need) => need.status === "cubierta").length;
  const partial = needs.filter((need) => need.status === "parcial").length;
  const open = total - covered - partial;
  const ratio =
    total === 0 ? 0 : needs.reduce((sum, need) => sum + WEIGHT[need.status], 0) / total;

  return { total, covered, partial, open, ratio };
}
