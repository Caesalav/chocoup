export const SITE_NAME = "Chuc-up";
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

export const OFFER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Rechazada" },
] as const;

export function needCategoryLabel(value: string): string {
  return NEED_CATEGORIES.find((c) => c.value === value)?.label ?? "Otro";
}

export function needStatusLabel(value: string): string {
  return NEED_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function offerStatusLabel(value: string): string {
  return OFFER_STATUSES.find((s) => s.value === value)?.label ?? value;
}
