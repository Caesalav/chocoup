import { NEED_CATEGORIES } from "./constants";
import type { SupportOfferKind } from "./types";

export const SUPPORT_KINDS: {
  value: SupportOfferKind;
  label: string;
  /**
   * El rótulo de la pastilla cuando los cuatro caminos van en una fila.
   *
   * Existe por una razón medida y no de gusto: en la columna de la landing, que
   * en el peor caso son 476 px, cuatro pastillas dejan unos 79 px de texto a
   * cada una, y «Voluntariado» parte en dos renglones justo ahí. Con la palabra
   * corta entra en una línea y las cuatro quedan a la misma altura. `label` se
   * queda como está porque es el que leen las pestañas del panel, donde sí cabe.
   */
  short: string;
  title: string;
  blurb: string;
}[] = [
  {
    value: "voluntario",
    label: "Voluntariado",
    short: "Voluntario",
    title: "Ofrecerme como voluntario",
    blurb: "Tiempo, manos y presencia. El equipo te escribe para encajarte donde haga falta.",
  },
  {
    value: "profesion",
    label: "Profesión",
    short: "Profesión",
    title: "Ofrecer mi profesión",
    blurb: "Un oficio o una titulación: medicina, obra, derecho, psicología, lo que sepas hacer.",
  },
  {
    value: "recurso",
    label: "Recurso",
    short: "Recurso",
    title: "Ofrecer un recurso",
    blurb: "Una cosa concreta: tejas, mercados, un cupo de carga, medicinas. No va a una familia desde aquí.",
  },
  {
    value: "fundacion",
    label: "Fundación",
    short: "Fundación",
    title: "Registrar una fundación",
    blurb:
      "Una organización o un colectivo que ya trabaja en el Chocó y puede sumar equipo, bodega o presencia en un municipio.",
  },
];

/**
 * El único camino cuyo formulario NO acaba en `support_offers`.
 *
 * Vive aquí y no dentro de la acción porque lo miran las dos partes: la acción
 * para saber en qué tabla escribe, y el panel para saber en qué pantalla se
 * gestiona. Con la comprobación escrita en un solo sitio, añadir un quinto
 * camino no puede dejar una de las dos desactualizada.
 */
export function isFoundationKind(kind: string): boolean {
  return kind === "fundacion";
}

/**
 * Los tres caminos que acaban en `support_offers`, o sea la bandeja.
 *
 * La bandeja del panel se construye con esta lista y no con `SUPPORT_KINDS`,
 * porque una pestaña «Fundación» ahí enseñaría siempre cero: sus filas están en
 * otra tabla y se gestionan en su propia pantalla. El tipo lo dice también, así
 * que un `getSupportOffers('fundacion')` no compila.
 */
export type OfferKind = Exclude<SupportOfferKind, "fundacion">;

export const OFFER_KINDS = SUPPORT_KINDS.filter(
  (entry): entry is (typeof SUPPORT_KINDS)[number] & { value: OfferKind } =>
    !isFoundationKind(entry.value),
);

export function supportKindMeta(kind: string) {
  return SUPPORT_KINDS.find((entry) => entry.value === kind) ?? null;
}

export const RESOURCE_CATEGORIES = NEED_CATEGORIES;
