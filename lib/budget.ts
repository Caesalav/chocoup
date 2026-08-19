import type { CaseProgress } from "./case-progress";

/**
 * El presupuesto de una causa: ítems con precio, cuánto se ha donado y cuánto
 * de eso ya se gastó.
 *
 * La meta es la suma de los precios. Lo usado es la suma de los ítems que el
 * equipo marcó como comprados. Lo donado no se teclea: llega de las donaciones
 * confirmadas (o, en los datos de muestra, de una cifra inventada para poder
 * ver la barra).
 *
 * La barra del caso enseña las tres cifras. El mapa y las tarjetas usan
 * `ratio`: si ya hay donaciones, es recaudado / meta; si todavía no —Mercado
 * Pago no está conectado—, es usado / meta, para que verificar una compra siga
 * moviendo el tablero.
 */

export type BudgetItem = {
  id: string;
  case_id: string;
  city_id: string;
  title: string;
  amount_cop: number;
  purchased: boolean;
  purchased_on: string | null;
  sort_order: number;
  created_at: string;
};

export type BudgetTotals = {
  goal_cop: number;
  donated_cop: number;
  used_cop: number;
};

export type BudgetProgress = {
  goal: number;
  donated: number;
  used: number;
  itemCount: number;
  pendingItems: number;
  purchasedItems: number;
  /** 0–1. Cero si todavía no hay presupuesto. */
  ratio: number;
};

export function budgetProgress(
  items: Pick<BudgetItem, "amount_cop" | "purchased">[],
  donated: number,
): BudgetProgress {
  const goal = items.reduce((sum, item) => sum + Number(item.amount_cop), 0);
  const used = items
    .filter((item) => item.purchased)
    .reduce((sum, item) => sum + Number(item.amount_cop), 0);
  const raised = Math.max(0, Number(donated) || 0);
  const covered = raised > 0 ? raised : used;
  const ratio = goal === 0 ? 0 : Math.min(1, covered / goal);

  return {
    goal,
    donated: raised,
    used,
    itemCount: items.length,
    pendingItems: items.filter((item) => !item.purchased).length,
    purchasedItems: items.filter((item) => item.purchased).length,
    ratio,
  };
}

export function budgetProgressFromTotals(totals: BudgetTotals): BudgetProgress {
  const goal = Number(totals.goal_cop) || 0;
  const donated = Number(totals.donated_cop) || 0;
  const used = Number(totals.used_cop) || 0;
  const covered = donated > 0 ? donated : used;
  return {
    goal,
    donated,
    used,
    itemCount: 0,
    pendingItems: 0,
    purchasedItems: 0,
    ratio: goal === 0 ? 0 : Math.min(1, covered / goal),
  };
}

/**
 * La forma que ya consumen el mapa y las tarjetas. `total` es la meta en pesos,
 * no un recuento de filas: `remainingRatio` sigue siendo lo que falta por
 * recaudar (o por gastar, si todavía no hay donaciones).
 */
export function asCaseProgress(budget: BudgetProgress): CaseProgress {
  return {
    total: budget.goal,
    covered: budget.used,
    partial: Math.max(0, budget.donated - budget.used),
    open: Math.max(0, budget.goal - Math.max(budget.donated, budget.used)),
    ratio: budget.ratio,
  };
}

export function mergeBudget(items: BudgetProgress[]): BudgetProgress {
  const goal = items.reduce((sum, item) => sum + item.goal, 0);
  const donated = items.reduce((sum, item) => sum + item.donated, 0);
  const used = items.reduce((sum, item) => sum + item.used, 0);
  const itemCount = items.reduce((sum, item) => sum + item.itemCount, 0);
  const pendingItems = items.reduce((sum, item) => sum + item.pendingItems, 0);
  const purchasedItems = items.reduce((sum, item) => sum + item.purchasedItems, 0);
  const covered = donated > 0 ? donated : used;
  return {
    goal,
    donated,
    used,
    itemCount,
    pendingItems,
    purchasedItems,
    ratio: goal === 0 ? 0 : Math.min(1, covered / goal),
  };
}

/** La compra más reciente, que es la que sirve de prueba en la ficha. */
export function lastPurchasedItem(items: BudgetItem[] | undefined): BudgetItem | null {
  if (!items) return null;
  const bought = items.filter((item) => item.purchased && item.purchased_on);
  if (bought.length === 0) return null;
  return bought.sort((a, b) => (b.purchased_on ?? "").localeCompare(a.purchased_on ?? ""))[0];
}

/** Lo siguiente que falta, en el orden que le dio el equipo. */
export function firstPendingItem(items: BudgetItem[] | undefined): BudgetItem | null {
  if (!items) return null;
  const pending = items.filter((item) => !item.purchased);
  if (pending.length === 0) return null;
  return pending.sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  )[0];
}

/** Casos con al menos un ítem todavía sin comprar. */
export function countOpenBudgetCases(
  items: Pick<BudgetItem, "case_id" | "purchased">[],
): number {
  const open = new Set<string>();
  for (const item of items) {
    if (!item.purchased) open.add(item.case_id);
  }
  return open.size;
}

/** Casos con presupuesto y todo ya comprado: las causas solucionadas. */
export function countSolvedBudgetCases(
  items: Pick<BudgetItem, "case_id" | "purchased">[],
): number {
  const pending = new Set<string>();
  const withBudget = new Set<string>();
  for (const item of items) {
    withBudget.add(item.case_id);
    if (!item.purchased) pending.add(item.case_id);
  }
  let solved = 0;
  for (const id of withBudget) {
    if (!pending.has(id)) solved += 1;
  }
  return solved;
}
