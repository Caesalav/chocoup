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

/**
 * Qué puede ser una causa, con las palabras que se ven en pantalla.
 *
 * Los valores son los de la base de datos (`cases_kind_valid`, 0016) y no cambian.
 * Las etiquetas van en singular y sin artículo porque se usan en dos sitios con
 * gramática distinta: el desplegable del panel y la pastilla de la ficha.
 *
 * `empty` es lo que se escribe en el hueco del retrato cuando no hay foto, y por
 * eso está aquí y no en el componente: es la decisión de fondo de 0016. Para una
 * persona son sus iniciales —eso lo calcula `personInitials`, y por eso el valor de
 * 'persona' es nulo— y para el resto tienen que ser palabras, porque «IE» en un
 * círculo donde tenía que haber una escuela se lee como un dato mal guardado, y un
 * animal no tiene iniciales de nada. Ver `CasePortrait`.
 *
 * «Fundación» sigue en la lista aunque 0015 se llevara la tabla de fundaciones, y
 * no es una contradicción: lo que se fue es la fundación como INTERMEDIARIA entre
 * el portal y una familia. Una fundación que perdió su sede en el terremoto es una
 * causa como cualquier otra, y se documenta igual.
 */
export const CASE_KINDS = [
  { value: "persona", label: "Persona o familia", empty: null },
  { value: "colegio", label: "Colegio o escuela", empty: "Colegio" },
  { value: "animal", label: "Animal", empty: "Animal" },
  { value: "fundacion", label: "Fundación", empty: "Fundación" },
] as const;

export function caseKindLabel(value: string): string {
  return CASE_KINDS.find((kind) => kind.value === value)?.label ?? "Persona o familia";
}

export const NEED_STATUSES = [
  { value: "abierta", label: "Abierta" },
  { value: "parcial", label: "Parcial" },
  { value: "cubierta", label: "Cubierta" },
] as const;

/**
 * El vocabulario del equipo, para la bandeja de /admin/recursos.
 *
 * «Retirada» va al final y no junto a «Negada», aunque las dos saquen la oferta
 * de lo público: en un desplegable el orden se lee como un recorrido, y las tres
 * primeras son el que hace una oferta normal —entra, se valora, se decide—.
 * Retirar es salirse de él, y ponerla en medio invitaría a usarla como el «no» de
 * tres letras menos.
 *
 * LA ETIQUETA DE `rechazada` DICE «NEGADA» Y EL VALOR SIGUE SIENDO `rechazada`.
 * No es un descuido a medio arreglar: el valor es el que hay escrito en las filas
 * de la base y en `offers_status_valid` (0012), y cambiarlo sería una migración
 * de datos para renombrar una palabra que nadie lee. La etiqueta sí se lee, y
 * tenía que cambiar: la sección se llama «Verificación, aceptación o negación de
 * los recursos ofrecidos» y sus botones y pestañas dicen «Negar» y «Negadas», así
 * que una pastilla que decía «Rechazada» ponía dos palabras para la misma cosa en
 * la misma pantalla. Quien las lee no puede saber que son la misma, y con mala
 * señal y prisa eso es un titubeo delante de una decisión sobre una donación.
 *
 * Se eligió «negar» y no «rechazar» porque es lo que el usuario escribió al pedir
 * la sección, y porque «rechazar» apunta a quien ofrecía —suena a que se le
 * rechaza a él— mientras «negar» apunta a lo ofrecido, que es lo que de verdad se
 * está juzgando.
 */
export const OFFER_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "aceptada", label: "Aceptada" },
  { value: "rechazada", label: "Negada" },
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
    hint: "Todo el portal: crear y publicar municipios, el canal general de donación y el de cada caso, la fecha en que se comprobó cada destino, las ofertas, los correos de los avisos, el foco del momento, el buzón y el equipo.",
  },
  {
    value: "documentacion",
    label: "Documentación",
    hint: "Fotos, casos y necesidades de los municipios asignados, con su tipo, su resumen y su diario de avances. No publica municipios ni toca canales de donación.",
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

/**
 * Las dos cosas que caben en el buzón: que algo no funciona, o que falta una
 * función. Las etiquetas van en frase, como el resto del portal.
 */
export const FEEDBACK_KINDS = [
  { value: "error", label: "Es un error" },
  { value: "idea", label: "Es una idea" },
] as const;

export function feedbackKindLabel(value: string): string {
  return FEEDBACK_KINDS.find((kind) => kind.value === value)?.label ?? value;
}
