import type { BudgetItem, BudgetProgress } from "./budget";
import type { DonationChannel } from "./donation-channel";
import type { PhotoFrame } from "./photo-frame";

export type { BudgetItem, BudgetProgress };

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
 * Qué es una causa del portal.
 *
 * El portal ya lo decía con palabras desde 0015 —/donaciones y la ficha de un
 * municipio lo escriben en una frase— pero no lo sabía el modelo, así que todo lo
 * que la interfaz decidía sobre una causa lo decidía como si fuera una persona.
 * Hay una decisión donde eso se nota: la reserva del retrato. Las iniciales del
 * nombre son una respuesta para una persona y un error de bulto para un colegio,
 * y con un animal no significan nada. Ver `CasePortrait`.
 *
 * Los valores los impone la base de datos (`cases_kind_valid`,
 * supabase/migrations/0016_ficha_de_causa.sql) y las palabras con las que se
 * escriben en pantalla están en lib/constants.ts, no aquí.
 */
export type CaseKind = "persona" | "colegio" | "animal" | "fundacion";

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

/** Las tres formas de ofrecer ayuda desde /ofrecer. */
/**
 * Los cuatro caminos para ofrecer ayuda.
 *
 * `fundacion` es el único que no acaba en `support_offers`: escribe en
 * `public.foundations` (0026), porque una organización es una ficha que se
 * mantiene y no una nota que se lee una vez. Comparte formulario y pantalla con
 * los otros tres, y ahí acaba el parecido.
 */
export type SupportOfferKind = "voluntario" | "profesion" | "recurso" | "fundacion";

export type SupportOffer = {
  id: string;
  kind: SupportOfferKind;
  person_name: string;
  contact: string;
  email: string;
  city_name: string;
  message: string;
  availability: string;
  skills: string;
  duration: string;
  has_transport: boolean;
  profession: string;
  experience: string;
  modality: "" | "presencial" | "remoto" | "ambos";
  credentials: string;
  resource: string;
  quantity: string;
  condition: "" | "nuevo" | "usado";
  can_deliver: boolean;
  category: string;
  created_at: string;
};

/**
 * En qué punto de la revisión está una fundación (0026).
 *
 * Nace en `pendiente` y solo coordinación la mueve. No hay un estado
 * intermedio del tipo «en revisión»: o el equipo comprobó que existe y hace lo
 * que dice, o todavía no lo ha hecho.
 */
export type FoundationStatus = "pendiente" | "verificada" | "descartada";

/**
 * Una fundación o colectivo que se ofrece a ayudar.
 *
 * NO ES UN DESTINO DE DINERO. 0015 quitó las fundaciones del portal
 * precisamente para que no lo fueran, y esta forma no tiene canal ni enlace de
 * recaudación: lo que ofrece es gente, bodega, transporte o presencia en un
 * municipio. Está explicado entero en 0026.
 */
export type Foundation = {
  id: string;
  /** El nombre registrado, el que sirve para comprobar que existe. */
  legal_name: string;
  /** Cómo se la conoce. Vacío cuando coincide con el legal. */
  display_name: string;
  /** Vacío es normal: mucha ayuda la mueven colectivos sin formalizar. */
  nit: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  /** Dónde está la sede. */
  city_name: string;
  /** Dónde trabaja, en sus palabras: «el medio Atrato». */
  coverage: string;
  focus: string;
  category: string;
  /** Qué puede poner encima de la mesa. Es lo que la hace accionable. */
  offering: string;
  team_size: string;
  founded_year: string;
  message: string;
  status: FoundationStatus;
  /** La libreta del equipo. No la escribe quien se apunta. */
  notes: string;
  created_at: string;
  updated_at: string;
};

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
 * Las columnas del canal de donación, iguales en el caso y en el canal general.
 * Se escriben una vez aquí porque los dos tienen que admitir los mismos
 * formatos: si el general solo aceptara llaves, el día que sea una Vaki habría
 * que cambiar el esquema en vez de un campo.
 *
 * El municipio ya no las tiene. Los canales por ciudad se fueron con
 * supabase/migrations/0015_canal_general.sql: el dinero va a un caso, y el caso
 * que no tiene canal propio usa el general.
 *
 * Nunca se leen sueltas: `donationChannel()` (lib/donation-channel.ts) las
 * convierte en un canal o en nulo, y es quien sabe que llave, enlace y
 * teléfono se excluyen. Ver supabase/migrations/0011_canal_de_donacion.sql,
 * 0013_canal_de_telefono.sql y 0015_canal_general.sql.
 */
