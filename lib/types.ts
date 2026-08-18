import type { DonationChannel } from "./donation-channel";
import type { PhotoFrame } from "./photo-frame";

export type NeedCategory =
  | "agua"
  | "alimentos"
  | "medicamentos"
  | "techo"
  | "ropa"
  | "transporte"
  | "dinero"
  | "mano_de_obra"
  | "otro";

export type NeedStatus = "abierta" | "parcial" | "cubierta";

/**
 * El estado de una oferta dentro de la bandeja del equipo.
 *
 * `retirada` no es un sinónimo de `rechazada` y por eso son dos palabras.
 * `rechazada` es un juicio sobre lo que se ofrecía: alguien del equipo lo miró y
 * dijo que no. `retirada` es una baja, y sirve para lo contrario: quitar del muro
 * público —spam, un duplicado, algo que ya no está disponible— sin dictaminar
 * nada sobre ello. Desde que `/ofrecido` publica lo pendiente, un muro sin
 * moderación previa necesita esa salida rápida, y obligar a rechazar para limpiar
 * dejaría en el registro del equipo un veredicto que nadie emitió.
 *
 * Ninguna de las dos se publica: la vista `public.offer_log` solo deja pasar
 * `pendiente` y `aceptada`. Ver supabase/migrations/0012_registro_de_lo_ofrecido.sql.
 */
export type OfferStatus = "pendiente" | "aceptada" | "rechazada" | "retirada";

/**
 * El estado de una oferta como lo lee cualquiera en el registro público.
 *
 * Son dos palabras y no cuatro, y ninguna es la del equipo. «Pendiente» describe
 * la bandeja —hay algo esperando a que alguien lo mire— y en público se leería
 * como que el portal va lento; «sin confirmar» describe lo que el lector
 * necesita saber, que es qué fiabilidad tiene lo que está viendo. Lo rechazado y
 * lo retirado no tienen palabra porque no se publican.
 *
 * Lo decide la vista `public.offer_log` y no esta capa: ver
 * supabase/migrations/0012_registro_de_lo_ofrecido.sql.
 */
export type OfferRecordState = "sin_confirmar" | "confirmada";

/**
 * Los dos roles del equipo. Coordinación decide y reparte; documentación
 * registra lo que ve en los municipios que tenga asignados.
 *
 * Esto es una etiqueta para la interfaz, no una credencial: quien manda es la
 * base de datos. Ver supabase/migrations/0002_roles_y_ayudas.sql.
 */
export type TeamRole = "coordinacion" | "documentacion";

/** Quién eres y dónde puedes escribir, según el servidor. */
export type TeamSession = {
  email: string;
  role: TeamRole;
  /** Municipios asignados. Vacío en coordinación, que escribe en todos. */
  cityIds: string[];
};

/** Una fila de la pantalla de equipo. Solo la ve coordinación. */
export type TeamMemberEntry = TeamSession & {
  nombre: string;
  createdAt: string;
};

/**
 * Las columnas del canal de donación, iguales en el municipio y en el caso.
 * Se escriben una vez aquí porque los dos niveles tienen que admitir los
 * mismos formatos: si uno solo aceptara enlaces, el pueblo o la familia que
 * tenga una llave o un teléfono se quedaría sin poder recibir.
 *
 * Nunca se leen sueltas: `donationChannel()` (lib/donation-channel.ts) las
 * convierte en un canal o en nulo, y es quien sabe que llave, enlace y
 * teléfono se excluyen. Ver supabase/migrations/0011_canal_de_donacion.sql
 * y 0013_canal_de_telefono.sql.
 */
export type DonationColumns = {
  donation_key: string;
  donation_url: string;
  donation_phone: string;
  donation_app: string;
  donation_holder: string;
};

