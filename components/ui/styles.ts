/**
 * Clases compartidas en vez de una librería de componentes: el portal tiene
 * pocos patrones y muchos formularios, y así se mantienen consistentes sin
 * añadir una capa de abstracción que haya que aprender.
 *
 * Los controles miden al menos 44 px de alto porque casi todo el uso en campo
 * será con el pulgar.
 *
 * Sobre superficies y estados, ver el bloque largo de app/globals.css: papel,
 * panel y panel alto están tan juntos que un cambio de relleno no se ve, así
 * que el estado de una tarjeta lo llevan la sombra, el borde, un
 * desplazamiento y —lo elegido— un aro de tinta. Aquí viven las recetas; en las
 * páginas no debería haber ni una sombra escrita a mano.
 */

/**
 * En Tailwind 4 hay que nombrar `translate` y `scale`, no `transform`.
 *
 * `-translate-y-1`, `scale-95` y `scale-[0.97]` ya no escriben la matriz de
 * `transform`: escriben las propiedades sueltas `translate` y `scale`, que son
 * independientes y animables por su cuenta. Una `transition-[transform,…]` heredada
 * de la versión anterior compila sin queja y no anima nada, así que el movimiento
 * de la pieza pasa a ser un salto instantáneo —y no se nota mirando una captura,
 * solo usándolo—. Lo llevaban todas las tarjetas del portal y todos los controles.
 *
 * Son dos listas y no una porque un control y una superficie no mueven lo mismo:
 * ésta para lo que se pulsa (color y hundimiento) y `lifts`, más abajo, para lo que
 * se levanta (desplazamiento y sombra). Quien escriba una pieza nueva compone desde
 * una de las dos en vez de volver a escribir la lista, que es cómo se colaron
 * catorce copias de la versión vieja por las páginas.
 */
const moves = "transition-[translate,scale,background-color,border-color,color] duration-150";

/**
 * Todo control responde al dedo: cambia de color al pasar por encima y se hunde
 * un punto al pulsarlo. Es la señal más básica de "sí, te oí", y en conexiones
 * lentas es lo único que confirma que algo está pasando.
 */
const pressable = `${moves} active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:active:scale-100`;

export const button = {
  primary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper hover:bg-accent-strong ${pressable}`,
  secondary: `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel-high px-6 py-3 text-sm font-medium text-body hover:border-ink/40 hover:text-ink ${pressable}`,
  ghost: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-line hover:text-ink ${pressable}`,
  /* Borrar va en el rojo de la escala y no en el verde de marca: el verde es el
     color de lo que se hace a favor, y un «Borrar este municipio» pintado igual
     que «Donar dinero» es exactamente la confusión que no se puede permitir en
     el panel. `need-high` sobre panel alto da 6,9:1, y 5,5:1 sobre su lavado. */
  danger: `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-transparent px-4 py-2 text-sm font-medium text-need-high hover:border-need-high hover:bg-need-high-soft ${pressable}`,
};

/**
 * Los campos van en blanco puro y no en un panel translúcido: es lo único que
 * los separa a la vez del papel de la página y de la tarjeta que los contiene,
 * que están casi al mismo tono. El marcador de posición sube de `faint/70` a
 * `faint` porque rebajado se queda en 3:1 contra el blanco.
 *
 * La etiqueta iba en versalitas apretadas, que era la voz de la etapa anterior.
 * En /ofrecer —por donde entra toda la ayuda que ofrece la gente— esas
 * mayúsculas a 11 px pesaban más que la pregunta que van a contestar y se leían
 * peor. Ahora es una frase normal, del tamaño del texto corrido y en `body`:
 * la misma voz blanda de las pastillas del resto del portal.
 */
