import type { ReactElement } from "react";
import { CasesIcon, PledgeIcon, TownIcon } from "@/components/ui/icons";

/**
 * Una puerta y tres secciones: el mapa del panel, escrito una vez.
 *
 * Son las tres cosas que el equipo hace, y se distinguen por CUÁNDO se hacen:
 *
 *   * CIUDADES es crear y situar un pueblo en el mapa.
 *   * CASOS es documentar a alguien y seguir su avance.
 *   * VERIFICACIÓN DE RECURSOS es contestar a lo que llega de fuera.
 *
 * Los iconos son los del portal público —municipios, casos, lo ofrecido— para
 * que el panel y ChocóUp se reconozcan como la misma herramienta.
 *
 * El canal de cada caso y el diario de avances viven en la ficha, en Casos.
 * El canal general se repasa en MONEY_REVIEW_PATH, también en Casos. Los
 * correos de avisos caen en Verificación: los escribe la misma gente que las
 * ofertas. Equipo y Sugerencias no son ninguna de las tres y van aparte.
 */

/** La única puerta. */
export const ADMIN_HOME = "/admin";

/** El repaso de todos los destinos de dinero, dentro de Casos. */
export const MONEY_REVIEW_PATH = "/admin/casos/dinero";

/** La lista de correos de avisos, dentro de Verificación de recursos. */
export const SIGNUPS_PATH = "/admin/recursos/avisos";

/**
 * Las fundaciones que se ofrecen a ayudar, dentro de Ofertas.
 *
 * Va aquí y no como una pestaña más de la bandeja porque no es una bandeja: es
 * una lista de fichas que se editan y que llevan un estado de revisión. La
 * pantalla de ofertas remite a esta, para que quien busque «fundación» la
 * encuentre desde donde la buscaría.
 */
export const FOUNDATIONS_PATH = "/admin/recursos/fundaciones";

export type AdminSectionKey = "ciudades" | "casos" | "recursos";

type Icon = (props: { className?: string }) => ReactElement;

export type AdminSection = {
  key: AdminSectionKey;
  href: string;
  /** El nombre corto, para la barra. */
  label: string;
  /** El nombre de la pantalla. */
  title: string;
  /** Qué se hace ahí, en una línea. Se lee en la puerta. */
  blurb: string;
  Icon: Icon;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "ciudades",
    href: "/admin/ciudades",
    label: "Ciudades",
    title: "Ciudades",
    blurb: "Crear, ubicar, describir y fotografiar cada municipio.",
    Icon: TownIcon,
  },
  {
    key: "casos",
    href: "/admin/casos",
    label: "Casos",
    title: "Casos",
    blurb: "Historia, retrato, presupuesto, avances y a dónde va el dinero.",
    Icon: CasesIcon,
  },
  {
    key: "recursos",
    href: "/admin/recursos",
    label: "Ofertas",
    title: "Ofertas recibidas",
    blurb: "Voluntarios, profesiones y recursos: un listado para encontrarlos.",
    Icon: PledgeIcon,
  },
];

/**
 * Qué sección está abierta, mirando la ruta.
 *
 * La ficha de una causa vive en /admin/ciudades/…/casos/… y pertenece a Casos.
 */
export function activeAdminSection(pathname: string): AdminSectionKey | null {
  if (/^\/admin\/ciudades\/[^/]+\/casos(\/|$)/.test(pathname)) return "casos";
  if (pathname === "/admin/ciudades" || pathname.startsWith("/admin/ciudades/")) return "ciudades";
  if (pathname === "/admin/casos" || pathname.startsWith("/admin/casos/")) return "casos";
  if (pathname === "/admin/recursos" || pathname.startsWith("/admin/recursos/")) return "recursos";
  return null;
}

export const ADMIN_UTILITIES = [
  { href: "/admin/fotos", label: "Fotos", coordinationOnly: false },
  { href: "/admin/sugerencias", label: "Sugerencias", coordinationOnly: false },
  { href: "/admin/casos/donantes", label: "Donantes", coordinationOnly: true },
  { href: "/admin/equipo", label: "Equipo", coordinationOnly: true },
] as const;
