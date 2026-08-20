/**
 * Datos de muestra para ver el portal lleno antes de conectar Supabase.
 *
 * Se usan solo cuando no hay claves configuradas (ver `isDemoMode`). En cuanto
 * existan, el portal lee de la base de datos y esto deja de intervenir.
 *
 * El contenido es inventado. Sirve para valorar el diseño y el recorrido, no
 * como documentación de nada. El banner del portal lo deja claro en pantalla.
 */
import { situationPhotos, withUpdatePhotos } from "./case-photos";
import { lastUpdateOn } from "./case-updates";
import type { ContributionTally } from "./contributions";
import {
  donationChannel,
  moneyDestinationsOf,
  type DonationChannel,
  type MoneyDestination,
} from "./donation-channel";
import { savedFrame } from "./photo-frame";
import { NEED_CATEGORIES } from "./constants";
import { EMPTY_FOCUS, type CampaignFocusRow } from "./campaign";
import {
  asCaseProgress,
  budgetProgress,
  countOpenBudgetCases,
  countSolvedBudgetCases,
  type BudgetItem,
} from "./budget";
import { countOpenNeeds, isOpenNeed } from "./needs";
import type {
  AdminCityRow,
  AdminDonation,
  AidRecord,
  Case,
  CaseCard,
  CaseKind,
  CasePage,
  CaseSummary,
  CaseUpdate,
  CaseWithPhotos,
  CityCardData,
  CityPage,
  City,
  DonationColumns,
  Need,
  NeedCard,
  NeedCategory,
  NeedOption,
  NeedStatus,
  NewsletterSignup,
  Offer,
  OfferRecord,
  OfferStatus,
  OfferTarget,
  OfferWithContext,
  Photo,
  PortalTotals,
  SupportOffer,
  SupportOfferKind,
  TeamMemberEntry,
  TeamSession,
  DonationDestination,
  DonationLogEntry,
  FeedbackNote,
} from "./types";

/** UUIDs con forma válida para que los enlaces del formulario funcionen igual. */
function demoId(kind: number, index: number): string {
  const tail = `${String(kind).padStart(4, "0")}${String(index).padStart(8, "0")}`;
  return `00000000-0000-4000-8000-${tail}`;
}

const CITY = 1;
const CASE = 3;
const NEED = 4;
const PHOTO = 5;
const OFFER = 6;
const UPDATE = 7;
const FEEDBACK = 8;
const NEWSLETTER = 9;
const BUDGET = 10;
const SUPPORT = 11;
const DONATION = 12;

// El 2 era de las fundaciones y se queda libre. No se reaprovecha: los
// identificadores de muestra salen en las direcciones y en las capturas, y
// reciclar el número haría que una captura vieja de una fundación y una nueva de
// otra cosa señalaran a la misma fila.

const day = (n: number) => `2026-08-${String(n).padStart(2, "0")}T14:30:00.000Z`;

