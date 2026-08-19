import type { CaseProgress } from "./case-progress";
import type { PhotoFrame } from "./photo-frame";
import type { CaseKind, NeedCategory, NeedStatus } from "./types";

/**
 * Un recurso que todavía falta en una causa, para enseñarlo en la lista.
 *
 * Es el presupuesto de esta pantalla: no hay recaudo en pesos que se pueda
 * leer —la pasarela no está, y un cero fingido diría que nadie ha ayudado—
 * así que el plan son estas líneas (tejas, mercados, tanques) y lo recopilado
 * es cuántas ya están cubiertas. Ver `caseProgress`.
 */
export type AdminCaseResource = {
  title: string;
  quantity: string;
  category: NeedCategory;
  status: NeedStatus;
  urgent: boolean;
};

/**
 * Una causa en la lista de /admin/casos, reducida a lo que hace falta para
 * elegirla de un vistazo.
 *
 * El tipo vive aquí, sin el cliente de la base, para que el directorio del
 * panel pueda pintarlo sin arrastrar `next/headers` al navegador.
 */
export type AdminCaseRow = {
  id: string;
  displayName: string;
  kind: CaseKind;
  household: string;
  summary: string;
  createdAt: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  cityPublished: boolean;
  published: boolean;
  consent: boolean;
  /** Con canal propio, o recibiendo por el general. Ver `caseDonation()`. */
  ownChannel: boolean;
  openNeeds: number;
  /** Cuánto del plan de recursos está cubierto. Sin necesidades, total 0. */
  progress: CaseProgress;
  /** Lo que todavía falta, urgentes primero. Lo cubierto no se lista aquí. */
  resources: AdminCaseResource[];
  portraitPath: string | null;
  portraitFrame: PhotoFrame | null;
  /**
   * El día del último avance del diario, o nulo si todavía no hay ninguno.
   *
   * Es `max(case_updates.happened_on)` y no `cases.updated_at`, por lo mismo que
   * en `CasePage.lastUpdateOn`: esa columna se mueve al corregir una tilde, así
   * que la lista diría que hay noticias de una familia el día en que alguien
   * arregló una errata. Nulo es frecuente y es una respuesta —esta causa está
   * documentada y todavía no ha pasado nada— y no un hueco.
   */
  lastUpdateOn: string | null;
};
