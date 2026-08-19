/**
 * Una puerta y tres secciones: el mapa del panel, escrito una vez.
 *
 * El panel tenía cinco entradas en la barra —Panel, Ofertas, Sugerencias, Dinero,
 * Equipo— y la lista de municipios metida dentro de la primera, que además se
 * llamaba igual que el panel entero. Eso obligaba a saberse de memoria dónde vive
 * cada cosa: el canal de un caso en «Panel», el general en «Dinero», las ofertas de
 * ese mismo caso en dos sitios a la vez.
 *
 * Ahora hay UNA puerta —/admin— y tres secciones dentro. Las dos mitades de eso son
 * igual de importantes y parecen contradecirse hasta que se leen juntas: se entra
 * por un solo sitio, pero ese sitio no es una pantalla donde esté todo amontonado,
 * es un reparto en tres.
 *
 * ═══ POR QUÉ ESTAS TRES Y NO OTRAS ═══
 *
 * Son las tres cosas que el equipo hace, y se distinguen por CUÁNDO se hacen y no
 * por qué tabla tocan:
 *
 *   * CIUDADES es llegar a un pueblo y contar qué pasó. Se hace una vez por
 *     municipio y después se corrige.
 *   * CASOS es documentar a alguien y seguir su avance. Se hace muchas veces por
 *     municipio y se vuelve cada semana.
 *   * RECURSOS OFRECIDOS es contestar a lo que llega de fuera. No lo decide el
 *     equipo, llega cuando llega, y hay que resolverlo el mismo día.
 *
 * ═══ DÓNDE CAE LO QUE YA EXISTÍA ═══
 *
 * Nada de esto es una cuarta sección, y esa era la tentación:
 *
 *   * EL CANAL DE CADA CASO se queda en la ficha de su caso, o sea en Casos. Ahí
 *     está desde 0011 y ahí tiene que seguir: el destino del dinero se cambia con
 *     el nombre y la historia de quien lo recibe delante, no en una lista de
 *     llaves donde todas se parecen.
 *
 *   * EL CANAL GENERAL y el repaso de todos los destinos caen también en Casos,
 *     en una pantalla propia (`MONEY_REVIEW_PATH`). El general no es de ningún
 *     municipio, así que en Ciudades no cabe; y lo que hace es dar destino a los
 *     CASOS que no tienen el suyo, así que es de Casos aunque no sea de un caso.
 *     Ponerlo donde se ve a la vez con los canales propios es además lo que
 *     contesta la única pregunta que esa pantalla existe para contestar: ¿qué
 *     destinos estamos publicando?
 *
 *   * EL DIARIO DE AVANCES se queda en la ficha del caso, en Casos. No se movió y
 *     no debía: un avance se escribe mirando la historia a la que continúa.
 *
 *   * LA LISTA DE CORREOS DE AVISOS cae en Recursos ofrecidos, y esta es la única
 *     que hubo que pensar. No es de un municipio ni de un caso, así que las dos
 *     primeras secciones no la admiten. Lo que la coloca es de dónde viene: la
 *     escribe la misma gente y en el mismo gesto que las ofertas —quien deja su
 *     correo en «Quiero ayudar» está diciendo lo mismo que quien ofrece unas tejas,
 *     con menos concreción—. Así que la sección de lo que llega de fuera es donde
 *     alguien la va a buscar. Solo coordinación, como manda su política (0015).
 *
 * ═══ LO QUE NO ENCAJA, Y NO SE FUERZA ═══
 *
 * `UTILITIES` son las dos pantallas que no son ninguna de las tres cosas de arriba
 * y no se pueden meter con calzador. EQUIPO es quién puede entrar aquí, o sea el
 * panel hablando de sí mismo. SUGERENCIAS es el buzón de lo que el público dice
 * SOBRE EL PORTAL, no sobre una familia ni sobre un recurso; se parece a Recursos
 * en que llega de fuera, y ahí acaba el parecido: no hay nada que verificar,
 * aceptar ni negar, y meterlo dentro convertiría la bandeja de trabajo en un cajón
 * de correo entrante. Van juntas y aparte, al lado de la cuenta, que es donde se
 * ponen las pantallas de las que uno se acuerda una vez al mes.
 */

