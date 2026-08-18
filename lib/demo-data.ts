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
import { savedFrame } from "./photo-frame";
import { NEED_CATEGORIES } from "./constants";
import type {
  AdminCityRow,
  AidRecord,
  Case,
  CaseCard,
  CasePage,
  CaseSummary,
  CaseUpdate,
  CaseWithPhotos,
  CityCardData,
  CityPage,
  City,
  DonationKey,
  Foundation,
  FoundationEntry,
  Need,
  NeedCard,
  NeedCategory,
  NeedOption,
  NeedStatus,
  Offer,
  OfferStatus,
  OfferTarget,
  OfferWithContext,
  Photo,
  PortalTotals,
  TeamMemberEntry,
  TeamSession,
} from "./types";

/** UUIDs con forma válida para que los enlaces del formulario funcionen igual. */
function demoId(kind: number, index: number): string {
  const tail = `${String(kind).padStart(4, "0")}${String(index).padStart(8, "0")}`;
  return `00000000-0000-4000-8000-${tail}`;
}

const CITY = 1;
const FOUNDATION = 2;
const CASE = 3;
const NEED = 4;
const PHOTO = 5;
const OFFER = 6;
const UPDATE = 7;

const day = (n: number) => `2026-08-${String(n).padStart(2, "0")}T14:30:00.000Z`;

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
    name: "Bojayá",
    slug: "bojaya",
    lat: 6.5581,
    lng: -76.8869,
    summary:
      "En Bellavista se agrietaron el centro de salud y catorce viviendas del sector alto. No hubo heridos graves.\n\nEl comité local ya tiene censo de familias afectadas y está pidiendo materiales antes de que empiece la temporada de lluvias fuertes.",
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
// Fundaciones
//
// Una por municipio como máximo, que es lo que garantiza la base de datos
// (`foundations_one_per_city`, ver 0004). Aquí había además una segunda
// fundación en Quibdó, «aliada», para poder ver la tarjeta secundaria: ya no
// existe esa tarjeta ni ese estado, y dejarla habría sido enseñar en el portal de
// muestra una forma que la base de datos rechaza.
//
// Condoto y Nuquí se quedan sin ninguna a propósito: es como nace un municipio
// —creado antes de la visita, con la fundación por levantar— y así se puede ver
// que la ficha se sostiene sin canal de donación. Bojayá tiene fundación pero sin
// enlace, que es el otro caso frecuente: se coordina por WhatsApp.
// ---------------------------------------------------------------------------

type FoundationSeed = Omit<Foundation, "id" | "city_id" | "created_at"> & { citySlug: string };

const foundationSeeds: FoundationSeed[] = [
  {
    citySlug: "quibdo",
    name: "Fundación Atrato Vive",
    description:
      "Llevan ocho años trabajando en los barrios de la ribera. Coordinan el albergue del coliseo y el reparto de mercados.",
    contact_name: "Yeimy Palacios",
    phone: "604 671 2345",
    whatsapp: "3115557788",
    email: "contacto@atratovive.org",
    website: "https://atratovive.org",
    donation_url: "https://atratovive.org/donar",
    address: "Carrera 4 # 24-18, barrio Cesar Conto",
  },
  {
    citySlug: "istmina",
    name: "Corporación Istmina Unida",
    description: "Junta de acción comunal ampliada. Tienen el censo de viviendas afectadas.",
    contact_name: "Alberto Perea",
    phone: "604 670 8811",
    whatsapp: "3103334455",
    email: "istminaunida@correo.com",
    website: "",
    donation_url: "https://vaki.co/vaki/istmina-unida",
    address: "Calle 8 # 3-40, frente a la casa de la cultura",
  },
  {
    citySlug: "bahia-solano",
    name: "Fundación Mar y Selva",
    description:
      "Trabajan con las asociaciones de pescadores de El Valle y Huina. Reciben donaciones en Medellín y las embarcan en Buenaventura.",
    contact_name: "Erika Klinger",
    phone: "",
    whatsapp: "3148889900",
    email: "marysleva.choco@correo.com",
    website: "",
    donation_url: "https://vaki.co/vaki/mar-y-selva",
    address: "Calle principal, al lado de la Capitanía",
  },
  {
    citySlug: "bojaya",
    name: "Comité de Víctimas de Bojayá",
    description: "Organización histórica del municipio. Llevan el censo y la priorización de casos.",
    contact_name: "Leonel Cuesta",
    phone: "",
    whatsapp: "3159992211",
    email: "comitebojaya@correo.com",
    website: "",
    donation_url: "",
    address: "Bellavista, casa comunal",
  },
];

