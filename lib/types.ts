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

export type OfferStatus = "pendiente" | "aceptada" | "rechazada";

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

export type City = {
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

/**
 * La llave de transferencia del portal: una, y la misma para todo.
 *
 * No cuelga de ningún municipio, y eso es deliberado: el enlace de una fundación
 * es de esa fundación y para ese pueblo, mientras la llave es del portal entero.
 * Por qué no es una columna más de `Foundation`, y por qué vive en la base de
 * datos y no en una constante que habría que desplegar, está escrito en
 * supabase/migrations/0010_llave_de_transferencia.sql.
 *
 * Va en camello y sin `singleton` porque es una forma compuesta y no la fila tal
 * cual: la capa de datos ya la traduce, igual que hace con `TeamSession`.
 */
export type DonationKey = {
  /**
   * La llave tal cual se pega en la app, `@soschoco`.
   *
   * Vacía solo en el panel, que es donde se escribe la primera y donde se retira
   * una comprometida. La lectura pública (`getDonationKey`) devuelve nulo en ese
   * caso, de modo que ninguna pantalla del portal puede pintar el bloque de la
   * llave con la llave en blanco por olvidar una comprobación.
   */
  value: string;
  /** En qué app se usa. Vacío es normal: entonces se dice la versión general, sin
   *  inventarse una marca. */
  app: string;
  /** A nombre de quién tiene que aparecer en la app al confirmar. Es lo único con
   *  lo que quien dona puede comprobar que la llave no es otra. */
  holder: string;
  updatedAt: string;
  /** Correo de la sesión que la cambió, según la base de datos. Vacío si se tocó
   *  sin sesión —el SQL Editor— o si nadie la ha cambiado desde la migración. */
  updatedBy: string;
};

export type Case = {
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
  /** Canal de donación de esta familia. Vacío: se usa el de la fundación. */
  donation_url: string;
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

/** Una fundación en la lista de donaciones, con el municipio en el que trabaja. */
export type FoundationEntry = Foundation & {
  cityName: string;
  citySlug: string;
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

export type SearchResults = {
  cities: CityCardData[];
  cases: CaseCard[];
  needs: NeedCard[];
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
  /** Fundación del municipio: recaudo por omisión si el caso no trae el suyo. */
  foundation: Foundation | null;
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