export type City = DonationColumns & {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  summary: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * La fundación de un municipio: una y solo una.
 *
 * Aquí había una marca de «es la madre» porque la tabla admitía varias. Ya no: la
 * base de datos garantiza una fila por municipio (`foundations_one_per_city`, ver
 * supabase/migrations/0004_una_fundacion_por_municipio.sql), así que no hay nada
 * que desempatar y `donation_url` no puede depender de qué fila devuelva antes
 * una consulta.
 */
export type Foundation = {
  id: string;
  city_id: string;
  name: string;
  description: string;
  contact_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  /** Enlace oficial de donación. El botón "Donar dinero" abre esto. */
  donation_url: string;
  address: string;
  created_at: string;
};

export type Case = DonationColumns & {
  id: string;
  city_id: string;
  display_name: string;
  household: string;
  story: string;
  consent_to_publish: boolean;
  published: boolean;
  /**
   * La foto suya que el equipo eligió como retrato, de entre las que ya subió al
   * caso. Nulo mientras nadie elija, que va a ser lo normal.
   *
   * Es un identificador y no una ruta a propósito: la ruta la resuelve la capa de
   * datos buscándolo entre las fotos del propio caso, así que un puntero que
   * quedara señalando la foto de otra persona se lee como «sin retrato». Ver
   * supabase/migrations/0003_retrato_del_caso.sql.
   */
  portrait_photo_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Photo = {
  id: string;
  city_id: string;
  case_id: string | null;
  storage_path: string;
  /** Versión de 400 px. Vacío si no se pudo generar. */
  thumb_path: string;
  caption: string;
  sort_order: number;
  /**
   * Encuadre: los tres nulos (recorte por omisión de la caja) o los tres
   * puestos. Ver `lib/photo-frame.ts` y supabase/migrations/0009_encuadre_de_fotos.sql.
   */
  focus_x: number | null;
  focus_y: number | null;
  zoom: number | null;
  created_at: string;
};

export type Need = {
  id: string;
  city_id: string;
  case_id: string | null;
  category: NeedCategory;
  title: string;
  details: string;
  quantity: string;
  status: NeedStatus;
  urgent: boolean;
  created_at: string;
};

/**
 * Un paso del historial de un caso: título, qué se hizo, y la foto que lo prueba.
 *
 * No es una necesidad. Las necesidades dicen qué falta; esto dice qué ha pasado
 * —el plano, el arquitecto, los materiales—. La barra de progreso se calcula de
 * las necesidades; el diario es la trazabilidad, en orden de fecha.
 *
 * `photoPath` lo resuelve la capa de datos entre las fotos del propio caso,
 * igual que el retrato: un puntero a la foto de otra familia se lee como
 * «este avance todavía no tiene foto». `photoFrame` es el encuadre de esa
 * misma foto, o nulo si nadie lo ha tocado.
 */
export type CaseUpdate = {
  id: string;
  case_id: string;
  city_id: string;
  happened_on: string;
  title: string;
  body: string;
  photo_id: string | null;
  photoPath: string | null;
  photoFrame: PhotoFrame | null;
  created_at: string;
};


export type Offer = {
  id: string;
  city_id: string | null;
  case_id: string | null;
  need_id: string | null;
  offerer_name: string;
  /** Nunca sale al público. Ni aquí ni en la vista del registro de ayudas. */
  offerer_contact: string;
  resource: string;
  category: string;
  message: string;
  status: OfferStatus;
  /** El día que la ayuda llegó de verdad, no el día que se aceptó. Nulo mientras
   *  siga siendo una promesa: es lo único que la hace pública. */
  delivered_on: string | null;
  /** Autorización expresa para aparecer con nombre en el registro público.
   *  Falso por omisión: la privacidad no se pide, se conserva. */
  publish_name: boolean;
  team_notes: string;
  created_at: string;
};

/**
 * Una ayuda entregada, como la ve cualquiera desde /ayudas.
 *
 * Es lo que devuelve la vista `public.aid_log`, y de ahí viene todo lo que no
 * está aquí: ni contacto ni mensaje, ni el día de la entrega, ni el caso al que
 * fue, ni el texto con el que quien ofrecía describió su ayuda. Esas columnas no
 * existen en la vista, así que este tipo no puede tenerlas ni por descuido.
 * `offerer_name` llega nulo salvo que la persona autorizara su nombre.
 */
export type AidRecord = {
  id: string;
  /**
   * Una de las nueve categorías, siempre. Es `NeedCategory` y no texto libre
   * porque lo garantiza la vista: `offers.category` sí es texto libre, y lo que no
   * esté en la lista sale de ahí como "otro" (ver
   * supabase/migrations/0005_registro_sin_texto_libre.sql). Esto es lo único que se
   * publica de qué llegó.
   */
  category: NeedCategory;
  /** Solo el mes, en 'YYYY-MM'. El día exacto se queda en la tabla de ofertas,
   *  que es donde trabaja el equipo. */
  delivered_month: string;
  offerer_name: string | null;
  city_name: string | null;
  city_slug: string | null;
  /** Solo si la necesidad es del municipio. Las de un caso no se nombran: su
   *  título está escrito en la ficha de la familia. */
  need_title: string | null;
};

/**
 * Una oferta prometida y todavía sin llegar, como la ve cualquiera desde
 * /ofrecido.
 *
 * Es lo que devuelve la vista `public.offer_log`, y de ahí viene todo lo que no
 * está aquí: ni contacto, ni el mensaje largo, ni las notas del equipo, ni el
 * caso al que apunta, ni la fecha de entrega. Esas columnas no existen en la
 * vista, así que este tipo no puede tenerlas ni por descuido.
 *
 * Es hermano de `AidRecord` y las dos listas son disjuntas: en cuanto una ayuda
 * llega, sale de aquí y aparece allí.
 */
export type OfferRecord = {
  id: string;
  /**
   * Una de las nueve categorías, siempre, por lo mismo que en `AidRecord`:
   * `offers.category` es texto libre y la vista publica «otro» para todo lo que
   * no esté en la lista.
   */
  category: NeedCategory;
  /**
   * Qué se ofrece, con los teléfonos y los correos que hubiera dentro
   * sustituidos por «[número oculto]» y «[contacto oculto]».
   *
   * Este texto lo escribe quien ofrece y nadie lo revisa antes, así que llega
   * recortado y no crudo. Que se publique —y que en `AidRecord` no exista— es
   * deliberado: aquí es lo único que permite cruzar unas tejas sin transporte con
   * un camión que sube vacío, mientras que allí describiría lo que recibió una
   * familia. El recorte está en la vista y no en la plantilla, así que ninguna
   * pantalla puede deshacerlo.
   *
   * NULO SIGNIFICA QUE LA OFERTA IBA DIRIGIDA A UNA FAMILIA, y conviene saber lo
   * que eso implica antes de escribirlo en una pantalla. La frase la escribió
   * alguien que tenía delante la ficha de esa familia, así que puede describirla;
   * la vista la anula por eso, y no porque falte el dato. Es la misma razón por la
   * que `AidRecord` no tiene esta columna en absoluto.
   *
   * De ahí lo que este nulo autoriza y lo que no. Se puede decir que la fila es
   * para una familia —la fila entera existe para que alguien pueda completarla, y
   * su categoría y su municipio ya están publicados—, pero no se puede pedir el
   * texto por otra vía ni deducirlo, porque no hay otra vía: `offers.resource` no
   * es legible por el público, ni por política ni por permiso de tabla. Ver
   * supabase/migrations/0012_registro_de_lo_ofrecido.sql.
   */
  resource: string | null;
  /**
   * El día en que se ofreció, en 'YYYY-MM-DD' y en hora de Colombia.
   *
   * De una entrega no se publica la fecha —sería un calendario de reparto— y de
   * una oferta sí: no dice cuándo llega algo a un sitio, dice desde cuándo
   * alguien está esperando respuesta, y hace falta para atenuar lo que lleva
   * semanas sin confirmar.
   */
  offered_on: string;
  state: OfferRecordState;
  /** Solo con la oferta aceptada y autorización expresa. Nulo en todo lo demás,
   *  que va a ser la mayoría. */
  offerer_name: string | null;
  city_name: string | null;
  city_slug: string | null;
  /** Solo si la necesidad es del municipio, igual que en `AidRecord`. */
  need_title: string | null;
};

/** Oferta con el contexto al que apunta, para la bandeja del equipo. */
export type OfferWithContext = Offer & {
  cities: Pick<City, "name" | "slug"> | null;
  cases: Pick<Case, "id" | "display_name"> | null;
  needs: Pick<Need, "id" | "title" | "category" | "status"> | null;
};

// ---------------------------------------------------------------------------
// Formas compuestas que consumen las páginas
// ---------------------------------------------------------------------------

/**
 * Necesidad reducida a lo que hace falta para contarla sin volver a la base de
 * datos: es lo que getCityCards adjunta a cada municipio y de donde
 * getPortalTotals saca los números del inicio.
 */
export type NeedFacet = {
  category: NeedCategory;
  status: NeedStatus;
  case_id: string | null;
};

export type CityCardData = City & {
  coverPath: string | null;
  coverFrame: PhotoFrame | null;
  openNeeds: number;
  caseCount: number;
  needs: NeedFacet[];
};

export type CaseSummary = Case & {
  coverPath: string | null;
  coverFrame: PhotoFrame | null;
  /**
   * El retrato ya resuelto a una ruta de imagen, o nulo si no hay: ni elegido, ni
   * la foto elegida sigue existiendo, ni es de este caso. Quien pinta la tarjeta
   * no tiene que saber distinguir esos tres casos, porque los tres se dibujan
   * igual —con las iniciales— y ninguno es un error.
   */
  portraitPath: string | null;
  /** Encuadre del retrato, o nulo si esa foto sigue con el recorte por omisión. */
  portraitFrame: PhotoFrame | null;
  openNeeds: number;
  /** Categorías con algo abierto. Son las etiquetas de la tarjeta del caso:
   *  dicen de un vistazo si lo que falta es agua, techo o medicinas. */
  categories: NeedCategory[];
};

/**
 * Un caso con sus fotos dentro.
 *
 * Es lo que necesita la tarjeta de la ficha de municipio, que lleva el carrusel
 * de esa persona en la propia tarjeta. Las listas transversales —/casos,
 * /buscar— siguen con `CaseSummary` a secas: allí cada caso es una fila y una
 * foto, y arrastrar cuarenta carruseles en una página no ayuda a nadie.
 */
export type CaseWithPhotos = CaseSummary & {
  photos: Pick<Photo, "id" | "storage_path" | "thumb_path" | "caption" | "focus_x" | "focus_y" | "zoom">[];
};

/** Un caso fuera de la pantalla de su municipio, donde hay que decir de dónde es. */
export type CaseCard = CaseSummary & {
  cityName: string;
  citySlug: string;
};

/** Una necesidad en la lista general, con su procedencia. */
export type NeedCard = Need & {
  cityName: string;
  citySlug: string;
  caseName: string | null;
};

/**
 * Los cuatro números del inicio. Salen todos de la misma consulta para que no
 * puedan contradecirse entre sí en la misma pantalla.
 */
export type PortalTotals = {
  cities: number;
  cases: number;
  /** Necesidades registradas: el total, cubiertas incluidas. */
  needs: number;
  coveredNeeds: number;
  openNeeds: number;
  updatedAt: string | null;
};

/**
 * Los cuatro grupos del buscador, que son las cuatro formas en que algo puede
 * estar en el portal: un municipio, una familia, algo que falta y algo que
 * alguien ya prometió.
 */
export type SearchResults = {
  cities: CityCardData[];
  cases: CaseCard[];
  needs: NeedCard[];
  offers: OfferRecord[];
};

/**
 * La ficha de un municipio.
 *
 * Aquí había una tira de `casePhotos`: todas las fotos de todos los casos
 * publicados, juntas y sueltas en su propia sección. Ya no. Una foto de un caso
 * es de esa persona —la sacó ella o la sacaron en su casa, y su consentimiento va
 * con ella—, y amontonadas fuera de su ficha se convertían en un muestrario de
 * daños sin dueño. Cada una vive ahora dentro de la tarjeta de quien es.
 */
export type CityPage = {
  city: City;
  /** La fundación del municipio, o nula mientras nadie la haya registrado —que es
   *  como nace cada municipio, antes de la visita. Una, no una lista: lo garantiza
   *  la base de datos. */
  foundation: Foundation | null;
  /** Fotos del municipio, no de una familia. */
  photos: Photo[];
  zoneNeeds: Need[];
  caseNeeds: Need[];
  cases: CaseWithPhotos[];
};

export type CasePage = {
  city: City;
  caseRecord: Case;
  photos: Photo[];
  needs: Need[];
  updates: CaseUpdate[];
  /**
   * La fundación del municipio, que aquí ya no es el recaudo por omisión de esta
   * familia: si el caso no trae canal propio, no hay canal. Sigue haciendo falta
   * para decir quién responde por el caso en terreno y para escribirle por
   * WhatsApp, que es una conversación y no un destino de dinero.
   */
  foundation: Foundation | null;
};

/**
 * Un municipio en /donaciones: su foto de portada, su canal y su fundación.
 *
 * Sale aunque todavía no tenga canal. El pop-up de «Donar» lo dice, y no listarlo
 * dejaría un pueblo documentado fuera de la única pantalla que existe para darle
 * dinero. La fundación va dentro porque es de ese municipio, y la pestaña de
 * fundaciones se arma filtrando las que hay.
 */
export type CityDonationEntry = {
  city: City;
  channel: DonationChannel | null;
  foundation: Foundation | null;
  coverPath: string | null;
  coverFrame: PhotoFrame | null;
};

/** Contexto de una necesidad, caso o ciudad para el formulario de oferta. */
export type OfferTarget = {
  cityId: string | null;
  cityName: string | null;
  citySlug: string | null;
  caseId: string | null;
  caseName: string | null;
  needId: string | null;
  needTitle: string | null;
  needCategory: string | null;
};

export type AdminCityRow = City & {
  caseCount: number;
  openNeeds: number;
  photoCount: number;
  pendingOffers: number;
};

export type NeedOption = {
  id: string;
  title: string;
  cityName: string;
  caseName: string | null;
};