export const field = {
  label: "block text-[14px] font-medium leading-snug text-body",
  input:
    "mt-2 block w-full rounded-lg border border-line-strong bg-panel-high px-3.5 py-2.5 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none",
  textarea:
    "mt-2 block w-full rounded-lg border border-line-strong bg-panel-high px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-faint focus:border-accent focus:outline-none",
  /* `select-chevron` (globals.css) le devuelve la flecha que `appearance-none`
     le quita. Sin ella el desplegable de /ofrecer es indistinguible de un campo
     de texto y la gente intenta escribir dentro. */
  select:
    "select-chevron mt-2 block w-full appearance-none rounded-lg border border-line-strong bg-panel-high py-2.5 pl-3.5 pr-10 text-base text-ink focus:border-accent focus:outline-none",
  hint: "mt-2 text-xs leading-relaxed text-faint",
  checkboxRow:
    "flex items-start gap-3 rounded-lg border border-line bg-panel-high px-3.5 py-3 text-sm text-body",
  checkbox: "mt-0.5 size-5 shrink-0 accent-accent",
};

/**
 * Aviso de validación o de error: «No pudimos enviar tu oferta», «Ese correo no
 * está en la lista del equipo».
 *
 * Iba en la familia verde, que es la de la marca y la del «hecho»: una oferta
 * que no se envió y un envío correcto salían del mismo color. Va en el rojo
 * profundo de la escala, que aquí no cuenta necesidades sino que avisa —es el
 * mismo tono, y no hay dos rojos—. `need-high` sobre su lavado da 5,5:1.
 */
export const alertBox = "rounded-lg bg-need-high-soft px-3.5 py-2.5 text-sm text-need-high";

// ---------------------------------------------------------------------------
// Superficies
// ---------------------------------------------------------------------------

/** Tarjeta sobria: la que usa el panel del equipo y los formularios. */
export const panel = "rounded-xl border border-line bg-panel";

/**
 * La tarjeta grande de este diseño: radio generoso, blanco puro y sombra de
 * reposo. Blanco y no `panel` porque casi siempre lleva una foto dentro y el
 * marco tiene que ser lo más claro de la pantalla para que la imagen no parezca
 * sucia.
 */
export const card = "rounded-3xl border border-line bg-panel-high shadow-card";

/**
 * El levantamiento de una tarjeta, en 150 ms. La otra mitad de la lección de
 * Tailwind 4 que explica `moves` ahí arriba.
 *
 * Está aparte de `cardLink` porque hay dos formas de colgarlo y la transición tiene
 * que ser la misma en las dos: cuando la tarjeta entera es el enlace se cuelga de
 * `hover:` (aquí abajo), y cuando el enlace es una pieza de dentro —la tarjeta
 * grande de un caso, que lleva un carrusel al lado— se cuelga de `has-[a:hover]:`.
 * Esa segunda versión tenía su propia lista de propiedades, ya corregida, mientras
 * esta seguía con la de Tailwind 3; ahora las dos leen de la misma línea.
 */
export const lifts = "transition-[translate,scale,box-shadow,border-color] duration-150";

/**
 * La misma tarjeta cuando es un enlace, que es casi siempre.
 *
 * Al pasar por encima sube cuatro píxeles y la sombra crece; al pulsar cae de
 * golpe —la sombra se aplasta contra el papel y la tarjeta se encoge un 3 %— y
 * el borde se va a tinta. Nada de esto toca el relleno porque el relleno no
 * puede contarlo: entre panel alto y papel hay nueve niveles de 255.
 *
 * El 3 % de encogimiento parece mucho escrito, y es lo que hay que poner: en un
 * móvil no existe el paso por encima, el hundimiento es la única confirmación de
 * que el toque llegó, y en una tarjeta de 350 px un 1 % son tres píxeles que se
 * los come el dedo que está encima.
 */
