export const SITE_NAME = "Chocó-up";
export const SITE_TAGLINE = "Documentación del viaje a Chocó";

export const PHOTO_BUCKET = "fotos";

/**
 * Los valores son los de la base de datos y no cambian. Las etiquetas son
 * palabras de uso corriente: quien llega al portal no tiene por qué saber qué
 * significa "insumos" ni "alimentos no perecederos".
 */
export const NEED_CATEGORIES = [
  { value: "agua", label: "Agua" },
  { value: "alimentos", label: "Comida" },
  { value: "medicamentos", label: "Medicinas" },
  { value: "techo", label: "Techo" },
  { value: "ropa", label: "Ropa" },
  { value: "transporte", label: "Transporte" },
  { value: "dinero", label: "Dinero" },
  { value: "mano_de_obra", label: "Trabajo y manos" },
  { value: "otro", label: "Otras cosas" },
] as const;

export const NEED_STATUSES = [
  { value: "abierta", label: "Abierta" },
  { value: "parcial", label: "Parcial" },
  { value: "cubierta", label: "Cubierta" },
] as const;

/**
 * El vocabulario del equipo, para la bandeja de /admin/ofertas.
 *
 * «Retirada» va al final y no junto a «Rechazada», aunque las dos saquen la
 * oferta de lo público: en un desplegable el orden se lee como un recorrido, y
 * las tres primeras son el que hace una oferta normal —entra, se valora, se
 * decide—. Retirar es salirse de él, y ponerla en medio invitaría a usarla como
 * el «no» de tres letras menos.
 */
export const OFFER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "retirada", label: "Retirada" },
] as const;

/**
 * Y el del público, que no es el mismo y no debe serlo.
 *
 * «Pendiente» habla de la bandeja: hay algo esperando a que una persona del
 * equipo lo mire. Puesto en una página pública se lee como que el portal va
 * lento, cuando lo que hay que decirle a quien lee es otra cosa: qué fiabilidad
 * tiene lo que está viendo. «Sin confirmar» dice que alguien lo ha ofrecido y que
 * todavía nadie ha hablado con esa persona, que es la verdad y además lo único
 * que le sirve para decidir si cuenta con ello.
 *
 * Son dos y no cuatro porque lo rechazado y lo retirado no se publican. Los
 * valores los produce la vista `public.offer_log` (0012).
 */
export const OFFER_STATES = [
  { value: "sin_confirmar", label: "Sin confirmar" },
  { value: "confirmada", label: "Confirmada" },
] as const;

/**
 * Los dos roles, con la frase que los explica en la pantalla de equipo. Quien
 * reparte permisos con prisa tiene que leer en una línea qué está dando.
 */
export const TEAM_ROLES = [
  {
    value: "coordinacion",
    label: "Coordinación",
    hint: "Todo el portal: crear y publicar municipios, a dónde va el dinero de cada municipio y de cada caso, las fundaciones, las ofertas y el equipo.",
  },
  {
    value: "documentacion",
    label: "Documentación",
    hint: "Fotos, casos y necesidades de los municipios asignados. No publica municipios ni toca canales de donación.",
  },
] as const;

export function teamRoleLabel(value: string): string {
  return TEAM_ROLES.find((role) => role.value === value)?.label ?? value;
}

export function needCategoryLabel(value: string): string {
  return NEED_CATEGORIES.find((c) => c.value === value)?.label ?? "Otro";
}

export function needStatusLabel(value: string): string {
  return NEED_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function offerStatusLabel(value: string): string {
  return OFFER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/**
 * El respaldo es «Sin confirmar» y no el valor crudo, al contrario que en las
 * demás: lo que se rotula aquí es la fiabilidad de una promesa, así que ante un
 * valor que no reconozcamos hay que decir lo dudoso. Devolver la palabra tal cual
 * podría acabar afirmando en pantalla algo que nadie ha confirmado.
 */
export function offerStateLabel(value: string): string {
  return OFFER_STATES.find((s) => s.value === value)?.label ?? "Sin confirmar";
}