/** La única puerta. */
export const ADMIN_HOME = "/admin";

/**
 * El repaso de todos los destinos de dinero, dentro de Casos.
 *
 * Se exporta como constante porque la escriben tres sitios —la barra, la puerta y
 * `moneyDestinationsOf()`, que la mete dentro de cada fila del general— y una ruta
 * repetida a mano es una ruta que se queda vieja en dos de los tres.
 */
export const MONEY_REVIEW_PATH = "/admin/casos/dinero";

/** La lista de correos de avisos, dentro de Recursos ofrecidos. */
export const SIGNUPS_PATH = "/admin/recursos/avisos";

export type AdminSectionKey = "ciudades" | "casos" | "recursos";

export type AdminSection = {
  key: AdminSectionKey;
  href: string;
  /**
   * El nombre corto, para la barra.
   *
   * Existe por una sola de las tres y conviene decirlo: la tercera se llama
   * «Verificación, aceptación o negación de los recursos ofrecidos», que son 56
   * caracteres y no caben en una pastilla de una barra que en un móvil de 390 px
   * lleva otras dos al lado. El nombre entero se escribe donde hay sitio —la
   * puerta y el titular de su propia pantalla— y esto es lo que va en la pastilla.
   */
  label: string;
  /** El nombre entero, el que la puerta y el titular de la sección escriben. */
  title: string;
  /** Qué se hace ahí, en una línea. Se lee en la puerta. */
  blurb: string;
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "ciudades",
    href: "/admin/ciudades",
    label: "Ciudades",
    title: "Ciudades",
    blurb: "Qué pasó en cada municipio, sus fotos y lo que falta en la zona.",
  },
  {
    key: "casos",
    href: "/admin/casos",
    label: "Casos",
    title: "Casos",
    blurb:
      "Las causas documentadas: su historia, su retrato, sus necesidades, su diario de avances y a dónde va su dinero.",
  },
  {
    key: "recursos",
    href: "/admin/recursos",
    label: "Recursos ofrecidos",
    title: "Verificación, aceptación o negación de los recursos ofrecidos",
    blurb:
      "Lo que ofrece el público: comprobar que es legítimo, aceptarlo o negarlo, y anotar cuándo llegó.",
  },
];

/**
 * Qué sección está abierta, mirando la ruta.
 *
 * Se resuelve por rama y no por igualdad porque toda pantalla del panel cuelga de
 * una de las tres, incluidas las que no lo parecen: la ficha de un caso vive en
 * /admin/ciudades/…/casos/… por la ruta que tenía antes de la reforma, y pertenece a
 * Casos. Sin esta excepción, editar un caso dejaría la barra señalando Ciudades, y
 * la barra estaría diciendo que se está en otra sección.
 *
 * Devuelve nulo en la puerta y en las pantallas de `UTILITIES`, que no son ninguna
 * de las tres. Nulo es una respuesta y no un hueco: en la puerta no hay ninguna
 * sección abierta todavía.
 */
export function activeAdminSection(pathname: string): AdminSectionKey | null {
  if (/^\/admin\/ciudades\/[^/]+\/casos(\/|$)/.test(pathname)) return "casos";
  if (pathname === "/admin/ciudades" || pathname.startsWith("/admin/ciudades/")) return "ciudades";
  if (pathname === "/admin/casos" || pathname.startsWith("/admin/casos/")) return "casos";
  if (pathname === "/admin/recursos" || pathname.startsWith("/admin/recursos/")) return "recursos";
  return null;
}

/**
 * Las dos pantallas que no son ninguna de las tres secciones.
 *
 * `coordinationOnly` no protege nada —la pantalla y sus acciones comprueban el rol
 * en el servidor, y la base de datos lo vuelve a comprobar— pero ofrecer una puerta
 * que solo puede devolver un error tampoco ayuda.
 */
export const ADMIN_UTILITIES = [
  { href: "/admin/sugerencias", label: "Sugerencias", coordinationOnly: false },
  { href: "/admin/equipo", label: "Equipo", coordinationOnly: true },
] as const;