export const demoFoundations: Foundation[] = foundationSeeds.map((seed, index) => {
  const { citySlug, ...rest } = seed;
  return {
    id: demoId(FOUNDATION, index),
    city_id: cityBySlug(citySlug).id,
    created_at: day(6),
    ...rest,
  };
});

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
  },
  {
    citySlug: "bojaya",
    display_name: "Familia Cuesta Bautista",
    household: "6 personas, 3 niños y una señora con movilidad reducida",
    story:
      "La casa está en el sector alto de Bellavista y se agrietó el muro que da a la ladera. Con lluvia fuerte les preocupa que ceda.\n\nDoña Emérita se mueve en silla y la rampa de la entrada quedó partida. El comité los tiene priorizados en el censo.",
    consent_to_publish: true,
    published: true,
  },
  // Este caso no tenía fotos; ahora lleva un retrato de archivo para que la
  // tarjeta no quede en iniciales. El borrador sin imagen es Familia Ibargüen.
  {
    citySlug: "bojaya",
    display_name: "Don Aristides Mena",
    household: "Vive con su hija y dos nietos",
    story:
      "La cocina y el baño quedaron separados de la casa por una grieta que atraviesa el piso. Siguen durmiendo dentro porque el resto de la vivienda aguantó.\n\nLo que pide es que alguien mire la grieta antes de que empiecen las lluvias fuertes.",
    consent_to_publish: true,
    published: true,
  },
];

/**
 * Los casos sin su retrato todavía.
 *
 * El retrato apunta a una de sus fotos y las fotos se construyen más abajo —usan
 * `caseByName`, así que no pueden ir antes—, de modo que `demoCases` se termina
 * de armar en la sección de fotos. Aquí no falta nada más.
 */