export type DonationColumns = {
  donation_key: string;
  donation_url: string;
  donation_phone: string;
  donation_app: string;
  donation_holder: string;
  /**
   * El día en que alguien de coordinación comprobó de verdad este destino:
   * llamó al número, o mandó mil pesos a la llave y miró qué nombre salía.
   *
   * Nulo es el estado normal y no un hueco que rellenar: significa que nadie lo ha
   * comprobado, que es la verdad de casi todos los canales el día que se
   * registran. No se hereda de un destino anterior —la base de datos la borra sola
   * cuando el destino cambia— y envejece a la vista pasados 60 días. Ver
   * `channelCheck()` en lib/donation-channel.ts y
   * supabase/migrations/0016_ficha_de_causa.sql.
   */
  donation_verified_on: string | null;
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

export type Case = DonationColumns & {
  id: string;
  city_id: string;
  display_name: string;
  /**
   * Una persona, un colegio, un animal o una fundación. Ver `CaseKind`.
   *
   * Nunca llega vacío: la base de datos pone 'persona' por omisión, que es lo que
   * son todas las causas escritas hasta hoy.
   */
  case_kind: CaseKind;
  household: string;
  /**
   * Una frase, y es LA frase: la que sale en la vista previa de WhatsApp cuando
   * alguien comparte el enlace, que es como se mueve este portal.
   *
   * Vacío es válido y es como nacen todas. Sin resumen, la tarjeta y la vista
   * previa siguen recortando la historia con `excerpt()`, y ese corte cae donde
   * cae: a mitad de frase. Exigirlo para publicar dejaría a una familia sin
   * publicar por un asunto de redacción, así que no se exige; lo que hace es que
   * se pueda escribir bien cuando haya un minuto. Máximo 120 caracteres, y lo
   * impone la base de datos porque un `maxlength` no viaja en una llamada a la API.
   */
  summary: string;
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
  /** Bytes del JPEG grande. Cero si todavía no se midió. */
  byte_size: number;
  /** Bytes de la miniatura. Cero si no hay o no se midió. */
  thumb_byte_size: number;
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
  /**
   * Si sale en /ofrecido. Independiente de si está pendiente o aceptada: se
   * puede haber hablado con quien ofrece y aun así no publicarlo, o quitar del
   * muro un pendiente sin negarlo.
   */
  on_wall: boolean;
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

/**
 * Una donación confirmada, como la ve cualquiera desde el inicio, un municipio
 * o la ficha de una causa.
 *
 * Es lo que devuelve la vista `public.donation_log` (0021), y de ahí viene todo
 * lo que no está aquí: ni la referencia del pago, ni el proveedor, ni una
 * donación pendiente. Esas columnas no existen en la vista, así que este tipo
 * no puede tenerlas ni por descuido.
 *
 * El nombre llega nulo cuando la donación es anónima —porque no se autorizó, o
 * porque el campo no era un nombre— y la plantilla lo dice. No se deduce: si
 * llegara la cadena vacía fingiendo un nombre, también se leería como anónima.
 */
/**
 * A dónde va una donación: a una familia o al fondo general que reparte el
 * equipo. No es un detalle de pantalla, es una columna con dos restricciones
 * detrás: 'causa' exige una causa y 'fondo' exige que no haya ninguna. Ver
 * supabase/migrations/0023_donacion_al_fondo.sql.
 */
export type DonationDestination = "causa" | "fondo";

export type DonationLogEntry = {
  id: string;
  amount_cop: number;
  /** Cuándo se confirmó el pago, con hora. */
  donated_at: string;
  /** Nulo si la donación es anónima. */
  donor_name: string | null;
  publish_name: boolean;
  destination: DonationDestination;
  /**
   * La causa y su municipio, o nulos los cinco cuando la donación fue al fondo
   * general. Nulo aquí NO significa «una causa que no se puede enseñar»: la
   * vista no publica una donación cuya causa no esté publicada, ni siquiera sin
   * nombrarla. Significa que no había causa. Ver 0022.
   */
  case_id: string | null;
  case_name: string | null;
  city_id: string | null;
  city_name: string | null;
  city_slug: string | null;
};

/**
 * Una donación como la lee coordinación: todos los estados, el nombre aunque
 * no se publique, y la referencia del pago. El público no ve esta forma.
 */
export type DonationStatus = "pendiente" | "confirmada" | "fallida" | "reembolsada";

/**
 * Cómo se enteró el portal de un pago. Ver 0025.
 *
 * No hay un valor para «lo escribió una persona», y esa ausencia es la regla de
 * 0017 dicha en el sistema de tipos: las dos formas son preguntarle a Mercado
 * Pago, y se diferencian solo en quién empezó la conversación.
 */
export type DonationSource = "webhook" | "conciliacion";

export type AdminDonation = {
  id: string;
  amount_cop: number;
  status: DonationStatus;
  donor_name: string;
  publish_name: boolean;
  provider: string;
  payment_ref: string;
  created_at: string;
  settled_at: string | null;
  /** A una causa o al fondo general. Ver `DonationDestination`. */
  destination: DonationDestination;
  /** Cómo se enteró el portal: avisó la pasarela, o se le preguntó (0025). */
  source: DonationSource;
  /**
   * La causa y su municipio, o nulos los cinco cuando la donación fue al fondo
   * general.
   *
   * Aquí estaban como no nulos, y esa mentira del tipo tenía consecuencias:
   * `getAdminDonations` descartaba con un `.filter()` toda fila que no
   * resolviera causa y municipio para que los tipos cuadraran, así que las
   * donaciones al fondo —que por definición no tienen causa— no aparecían en la
   * lista de coordinación. Dinero registrado en la base y ausente de la única
   * pantalla donde se mira. Nulo aquí significa «fue al fondo», y quien pinte
   * esta forma tiene que decirlo.
   */
  case_id: string | null;
  case_name: string | null;
  city_id: string | null;
  city_name: string | null;
  city_slug: string | null;
};

/**
 * Un aviso de pago tal como quedó apuntado (0025).
 *
 * No lleva nombres ni correos, y no es un descuido: la bitácora existe para
 * poder reconstruir qué hizo el servidor con un aviso, no para guardar una
 * lista de quién donó. Eso está en `donations`, con sus permisos.
 */
export type PaymentNotice = {
  id: string;
  received_at: string;
  provider: string;
  /** El identificador del pago, o vacío si el aviso no traía ninguno. */
  payment_ref: string;
  kind: string;
  request_id: string;
  signature: "valida" | "invalida" | "ausente";
  outcome: string;
  detail: string;
  donation_id: string | null;
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
  /** Ítems del presupuesto todavía sin comprar. */
  openNeeds: number;
  /**
   * Casos con algo sin cubrir, que no es lo mismo que `caseCount`. La tarjeta
   * del pueblo lo enseña junto a su porcentaje —el inicio y el costado de
   * /mapa— porque contestan preguntas distintas: el porcentaje dice cuánto
   * falta y esto dice a cuánta gente. Ver `countOpenBudgetCases` en
   * lib/budget.ts.
   *
   * En cero no se escribe: la tarjeta se queda con su porcentaje, y un «0 casos
   * abiertos» al lado sonaría a que en ese pueblo no hay nadie documentado. Ver
   * `CityRailCard`.
   */
  openCases: number;
  /** Casos con el presupuesto comprado entero. */
  solvedCases: number;
  caseCount: number;
  needs: NeedFacet[];
  /**
   * El avance del pueblo, sobre el presupuesto de sus causas. `total` es la
   * meta en pesos. De aquí sale el color del mapa y la barra de la tarjeta.
   */
  progress: {
    total: number;
    covered: number;
    partial: number;
    ratio: number;
  };
  budget: BudgetProgress;
  /**
   * Aportes en pie que todavía no han llegado. Es movimiento, no cobertura:
   * no pinta el mapa. Ver lib/city-activity.ts.
   */
  standingOffers: number;
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
  budget: BudgetProgress;
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
  /** Casos con el presupuesto comprado entero. */
  solvedCases: number;
  openCases: number;
  /** Ítems de presupuesto registrados: el total, comprados incluidos. */
  needs: number;
  coveredNeeds: number;
  openNeeds: number;
  budget: BudgetProgress;
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
 *
 * Aquí había también una `foundation`. Se fue con 0015: las fundaciones no son
 * una entidad del portal y un municipio no tiene canal propio. La ficha del
 * municipio dejó de ser una pantalla de dinero y volvió a ser lo que describe,
 * que es lo que pasa en ese pueblo y quién está documentado allí.
 */
export type CityPage = {
  city: City;
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
  budgetItems: BudgetItem[];
  budget: BudgetProgress;
  updates: CaseUpdate[];
  /**
   * El canal general del portal, que es lo que recibe este caso si no trae uno
   * propio.
   *
   * Viaja dentro de la ficha y no se pide aparte para que no haya ninguna forma
   * de pintar esta pantalla sin él: `caseDonation()` necesita los dos —el de la
   * fila y este— para poder decir de quién es el que se enseña, y eso es lo que
   * la ficha tiene que escribir con palabras.
   */
  generalChannel: DonationChannel | null;
  /**
   * El día del último avance del diario, o nulo si todavía no hay ninguno.
   *
   * Es lo que la ficha escribe como «Actualizado el …», y sustituye a
   * `cases.updated_at`, que decía otra cosa: esa columna se mueve cuando alguien
   * corrige una errata en la historia, así que la ficha afirmaba que había noticias
   * de esta familia el día en que se arregló una tilde. Lo que quien lee necesita
   * saber es cuándo pasó algo, y eso es `max(case_updates.happened_on)`.
   *
   * Se resuelve aquí y no en la plantilla para que no haya dos formas de
   * contestarlo. Y sale de los avances que las políticas dejan ver, que es lo
   * correcto: la fecha tiene que ser la del último avance que quien lee puede leer,
   * no la de uno que está escondido.
   *
   * Nulo es frecuente —un caso recién documentado no tiene diario— y no se rellena
   * con `updated_at` para taparlo: la ficha dice entonces cuándo se documentó, que
   * es cierto y es otra frase.
   */
  lastUpdateOn: string | null;
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

/**
 * Una nota del buzón público: un error del portal o una idea para mejorarlo.
 *
 * No se publica. El contacto es opcional y solo lo ve el equipo.
 */
export type FeedbackKind = "error" | "idea";

export type FeedbackNote = {
  id: string;
  kind: FeedbackKind;
  body: string;
  contact: string;
  page_path: string;
  created_at: string;
};

/**
 * Un correo apuntado a los avisos del portal desde «Quiero ayudar».
 *
 * Solo existe en el panel y solo lo ve coordinación: no hay ninguna consulta
 * pública que devuelva esta forma, ni siquiera para contarla. Lo garantiza la
 * base de datos por dos vías que no dependen la una de la otra —el permiso de
 * tabla y la política—, ver supabase/migrations/0015_canal_general.sql.
 *
 * No lleva de qué página vino ni con qué oferta, y eso es a propósito: el
 * consentimiento que dio esa persona fue para recibir novedades, no para quedar
 * asociada a nada más. Un correo y una fecha.
 */
export type NewsletterSignup = {
  id: string;
  email: string;
  created_at: string;
};