/** Un instante concreto, para el registro de donaciones: la hora sí se publica. */
const at = (n: number, hour: number, minute: number) =>
  `2026-08-${String(n).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;

/**
 * El mismo día sin hora, como lo guarda una columna `date`: la fecha en que se
 * comprobó un canal, que es un día de Colombia y no un instante.
 */
const dayOnly = (n: number) => `2026-08-${String(n).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// Municipios
// ---------------------------------------------------------------------------

type CitySeed = {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  summary: string;
  published: boolean;
};

const citySeeds: CitySeed[] = [
  {
    name: "Quibdó",
    slug: "quibdo",
    lat: 5.6947,
    lng: -76.6611,
    summary:
      "El sismo dañó viviendas en los barrios Niño Jesús, La Yesquita y Cesar Conto, sobre la ribera del Atrato. Hay 140 familias durmiendo en el coliseo del barrio Kennedy y otras 60 repartidas entre casas de familiares.\n\nEl acueducto funciona a media capacidad y el agua llega turbia. El hospital atiende con planta eléctrica. La vía a Medellín está habilitada con paso restringido en dos tramos.",
    published: true,
  },
  {
    name: "Istmina",
    slug: "istmina",
    lat: 5.1594,
    lng: -76.6853,
    summary:
      "Unas treinta viviendas del casco urbano quedaron con grietas estructurales y la escuela del barrio San Agustín está cerrada por riesgo de desplome.\n\nLa comunidad organizó una olla común en la casa de la cultura. Lo más urgente es material para apuntalar y agua potable.",
    published: true,
  },
  {
    name: "Bahía Solano",
    slug: "bahia-solano",
    lat: 6.2225,
    lng: -77.4028,
    summary:
      "En la costa el daño mayor fue en los muelles de pescadores y en las viviendas de palafito de El Valle. Diez lanchas quedaron inservibles, que es de lo que vive la mitad del pueblo.\n\nLlegar solo es posible por avioneta o por mar, así que todo lo que se mande hay que coordinarlo con antelación.",
    published: true,
  },
  {
    name: "Nuquí",
    slug: "nuqui",
    lat: 5.7089,
    lng: -77.2708,
    summary: "Pendiente de visita. Reportes por radio hablan de daños en la escuela.",
    published: false,
  },
  {
    name: "Condoto",
    slug: "condoto",
    lat: 5.0906,
    lng: -76.6469,
    summary: "",
    published: false,
  },
];

export const demoCities: City[] = citySeeds.map((seed, index) => ({
  id: demoId(CITY, index),
  ...seed,
  created_at: day(4),
  updated_at: day(11 + index),
}));

const cityBySlug = (slug: string) => demoCities.find((city) => city.slug === slug)!;

// ---------------------------------------------------------------------------
// Canales de donación de muestra
//
// Son inventados a propósito. El canal de verdad —el general y el de cada
// familia— vive en la base de datos y lo escribe coordinación desde el panel.
// Copiar aquí uno real lo convertiría en dos sitios, y el segundo no se cambia
// desde ningún panel: el día que cambiara, este archivo seguiría enseñando el
// viejo a cualquiera que abriera el portal sin claves. Un destino caducado
// enseñado como bueno es dinero perdido, así que los de muestra se ven de lejos
// que lo son.
//
// Aquí había también canales de municipio. Se fueron con 0015: ya no hay canales
// por ciudad, y `City` dejó de tener las columnas del destino.
// ---------------------------------------------------------------------------

const NO_CHANNEL: DonationColumns = {
  donation_key: "",
  donation_url: "",
  donation_phone: "",
  donation_app: "",
  donation_holder: "",
  donation_verified_on: null,
};

const keyChannel = (
  value: string,
  app: string,
  holder: string,
  verifiedOn: string | null = null,
): DonationColumns => ({
  ...NO_CHANNEL,
  donation_key: value,
  donation_app: app,
  donation_holder: holder,
  donation_verified_on: verifiedOn,
});

const linkChannel = (url: string, verifiedOn: string | null = null): DonationColumns => ({
  ...NO_CHANNEL,
  donation_url: url,
  donation_verified_on: verifiedOn,
});

/**
 * El canal general de muestra.
 *
 * Es una llave y no un enlace porque es lo que hay en la base real, y porque la
 * llave es el formato que más pantalla ocupa —se escribe entera, con sus dos
 * pasos— y conviene poder verla sin claves. Lleva «(muestra)» en el titular por
 * lo mismo que los demás: para que nadie la copie creyendo que es la buena.
 *
 * Comprobado el 12 de agosto, o sea dentro de los 60 días de
 * `CHANNEL_CHECK_STALE_DAYS`: es el estado bueno de esa frase, y el que hay que
 * poder ver en el destino que alcanza a más gente. El envejecido se ve en el canal
 * propio de Familia Klinger, más abajo, con una fecha de mayo.
 *
 * Las fechas de este archivo son de agosto de 2026 y por eso la muestra envejece
 * sola: leída dentro de un año, esta llave dirá que lleva sin comprobarse un año.
 * Es lo correcto para lo que es —una demostración de un momento— y es justo lo que
 * supabase/datos-de-prueba.sql no puede permitirse, porque ese se pega sobre la
 * base de verdad meses después; ahí las dos fechas van restadas de `current_date`.
 */
export function demoGeneralChannel(): DonationChannel | null {
  return donationChannel(
    keyChannel("@soschoco-muestra", "Bre-B", "ChocóUp (muestra)", dayOnly(12)),
  );
}

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------

type CaseSeed = {
  citySlug: string;
  display_name: string;
  household: string;
  story: string;
  consent_to_publish: boolean;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  /**
   * Sin poner, 'persona', que es lo que pone la base de datos por omisión y lo que
   * son casi todas. Los que sí lo dicen están para poder ver lo que el tipo cambia,
   * que es la reserva del retrato: el colegio de Istmina va sin retrato a propósito.
   */
  case_kind?: CaseKind;
  /**
   * La frase que viaja por WhatsApp. Sin poner, la tarjeta recorta la historia con
   * `excerpt()` como hasta ahora, y eso también hay que poder verlo: la mayoría de
   * las fichas van a estar así una temporada.
   */
  summary?: string;
};

const DANIELA = "Daniela, madre soltera reconstruye sola su casa";

const caseSeeds: CaseSeed[] = [
  {
    citySlug: "quibdo",
    display_name: DANIELA,
    household: "3 personas, madre soltera y dos hijas",
    story:
      "Daniela Córdoba González es madre soltera y tiene dos hijas. En medio del temblor, su casa se desplomó y lo perdió prácticamente todo. Hoy enfrenta, junto a sus niñas, la incertidumbre de no tener un hogar. Queremos ayudarla a reconstruir no solo su casa, sino también la esperanza de volver a empezar.",
    consent_to_publish: true,
    published: true,
    created_at: day(8),
    updated_at: day(17),
    summary: "Perdió su casa con el temblor y reconstruye sola con sus dos hijas.",
  },
  {
    citySlug: "quibdo",
    display_name: "Familia Mosquera Palacios",
    household: "6 personas, 3 niñas y un adulto mayor",
    story:
      "La pared del fondo se cayó con el segundo temblor y el techo quedó apoyado sobre una viga partida. Nadie entra a la casa desde entonces.\n\nDuermen en el coliseo desde la primera noche. Don Aníbal, el abuelo, tiene 81 años y no aguanta bien el piso, así que le consiguieron una colchoneta prestada. Lo que piden es material para levantar la pared y volver, porque la casa es propia y el lote está en buen terreno.\n\nJosefa trabaja vendiendo pescado en el mercado y perdió la nevera de icopor y la balanza.",
    consent_to_publish: true,
    published: true,
  },
  {
    citySlug: "quibdo",
    display_name: "Doña Bernarda Rentería",
    household: "Vive sola, 78 años",
    story:
      "Su casa de madera se inclinó y quedó apoyada contra la del vecino. Ella salió sin nada, solo con la cédula y una bolsa de ropa.\n\nEstá alojada donde una sobrina, en el barrio La Yesquita, pero la casa es pequeña y ya son nueve. Toma pastillas para la tensión y se le acabaron; en el hospital le dijeron que volviera en dos semanas.",
    consent_to_publish: true,
    published: true,
  },
  {
    citySlug: "quibdo",
    display_name: "Familia Asprilla Moreno",
    household: "5 personas, 2 niños de 4 y 9 años",
    story:
      "La casa resistió, pero el piso de la cocina se hundió y la instalación de gas quedó suelta. Un técnico de la alcaldía les dijo que no la usen.\n\nSiguen viviendo ahí porque no tienen a dónde ir. Cocinan con leña en el patio, que con las lluvias de estos días se ha vuelto complicado.",
    consent_to_publish: true,
    published: true,
  },
  {
    citySlug: "quibdo",
    display_name: "Familia Ibargüen",
    household: "4 personas",
    story:
      "Visitados el domingo. Falta confirmar con ellos si quieren que publiquemos su caso y sus fotos.",
    consent_to_publish: false,
    published: false,
  },
  {
    citySlug: "istmina",
    display_name: "Familia Perea Córdoba",
    household: "7 personas, 4 menores de edad",
    story:
      "La vivienda tiene una grieta que atraviesa dos muros de carga. La marcaron con cinta y les recomendaron desalojar.\n\nEstán en la casa de la cultura con otras cuatro familias. Piden tejas y madera para reforzar, y un lugar donde guardar lo que alcanzaron a sacar.",
    consent_to_publish: true,
    published: true,
  },
  {
    citySlug: "istmina",
    display_name: "Yeison Córdoba y su hermana",
    household: "2 personas, 16 y 11 años, a cargo de una tía",
    story:
      "El cuarto donde dormían quedó inhabitable. La tía los recibió pero no alcanza el espacio ni la comida para todos.\n\nYeison está en décimo y perdió los cuadernos y el uniforme. La escuela retoma clases la próxima semana en la sede alterna.",
    consent_to_publish: true,
    published: true,
  },
  {
    citySlug: "bahia-solano",
    display_name: "Familia Klinger Valencia",
    household: "5 personas, 2 niños",
    story:
      "La casa de palafito en El Valle perdió tres pilotes y el piso quedó ladeado. La lancha con la que Wilmar pescaba se partió contra el muelle.\n\nSin la lancha no hay ingreso. Piden madera para los pilotes y ayuda para reparar el motor, que se puede recuperar según el mecánico del pueblo.",
    consent_to_publish: true,
    published: true,
    summary: "Sin la lancha no hay ingreso: piden madera para los pilotes y arreglar el motor.",
  },
  /**
   * Una causa que no es una persona, y por eso está aquí.
   *
   * Es el caso que hace visible lo que 0016 vino a arreglar: sin retrato, la reserva
   * de una persona son sus iniciales, y «IE» en un círculo donde tenía que haber una
   * escuela se lee como un dato mal guardado. Va sin retrato a propósito —un colegio
   * no tiene cara— y sin canal propio, así que además sirve para ver el renglón de
   * procedencia del canal general en algo que no es una familia.
   *
   * Va al final de la lista y no en medio: los identificadores de muestra se sacan
   * del índice de este array y salen en las direcciones y en las capturas, así que
   * meterlo entre dos casos existentes renombraría a la mitad.
   */
  {
    citySlug: "istmina",
    display_name: "Escuela del barrio Niño Jesús",
    household: "128 estudiantes, 6 docentes",
    story:
      "El techo de dos salones se vino abajo la noche del temblor y el muro del patio quedó agrietado. No hubo nadie dentro.\n\nLas clases se reparten entre la casa de la cultura y la sede alterna, en turnos de media jornada. Lo que piden es teja y madera para rearmar la cubierta antes de que vuelvan las lluvias fuertes, y pupitres: los de los dos salones quedaron debajo.",
    consent_to_publish: true,
    published: true,
    case_kind: "colegio",
    summary: "Dos salones sin techo: piden teja, madera y pupitres antes de las lluvias.",
  },
  {
    citySlug: "quibdo",
    display_name: "Caninos del malecón",
    household: "Una camada y tres adultos, a cargo de vecinas del puerto",
    story:
      "Con el temblor se cayeron dos ranchos del malecón donde dormían. Las vecinas los están alimentando con lo que alcanza.\n\nPiden concentrado para un mes y madera para armar un refugio seco, fuera de la crecida.",
    consent_to_publish: true,
    published: true,
    case_kind: "animal",
    summary: "Sin ranchos en el malecón: piden concentrado y un refugio seco.",
  },
  {
    citySlug: "istmina",
    display_name: "Casa de la cultura de Istmina",
    household: "Sede del pueblo, hoy albergue de cuatro familias",
    story:
      "La casa de la cultura resistió, pero el techo del salón principal gotea y el piso de madera se levantó en una esquina.\n\nAhí duermen cuatro familias desalojadas y se guarda lo que sacaron de las casas marcadas. Piden teja, un rollo de plástico y apuntalar el piso antes de que empeoren las lluvias.",
    consent_to_publish: true,
    published: true,
    case_kind: "fundacion",
    summary: "El albergue del pueblo gotea: teja, plástico y apuntalar el piso.",
  },
];

/**
 * Los casos sin su retrato todavía.
 *
 * El retrato apunta a una de sus fotos y las fotos se construyen más abajo —usan
 * `caseByName`, así que no pueden ir antes—, de modo que `demoCases` se termina
 * de armar en la sección de fotos. Aquí no falta nada más.
 */
const caseRows: Omit<Case, "portrait_photo_id" | keyof DonationColumns>[] = caseSeeds.map((seed, index) => {
  const { citySlug, created_at, updated_at, case_kind, summary, ...rest } = seed;
  return {
    id: demoId(CASE, index),
    city_id: cityBySlug(citySlug).id,
    created_at: created_at ?? day(7 + (index % 5)),
    updated_at: updated_at ?? day(12 + (index % 4)),
    // Los dos valores por omisión son los de la base de datos, escritos aquí para
    // que los datos de muestra no puedan enseñar un estado que la tabla no permite:
    // una causa sin clasificar es una persona, y una sin resumen tiene la cadena
    // vacía y no un nulo.
    case_kind: case_kind ?? "persona",
    summary: summary ?? "",
    ...rest,
  };
});

const caseByName = (name: string) => caseRows.find((row) => row.display_name === name)!;

// ---------------------------------------------------------------------------
// Necesidades
// ---------------------------------------------------------------------------

type NeedSeed = {
  citySlug: string;
  caseName?: string;
  category: NeedCategory;
  title: string;
  details?: string;
  quantity?: string;
  status?: NeedStatus;
  urgent?: boolean;
};

const needSeeds: NeedSeed[] = [
  // Quibdó, zona
  {
    citySlug: "quibdo",
    category: "techo",
    title: "Tejas de zinc para 40 viviendas",
    quantity: "600 tejas de 2,44 m",
    details:
      "Entregar en la bodega de la fundación, carrera 4. Ellos coordinan el reparto por barrio con el censo.",
    urgent: true,
  },
  {
    citySlug: "quibdo",
    category: "alimentos",
    title: "Mercados para el albergue del coliseo",
    quantity: "140 mercados semanales",
    details: "Arroz, panela, aceite, lenteja, atún, sal. Sin productos que necesiten refrigeración.",
    urgent: true,
  },
  {
    citySlug: "quibdo",
    category: "agua",
    title: "Tanques de almacenamiento",
    quantity: "25 tanques de 500 litros",
    details: "El agua del acueducto llega turbia. Hacen falta tanques y pastillas potabilizadoras.",
    status: "parcial",
  },
  {
    citySlug: "quibdo",
    category: "transporte",
    title: "Camión para traer donaciones desde Medellín",
    details: "Ruta Medellín–Quibdó, paso restringido en dos tramos. Ida y vuelta, dos días.",
  },
  {
    citySlug: "quibdo",
    category: "medicamentos",
    title: "Suero oral y analgésicos",
    quantity: "Lote para 200 personas",
    status: "cubierta",
  },
  // Istmina, zona
  {
    citySlug: "istmina",
    category: "techo",
    title: "Madera y puntales para apuntalar viviendas",
    quantity: "Para 30 casas",
    details: "Un maestro de obra del pueblo dirige el apuntalamiento si llega el material.",
    urgent: true,
  },
  {
    citySlug: "istmina",
    category: "agua",
    title: "Agua potable para la olla común",
    quantity: "Bidones de 20 litros",
    status: "parcial",
  },
  {
    citySlug: "istmina",
    category: "otro",
    title: "Carpa o bodega temporal",
    details: "Para guardar lo que las familias sacaron de las casas marcadas.",
  },
  // Bahía Solano, zona
  {
    citySlug: "bahia-solano",
    category: "mano_de_obra",
    title: "Carpintero con experiencia en palafitos",
    details: "Dos semanas de trabajo. La comunidad pone alojamiento y comida.",
  },
  {
    citySlug: "bahia-solano",
    category: "transporte",
    title: "Cupo de carga en avioneta o lancha",
    details: "No entra carga por tierra. Coordinar con la fundación antes de despachar cualquier cosa.",
    urgent: true,
  },
  {
    citySlug: "bahia-solano",
    category: "otro",
    title: "Reparación de motores fuera de borda",
    quantity: "6 motores",
    status: "parcial",
  },
  // Casos
  {
    citySlug: "quibdo",
    caseName: DANIELA,
    category: "techo",
    title: "Material para reconstruir la casa: bloque, cemento, tejas y madera",
    quantity: "Para una vivienda de tres",
    details: "El lote es propio. Daniela reconstruye sola, con sus dos hijas.",
    urgent: true,
  },
  {
    citySlug: "quibdo",
    caseName: DANIELA,
    category: "alimentos",
    title: "Mercados mientras sale de la casa de la vecina",
    quantity: "Para tres personas, un mes",
    status: "parcial",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    category: "techo",
    title: "Bloque, cemento y una viga para rehacer la pared del fondo",
    quantity: "300 bloques, 15 bultos de cemento",
    urgent: true,
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    category: "otro",
    title: "Nevera de icopor y balanza para volver a vender pescado",
    status: "parcial",
  },
  {
    citySlug: "quibdo",
    caseName: "Doña Bernarda Rentería",
    category: "medicamentos",
    title: "Medicación para la tensión, tratamiento de tres meses",
    urgent: true,
  },
  {
    citySlug: "quibdo",
    caseName: "Doña Bernarda Rentería",
    category: "techo",
    title: "Evaluación técnica de la casa antes de repararla",
    details: "Quedó apoyada contra la casa vecina. Nadie sabe si se puede recuperar.",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Asprilla Moreno",
    category: "otro",
    title: "Revisión de la instalación de gas y arreglo del piso de la cocina",
    urgent: true,
  },
  {
    citySlug: "istmina",
    caseName: "Familia Perea Córdoba",
    category: "techo",
    title: "Tejas y madera para reforzar los dos muros de carga",
    quantity: "40 tejas",
  },
  {
    citySlug: "istmina",
    caseName: "Yeison Córdoba y su hermana",
    category: "otro",
    title: "Útiles escolares y dos uniformes",
    details: "Yeison está en décimo, la hermana en quinto. Clases desde la próxima semana.",
    status: "parcial",
  },
  {
    citySlug: "bahia-solano",
    caseName: "Familia Klinger Valencia",
    category: "otro",
    title: "Madera para tres pilotes y reparación del motor de la lancha",
    urgent: true,
  },
  {
    citySlug: "istmina",
    caseName: "Escuela del barrio Niño Jesús",
    category: "techo",
    title: "Teja y madera para rearmar la cubierta de dos salones",
    quantity: "Para dos salones",
    urgent: true,
  },
  {
    citySlug: "istmina",
    caseName: "Escuela del barrio Niño Jesús",
    category: "otro",
    title: "Pupitres para los dos salones que quedaron debajo",
    quantity: "40 pupitres",
    status: "parcial",
  },
  {
    citySlug: "quibdo",
    caseName: "Caninos del malecón",
    category: "alimentos",
    title: "Concentrado para un mes",
    quantity: "Para una camada y tres adultos",
    urgent: true,
  },
  {
    citySlug: "istmina",
    caseName: "Casa de la cultura de Istmina",
    category: "techo",
    title: "Teja, plástico y apuntalar el piso del salón",
    details: "Hoy es albergue de cuatro familias. El techo gotea.",
    urgent: true,
  },
];

export const demoNeeds: Need[] = needSeeds.map((seed, index) => ({
  id: demoId(NEED, index),
  city_id: cityBySlug(seed.citySlug).id,
  case_id: seed.caseName ? caseByName(seed.caseName).id : null,
  category: seed.category,
  title: seed.title,
  details: seed.details ?? "",
  quantity: seed.quantity ?? "",
  status: seed.status ?? "abierta",
  urgent: seed.urgent ?? false,
  created_at: day(8 + (index % 6)),
}));

const needByTitle = (title: string) => demoNeeds.find((need) => need.title === title)!;

// ---------------------------------------------------------------------------
// Presupuesto de cada causa
// ---------------------------------------------------------------------------

type BudgetSeed = {
  caseName: string;
  title: string;
  amount_cop: number;
  purchased?: boolean;
};

const budgetSeeds: BudgetSeed[] = [
  {
    caseName: DANIELA,
    title: "Bloque, cemento, tejas y madera para reconstruir la casa",
    amount_cop: 8_500_000,
  },
  {
    caseName: DANIELA,
    title: "Mercados para tres personas, un mes",
    amount_cop: 480_000,
  },
  {
    caseName: DANIELA,
    title: "Colchonetas, sábanas y un fogón de dos puestos",
    amount_cop: 320_000,
    purchased: true,
  },
  {
    caseName: "Familia Mosquera Palacios",
    title: "300 bloques y 15 bultos de cemento para la pared del fondo",
    amount_cop: 4_200_000,
  },
  {
    caseName: "Familia Mosquera Palacios",
    title: "Nevera de icopor y balanza para volver a vender pescado",
    amount_cop: 380_000,
    purchased: true,
  },
  {
    caseName: "Doña Bernarda Rentería",
    title: "Medicación para la tensión, tres meses",
    amount_cop: 180_000,
    purchased: true,
  },
  {
    caseName: "Doña Bernarda Rentería",
    title: "Evaluación técnica de la casa antes de repararla",
    amount_cop: 650_000,
  },
  {
    caseName: "Familia Asprilla Moreno",
    title: "Revisión del gas y arreglo del piso de la cocina",
    amount_cop: 2_100_000,
  },
  {
    caseName: "Familia Perea Córdoba",
    title: "40 tejas y madera para reforzar dos muros de carga",
    amount_cop: 1_600_000,
  },
  {
    caseName: "Yeison Córdoba y su hermana",
    title: "Útiles escolares y dos uniformes",
    amount_cop: 420_000,
  },
  {
    caseName: "Familia Klinger Valencia",
    title: "Madera para tres pilotes y reparación del motor de la lancha",
    amount_cop: 5_400_000,
  },
  {
    caseName: "Escuela del barrio Niño Jesús",
    title: "Teja y madera para la cubierta de dos salones",
    amount_cop: 6_200_000,
  },
  {
    caseName: "Escuela del barrio Niño Jesús",
    title: "40 pupitres para los salones que quedaron debajo",
    amount_cop: 1_800_000,
    purchased: true,
  },
  {
    caseName: "Caninos del malecón",
    title: "Concentrado para un mes",
    amount_cop: 420_000,
    purchased: true,
  },
  {
    caseName: "Caninos del malecón",
    title: "Madera para un refugio seco fuera de la crecida",
    amount_cop: 780_000,
  },
  {
    caseName: "Casa de la cultura de Istmina",
    title: "Teja y plástico para el salón principal",
    amount_cop: 2_400_000,
  },
  {
    caseName: "Casa de la cultura de Istmina",
    title: "Apuntalar el piso de madera",
    amount_cop: 900_000,
    purchased: true,
  },
];

export const demoBudgetItems: BudgetItem[] = budgetSeeds.map((seed, index) => {
  const caseRecord = caseByName(seed.caseName);
  return {
    id: demoId(BUDGET, index),
    case_id: caseRecord.id,
    city_id: caseRecord.city_id,
    title: seed.title,
    amount_cop: seed.amount_cop,
    purchased: seed.purchased ?? false,
    purchased_on: seed.purchased ? dayOnly(10) : null,
    sort_order: index,
    created_at: day(8 + (index % 6)),
  };
});

/**
 * Donaciones de muestra. Los importes por causa suman lo que la barra enseña:
 * la lista y el total salen del mismo arreglo, así que no pueden contradecirse.
 *
 * En modo real esas filas las escribe el webhook y el público las lee de
 * `donation_log`, no de la tabla.
 */
type DonationSeed = {
  /** Null es una donación al fondo general, que no eligió familia. */
  caseName: string | null;
  amount_cop: number;
  donor_name: string;
  publish_name: boolean;
  at: string;
};

const donationSeeds: DonationSeed[] = [
  { caseName: DANIELA, amount_cop: 1_500_000, donor_name: "Lucía Restrepo", publish_name: true, at: at(19, 11, 20) },
  { caseName: DANIELA, amount_cop: 1_000_000, donor_name: "Carlos Vélez", publish_name: true, at: at(18, 16, 5) },
  { caseName: DANIELA, amount_cop: 700_000, donor_name: "Andrés Palacios", publish_name: true, at: at(17, 9, 40) },
  { caseName: "Familia Mosquera Palacios", amount_cop: 1_200_000, donor_name: "Carmen Lozano", publish_name: true, at: at(18, 19, 12) },
  { caseName: "Familia Mosquera Palacios", amount_cop: 600_000, donor_name: "Yulieth Mena", publish_name: true, at: at(15, 8, 30) },
  { caseName: "Doña Bernarda Rentería", amount_cop: 400_000, donor_name: "Marta Hinestroza", publish_name: true, at: at(16, 13, 45) },
  { caseName: "Familia Asprilla Moreno", amount_cop: 250_000, donor_name: "Diego Murillo", publish_name: true, at: at(14, 10, 15) },
  { caseName: "Familia Perea Córdoba", amount_cop: 650_000, donor_name: "Ana Isabel Córdoba", publish_name: true, at: at(17, 21, 8) },
  { caseName: "Familia Perea Córdoba", amount_cop: 500_000, donor_name: "Jairo Rivas", publish_name: true, at: at(13, 7, 50) },
  { caseName: "Yeison Córdoba y su hermana", amount_cop: 350_000, donor_name: "Sofía Caicedo", publish_name: true, at: at(16, 18, 22) },
  { caseName: "Familia Klinger Valencia", amount_cop: 800_000, donor_name: "Wilmer Caicedo", publish_name: true, at: at(15, 12, 0) },
  { caseName: "Escuela del barrio Niño Jesús", amount_cop: 1_000_000, donor_name: "Colegio San José", publish_name: true, at: at(18, 10, 0) },
  { caseName: "Escuela del barrio Niño Jesús", amount_cop: 800_000, donor_name: "Rotary Club Medellín", publish_name: true, at: at(16, 15, 30) },
  { caseName: "Caninos del malecón", amount_cop: 250_000, donor_name: "Paola Mosquera", publish_name: true, at: at(17, 8, 10) },
  { caseName: "Caninos del malecón", amount_cop: 200_000, donor_name: "", publish_name: false, at: at(14, 19, 40) },
  { caseName: "Casa de la cultura de Istmina", amount_cop: 700_000, donor_name: "Alberto Mena", publish_name: true, at: at(18, 12, 25) },
  { caseName: "Casa de la cultura de Istmina", amount_cop: 400_000, donor_name: "Vecindario San Agustín", publish_name: true, at: at(15, 9, 5) },
  { caseName: DANIELA, amount_cop: 50_000, donor_name: "", publish_name: false, at: at(19, 20, 15) },
  // Al fondo general: sin familia elegida, que es el otro camino que ofrece
  // /donaciones. Una firmada y una anónima, porque las dos se pintan distinto y
  // las dos tienen que poder mirarse antes de que entre dinero de verdad.
  { caseName: null, amount_cop: 900_000, donor_name: "Aura Bermúdez", publish_name: true, at: at(19, 8, 45) },
  { caseName: null, amount_cop: 120_000, donor_name: "", publish_name: false, at: at(16, 20, 30) },
];

const demoDonationRows = donationSeeds.map((seed, index) => {
  const caseRecord = seed.caseName ? caseByName(seed.caseName) : null;
  return {
    id: demoId(DONATION, index),
    destination: (caseRecord ? "causa" : "fondo") as DonationDestination,
    case_id: caseRecord?.id ?? null,
    city_id: caseRecord?.city_id ?? null,
    amount_cop: seed.amount_cop,
    donor_name: seed.donor_name,
    publish_name: seed.publish_name,
    donated_at: seed.at,
  };
});

// Lo donado por causa, para la barra de cada ficha. Lo del fondo general no
// entra en ninguna: no es de nadie todavía, y sumarlo a una familia sería
// prometerle un dinero que el equipo aún no ha repartido. Es lo mismo que hace
// la vista `case_budget` (0020), que suma por `case_id` y no ve estas filas.
const demoDonatedByCase: Record<string, number> = {};
for (const row of demoDonationRows) {
  if (!row.case_id) continue;
  demoDonatedByCase[row.case_id] = (demoDonatedByCase[row.case_id] ?? 0) + row.amount_cop;
}

function itemsOf(caseId: string): BudgetItem[] {
  return demoBudgetItems.filter((item) => item.case_id === caseId);
}

export function demoBudgetOf(caseId: string) {
  return budgetProgress(itemsOf(caseId), demoDonatedByCase[caseId] ?? 0);
}

type SupportSeed = {
  kind: SupportOfferKind;
  person_name: string;
  contact: string;
  email?: string;
  city_name?: string;
  message?: string;
  availability?: string;
  skills?: string;
  duration?: string;
  has_transport?: boolean;
  profession?: string;
  experience?: string;
  modality?: SupportOffer["modality"];
  credentials?: string;
  resource?: string;
  quantity?: string;
  condition?: SupportOffer["condition"];
  can_deliver?: boolean;
  category?: string;
};

const supportSeeds: SupportSeed[] = [
  {
    kind: "voluntario",
    person_name: "Camila Hurtado",
    contact: "300 441 2290",
    email: "camila.h@example.com",
    city_name: "Medellín",
    availability: "Fines de semana y una semana completa en septiembre",
    skills: "Inventario, olla común, acompañamiento a familias en el albergue",
    duration: "Puedo quedarme 10 días",
    has_transport: true,
    message: "He ido dos veces a Quibdó. Puedo llevar un cupo de carga.",
  },
  {
    kind: "voluntario",
    person_name: "Andrés Palacios",
    contact: "312 880 1144",
    city_name: "Quibdó",
    availability: "Tardes, de lunes a viernes",
    skills: "Reparto de mercados y censo en barrios",
    duration: "Mientras dure el albergue",
    has_transport: false,
  },
  {
    kind: "profesion",
    person_name: "Dra. Lucía Córdoba",
    contact: "315 220 9088",
    email: "lucia.cordoba@example.com",
    city_name: "Cali",
    profession: "Médica internista",
    experience: "Ocho años en hospital público. Atención de hipertensión y diabetes.",
    modality: "ambos",
    credentials: "RM 384920",
    availability: "Teleconsulta dos noches por semana; una visita en octubre",
    message: "Puedo priorizar a adultas mayores con tratamiento interrumpido.",
  },
  {
    kind: "profesion",
    person_name: "Julián Rivas",
    contact: "304 119 6671",
    city_name: "Istmina",
    profession: "Maestro de obra",
    experience: "Apuntalamiento y techos de zinc. Trabajo con cuadrillas del pueblo.",
    modality: "presencial",
    availability: "Ya estoy en Istmina",
  },
  {
    kind: "recurso",
    person_name: "Cooperativa El Atrato",
    contact: "318 555 0142",
    city_name: "Medellín",
    resource: "Tejas de zinc de 2,44 m",
    quantity: "200 tejas",
    condition: "nuevo",
    can_deliver: false,
    category: "techo",
    message: "Están en la bodega de Guayabal. Hay que coordinar el camión.",
  },
  {
    kind: "recurso",
    person_name: "Marta Vélez",
    contact: "301 772 4401",
    city_name: "Pereira",
    resource: "Mercados secos",
    quantity: "40 mercados",
    condition: "nuevo",
    can_deliver: true,
    category: "alimentos",
    message: "Puedo subirlos yo el 28 si hay quién reciba en Quibdó.",
  },
];

export const demoSupportOffers: SupportOffer[] = supportSeeds.map((seed, index) => ({
  id: demoId(SUPPORT, index),
  kind: seed.kind,
  person_name: seed.person_name,
  contact: seed.contact,
  email: seed.email ?? "",
  city_name: seed.city_name ?? "",
  message: seed.message ?? "",
  availability: seed.availability ?? "",
  skills: seed.skills ?? "",
  duration: seed.duration ?? "",
  has_transport: seed.has_transport ?? false,
  profession: seed.profession ?? "",
  experience: seed.experience ?? "",
  modality: seed.modality ?? "",
  credentials: seed.credentials ?? "",
  resource: seed.resource ?? "",
  quantity: seed.quantity ?? "",
  condition: seed.condition ?? "",
  can_deliver: seed.can_deliver ?? false,
  category: seed.category ?? "",
  created_at: day(12 + index),
}));

// ---------------------------------------------------------------------------
// Fotos
//
// Las imágenes viven en public/demo y las resuelve photoUrl(). Los paisajes y
// la arquitectura del Chocó no llevan personas ni daños. Los retratos sí son
// caras, de archivo y con el mismo sello «muestra»: no son las familias de los
// textos. Una imagen inventada de escombros sería indistinguible de una prueba.
//
// Por eso los pies de foto describen lo que se ve de verdad y no los destrozos
// que cuentan los textos. En campo, cada foto llega con su propio pie escrito por
// el equipo.
// ---------------------------------------------------------------------------

type PhotoSeed = { citySlug: string; caseName?: string; image: string; caption: string };

const photoSeeds: PhotoSeed[] = [
  { citySlug: "quibdo", image: "ciudad-quibdo", caption: "Atardecer sobre el Atrato, en Quibdó." },
  { citySlug: "istmina", image: "ciudad-istmina", caption: "La iglesia del Divino Niño, en Istmina." },
  { citySlug: "bahia-solano", image: "ciudad-bahia-solano", caption: "El Valle, en Bahía Solano." },

  { citySlug: "quibdo", caseName: DANIELA, image: "choco-pueblo", caption: "La cuadra donde estaba la casa de Daniela." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-edificio", caption: "El coliseo del barrio, cerca de donde duermen ahora." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-camino", caption: "El camino hasta el lote, el día que se documentó." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-selva", caption: "El lote, ya marcado, el día del censo." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-rio", caption: "El Atrato desde el lote, cuando se dibujó el plano." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-edificio", caption: "Donde se reunieron con el arquitecto." },
  { citySlug: "quibdo", caseName: DANIELA, image: "choco-pueblo", caption: "La cuadra el día que llegaron los materiales." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-pueblo", caption: "La cuadra donde vive la familia." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-edificio", caption: "El coliseo donde duermen ahora." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-selva", caption: "Los alrededores del barrio." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "persona-josefa", caption: "Retrato de archivo, para la demostración." },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    image: "choco-camino",
    caption: "El camino hasta la casa, el día del censo.",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    image: "choco-rio",
    caption: "El Atrato visto desde el lote, cuando se dibujó el plano.",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    image: "choco-edificio",
    caption: "El coliseo, donde se reunieron con el arquitecto.",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    image: "choco-pueblo",
    caption: "La cuadra el día que descargaron los bloques.",
  },
  {
    citySlug: "quibdo",
    caseName: "Familia Mosquera Palacios",
    image: "choco-selva",
    caption: "Los alrededores, con los primeros bloques ya en el lote.",
  },
  {
    citySlug: "quibdo",
    caseName: "Doña Bernarda Rentería",
    image: "choco-rio",
    caption: "El río desde La Yesquita, el día que quedó alojada.",
  },
  {
    citySlug: "bahia-solano",
    caseName: "Familia Klinger Valencia",
    image: "choco-costa",
    caption: "La playa de El Valle, el día que se documentó el palafito.",
  },
  {
    citySlug: "bahia-solano",
    caseName: "Familia Klinger Valencia",
    image: "choco-canoas",
    caption: "Las lanchas del pueblo, cuando el mecánico revisó el motor.",
  },
  { citySlug: "quibdo", caseName: "Doña Bernarda Rentería", image: "choco-pueblo", caption: "La cuadra de doña Bernarda." },
  { citySlug: "quibdo", caseName: "Doña Bernarda Rentería", image: "choco-camino", caption: "El camino hasta su casa." },
  { citySlug: "quibdo", caseName: "Doña Bernarda Rentería", image: "persona-bernarda", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "quibdo", caseName: "Familia Asprilla Moreno", image: "choco-edificio", caption: "El puesto de salud del sector." },
  { citySlug: "quibdo", caseName: "Familia Asprilla Moreno", image: "choco-canoas", caption: "El puerto donde trabajan." },
  { citySlug: "quibdo", caseName: "Familia Asprilla Moreno", image: "persona-asprilla", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "istmina", caseName: "Familia Perea Córdoba", image: "choco-pueblo", caption: "El barrio de la familia." },
  { citySlug: "istmina", caseName: "Familia Perea Córdoba", image: "choco-edificio", caption: "La casa de la cultura, donde guardan sus cosas." },
  { citySlug: "istmina", caseName: "Familia Perea Córdoba", image: "persona-perea", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "istmina", caseName: "Yeison Córdoba y su hermana", image: "choco-pueblo", caption: "La calle de la casa." },
  { citySlug: "istmina", caseName: "Yeison Córdoba y su hermana", image: "persona-tia", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "bahia-solano", caseName: "Familia Klinger Valencia", image: "choco-palafitos", caption: "Su palafito, sobre el estero." },
  { citySlug: "bahia-solano", caseName: "Familia Klinger Valencia", image: "choco-canoas", caption: "La lancha con la que pescan." },
  { citySlug: "bahia-solano", caseName: "Familia Klinger Valencia", image: "persona-wilmar", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "quibdo", caseName: DANIELA, image: "persona-aristides", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "istmina", caseName: "Escuela del barrio Niño Jesús", image: "choco-edificio", caption: "La escuela, el día que se documentó." },
  { citySlug: "istmina", caseName: "Escuela del barrio Niño Jesús", image: "choco-camino", caption: "El patio, con el muro agrietado." },
  { citySlug: "quibdo", caseName: "Caninos del malecón", image: "choco-canoas", caption: "El malecón, donde estaban los ranchos." },
  { citySlug: "quibdo", caseName: "Caninos del malecón", image: "choco-rio", caption: "El Atrato, el día del censo." },
  { citySlug: "istmina", caseName: "Casa de la cultura de Istmina", image: "choco-edificio", caption: "La casa de la cultura, hoy albergue." },
  { citySlug: "istmina", caseName: "Casa de la cultura de Istmina", image: "choco-pueblo", caption: "El pueblo, el día que se apuntaló el piso." },
];

export const demoPhotos: Photo[] = photoSeeds.map((seed, index) => ({
  id: demoId(PHOTO, index),
  city_id: cityBySlug(seed.citySlug).id,
  case_id: seed.caseName ? caseByName(seed.caseName).id : null,
  storage_path: `demo/${seed.image}`,
  thumb_path: `demo/${seed.image}-mini`,
  caption: seed.caption,
  sort_order: index,
  focus_x: null,
  focus_y: null,
  zoom: null,
  byte_size: 0,
  thumb_byte_size: 0,
  created_at: day(9),
}));

/**
 * El retrato de cada persona: cuál de sus fotos eligió el equipo.
 *
 * Ninguna es la primera de su caso, y eso es el ejemplo: si el retrato se tomara
 * por orden, la tarjeta enseñaría la casa y no a quien vive en ella. Las caras
 * son de archivo, con el sello «muestra»: no son las familias reales. Familia
 * Ibargüen se queda sin retrato a propósito —es un borrador, y en campo habrá
 * casos así— para que esa tarjeta se pueda ver en el panel.
 */
const portraitSeeds: Record<string, string> = {
  [DANIELA]: "persona-aristides",
  "Familia Mosquera Palacios": "persona-josefa",
  "Doña Bernarda Rentería": "persona-bernarda",
  "Familia Asprilla Moreno": "persona-asprilla",
  "Familia Perea Córdoba": "persona-perea",
  "Yeison Córdoba y su hermana": "persona-tia",
  "Familia Klinger Valencia": "persona-wilmar",
};

/**
 * Dos familias con canal propio y seis sin ninguno, que es la proporción real:
 * lo normal es no tener uno abierto a su nombre, y desde 0015 esas seis reciben
 * por el canal general. Las dos proporciones importan aquí, porque son los dos
 * estados que la ficha tiene que saber distinguir con palabras —«el canal que el
 * equipo registró para ella» y «el canal general del portal»— y el portal de
 * muestra es donde se comprueba que se distinguen. Una con llave y otra con
 * enlace, para poder ver los dos formatos.
 *
 * Daniela se queda sin canal propio a propósito, igual que en la base real: es el
 * caso que se abre para revisar cómo se lee el general.
 *
 * El dominio es `ejemplo.org` y no una plataforma de recaudación de verdad. Ya
 * hubo que vaciar enlaces de muestra que apuntaban a campañas vivas de terceros:
 * un enlace inventado que existe manda dinero a alguien que no lo pidió.
 *
 * Las dos llevan fecha de comprobación y llevan las dos que hay: una reciente y
 * una vieja. Son los dos estados de esa frase y los dos tienen que poder verse sin
 * claves, porque el segundo es la mitad del valor del campo —una comprobación de
 * hace cinco meses presentada como insignia fija diría que esto está vigilado
 * cuando lleva cinco meses sin mirarse—. La de Klinger está escrita en mayo a
 * propósito, que son más de los 60 días de `CHANNEL_CHECK_STALE_DAYS` contados
 * desde el agosto en el que viven estos datos.
 */
const caseChannels: Record<string, DonationColumns> = {
  "Familia Mosquera Palacios": keyChannel(
    "@mosquera-muestra",
    "Nequi",
    "Yeimy Palacios (muestra)",
    dayOnly(9),
  ),
  "Familia Klinger Valencia": linkChannel("https://ejemplo.org/klinger-valle", "2026-05-14"),
};

export const demoCases: Case[] = caseRows.map((row) => ({
  ...row,
  ...(caseChannels[row.display_name] ?? NO_CHANNEL),
  portrait_photo_id:
    demoPhotos.find(
      (photo) =>
        photo.case_id === row.id &&
        photo.storage_path === `demo/${portraitSeeds[row.display_name]}`,
    )?.id ?? null,
}));

// ---------------------------------------------------------------------------
// Diario de seguimiento
// ---------------------------------------------------------------------------

type UpdateSeed = {
  caseName: string;
  happenedOn: string;
  title: string;
  body: string;
  photoCaption: string;
};

const updateSeeds: UpdateSeed[] = [
  {
    caseName: DANIELA,
    happenedOn: "2026-08-08",
    title: "Se documentó lo que hay",
    body: "La casa se desplomó con el temblor. Daniela y sus dos hijas lo perdieron casi todo. Están en casa de una vecina. Ella dio su consentimiento para publicar.",
    photoCaption: "El camino hasta el lote, el día que se documentó.",
  },
  {
    caseName: DANIELA,
    happenedOn: "2026-08-10",
    title: "Lo que ya se ha hecho",
    body: "Se levantó el censo, se marcó el lote y se confirmó que el terreno es propio. Con eso se puede reconstruir en el mismo sitio.",
    photoCaption: "El lote, ya marcado, el día del censo.",
  },
  {
    caseName: DANIELA,
    happenedOn: "2026-08-12",
    title: "Plan de reconstrucción",
    body: "Quedó el plano de una vivienda de tres: sala-cocina, un cuarto para Daniela y otro para las niñas. Se reconstruye sobre el mismo lote.",
    photoCaption: "El Atrato desde el lote, cuando se dibujó el plano.",
  },
  {
    caseName: DANIELA,
    happenedOn: "2026-08-14",
    title: "Arquitecto asignado",
    body: "Carlos Murillo, de la fundación, queda a cargo de la obra. Daniela reconstruye con él: no hay más manos en la casa.",
    photoCaption: "Donde se reunieron con el arquitecto.",
  },
  {
    caseName: DANIELA,
    happenedOn: "2026-08-16",
    title: "Materiales entregados",
    body: "Llegaron los primeros bloques, tejas y cuatro bultos de cemento. Falta el resto para cerrar muros y techo.",
    photoCaption: "La cuadra el día que llegaron los materiales.",
  },
  {
    caseName: "Familia Mosquera Palacios",
    happenedOn: "2026-08-08",
    title: "Se documentó lo que hay",
    body: "La pared del fondo está en el suelo y el techo apoyado en una viga partida. Seis personas, tres de ellas niñas. Duermen en el coliseo. Josefa dio su consentimiento para publicar.",
    photoCaption: "El camino hasta la casa, el día del censo.",
  },
  {
    caseName: "Familia Mosquera Palacios",
    happenedOn: "2026-08-10",
    title: "Plan de reconstrucción",
    body: "Se midió el lote y se dejó el plano de la pared y la viga. El resto de la casa se conserva. Con ese plano se pide el material.",
    photoCaption: "El Atrato visto desde el lote, cuando se dibujó el plano.",
  },
  {
    caseName: "Familia Mosquera Palacios",
    happenedOn: "2026-08-12",
    title: "Arquitecto asignado",
    body: "Carlos Murillo, de la fundación, queda a cargo de la obra. Primera visita a la cuadra el mismo día.",
    photoCaption: "El coliseo, donde se reunieron con el arquitecto.",
  },
  {
    caseName: "Familia Mosquera Palacios",
    happenedOn: "2026-08-14",
    title: "Materiales entregados",
    body: "Llegaron 80 bloques y 4 bultos de cemento. Los dejó un vecino de Kennedy. Faltan el resto de bloques y la viga.",
    photoCaption: "La cuadra el día que descargaron los bloques.",
  },
  {
    caseName: "Familia Mosquera Palacios",
    happenedOn: "2026-08-16",
    title: "Lo que ya está listo",
    body: "El censo, el plano y el arquitecto. Los primeros bloques están en la cuadra. Falta cemento, la viga y terminar el muro para que puedan volver.",
    photoCaption: "Los alrededores, con los primeros bloques ya en el lote.",
  },
  {
    caseName: "Doña Bernarda Rentería",
    happenedOn: "2026-08-10",
    title: "Alojada en La Yesquita",
    body: "Está en casa de una sobrina. Se pidió la medicación para la tensión a tres meses.",
    photoCaption: "El río desde La Yesquita, el día que quedó alojada.",
  },
  {
    caseName: "Familia Klinger Valencia",
    happenedOn: "2026-08-09",
    title: "Se documentó el palafito",
    body: "Perdió tres pilotes. La lancha se partió contra el muelle.",
    photoCaption: "La playa de El Valle, el día que se documentó el palafito.",
  },
  {
    caseName: "Familia Klinger Valencia",
    happenedOn: "2026-08-14",
    title: "El motor se puede recuperar",
    body: "Lo revisó el mecánico del pueblo. Piden madera para los pilotes y el arreglo.",
    photoCaption: "Las lanchas del pueblo, cuando el mecánico revisó el motor.",
  },
  {
    caseName: "Escuela del barrio Niño Jesús",
    happenedOn: "2026-08-11",
    title: "Se documentó la cubierta",
    body: "Dos salones sin techo. Las clases están en turnos, en la casa de la cultura y en la sede alterna.",
    photoCaption: "La escuela, el día que se documentó.",
  },
  {
    caseName: "Caninos del malecón",
    happenedOn: "2026-08-12",
    title: "Se documentó el malecón",
    body: "Los ranchos se cayeron. Las vecinas los están alimentando. Se pidió concentrado y madera para un refugio.",
    photoCaption: "El malecón, donde estaban los ranchos.",
  },
  {
    caseName: "Casa de la cultura de Istmina",
    happenedOn: "2026-08-13",
    title: "El piso ya está apuntalado",
    body: "Se apuntaló la esquina que se levantó. El techo sigue goteando. Ahí duermen cuatro familias.",
    photoCaption: "El pueblo, el día que se apuntaló el piso.",
  },
];

function photoByCaption(caseName: string, caption: string): Photo {
  const row = caseByName(caseName);
  const photo = demoPhotos.find(
    (item) => item.case_id === row.id && item.caption === caption,
  );
  if (!photo) {
    throw new Error(`Falta la foto de muestra «${caption}» en ${caseName}`);
  }
  return photo;
}

export const demoCaseUpdates: CaseUpdate[] = withUpdatePhotos(
  updateSeeds.map((seed, index) => {
    const row = caseByName(seed.caseName);
    const photo = photoByCaption(seed.caseName, seed.photoCaption);
    return {
      id: demoId(UPDATE, index),
      case_id: row.id,
      city_id: row.city_id,
      happened_on: seed.happenedOn,
      title: seed.title,
      body: seed.body,
      photo_id: photo.id,
      created_at: `${seed.happenedOn}T18:00:00.000Z`,
    };
  }),
  demoPhotos,
);

// ---------------------------------------------------------------------------
// Ofertas del público
// ---------------------------------------------------------------------------

type OfferSeed = {
  offerer_name: string;
  offerer_contact: string;
  resource: string;
  category: NeedCategory;
  message?: string;
  status?: OfferStatus;
  team_notes?: string;
  needTitle?: string;
  caseName?: string;
  citySlug?: string;
  /** Día en que llegó. Solo lo entregado sale al registro público. */
  deliveredOn?: string;
  /** Autorización expresa para aparecer con nombre. Sin ella, la entrega se
   *  publica igual pero sin decir de quién viene. */
  publishName?: boolean;
  on_wall?: boolean;
};

const offerSeeds: OfferSeed[] = [
  {
    offerer_name: "Ferretería El Progreso",
    offerer_contact: "3009998877",
    resource: "600 tejas de zinc de 2,44 m",
    category: "techo",
    message:
      "Somos una ferretería en Itagüí. Podemos donar el lote completo si alguien pone el transporte. Tenemos factura para el descargo.",
    needTitle: "Tejas de zinc para 40 viviendas",
  },
  {
    offerer_name: "Logística Aburrá",
    offerer_contact: "coordinacion@logisticaaburra.co",
    resource: "Camión de 8 toneladas, ruta Medellín–Quibdó",
    category: "transporte",
    message:
      "Tenemos un camión que sube vacío el jueves. Cabe carga de hasta 8 toneladas. Necesitamos confirmar el punto de recogida en Medellín con dos días de antelación.",
    needTitle: "Camión para traer donaciones desde Medellín",
  },
  {
    offerer_name: "Parroquia San Judas",
    offerer_contact: "3124445566",
    resource: "200 mercados armados",
    category: "alimentos",
    message: "La colecta de la parroquia. Los mercados ya están armados y empacados.",
    citySlug: "istmina",
  },
  {
    offerer_name: "Marta Villegas",
    offerer_contact: "3167778899",
    resource: "Contacto de un carpintero de Buenaventura",
    category: "mano_de_obra",
    message:
      "No soy yo quien ayuda: es mi cuñado, lleva años haciendo palafitos y está dispuesto a ir. Les paso su número si les interesa.",
    citySlug: "bahia-solano",
  },
  {
    offerer_name: "Rotary Club Medellín",
    offerer_contact: "3131112233",
    resource: "12 tanques de 500 litros y pastillas potabilizadoras",
    category: "agua",
    message: "Aprobado por la junta. Podemos despachar en cuanto haya transporte confirmado.",
    status: "aceptada",
    team_notes:
      "Hablé con Diana el martes. Van 12 tanques en el camión de Logística Aburrá; los otros 13 quedan para el siguiente viaje.",
    needTitle: "Tanques de almacenamiento",
    deliveredOn: "2026-08-13",
    publishName: true,
  },
  {
    offerer_name: "Droguería La Salud",
    offerer_contact: "3145556677",
    resource: "Tratamiento para la tensión, tres meses",
    category: "medicamentos",
    message: "Vi el caso de la señora. Le cubrimos el tratamiento completo, solo necesito la fórmula médica.",
    status: "aceptada",
    team_notes: "Yeimy le llevó la fórmula el miércoles. Entregado.",
    caseName: "Doña Bernarda Rentería",
    deliveredOn: "2026-08-12",
  },
  // Entregada contra una necesidad de un caso: en la bandeja del equipo se ve
  // para qué familia era, y en el registro público solo el municipio.
  {
    offerer_name: "Ferretería El Trapiche",
    offerer_contact: "3105554433",
    resource: "300 bloques y 15 bultos de cemento",
    category: "techo",
    message: "Vimos el caso en el portal. Ponemos el material; el transporte no podemos.",
    status: "aceptada",
    team_notes: "Llegó con el camión del jueves. Lo recibió la familia el viernes.",
    needTitle: "Bloque, cemento y una viga para rehacer la pared del fondo",
    deliveredOn: "2026-08-11",
    publishName: true,
  },
  {
    offerer_name: "Colegio San José",
    offerer_contact: "rectoria@sanjose.edu.co",
    resource: "300 cuadernos, lápices y dos uniformes",
    category: "otro",
    message: "Colecta de los cursos de bachillerato. Ya están empacados por tallas y por curso.",
    status: "aceptada",
    team_notes: "Llegaron con el camión del jueves. Los recibió Alberto en la casa de la cultura.",
    citySlug: "istmina",
    deliveredOn: "2026-08-14",
    publishName: true,
  },
  {
    offerer_name: "Marina Restrepo",
    offerer_contact: "3182223344",
    resource: "Flete de 8 toneladas de Medellín a Quibdó",
    category: "transporte",
    message: "Tengo un camión que sube vacío. No quiero que aparezca mi nombre en ninguna parte.",
    status: "aceptada",
    team_notes: "Subió el jueves con los tanques y los mercados. Confirmado por Yeimy al descargar.",
    deliveredOn: "2026-08-13",
  },
  {
    offerer_name: "Donante anónimo",
    offerer_contact: "3159998877",
    resource: "Ropa usada sin clasificar, varios bultos",
    category: "ropa",
    message: "Tengo como diez bultos de ropa de la familia y de vecinos.",
    status: "rechazada",
    team_notes:
      "No hay bodega ni gente para clasificar. Se le explicó y quedó en mandar solo ropa de niño empacada por tallas.",
    citySlug: "quibdo",
  },
  // Las dos siguientes existen para que el registro de lo prometido se pueda ver
  // lleno en el portal de muestra. Sin ellas todo lo que sale allí es una promesa
  // sin confirmar y con el nombre oculto, así que ni la distinción entre las dos
  // fiabilidades ni el recorte del texto se verían nunca en pantalla.

  // Aceptada y sin fecha de entrega: es la única combinación que sale como
  // «confirmada», y con autorización, la única que además va con nombre.
  {
    offerer_name: "Transportes del Atrato",
    offerer_contact: "3172224455",
    resource: "Camión de 5 toneladas, un viaje al mes",
    category: "transporte",
    message: "Ya hablamos con Yeimy. Reservamos un viaje al mes hasta diciembre.",
    status: "aceptada",
    team_notes: "Acordado por teléfono el lunes. El primer viaje se coordina la semana entrante.",
    citySlug: "quibdo",
    publishName: true,
  },
  // Y el atajo que el registro tiene que tapar: el teléfono metido dentro de la
  // descripción, que es lo que hace la gente cuando el formulario no publica su
  // contacto. En el portal de muestra sale como «[número oculto]».
  {
    offerer_name: "Vidrios y Aluminios Chocó",
    offerer_contact: "3141119988",
    resource: "80 láminas de policarbonato, llámame al 314 111 9988",
    category: "techo",
    message: "Prefiero que me llamen directo, no manejo correo.",
    citySlug: "istmina",
  },
  // Y la que enseña el recorte nuevo: una oferta dirigida a una familia, todavía
  // esperando, que en el portal de muestra sale SIN su descripción.
  //
  // El texto está escrito a propósito como lo escribiría alguien que acaba de leer
  // la ficha: nombra el albergue y cuenta a quién hay en la casa. Eso es lo que la
  // vista no publica y lo que hace falta ver aquí para entender por qué —con «300
  // bloques y 15 bultos de cemento» el recorte parecería una exageración—. La fila
  // sigue saliendo, porque «Techo, en Quibdó, sin confirmar» es lo que permite que
  // alguien ponga el transporte que le falta.
  //
  // Pendiente y no aceptada para no mover la proporción de la muestra: el registro
  // tiene que leerse como lo que es, un muro donde casi nada está confirmado
  // todavía, y una sola fila confirmada es lo que hace visible la diferencia sin
  // sugerir que el equipo va al día.
  {
    offerer_name: "Aserradero San Pacho",
    offerer_contact: "3196663322",
    resource: "Madera y láminas para la casa de la señora que duerme en el coliseo con las tres niñas",
    category: "techo",
    message:
      "Leímos la ficha de la familia en el portal. Ponemos la madera y las láminas, pero no tenemos con qué llevarlas hasta allá.",
    caseName: "Familia Mosquera Palacios",
  },
];

export const demoOffers: Offer[] = offerSeeds.map((seed, index) => {
  const need = seed.needTitle ? needByTitle(seed.needTitle) : null;
  const caseRecord = seed.caseName ? caseByName(seed.caseName) : null;
  const cityId =
    need?.city_id ?? caseRecord?.city_id ?? (seed.citySlug ? cityBySlug(seed.citySlug).id : null);

  return {
    id: demoId(OFFER, index),
    city_id: cityId,
    case_id: caseRecord?.id ?? need?.case_id ?? null,
    need_id: need?.id ?? null,
    offerer_name: seed.offerer_name,
    offerer_contact: seed.offerer_contact,
    resource: seed.resource,
    category: seed.category,
    message: seed.message ?? "",
    status: seed.status ?? "pendiente",
    delivered_on: seed.deliveredOn ?? null,
    publish_name: seed.publishName ?? false,
    team_notes: seed.team_notes ?? "",
    created_at: day(10 + (index % 5)),
    on_wall: seed.on_wall ?? true,
  };
});

export const demoOffersWithContext: OfferWithContext[] = demoOffers.map((offer) => {
  const city = demoCities.find((row) => row.id === offer.city_id);
  const caseRecord = demoCases.find((row) => row.id === offer.case_id);
  const need = demoNeeds.find((row) => row.id === offer.need_id);

  return {
    ...offer,
    cities: city ? { name: city.name, slug: city.slug } : null,
    cases: caseRecord ? { id: caseRecord.id, display_name: caseRecord.display_name } : null,
    needs: need
      ? { id: need.id, title: need.title, category: need.category, status: need.status }
      : null,
  };
});

// ---------------------------------------------------------------------------
// Ensamblado
//
// Reproduce lo que en modo real hacen las RLS: el público solo ve lo publicado
// y los casos con consentimiento. `includeDrafts` es lo que usa el panel.
// ---------------------------------------------------------------------------

const categoriesOf = (needs: Need[]) => [...new Set(needs.filter(isOpenNeed).map((need) => need.category))];

/**
 * Las necesidades de un municipio que el público puede ver: las de la zona más
 * las de sus casos visibles.
 *
 * El filtro por caso visible es lo que en modo real hacen las RLS
 * (`needs_public_read`, 0001), y sin él estos datos contaban de más: la tarjeta
 * de /municipios sumaba lo que le falta a una familia cuyo caso todavía no está
 * publicado, y la ficha de ese municipio no, porque `demoCityPage` sí filtra.
 * Hoy no se nota —el único caso en borrador de la muestra no tiene necesidades
 * anotadas— y por eso conviene que esté escrito: en cuanto alguien le añada una
 * para probar el panel, los datos de muestra volverían a enseñar el descuadre
 * que el portal ya no tiene.
 */
function visibleNeeds(cityId: string, includeDrafts: boolean): Need[] {
  const visibleIds = new Set(visibleCases(cityId, includeDrafts).map((row) => row.id));
  return demoNeeds.filter(
    (need) =>
      need.city_id === cityId && (need.case_id === null || visibleIds.has(need.case_id)),
  );
}

const coverOf = (photos: Photo[]) => {
  const first = [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  return first ? first.thumb_path || first.storage_path : null;
};

/** Las fotos de una persona, en el orden en que el equipo las dejó. */
const photosOf = (caseId: string) =>
  demoPhotos
    .filter((photo) => photo.case_id === caseId)
    .sort((a, b) => a.sort_order - b.sort_order);

function visibleCases(cityId: string, includeDrafts: boolean): Case[] {
  return demoCases.filter(
    (row) =>
      row.city_id === cityId && (includeDrafts || (row.published && row.consent_to_publish)),
  );
}

export function demoCityCards(): CityCardData[] {
  return demoCities
    .filter((city) => city.published)
    .map((city) => {
      const needs = visibleNeeds(city.id, false);
      const cases = visibleCases(city.id, false);
      const items = demoBudgetItems.filter((item) =>
        cases.some((row) => row.id === item.case_id),
      );
      const donated = cases.reduce((sum, row) => sum + (demoDonatedByCase[row.id] ?? 0), 0);
      const budget = budgetProgress(items, donated);
      const covers = demoPhotos.filter((photo) => photo.city_id === city.id && photo.case_id === null);
      return {
        ...city,
        coverPath: coverOf(covers),
        coverFrame: savedFrame(
          [...covers].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null,
        ),
        openNeeds: budget.pendingItems,
        openCases: countOpenBudgetCases(items),
        solvedCases: countSolvedBudgetCases(items),
        caseCount: cases.length,
        needs: needs.map((need) => ({
          category: need.category,
          status: need.status,
          case_id: need.case_id,
        })),
        progress: asCaseProgress(budget),
        budget,
        standingOffers: demoOffers.filter(
          (offer) =>
            offer.city_id === city.id &&
            (offer.status === "pendiente" || offer.status === "aceptada") &&
            offer.on_wall &&
            offer.delivered_on === null,
        ).length,
      };
    })
    .filter((city) => city.caseCount > 0);
}

export function demoCityPage(slug: string, includeDrafts: boolean): CityPage | null {
  const city = demoCities.find((row) => row.slug === slug);
  if (!city || (!city.published && !includeDrafts)) return null;

  const visible = visibleCases(city.id, includeDrafts);
  if (!includeDrafts && visible.length === 0) return null;
  // El mismo conjunto que cuenta la tarjeta de /municipios, partido en dos por
  // el ámbito: la ficha las enseña separadas —el panel edita las de la zona en
  // su propio formulario— y su cabecera vuelve a sumarlas. Partiendo de aquí no
  // hay forma de que una de las dos pantallas vea una necesidad que la otra no.
  const needs = visibleNeeds(city.id, includeDrafts);

  return {
    city,
    photos: demoPhotos.filter((row) => row.city_id === city.id && row.case_id === null),
    zoneNeeds: needs.filter((row) => row.case_id === null),
    caseNeeds: needs.filter((row) => row.case_id !== null),
    cases: visible.map((row) => detailCase(row)),
  };
}

/** Un caso con lo que necesitan sus tarjetas: portada, retrato, cuántas faltan y de qué. */
function summarizeCase(row: Case): CaseSummary {
  const needs = demoNeeds.filter((need) => need.case_id === row.id);
  const budget = demoBudgetOf(row.id);
  const allPhotos = photosOf(row.id);
  const photos = situationPhotos(
    allPhotos,
    row.portrait_photo_id,
    demoCaseUpdates.filter((update) => update.case_id === row.id),
  );
  const portrait = allPhotos.find((photo) => photo.id === row.portrait_photo_id);

  return {
    ...row,
    coverPath: coverOf(photos),
    coverFrame: savedFrame(
      [...photos].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null,
    ),
    portraitPath: portrait ? portrait.thumb_path || portrait.storage_path : null,
    portraitFrame: savedFrame(portrait ?? null),
    openNeeds: budget.pendingItems,
    budget,
    categories: categoriesOf(needs),
  };
}

/** El caso con sus fotos de la situación, que es lo que lleva la tarjeta de un municipio. */
function detailCase(row: Case): CaseWithPhotos {
  return {
    ...summarizeCase(row),
    photos: situationPhotos(
      photosOf(row.id),
      row.portrait_photo_id,
      demoCaseUpdates.filter((update) => update.case_id === row.id),
    ),
  };
}

export function demoCasePage(
  slug: string,
  caseId: string,
  includeDrafts: boolean,
): CasePage | null {
  const city = demoCities.find((row) => row.slug === slug);
  if (!city || (!city.published && !includeDrafts)) return null;

  const caseRecord = visibleCases(city.id, includeDrafts).find((row) => row.id === caseId);
  if (!caseRecord) return null;

  const updates = demoCaseUpdates
    .filter((row) => row.case_id === caseRecord.id)
    .sort(
      (a, b) =>
        a.happened_on.localeCompare(b.happened_on) || a.created_at.localeCompare(b.created_at),
    );

  return {
    city,
    caseRecord,
    photos: demoPhotos.filter((row) => row.case_id === caseRecord.id),
    needs: demoNeeds.filter((row) => row.case_id === caseRecord.id),
    budgetItems: itemsOf(caseRecord.id),
    budget: demoBudgetOf(caseRecord.id),
    updates,
    generalChannel: demoGeneralChannel(),
    // La misma función que la capa de datos de verdad, y por eso se importa en vez
    // de repetir el `at(-1)`: la fecha del rótulo la decide un solo sitio.
    lastUpdateOn: lastUpdateOn(updates),
  };
}

export function demoOfferTarget(params: {
  need?: string;
  case?: string;
  city?: string;
}): OfferTarget | null {
  const build = (
    cityId: string | null,
    caseRecord: Case | null,
    need: Need | null,
  ): OfferTarget => {
    const city = demoCities.find((row) => row.id === cityId) ?? null;
    return {
      cityId: city?.id ?? null,
      cityName: city?.name ?? null,
      citySlug: city?.slug ?? null,
      caseId: caseRecord?.id ?? null,
      caseName: caseRecord?.display_name ?? null,
      needId: need?.id ?? null,
      needTitle: need?.title ?? null,
      needCategory: need?.category ?? null,
    };
  };

  if (params.need) {
    const need = demoNeeds.find((row) => row.id === params.need);
    if (need) {
      const caseRecord = demoCases.find((row) => row.id === need.case_id) ?? null;
      return build(need.city_id, caseRecord, need);
    }
  }

  if (params.case) {
    const caseRecord = demoCases.find((row) => row.id === params.case);
    if (caseRecord) return build(caseRecord.city_id, caseRecord, null);
  }

  if (params.city) {
    const city = demoCities.find((row) => row.slug === params.city);
    if (city) return build(city.id, null, null);
  }

  return null;
}

/**
 * Las vistas transversales sobre los datos de muestra. Respetan lo mismo que las
 * de verdad: solo municipios publicados y solo casos con consentimiento, que es
 * lo que en producción hacen las RLS.
 */
const publishedCities = () => demoCities.filter((city) => city.published);

export function demoPortalTotals(): PortalTotals {
  const cities = publishedCities().filter((city) => visibleCases(city.id, false).length > 0);
  const cases = cities.flatMap((city) => visibleCases(city.id, false));
  const items = demoBudgetItems.filter((item) => cases.some((row) => row.id === item.case_id));
  const donated = cases.reduce((sum, row) => sum + (demoDonatedByCase[row.id] ?? 0), 0);
  const budget = budgetProgress(items, donated);

  return {
    cities: cities.length,
    cases: cases.length,
    solvedCases: countSolvedBudgetCases(items),
    openCases: countOpenBudgetCases(items),
    needs: budget.itemCount,
    coveredNeeds: budget.purchasedItems,
    openNeeds: budget.pendingItems,
    budget,
    updatedAt:
      cities.map((city) => city.updated_at).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

export function demoCaseCards(): CaseCard[] {
  return publishedCities()
    .flatMap((city) =>
      visibleCases(city.id, false).map((row) => ({
        ...summarizeCase(row),
        cityName: city.name,
        citySlug: city.slug,
      })),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function demoNeedCards(): NeedCard[] {
  return publishedCities().flatMap((city) =>
    demoNeeds
      .filter((need) => need.city_id === city.id)
      .map((need) => ({
        ...need,
        cityName: city.name,
        citySlug: city.slug,
        caseName: demoCases.find((row) => row.id === need.case_id)?.display_name ?? null,
      })),
  );
}

/** El repaso de dinero del panel, con la misma regla que en producción: se
 *  arman con `moneyDestinationsOf`, así que la lista de muestra no puede contar
 *  una cosa distinta de la de verdad. */
export function demoMoneyDestinations(): MoneyDestination[] {
  return moneyDestinationsOf(
    demoGeneralChannel(),
    demoCases.map((row) => {
      const city = demoCities.find((entry) => entry.id === row.city_id)!;
      return {
        ...row,
        cityName: city.name,
        citySlug: city.slug,
        cityPublished: city.published,
      };
    }),
  );
}

/**
 * El contador de aportes con datos de muestra.
 *
 * Se cuenta sobre `demoOffers` y con el mismo criterio que la vista
 * `public.offer_tally` (0015): lo que sigue en pie —pendiente o aceptada— y, de
 * eso, lo entregado. Contarlo aquí de otra manera sería el fallo de lib/needs.ts
 * otra vez, esta vez entre el portal de muestra y el de verdad, que es donde peor
 * se ve: nadie compara las dos a la vez.
 *
 * Lo que no se reproduce es la cascada de publicación, porque `demoOffers` solo
 * apunta a municipios publicados y añadirla aquí sería escribir una condición que
 * ningún dato ejercita.
 */
/** En muestra no hay foco editorial: el aviso cae en el pueblo más atrasado. */
export function demoCampaignFocus(): CampaignFocusRow {
  return EMPTY_FOCUS;
}

export function demoContributionTally(): ContributionTally {
  const standing = demoOffers.filter(
    (offer) =>
      (offer.status === "pendiente" || offer.status === "aceptada") && offer.on_wall,
  );
  return {
    ofrecidos: standing.length,
    entregados: standing.filter((offer) => offer.delivered_on !== null).length,
  };
}

/**
 * Dos correos de muestra para que la pantalla del panel no se vea vacía.
 *
 * Son inventados y llevan el dominio `ejemplo.org` por lo mismo que los canales:
 * escribirle a una dirección de muestra que existiera sería escribirle a alguien
 * que no lo pidió.
 */
export function demoNewsletterSignups(): NewsletterSignup[] {
  return [
    { id: demoId(NEWSLETTER, 0), email: "vecina@ejemplo.org", created_at: day(16) },
    { id: demoId(NEWSLETTER, 1), email: "colegio.san.agustin@ejemplo.org", created_at: day(13) },
  ];
}

export function demoAdminCities(): AdminCityRow[] {
  return demoCities.map((city) => ({
    ...city,
    caseCount: demoCases.filter((row) => row.city_id === city.id).length,
    // El panel ve también lo de los casos en borrador, igual que el equipo en
    // modo real: `includeDrafts` en vez del filtro del público.
    openNeeds: countOpenNeeds(visibleNeeds(city.id, true)),
    photoCount: demoPhotos.filter((row) => row.city_id === city.id).length,
    pendingOffers: demoOffers.filter(
      (row) => row.city_id === city.id && row.status === "pendiente",
    ).length,
  }));
}

export function demoOffersFor(status?: OfferStatus): OfferWithContext[] {
  const rows = status
    ? demoOffersWithContext.filter((offer) => offer.status === status)
    : demoOffersWithContext;
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Dos notas de muestra para que el buzón del panel no se vea vacío. Son
 * inventadas, como el resto: un error y una idea, una con contacto y otra sin
 * él, que es lo que hay que poder distinguir de un vistazo.
 */
export function demoFeedback(): FeedbackNote[] {
  return [
    {
      id: demoId(FEEDBACK, 0),
      kind: "error",
      body: "En el mapa, al tocar Bahía Solano en el móvil, a veces no abre la ficha y se queda el zoom a medias.",
      contact: "3001112233",
      page_path: "/mapa",
      created_at: day(16),
    },
    {
      id: demoId(FEEDBACK, 1),
      kind: "idea",
      body: "¿Se podría filtrar las necesidades por barrio y no solo por municipio? En Quibdó hay varios y cuesta encontrar los de La Yesquita.",
      contact: "",
      page_path: "/necesidades",
      created_at: day(14),
    },
  ];
}

export function demoNeedOptions(): NeedOption[] {
  return demoNeeds
    .filter(isOpenNeed)
    .map((need) => ({
      id: need.id,
      title: need.title,
      cityName: demoCities.find((city) => city.id === need.city_id)?.name ?? "Sin municipio",
      caseName: demoCases.find((row) => row.id === need.case_id)?.display_name ?? null,
    }));
}

// ---------------------------------------------------------------------------
// Registro público de ayudas
//
// Reproduce lo que hace la vista `public.aid_log`: solo lo entregado, solo de
// municipios publicados, el mes y no el día, el municipio y no el caso, la
// categoría y no el texto de quien ofreció, el nombre únicamente con autorización
// y nunca el contacto —que aquí ni se copia—. Si esa vista cambia, esto cambia con
// ella.
// ---------------------------------------------------------------------------

/**
 * La categoría contra el vocabulario cerrado, igual que hace la vista.
 *
 * Esto NO es la garantía: la garantía está en el `case` de
 * supabase/migrations/0005_registro_sin_texto_libre.sql, porque la vista es la API
 * y aquí no hay ninguna. Es la copia que hace que el portal de muestra se
 * comporte como el de verdad, incluido lo que pasa cuando `offers.category`
 * —texto libre— trae algo que no está en la lista.
 */
function publicCategory(value: string): NeedCategory {
  const known = NEED_CATEGORIES.find((option) => option.value === value);
  return known ? known.value : "otro";
}

/**
 * Una necesidad se puede nombrar si es del municipio. Las de un caso no: su
 * título está escrito en la ficha de la familia, así que nombrarlo aquí sería
 * decir qué recibió esa familia.
 */
function publicNeed(needId: string | null): Need | null {
  const found = demoNeeds.find((row) => row.id === needId);
  if (!found || found.case_id) return null;
  if (!demoCities.find((city) => city.id === found.city_id)?.published) return null;
  return found;
}

/**
 * El nombre solo con autorización expresa, y no si dentro hay un teléfono o un
 * correo: pasa que alguien escribe "Marta, 3167778899" en el campo del nombre, y
 * publicarlo sería publicar el contacto que no autorizó.
 */
function publishableName(offer: Offer): string | null {
  if (!offer.publish_name) return null;
  if (/[0-9]{7}/.test(offer.offerer_name) || offer.offerer_name.includes("@")) return null;
  return offer.offerer_name;
}

export function demoDonationLog(filters: {
  caseId?: string;
  cityId?: string;
  limit?: number;
  sort?: "recientes" | "generosas";
} = {}): DonationLogEntry[] {
  // Reproduce lo que hace la vista `public.donation_log`: solo lo confirmado
  // —aquí todas lo son—, solo de causas publicadas con consentimiento, solo de
  // municipios publicados, y el nombre únicamente con autorización. El recorte
  // del teléfono y del correo no hace falta: estas filas de muestra no los
  // llevan, y en producción lo hace la vista.
  const rows = demoDonationRows
    .filter((row) => {
      // La del fondo no cuelga de ninguna publicación, y no aparece cuando se
      // pregunta por una causa o por un municipio: no es de ninguno de los dos.
      if (!row.case_id) return !filters.caseId && !filters.cityId;

      const caseRecord = demoCases.find((entry) => entry.id === row.case_id);
      const city = demoCities.find((entry) => entry.id === row.city_id);
      if (!caseRecord || !city) return false;
      if (!caseRecord.published || !caseRecord.consent_to_publish || !city.published) {
        return false;
      }
      if (filters.caseId && row.case_id !== filters.caseId) return false;
      if (filters.cityId && row.city_id !== filters.cityId) return false;
      return true;
    })
    .map((row) => {
      const caseRecord = demoCases.find((entry) => entry.id === row.case_id) ?? null;
      const city = demoCities.find((entry) => entry.id === row.city_id) ?? null;
      const name = row.publish_name && row.donor_name.trim() ? row.donor_name : null;
      return {
        id: row.id,
        amount_cop: row.amount_cop,
        donated_at: row.donated_at,
        donor_name: name,
        publish_name: row.publish_name,
        destination: row.destination,
        case_id: caseRecord?.id ?? null,
        case_name: caseRecord?.display_name ?? null,
        city_id: city?.id ?? null,
        city_name: city?.name ?? null,
        city_slug: city?.slug ?? null,
      };
    })
    .sort((a, b) => {
      if (filters.sort === "generosas") {
        return b.amount_cop - a.amount_cop || b.donated_at.localeCompare(a.donated_at);
      }
      return b.donated_at.localeCompare(a.donated_at) || b.id.localeCompare(a.id);
    });

  return rows.slice(0, filters.limit ?? rows.length);
}

export function demoAdminDonations(): AdminDonation[] {
  const rows: AdminDonation[] = [];
  for (const row of demoDonationRows) {
    const caseRecord = demoCases.find((entry) => entry.id === row.case_id);
    const city = demoCities.find((entry) => entry.id === row.city_id);
    if (!caseRecord || !city) continue;
    rows.push({
      id: row.id,
      amount_cop: row.amount_cop,
      status: "confirmada",
      donor_name: row.donor_name,
      publish_name: row.publish_name,
      provider: "muestra",
      payment_ref: "",
      created_at: row.donated_at,
      settled_at: row.donated_at,
      case_id: caseRecord.id,
      case_name: caseRecord.display_name,
      city_id: city.id,
      city_name: city.name,
      city_slug: city.slug,
    });
  }
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoPhotoUsage() {
  return demoPhotos.map((photo) => {
    const city = demoCities.find((entry) => entry.id === photo.city_id)!;
    const caseRecord = photo.case_id
      ? demoCases.find((entry) => entry.id === photo.case_id) ?? null
      : null;
    return {
      id: photo.id,
      city_id: city.id,
      city_name: city.name,
      city_slug: city.slug,
      case_id: photo.case_id,
      case_name: caseRecord?.display_name ?? null,
      byte_size: 0,
      thumb_byte_size: 0,
    };
  });
}

export function demoAidRecords(): AidRecord[] {
  const openCityIds = new Set(publishedCities().map((city) => city.id));

  return demoOffers
    .filter(
      (offer) =>
        offer.delivered_on !== null && (offer.city_id === null || openCityIds.has(offer.city_id)),
    )
    .map((offer) => {
      const city = demoCities.find((row) => row.id === offer.city_id && row.published) ?? null;
      const need = publicNeed(offer.need_id);

      return {
        id: offer.id,
        // `resource` no se copia. No es que no se pinte: es que el registro público
        // no tiene ese dato, ni aquí ni en la vista.
        category: publicCategory(offer.category),
        delivered_month: offer.delivered_on!.slice(0, 7),
        offerer_name: publishableName(offer),
        city_name: city?.name ?? null,
        city_slug: city?.slug ?? null,
        need_title: need?.title ?? null,
      };
    })
    // Por mes y, dentro del mes, por identificador: el mismo orden que pide la
    // consulta de verdad. Ordenar por la fecha completa contaría el día.
    .sort((a, b) => b.delivered_month.localeCompare(a.delivered_month) || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Registro público de lo prometido
//
// Reproduce lo que hace la vista `public.offer_log`: solo lo pendiente y lo
// aceptado que todavía no ha llegado, solo de municipios publicados, el texto sin
// publicar cuando la oferta iba dirigida a una familia y con los teléfonos y los
// correos tapados cuando sí sale, la categoría contra el vocabulario
// cerrado, el municipio y no el caso, el nombre únicamente con la oferta aceptada
// y autorización, y nunca el contacto ni el mensaje —que aquí ni se copian—. Si
// esa vista cambia, esto cambia con ella.
// ---------------------------------------------------------------------------

/**
 * El texto con los contactos tapados, igual que hacen los dos `regexp_replace`
 * de la vista y en el mismo orden: primero las palabras con arroba —el correo
 * entero, y también el «@usuario» de una red social— y después las tiradas de
 * siete dígitos o más, contando los separados por espacios o guiones.
 *
 * Esto NO es la garantía: la garantía está en 0012, porque la vista es la API y
 * aquí no hay ninguna. Es la copia que hace que el portal de muestra se comporte
 * como el de verdad, incluido lo que NO se tapa: «600 tejas de zinc de 2,44 m»
 * sale entero, que es la mitad del recorte que se rompe sin que se note.
 */
function publicResource(resource: string): string {
  return resource
    .replace(/\S*@\S*/g, "[contacto oculto]")
    .replace(/\+?\d(?:[- ]?\d){6,}/g, "[número oculto]");
}

/**
 * El día en Colombia del instante en que se ofreció algo, que es el que publica
 * la vista. Restar cinco horas y leer la fecha en UTC vale porque Colombia no
 * cambia de hora: no hay verano que corrija.
 */
function bogotaDay(iso: string): string {
  return new Date(Date.parse(iso) - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Las ocho semanas de caducidad, medidas desde la oferta más reciente de la
 * muestra y no desde hoy.
 *
 * Los datos de muestra son una foto fija de agosto de 2026. Medidos contra el
 * reloj de verdad, la sección se vaciaría entera en cuanto pasara octubre y quien
 * abriera el portal sin claves configuradas lo leería como una avería —que es
 * justo lo que el modo de muestra existe para no provocar—. El corte es el mismo
 * y sigue estando; lo que cambia es desde dónde se mide.
 */
const demoOfferCutoff = () =>
  Math.max(...demoOffers.map((offer) => Date.parse(offer.created_at))) -
  8 * 7 * 24 * 60 * 60 * 1000;

export function demoOfferRecords(): OfferRecord[] {
  const openCityIds = new Set(publishedCities().map((city) => city.id));
  const cutoff = demoOfferCutoff();

  return demoOffers
    .filter(
      (offer) =>
        (offer.status === "pendiente" || offer.status === "aceptada") &&
        offer.on_wall &&
        // Lo que llegó sale de aquí y aparece en `demoAidRecords`. Las dos listas
        // se reparten las ofertas por esta misma línea y no se solapan nunca.
        offer.delivered_on === null &&
        (offer.city_id === null || openCityIds.has(offer.city_id)) &&
        Date.parse(offer.created_at) > cutoff,
    )
    .map((offer) => {
      const city = demoCities.find((row) => row.id === offer.city_id && row.published) ?? null;
      const need = publicNeed(offer.need_id);

      return {
        id: offer.id,
        category: publicCategory(offer.category),
        // El texto solo si la oferta no iba dirigida a una familia, igual que el
        // `case` de la vista y por lo que allí está escrito: la frase la escribió
        // alguien que tenía la ficha delante, así que puede describirla. La fila se
        // queda, que es lo que permite completarla; la frase, no.
        //
        // La vista mira además la necesidad, por si algún día se guarda solo ésa.
        // Aquí no hace falta: `demoOffers` copia el caso de la necesidad al armar
        // la oferta, así que una oferta contra la necesidad de un caso ya llega con
        // `case_id` puesto y esta línea la coge igual.
        resource: offer.case_id === null ? publicResource(offer.resource) : null,
        offered_on: bogotaDay(offer.created_at),
        state: offer.status === "aceptada" ? ("confirmada" as const) : ("sin_confirmar" as const),
        // La condición que `demoAidRecords` no tiene: con la oferta pendiente no
        // hay nombre aunque esté autorizado, porque nadie del equipo ha hablado
        // todavía con esa persona.
        offerer_name: offer.status === "aceptada" ? publishableName(offer) : null,
        city_name: city?.name ?? null,
        city_slug: city?.slug ?? null,
        need_title: need?.title ?? null,
      };
    })
    // Lo más reciente arriba, que es la promesa que más probablemente siga en
    // pie, y el identificador para desempatar: el mismo orden que pide la
    // consulta de verdad.
    .sort((a, b) => b.offered_on.localeCompare(a.offered_on) || a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// El equipo
//
// La sesión de muestra es de coordinación para que el panel se pueda recorrer
// entero, incluida la pantalla de equipo. Con base de datos conectada esto
// desaparece y el rol lo responde Postgres.
// ---------------------------------------------------------------------------

type TeamSeed = { email: string; nombre: string; role: TeamSession["role"]; cities: string[] };

const teamSeeds: TeamSeed[] = [
  { email: "muestra@chocoup.org", nombre: "Coordinación (muestra)", role: "coordinacion", cities: [] },
  {
    email: "yeimy@chocoup.org",
    nombre: "Yeimy Palacios",
    role: "documentacion",
    cities: ["quibdo"],
  },
  {
    email: "alberto@chocoup.org",
    nombre: "Alberto Perea",
    role: "documentacion",
    cities: ["istmina"],
  },
  {
    email: "erika@chocoup.org",
    nombre: "Erika Klinger",
    role: "documentacion",
    cities: ["bahia-solano"],
  },
];

export function demoTeamSession(): TeamSession {
  const [coordination] = teamSeeds;
  return { email: coordination.email, role: coordination.role, cityIds: [] };
}

export function demoTeamDirectory(): TeamMemberEntry[] {
  return teamSeeds.map((seed, index) => ({
    email: seed.email,
    nombre: seed.nombre,
    role: seed.role,
    cityIds: seed.cities.map((slug) => cityBySlug(slug).id),
    createdAt: day(4 + index),
  }));
}
