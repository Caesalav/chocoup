import {
  CasesIcon,
  CheckIcon,
  DonationIcon,
  FeedbackIcon,
  HomeIcon,
  MapIcon,
  OfferIcon,
  PledgeIcon,
  SearchIcon,
  TownIcon,
} from "@/components/ui/icons";

/**
 * Los destinos del portal, en un solo sitio.
 *
 * El mismo mapa se dibuja de dos maneras: abajo en el móvil, donde llega el
 * pulgar, y arriba en el escritorio, donde está la costumbre. Si cada barra
 * guardara su propia lista acabarían diciendo cosas distintas —una sección
 * nueva aparecería en una y no en la otra—, así que las listas y la regla de
 * qué está activo viven aquí y las barras solo las pintan.
 */

type Icon = (props: { className?: string }) => React.ReactElement;

export type Destination = {
  href: string;
  label: string;
  Icon: Icon;
  /** Rutas que pertenecen a este destino aunque no cuelguen de su dirección: la
   *  ficha de un municipio es /ciudades/… y se marca en «Municipios». */
  owns?: readonly string[];
};

/**
 * Las cuatro maneras de entrar al mismo material: por municipio, por lo que
 * hace falta, por las personas o por dónde va el dinero. Son los accesos con
 * icono del inicio y, en escritorio, la navegación de la cabecera.
 */
export const SECTIONS: readonly Destination[] = [
  { href: "/municipios", label: "Municipios", Icon: TownIcon, owns: ["/ciudades"] },
  { href: "/casos", label: "Casos", Icon: CasesIcon },
  { href: "/donaciones", label: "Donaciones", Icon: DonationIcon },
] as const;

/**
 * Las cuatro cosas que se hacen desde cualquier pantalla. No repiten las
 * secciones: aquí se vuelve al principio, se sitúa uno, se busca o se ofrece
 * algo. Buscar abre el campo en la barra; /buscar queda para quien no tiene
 * JavaScript y para enviar el formulario.
 */
export const TABS: readonly Destination[] = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/mapa", label: "Mapa", Icon: MapIcon },
  { href: "/buscar", label: "Buscar", Icon: SearchIcon },
  { href: "/ofrecer", label: "Ofrecer", Icon: OfferIcon },
] as const;

/** El acceso a donar, siempre a la vista en las barras. La etiqueta es más
 *  corta que en las secciones: en el móvil cabe como botón, no como destino. */
export const DONATE: Destination = {
  href: "/donaciones",
  label: "Donar",
  Icon: DonationIcon,
};

/**
 * Lo que se ha ofrecido y todavía no ha llegado.
 *
 * Hermano del registro de ayudas: son las dos mitades del mismo registro —lo
 * prometido y lo entregado—, así que van juntos donde aparezca cualquiera de los
 * dos: emparejados por pestañas dentro de sus pantallas y seguidos en el mapa del
 * pie, en este orden, que es el orden en que pasan las cosas. Y va fuera de
 * `SECTIONS` por la misma razón que su hermano, la que está explicada debajo.
 *
 * La etiqueta es la larga a propósito. «Ofrecido» a secas queda a una letra de
 * «Ofrecer», que es la acción de la barra de abajo: serían dos entradas casi
 * iguales en la misma navegación —una para mirar lo prometido y otra para
 * prometer algo— sin nada en las palabras que diga cuál es cuál.
 */
export const OFFER_LOG: Destination = {
  href: "/ofrecido",
  label: "Lo que se ha ofrecido",
  Icon: PledgeIcon,
};

/**
 * El registro de ayudas entregadas.
 *
 * Va aparte y no dentro de `SECTIONS` porque las secciones son las cuatro
 * maneras de entrar al material y esto no lo es: es la constancia de lo que ya
 * llegó, la respuesta a "¿y de verdad llega algo?". Meterlo ahí lo pondría de
 * quinto icono en una fila de cuatro del inicio, que es una decisión de diseño y
 * no de navegación.
 *
 * Lleva icono porque el tipo lo pide y porque el día que entre en una barra hará
 * falta; hoy solo lo pinta el mapa del pie, que va en palabras.
 */
export const AID_LOG: Destination = {
  href: "/ayudas",
  label: "Ayudas que llegaron",
  Icon: CheckIcon,
};

/**
 * El buzón: reportar un error o pedir una función.
 *
 * No es una sección ni una pestaña. Va en el pie, donde caben los destinos que
 * no son ni material ni acción de ayuda, y además como botón suelto en el
 * portal porque el inicio y el mapa no montan pie.
 */
export const FEEDBACK: Destination = {
  href: "/sugerencias",
  label: "Sugerencias",
  Icon: FeedbackIcon,
};

/**
 * Qué destino de la lista está abierto, o null si ninguno.
 *
 * El inicio se excluye del recorrido porque toda dirección empieza por "/" y si
 * no se lo saca gana siempre. Quien quiera que el inicio haga de rama por
 * defecto —la barra del móvil lo hace, para que nunca se vea sin nada marcado—
 * lo resuelve por su cuenta con el null.
 */
export function activeHref(
  pathname: string,
  items: readonly Destination[],
): string | null {
  const belongs = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const open = items.find(
    (item) => item.href !== "/" && (belongs(item.href) || item.owns?.some(belongs)),
  );
  if (open) return open.href;

  return pathname === "/" && items.some((item) => item.href === "/") ? "/" : null;
}
