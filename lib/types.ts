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
  is_primary: boolean;
  created_at: string;
};

export type Case = {
  id: string;
  city_id: string;
  display_name: string;
  household: string;
  story: string;
  consent_to_publish: boolean;
  published: boolean;
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

export type Offer = {
  id: string;
  city_id: string | null;
  case_id: string | null;
  need_id: string | null;
  offerer_name: string;
  offerer_contact: string;
  resource: string;
  category: string;
  message: string;
  status: OfferStatus;
  team_notes: string;
  created_at: string;
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

/** Necesidad reducida a lo que el lienzo de la portada usa para filtrar y contar. */
export type NeedFacet = {
  category: NeedCategory;
  status: NeedStatus;
  case_id: string | null;
};

export type CityCardData = City & {
  coverPath: string | null;
  openNeeds: number;
  caseCount: number;
  needs: NeedFacet[];
};

export type CaseSummary = Case & {
  coverPath: string | null;
  openNeeds: number;
};

export type CityPage = {
  city: City;
  foundations: Foundation[];
  photos: Photo[];
  zoneNeeds: Need[];
  cases: CaseSummary[];
};

export type CasePage = {
  city: City;
  caseRecord: Case;
  photos: Photo[];
  needs: Need[];
  /** Fundación madre del municipio: el canal por el que llega el dinero al caso. */
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