const caseRows: Omit<Case, "portrait_photo_id" | "donation_url">[] = caseSeeds.map((seed, index) => {
  const { citySlug, created_at, updated_at, ...rest } = seed;
  return {
    id: demoId(CASE, index),
    city_id: cityBySlug(citySlug).id,
    created_at: created_at ?? day(7 + (index % 5)),
    updated_at: updated_at ?? day(12 + (index % 4)),
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
  // Bojayá, zona
  {
    citySlug: "bojaya",
    category: "techo",
    title: "Cemento y varilla para muros de contención",
    quantity: "80 bultos y 40 varillas",
    urgent: true,
  },
  {
    citySlug: "bojaya",
    category: "ropa",
    title: "Ropa de niño empacada por tallas",
    details: "Solo si viene clasificada y empacada. No hay quien la organice aquí.",
    status: "cubierta",
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
    citySlug: "bojaya",
    caseName: "Familia Cuesta Bautista",
    category: "techo",
    title: "Rampa de acceso y refuerzo del muro de la ladera",
    details: "Doña Emérita se desplaza en silla de ruedas.",
    urgent: true,
  },
  {
    citySlug: "bojaya",
    caseName: "Don Aristides Mena",
    category: "techo",
    title: "Revisión técnica de la grieta que atraviesa el piso",
    details: "Antes de que empiecen las lluvias fuertes. Un maestro de obra del pueblo sirve.",
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
  { citySlug: "quibdo", image: "choco-rio", caption: "El Atrato a su paso por el municipio." },
  { citySlug: "quibdo", image: "choco-pueblo", caption: "Viviendas de la ribera en La Yesquita." },
  { citySlug: "quibdo", image: "choco-edificio", caption: "El coliseo del barrio Kennedy, hoy albergue." },
  { citySlug: "quibdo", image: "choco-canoas", caption: "Canoas varadas en el malecón." },
  { citySlug: "istmina", image: "choco-edificio", caption: "Escuela del barrio San Agustín." },
  { citySlug: "istmina", image: "choco-camino", caption: "La vía de entrada al casco urbano." },
  { citySlug: "istmina", image: "choco-rio", caption: "El San Juan aguas arriba del pueblo." },
  { citySlug: "bahia-solano", image: "choco-costa", caption: "La playa de El Valle." },
  { citySlug: "bahia-solano", image: "choco-palafitos", caption: "Palafitos sobre el estero." },
  { citySlug: "bahia-solano", image: "choco-canoas", caption: "Las lanchas de los pescadores." },
  { citySlug: "bojaya", image: "choco-pueblo", caption: "Bellavista vista desde el río." },
  { citySlug: "bojaya", image: "choco-selva", caption: "La selva que rodea el casco urbano." },

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
  {
    citySlug: "bojaya",
    caseName: "Don Aristides Mena",
    image: "choco-camino",
    caption: "La subida a la casa, el día que se midió la grieta.",
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
  { citySlug: "bojaya", caseName: "Familia Cuesta Bautista", image: "choco-pueblo", caption: "Bellavista, donde viven." },
  { citySlug: "bojaya", caseName: "Familia Cuesta Bautista", image: "choco-camino", caption: "La subida hasta la casa." },
  { citySlug: "bojaya", caseName: "Familia Cuesta Bautista", image: "persona-cuesta", caption: "Retrato de archivo, para la demostración." },
  { citySlug: "bojaya", caseName: "Don Aristides Mena", image: "persona-aristides", caption: "Retrato de archivo, para la demostración." },
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
  "Familia Mosquera Palacios": "persona-josefa",
  "Doña Bernarda Rentería": "persona-bernarda",
  "Familia Asprilla Moreno": "persona-asprilla",
  "Familia Perea Córdoba": "persona-perea",
  "Yeison Córdoba y su hermana": "persona-tia",
  "Familia Klinger Valencia": "persona-wilmar",
  "Familia Cuesta Bautista": "persona-cuesta",
  "Don Aristides Mena": "persona-aristides",
};

const donationSeeds: Record<string, string> = {
  "Familia Mosquera Palacios": "https://vaki.co/vaki/mosquera-palacios",
  "Familia Klinger Valencia": "https://vaki.co/vaki/klinger-valle",
};

export const demoCases: Case[] = caseRows.map((row) => ({
  ...row,
  donation_url: donationSeeds[row.display_name] ?? "",
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
    caseName: "Don Aristides Mena",
    happenedOn: "2026-08-11",
    title: "Se midió la grieta",
    body: "Atraviesa cocina y baño. Se espera un maestro de obra antes de las lluvias fuertes.",
    photoCaption: "La subida a la casa, el día que se midió la grieta.",
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

const openNeedsOf = (needs: Need[]) => needs.filter((need) => need.status !== "cubierta").length;

const categoriesOf = (needs: Need[]) => [
  ...new Set(needs.filter((need) => need.status !== "cubierta").map((need) => need.category)),
];

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
      const needs = demoNeeds.filter((need) => need.city_id === city.id);
      const covers = demoPhotos.filter((photo) => photo.city_id === city.id && photo.case_id === null);
      return {
        ...city,
        coverPath: coverOf(covers),
        coverFrame: savedFrame(
          [...covers].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null,
        ),
        openNeeds: openNeedsOf(needs),
        caseCount: visibleCases(city.id, false).length,
        needs: needs.map((need) => ({
          category: need.category,
          status: need.status,
          case_id: need.case_id,
        })),
      };
    });
}

export function demoCityPage(slug: string, includeDrafts: boolean): CityPage | null {
  const city = demoCities.find((row) => row.slug === slug);
  if (!city || (!city.published && !includeDrafts)) return null;

  const visible = visibleCases(city.id, includeDrafts);
  const visibleIds = new Set(visible.map((row) => row.id));

  return {
    city,
    foundation: demoFoundations.find((row) => row.city_id === city.id) ?? null,
    photos: demoPhotos.filter((row) => row.city_id === city.id && row.case_id === null),
    zoneNeeds: demoNeeds.filter((row) => row.city_id === city.id && row.case_id === null),
    caseNeeds: demoNeeds.filter(
      (row) => row.case_id !== null && visibleIds.has(row.case_id),
    ),
    cases: visible.map((row) => detailCase(row)),
  };
}

/** Un caso con lo que necesitan sus tarjetas: portada, retrato, cuántas faltan y de qué. */
function summarizeCase(row: Case): CaseSummary {
  const needs = demoNeeds.filter((need) => need.case_id === row.id);
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
    // La misma regla que en la capa de datos de verdad: el retrato se busca entre
    // las fotos de este caso y no por identificador contra todas, así que ningún
    // puntero descolocado puede acabar enseñando la cara de otra familia.
    portraitPath: portrait ? portrait.thumb_path || portrait.storage_path : null,
    portraitFrame: savedFrame(portrait ?? null),
    openNeeds: openNeedsOf(needs),
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

  return {
    city,
    caseRecord,
    photos: demoPhotos.filter((row) => row.case_id === caseRecord.id),
    needs: demoNeeds.filter((row) => row.case_id === caseRecord.id),
    updates: demoCaseUpdates
      .filter((row) => row.case_id === caseRecord.id)
      .sort(
        (a, b) =>
          a.happened_on.localeCompare(b.happened_on) || a.created_at.localeCompare(b.created_at),
      ),
    foundation: demoFoundations.find((row) => row.city_id === city.id) ?? null,
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
  const cities = publishedCities();
  const ids = new Set(cities.map((city) => city.id));
  const needs = demoNeeds.filter((need) => ids.has(need.city_id));
  const covered = needs.filter((need) => need.status === "cubierta").length;

  return {
    cities: cities.length,
    cases: cities.reduce((sum, city) => sum + visibleCases(city.id, false).length, 0),
    needs: needs.length,
    coveredNeeds: covered,
    openNeeds: needs.length - covered,
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

export function demoFoundationEntries(): FoundationEntry[] {
  return publishedCities()
    .flatMap((city) =>
      demoFoundations
        .filter((foundation) => foundation.city_id === city.id)
        .map((foundation) => ({ ...foundation, cityName: city.name, citySlug: city.slug })),
    )
    .sort((a, b) => a.cityName.localeCompare(b.cityName, "es"));
}

/**
 * La llave de transferencia del portal de muestra, y es inventada a propósito.
 *
 * La llave de verdad vive en un solo sitio: la fila de `public.donation_key`, que
 * escribe la migración 0010 y que cambia coordinación desde el panel. Copiarla
 * aquí la convertiría en dos sitios, y el segundo no se cambia desde ningún
 * panel: el día que la llave cambiara, este archivo se quedaría enseñando la
 * vieja a cualquiera que abriera el portal sin claves. Una llave caducada
 * enseñada como buena es dinero perdido, así que la de muestra se ve de lejos que
 * lo es.
 *
 * Lleva el nombre y la app puestos porque es también la pantalla de referencia:
 * es donde se comprueba cómo queda el bloque con los tres datos escritos.
 */
export function demoDonationKey(): DonationKey {
  return {
    value: "@ejemplo",
    app: "Nequi",
    holder: "Fundación Atrato Vive (muestra)",
    updatedAt: day(14),
    updatedBy: teamSeeds[0].email,
  };
}

export function demoAdminCities(): AdminCityRow[] {
  return demoCities.map((city) => ({
    ...city,
    caseCount: demoCases.filter((row) => row.city_id === city.id).length,
    openNeeds: openNeedsOf(demoNeeds.filter((row) => row.city_id === city.id)),
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

export function demoNeedOptions(): NeedOption[] {
  return demoNeeds
    .filter((need) => need.status !== "cubierta")
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
    cities: ["quibdo", "bojaya"],
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