export const cardLink = `${card} block ${lifts} hover:-translate-y-1 hover:border-line-strong hover:shadow-lift active:translate-y-0 active:scale-[0.97] active:border-ink/25 active:shadow-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;

// ---------------------------------------------------------------------------
// Piezas sobre foto
// ---------------------------------------------------------------------------

/**
 * Mando circular sobre una imagen: volver, compartir, avanzar. La pastilla
 * oscura no es decoración, es lo que garantiza el contraste del icono cuando la
 * foto de debajo sale quemada; el desenfoque solo evita que se vea el corte.
 * Al 55 % de tinta el icono aguanta 4:1 contra un blanco puro él solo, y con el
 * velo de arriba debajo se va a 10:1.
 */
export const iconOnPhoto =
  `inline-flex size-11 items-center justify-center rounded-full bg-ink/55 text-paper backdrop-blur-sm ${moves} hover:bg-ink/70 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper`;

/** El mismo mando cuando cae sobre papel y no sobre foto. */
export const iconOnPaper =
  `inline-flex size-11 items-center justify-center rounded-full border border-line bg-panel-high text-body shadow-card ${moves} hover:border-line-strong hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;

/**
 * Etiqueta suelta sobre una foto, como el rótulo de la referencia.
 *
 * En la referencia es una pastilla clara translúcida, y así se queda mientras la
 * foto sea oscura. Aquí va oscura: sobre un cielo quemado la clara desaparece.
 * Cuenta además con el velo de arriba debajo —sola llega a 3:1 y con él a 8:1—,
 * así que no se usa sobre una imagen sin velar.
 */
export const pillOnPhoto =
  "inline-flex items-center gap-1.5 rounded-full bg-ink/50 px-3.5 py-1.5 text-[12px] font-medium text-paper backdrop-blur-sm";

// ---------------------------------------------------------------------------
// Tipografía
// ---------------------------------------------------------------------------

/** Titular de sección dentro de una pantalla: el de "Casos documentados". */
export const screenTitle = "font-display text-[22px] leading-tight text-ink lg:text-[26px]";

export const eyebrow = "text-[11px] font-medium uppercase tracking-[0.18em] text-faint";

// ---------------------------------------------------------------------------
// Ancho
//
// El diseño nació en un móvil de 390 px y a cualquier otro ancho era el mismo
// móvil estirado. Estas tres medidas son lo que lo convierte en una web sin
// cambiarle el vocabulario: hasta dónde llega la página, cómo se reparten las
// tarjetas y hasta dónde puede correr una línea de texto.
// ---------------------------------------------------------------------------

/**
 * La caja de la página. El margen de 20 px del móvil no se toca —es el que
 * dejaron decidido las pantallas— y por encima crece hasta 1400, que es donde
 * ya estaban la cabecera y el pie.
 */
export const shell = "mx-auto w-full max-w-[1400px] px-5 sm:px-8";

/**
 * Muro de tarjetas: una columna en el móvil y hasta tres en pantalla ancha.
 *
 * Se corta en tres y no en cuatro porque a 1400 px la cuarta columna deja cada
 * tarjeta en 330 px, por debajo del ancho para el que están dibujadas —foto
 * cuadrada a la izquierda y tres renglones al lado— y el nombre empieza a
 * partirse.
 *
 * La rejilla estira sus celdas, pero eso no basta: quien tiene que ocupar el
 * alto de la fila es la tarjeta de dentro, y por eso las que se usan aquí
 * (CaseRow, CityRow, NeedRow, FoundationCard) llevan `h-full`. Con alturas
 * naturales, una fila de tarjetas con filete y sombra termina en escalera y se
 * lee como una rejilla rota; las que tienen una acción al final la anclan abajo
 * para que el hueco caiga entre bloques y no dentro.
 */
export const cardGrid = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

/**
 * Columna de lectura. Un párrafo de "Qué ocurre" cruzando 1400 px son 200
 * caracteres por línea y el ojo pierde el renglón al volver; 68 deja la medida
 * de un libro. No se aplica a las tarjetas, que ya se limitan solas.
 */
export const readable = "max-w-[68ch]";
