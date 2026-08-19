export const SEARCH_KINDS = ["ciudad", "caso", "necesidad", "seccion"] as const;

export type SearchKind = (typeof SEARCH_KINDS)[number];

export type SearchSuggestion = {
  href: string;
  title: string;
  kind: SearchKind;
};

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  ciudad: "Ciudad",
  caso: "Caso",
  necesidad: "Necesidad",
  seccion: "Sección",
};

/**
 * Atajos con el campo vacío: directorios que cualquiera puede abrir.
 * No van los formularios de ofrecer —eso no se consulta, se escribe.
 */
export const SEARCH_SHORTCUTS: SearchSuggestion[] = [
  { href: "/municipios", title: "Ciudades", kind: "ciudad" },
  { href: "/casos", title: "Casos", kind: "caso" },
  { href: "/mapa", title: "Mapa", kind: "seccion" },
  { href: "/donaciones", title: "Donaciones", kind: "seccion" },
];

/** Más sitios públicos, para cuando alguien escribe el nombre. */
export const SEARCH_PAGES: SearchSuggestion[] = [
  ...SEARCH_SHORTCUTS,
  { href: "/ofrecido", title: "Lo que se ha ofrecido", kind: "seccion" },
  { href: "/ayudas", title: "Ayudas que llegaron", kind: "seccion" },
];
