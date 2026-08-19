import { NEED_CATEGORIES } from "./constants";
import type { SupportOfferKind } from "./types";

export const SUPPORT_KINDS: {
  value: SupportOfferKind;
  label: string;
  title: string;
  blurb: string;
}[] = [
  {
    value: "voluntario",
    label: "Voluntariado",
    title: "Ofrecerme como voluntario",
    blurb: "Tiempo, manos y presencia. El equipo te escribe para encajarte donde haga falta.",
  },
  {
    value: "profesion",
    label: "Profesión",
    title: "Ofrecer mi profesión",
    blurb: "Un oficio o una titulación: medicina, obra, derecho, psicología, lo que sepas hacer.",
  },
  {
    value: "recurso",
    label: "Recurso",
    title: "Ofrecer un recurso",
    blurb: "Una cosa concreta: tejas, mercados, un cupo de carga, medicinas. No va a una familia desde aquí.",
  },
];

export function supportKindMeta(kind: string) {
  return SUPPORT_KINDS.find((entry) => entry.value === kind) ?? null;
}

export const RESOURCE_CATEGORIES = NEED_CATEGORIES;
