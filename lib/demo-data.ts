/**
 * Datos de muestra para ver el portal lleno antes de conectar Supabase.
 *
 * Se usan solo cuando no hay claves configuradas (ver `isDemoMode`). En cuanto
 * existan, el portal lee de la base de datos y esto deja de intervenir.
 *
 * El contenido es inventado. Sirve para valorar el diseño y el recorrido, no
 * como documentación de nada. El banner del portal lo deja claro en pantalla.
 */
import type {
  AdminCityRow,
  Case,
  CasePage,
  CityCardData,
  CityPage,
  City,
  Foundation,
  Need,
  NeedCategory,
  NeedOption,
  NeedStatus,
  Offer,
  OfferStatus,
  OfferTarget,
  OfferWithContext,
  Photo,
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
    is_primary: true,
  },
  {
    citySlug: "quibdo",
    name: "Red de Mujeres del Chocó",
    description: "Apoyan con acompañamiento psicosocial y cocinas comunitarias.",
    contact_name: "Nubia Moreno",
    phone: "",
    whatsapp: "3126661144",
    email: "redmujereschoco@correo.com",
    website: "",
    donation_url: "",
    address: "",
    is_primary: false,
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
    is_primary: true,
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
    is_primary: true,
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
    is_primary: true,
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
};

const caseSeeds: CaseSeed[] = [
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
];

export const demoCases: Case[] = caseSeeds.map((seed, index) => {
  const { citySlug, ...rest } = seed;
  return {
    id: demoId(CASE, index),
    city_id: cityBySlug(citySlug).id,
    created_at: day(7 + (index % 5)),
    updated_at: day(12 + (index % 4)),
    ...rest,
  };
});

const caseByName = (name: string) => demoCases.find((row) => row.display_name === name)!;

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
// Las imágenes viven en public/demo y las resuelve photoUrl(). Son paisajes y
// arquitectura del Chocó, sin personas y sin daños, con el sello "muestra"
// incrustado: este portal documenta un terremoto real y una imagen inventada de
// escombros sería indistinguible de una prueba.
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

  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-pueblo", caption: "La cuadra donde vive la familia." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-edificio", caption: "El coliseo donde duermen ahora." },
  { citySlug: "quibdo", caseName: "Familia Mosquera Palacios", image: "choco-selva", caption: "Los alrededores del barrio." },
  { citySlug: "quibdo", caseName: "Doña Bernarda Rentería", image: "choco-pueblo", caption: "La cuadra de doña Bernarda." },
  { citySlug: "quibdo", caseName: "Doña Bernarda Rentería", image: "choco-camino", caption: "El camino hasta su casa." },
  { citySlug: "quibdo", caseName: "Familia Asprilla Moreno", image: "choco-edificio", caption: "El puesto de salud del sector." },
  { citySlug: "quibdo", caseName: "Familia Asprilla Moreno", image: "choco-canoas", caption: "El puerto donde trabajan." },
  { citySlug: "istmina", caseName: "Familia Perea Córdoba", image: "choco-pueblo", caption: "El barrio de la familia." },
  { citySlug: "istmina", caseName: "Familia Perea Córdoba", image: "choco-edificio", caption: "La casa de la cultura, donde guardan sus cosas." },
  { citySlug: "istmina", caseName: "Yeison Córdoba y su hermana", image: "choco-pueblo", caption: "La calle de la casa." },
  { citySlug: "bahia-solano", caseName: "Familia Klinger Valencia", image: "choco-palafitos", caption: "Su palafito, sobre el estero." },
  { citySlug: "bahia-solano", caseName: "Familia Klinger Valencia", image: "choco-canoas", caption: "La lancha con la que pescan." },
  { citySlug: "bojaya", caseName: "Familia Cuesta Bautista", image: "choco-pueblo", caption: "Bellavista, donde viven." },
  { citySlug: "bojaya", caseName: "Familia Cuesta Bautista", image: "choco-camino", caption: "La subida hasta la casa." },
];

export const demoPhotos: Photo[] = photoSeeds.map((seed, index) => ({
  id: demoId(PHOTO, index),
  city_id: cityBySlug(seed.citySlug).id,
  case_id: seed.caseName ? caseByName(seed.caseName).id : null,
  storage_path: `demo/${seed.image}`,
  thumb_path: `demo/${seed.image}-mini`,
  caption: seed.caption,
  sort_order: index,
  created_at: day(9),
}));

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
    resource: "25 tanques de 500 litros y pastillas potabilizadoras",
    category: "agua",
    message: "Aprobado por la junta. Podemos despachar en cuanto haya transporte confirmado.",
    status: "aceptada",
    team_notes:
      "Hablé con Diana el martes. Van 12 tanques en el camión de Logística Aburrá; los otros 13 quedan para el siguiente viaje.",
    needTitle: "Tanques de almacenamiento",
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

const coverOf = (photos: Photo[]) => {
  const first = [...photos].sort((a, b) => a.sort_order - b.sort_order)[0];
  return first ? first.thumb_path || first.storage_path : null;
};

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
      return {
        ...city,
        coverPath: coverOf(
          demoPhotos.filter((photo) => photo.city_id === city.id && photo.case_id === null),
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

  return {
    city,
    foundations: demoFoundations.filter((row) => row.city_id === city.id),
    photos: demoPhotos.filter((row) => row.city_id === city.id && row.case_id === null),
    zoneNeeds: demoNeeds.filter((row) => row.city_id === city.id && row.case_id === null),
    cases: visibleCases(city.id, includeDrafts).map((row) => {
      const photos = demoPhotos.filter((photo) => photo.case_id === row.id);
      return {
        ...row,
        coverPath: coverOf(photos),
        openNeeds: openNeedsOf(demoNeeds.filter((need) => need.case_id === row.id)),
      };
    }),
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

  const cityFoundations = demoFoundations.filter((row) => row.city_id === city.id);

  return {
    city,
    caseRecord,
    photos: demoPhotos.filter((row) => row.case_id === caseRecord.id),
    needs: demoNeeds.filter((row) => row.case_id === caseRecord.id),
    foundation: cityFoundations.find((row) => row.is_primary) ?? cityFoundations[0] ?? null,
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
