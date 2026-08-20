import { progressPercent } from "./case-progress";

/**
 * Esquema del Chocó: silueta real del departamento y la proyección que sitúa
 * las ciudades sobre ella.
 *
 * Sustituye a un mapa de tiles a propósito. Un basemap descarga varios megas
 * por visita, necesita JavaScript y depende de un servicio externo; aquí el
 * mapa son dos kilobytes de SVG que se renderizan en el servidor. Con la señal
 * del Chocó y con el portal compartido por WhatsApp, esa diferencia se nota.
 *
 * Contorno derivado del Marco Geoestadístico Nacional del DANE (2018),
 * simplificado y fileteado: la costa deja de ser una sierra. Los vértices no
 * se sustituyen por el anillo del mosaico, para no descoser el empalme con
 * Colombia.
 */

/** Silueta del departamento en coordenadas del viewBox. */
export const CHOCO_PATH =
  "M197.6 109.0Q203.0 108.8 204.2 114.1L207.4 128.4Q211.4 146.4 201.2 161.8L189.2 180.0Q174.5 202.4 192.4 222.3L203.1 234.2Q211.8 243.9 224.8 245.0L225.9 245.1Q238.9 246.2 248.7 254.9L253.4 259.0Q266.7 270.9 275.0 286.7L292.8 320.2Q300.4 334.7 293.0 349.3L290.0 355.1Q285.0 365.1 274.9 360.4L274.0 360.0Q263.9 355.3 252.9 357.4L244.6 358.9Q232.1 361.3 236.8 373.1L237.2 374.1Q241.9 385.9 229.9 390.1L218.5 394.1Q206.8 398.2 206.6 410.6L206.6 411.7Q206.4 424.1 213.6 434.2L231.5 459.1Q240.4 471.6 241.3 486.9L241.5 490.8Q242.2 503.5 248.3 514.6L248.9 515.5Q255.0 526.6 267.6 527.5L281.0 528.5Q302.7 530.1 323.9 525.4L327.0 524.7Q346.9 520.3 355.3 538.8L359.0 546.8Q364.5 558.9 376.2 565.3L379.3 567.0Q388.8 572.2 384.2 582.0L383.8 582.8Q379.2 592.6 380.0 603.4L380.9 615.0Q381.6 625.0 389.3 631.3L390.0 631.9Q397.7 638.2 393.5 647.3L388.9 657.0Q382.2 671.3 370.4 681.9L369.5 682.7Q357.7 693.3 366.1 706.7L373.0 717.6Q387.2 740.1 379.4 765.5L375.3 778.9Q370.0 796.1 354.4 804.9L353.0 805.6Q337.4 814.4 333.4 831.9L330.3 844.9Q325.4 866.2 306.8 877.7L305.2 878.6Q286.6 890.1 296.1 909.8L300.4 918.8Q308.4 935.5 297.8 950.7L292.9 957.6Q286.3 967.1 275.0 969.3L274.0 969.5Q262.7 971.7 251.9 967.8L236.6 962.2Q225.5 958.2 217.2 949.7L216.6 949.0Q208.3 940.5 196.5 940.8L191.0 940.9Q175.1 941.3 162.8 931.2L160.2 929.0Q146.4 917.7 130.5 925.8L121.2 930.5Q111.9 935.3 110.6 945.7L110.4 946.5Q109.1 956.9 102.3 948.9L101.2 947.7Q94.0 939.2 94.8 928.1L95.1 923.3Q96.1 908.6 107.2 898.9L113.9 892.9Q130.4 878.5 131.2 856.6L132.5 820.4Q133.1 804.3 128.8 788.7L128.4 787.5Q124.1 771.9 122.7 755.8L117.7 697.1Q116.4 682.5 104.3 674.2L101.5 672.3Q91.2 665.3 96.0 653.8L96.4 652.8Q101.2 641.3 113.6 640.3L116.9 640.0Q131.4 638.8 139.4 626.6L140.1 625.5Q148.1 613.3 143.7 599.3L139.0 584.3Q132.0 562.1 117.9 543.6L107.9 530.6Q102.6 523.6 110.6 520.1L111.3 519.8Q119.3 516.3 118.6 507.6L118.1 500.4Q117.0 485.7 123.6 472.5L125.8 468.1Q134.0 451.9 122.3 438.0L112.1 425.9Q107.4 420.3 101.9 425.1L101.5 425.5Q96.0 430.3 93.1 423.6L87.6 411.1Q81.9 397.9 70.3 389.5L65.9 386.2Q57.7 380.3 62.0 371.2L62.4 370.4Q66.7 361.3 59.6 354.2L40.2 334.8Q22.5 317.2 31.2 293.8L37.2 277.7Q40.6 268.5 49.2 263.8L50.0 263.5Q58.6 258.8 57.2 249.1L55.8 239.3Q53.3 221.3 65.1 235.1L79.4 251.9Q85.4 259.0 92.7 253.3L93.3 252.8Q100.6 247.1 104.8 238.8L126.8 195.5Q134.2 181.0 150.1 177.5L151.4 177.2Q167.3 173.7 162.2 158.3L160.2 152.3Q153.7 132.6 144.5 114.0L132.4 89.6Q127.3 79.4 118.9 71.7L118.2 71.1Q109.8 63.4 115.1 53.3L119.4 45.1Q128.3 28.3 137.8 44.8L143.1 54.2Q149.5 65.3 160.9 71.3L161.8 71.7Q173.2 77.7 179.7 88.8L189.1 104.7Q191.8 109.3 197.2 109.1L197.6 109.0Z";

/** Marco que ocupa la silueta. Chocó es alto y estrecho: casi 2,4 a 1. */
export const LAND = { width: 420.3, height: 1000 };

type LabelType = { fontSize: number; letterSpacing: number };

/**
 * Tipografía de los rótulos del mapa, y el primer bloque del archivo porque de
 * ella cuelga todo lo demás: el margen del encuadre sale de medir el rótulo más
 * apretado, y el paso de la búsqueda de huecos, su alcance y lo que cuesta
 * cruzar de lado se miden en renglones, o sea en cuerpos.
 *
 * Vive aquí, junto a las cuentas que la usan, y no en el componente que la
 * dibuja: la colocación decide de qué lado cae cada nombre midiéndolo, y con el
 * cuerpo en un archivo y la medida en otro, el día que alguien suba una letra el
 * cálculo deja de valer sin avisar.
 *
 * ---------------------------------------------------------------------------
 * VEINTISÉIS UNIDADES, Y EL SUELO SON ONCE PÍXELES
 *
 * El cuerpo no se ve en unidades, se ve en píxeles, y cuántos son depende de la
 * caja que le den al mosaico: el encuadre se ajusta a ella, así que una unidad
 * vale `min(ancho / 720,3; alto / 1.000)` px y en /mapa manda siempre el alto
 * —el Chocó es dos veces y media más alto que ancho—. Medido en el navegador
 * sobre el `<svg>`: 0,2188 px por unidad en una ventana de 360×640,
 * 0,4228 en un teléfono de 390×844, 0,4480 en un escritorio de 1440×900 y 0,8308
 * en una tableta de 820×1180.
 *
 * El suelo son ONCE PÍXELES en el teléfono, y no es una apreciación: es el
 * cuerpo más pequeño con el que este portal ya escribe un dato en esa misma
 * pantalla. Medidos en el navegador, en /mapa a 390×844: la instrucción de la
 * leyenda —«El color es lo que falta. El rojo es lo que hay que bajar.»— 11 px,
 * el pie del marcador con los importes 11 px, los cinco tramos de la leyenda 12
 * px. El nombre del municipio es el contenido del tablero y la leyenda es su pie
 * de foto; un pie de foto no puede ser más grande que lo que explica.
 *
 * Y por eso el suelo del nombre está POR ENCIMA del del número, que son diez
 * píxeles (ver `PERCENT_LABEL`). Los diez del número son correctos porque un
 * dígito llena la caja alta: en Outfit 500 mide 0,71 del cuerpo, medido, así que
 * un número de 10 px trae 7,1 px de tinta. Una minúscula solo llena la equis,
 * 0,48 del cuerpo, así que un nombre de 10 px trae 4,8 px. Mismo cuerpo, dos
 * tercios de tinta: el nombre necesita un paso más.
 *
 * Once píxeles a 0,4228 son 26,0 unidades. A ese cuerpo el nombre sale a 5,7 px
 * en 360×640, 11,0 en 390×844, 11,7 en 1440×900 y 21,6 en la tableta.
 *
 * El peor caso que se diseña es el teléfono de 390×844. En una ventana de
 * 360×640 el mapa se queda en una caja de 320 × 219 px y ahí el nombre no se
 * puede arreglar con cuerpo: para once píxeles harían falta 50,3 unidades, y a
 * ese cuerpo "Bahía Solano" mide 323 sobre un departamento de 420,3 de ancho, o
 * sea el nombre tapando tres cuartos del Chocó. A ese tamaño lo que informa es el
 * color de la pieza y su punto, y los nombres están en /municipios.
 */
export const CITY_LABEL = { fontSize: 26, letterSpacing: 0.6 };
export const OCEAN_LABEL = { text: "Océano Pacífico", fontSize: 18, letterSpacing: 2.4 };
export const LAND_LABEL = { text: "Colombia", fontSize: 18, letterSpacing: 2.4 };

/**
 * El avance del pueblo, escrito al lado de su nombre.
 *
 * Diez píxeles reales es el suelo de un número, y a dieciséis unidades eso son
 * 0,625 px por unidad: lo pregunta el `@container` de la hoja de estilos sobre la
 * caja del propio mosaico (`.map-percent`), porque el cuerpo no dice nada sin
 * saber a qué escala se dibuja. Donde no llega, el municipio documentado se
 * distingue por su color y por su punto, que es lo que de verdad se lee a un
 * metro; el número exacto sigue en el nombre accesible del enlace y en la tarjeta
 * del municipio.
 *
 * No sube con el nombre, y son dieciséis por dos razones que van en la misma
 * dirección. Los diez píxeles son un SUELO, no una proporción: por debajo un
 * dígito deja de ser un dígito, y por encima solo se gana ancho —y el ancho lo
 * paga la colocación, porque el número entra en la medida del rótulo—. Y el
 * número anota el nombre: a dieciséis contra veintiséis se lee como lo que es,
 * la precisión de quien ya está tocando el mapa. Al revés —un número tan gordo
 * como el nombre— serían dos mapas, uno de letras y otro de cifras.
 *
 * El ancho se reserva siempre, aparezca o no: la colocación se resuelve una vez
 * en el servidor y el mismo dibujo se sirve a las dos pantallas, así que tiene
 * que caber en la que lo enseña. Y esconderlo no puede estrenar un choque —el
 * renglón se ancla en un punto y el número va al final, así que en los tres
 * anclajes la caja que queda cae DENTRO de la que se repartió—.
 *
 * El hueco separa el número del nombre sin gastar un signo, y entra en la
 * medida del rótulo como si fuera una letra más: es parte de lo que ocupa.
 */
export const PERCENT_LABEL = { fontSize: 16, letterSpacing: 0.4 };
export const PERCENT_GAP = 7;

/** Alto del renglón. Un pelo más que la tinta: lo más alto que escribe el mapa
 *  es un nombre con caja alta y acento a la vez —«Quibdó»—, y eso mide 0,81 del
 *  cuerpo, medido en Outfit 500. De estas cajas dependen las colisiones, así que
 *  sobrar es lo correcto. */
const lineHeight = ({ fontSize }: LabelType) => fontSize * 1.4;

/**
 * Halo de papel del rótulo, en unidades del dibujo.
 *
 * Es lo único que hace legible un nombre sobre el mosaico, y va en cuartos de
 * cuerpo y no en píxeles a propósito: no es una línea del dibujo —esas no
 * escalan, ver `NON_SCALING` en ChocoMap— sino parte de la letra, así que crece
 * con ella. Se pinta DEBAJO de la tinta (`paintOrder`), o sea que la mitad de
 * fuera es lo que despeja: 3,25 unidades, 1,4 px en un teléfono de 390×844.
 */
export const LABEL_HALO = CITY_LABEL.fontSize / 4;

/**
 * Margen a cada lado para las etiquetas de las ciudades. NO ES UN NÚMERO
 * REDONDO: sale de medir el peor rótulo, y hay que volver a medirlo cada vez que
 * se toque el cuerpo de la letra.
 *
 * Lo que pide el margen no es el nombre más largo, es el que peor colocado está:
 * "El Cantón del San Pablo", cuyo punto cae en x = 245,6 —casi la mitad de los
 * 420,3 del departamento—, así que ningún lado le presta mucha tierra. Su rótulo
 * entero, nombre más un porcentaje de tres cifras, mide 373,2 unidades; más el
 * hueco del punto (14) y la holgura (8), menos los 245,6 de tierra que tiene por
 * el oeste, pide 149,6. De ahí 150. Los nombres más largos del departamento —"El
 * Carmen de Atrato" y "San José del Palmar"— no lo piden: están pegados al borde
 * este, así que cruzan hacia dentro y les cabe sobre la propia tierra.
 *
 * Y no se pasa de ahí porque el margen se paga en dibujo. Todo lo que se reserva
 * ensancha el encuadre, y donde el ancho de la caja manda sobre el alto —el ancho
 * de la columna del mapa en escritorio está topado en 480 px— el departamento se
 * encoge en la misma proporción: mide 420,3 × 480 / encuadre, o sea 280 px con
 * este margen y 246 con cincuenta unidades más.
 *
 * Con 720,3 de encuadre eso no le pasa a ningún teléfono: medido en el navegador,
 * en 360×640, 390×844, 412×915, 430×932, 768×1024, 820×1180, 1440×900, 1728×1117
 * y 1920×1080 el mapa lo sigue limitando el alto, así que el Chocó se dibuja
 * exactamente igual de grande que con margen cero. El único sitio donde manda el
 * ancho es un escritorio muy alto, de 2560×1440. Y ese es el techo: diecisiete
 * unidades más y el teléfono de 412×915 empezaría a pagarlo, que es lo que no se
 * puede tocar.
 */
export const GUTTER = 150;

export const VIEW_BOX = {
  minX: -GUTTER,
  minY: 0,
  width: LAND.width + GUTTER * 2,
  height: LAND.height,
};

export const viewBoxAttr = `${VIEW_BOX.minX} ${VIEW_BOX.minY} ${VIEW_BOX.width} ${VIEW_BOX.height}`;

const BOUNDS = {
  minLng: -77.995626,
  maxLng: -75.893568,
  minLat: 3.824323,
  maxLat: 8.795889,
  cosLat: 0.993942,
};

const lngSpan = (BOUNDS.maxLng - BOUNDS.minLng) * BOUNDS.cosLat;
const latSpan = BOUNDS.maxLat - BOUNDS.minLat;

export function projectToMap(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - BOUNDS.minLng) * BOUNDS.cosLat * LAND.width) / lngSpan,
    y: ((BOUNDS.maxLat - lat) * LAND.height) / latSpan,
  };
}

/** Inversa de projectToMap, para fijar coordenadas tocando el esquema. */
export function unprojectFromMap(x: number, y: number): { lat: number; lng: number } {
  return {
    lat: BOUNDS.maxLat - (y * latSpan) / LAND.height,
    lng: BOUNDS.minLng + (x * lngSpan) / (LAND.width * BOUNDS.cosLat),
  };
}

export type MapPin = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  /** Avance del pueblo: de aquí salen el color de la forma y el número que se
   *  escribe junto al nombre. Sin el dato, la forma se pinta como no
   *  documentada, que es lo que de verdad sabemos. */
  progress?: { total: number; ratio: number };
};

/**
 * De qué lado del punto cae el nombre. `start` es hacia el este, `end` hacia el
 * oeste y `middle` es centrado justo encima o debajo del punto, que es lo que
 * salva la zona apretada del San Juan sin trazar una guía larguísima.
 */
export type LabelAnchor = "start" | "middle" | "end";

export type PlacedPin = MapPin & {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
};

const LABEL_GAP = 14;
const MIN_X = -GUTTER;
const MAX_X = LAND.width + GUTTER;

/**
 * Radio del punto de una ciudad con su filete de papel, en unidades del
 * viewBox. Es lo que un rótulo ajeno no puede pisar: un nombre encima de un
 * punto que no es el suyo miente sobre qué pueblo está nombrando.
 */
const DOT_REACH = 10;

/**
 * Cuánto se puede alejar un rótulo de la latitud de su pueblo, y cada cuánto se
 * prueba una altura.
 *
 * LOS DOS SE MIDEN EN RENGLONES, y no en unidades del dibujo, porque lo que se
 * está repartiendo son renglones apilados: en unidades fijas, subir el cuerpo
 * haría que en la misma columna cupieran menos nombres sin que nadie lo hubiera
 * decidido. Un cuarto de renglón de paso —más fino solo afinaría lo que no se ve
 * y multiplicaría las pruebas—, y cinco renglones y medio de alcance, que da para
 * apilar unos cinco rótulos alrededor de una misma latitud: el nudo que forman
 * los municipios pequeños del San Juan cuando estén los treinta documentados.
 *
 * Y se nota. Medido con los treinta documentados, en renglones no se toca ningún
 * nombre y trece se posan a menos de diez unidades del punto de un vecino; con
 * estos dos números clavados en unidades, un par de nombres se tocan y son
 * diecisiete.
 */
const LABEL_STEP = lineHeight(CITY_LABEL) / 4;
const LABEL_REACH = lineHeight(CITY_LABEL) * 5.5;

/**
 * Lo que cuesta mandar un rótulo al margen contrario, medido en las mismas
 * unidades que el desvío vertical.
 *
 * Cruzar de lado obliga a la guía a atravesar el departamento entero, así que
 * vale exactamente lo que llegar al final del alcance vertical: cualquier altura
 * del propio margen sale más barata o igual, y solo cuando esa columna se agota
 * se cruza. Se paga cuando no queda otra —"El Carmen de Atrato" no cabe por el
 * este— y no por gusto.
 */
const SIDE_COST = LABEL_REACH;

/**
 * Lo que cuesta poner el nombre centrado justo encima o debajo de su punto, en
 * vez de a un lado.
 *
 * Es la tercera familia de sitios y existe para el nudo del San Juan, donde una
 * docena de municipios diminutos se apilan en doscientas unidades de latitud.
 * Ahí el margen se agota, y la alternativa era una guía de cien unidades
 * cruzando tres municipios para llegar a un hueco: el nombre pegado a su punto
 * dice lo mismo sin trazar nada. Cuesta un poco más que quedarse en el margen a
 * su misma altura, para que los dos carriles del dibujo sigan siendo lo normal y
 * esto sea la excepción de la zona apretada.
 */
const MIDDLE_COST = 12;

/**
 * Y la cuarta libertad: separar el nombre de su punto hacia el margen, con la
 * guía siguiéndolo.
 *
 * Es lo que le da al mapa una columna de nombres cuando la zona se llena, que es
 * como resuelve esto un mapa impreso. Sin ella, y con los treinta documentados,
 * a cuatro pueblos no les quedaba más sitio que posar su nombre sobre el punto de
 * un vecino. Cuesta lo que se aparte, así que a nadie le compensa hasta que no
 * queda hueco cerca.
 */
const OUT_STEPS = [0, 34, 68, 102];

/**
 * Lo que avanza cada letra, en fracción del cuerpo, por clases de anchura.
 *
 * Medido en el navegador sobre la familia del portal —Outfit, peso 500, que es
 * con la que se dibujan estos rótulos— y redondeado SIEMPRE hacia arriba dentro
 * de cada clase, para que la estimación no pueda quedarse corta.
 *
 * Sustituye a un 0,58 plano para todas las letras, y no es afinar por afinar:
 * con el número plano, «El Litoral del San Juan» se reservaba 281 unidades para
 * ocupar 211, un 33 % de más. Ese 33 % lo pagaba la colocación, porque un sitio
 * que en realidad servía se descartaba por no caber, y de ahí salían los últimos
 * rótulos pisando el punto de un vecino cuando el mapa se llena. Ahora el error
 * es del 5 % y sigue siendo por exceso.
 *
 * Se estima y no se mide porque esto se calcula en el servidor, donde no hay
 * caja de texto que preguntar. SI CAMBIA LA FAMILIA HAY QUE VOLVER A MEDIR, y la
 * receta es esta, en la consola sobre cualquier mapa del portal:
 *
 *   const p = document.createElementNS('http://www.w3.org/2000/svg', 'text');
 *   p.setAttribute('font-size', '20'); p.setAttribute('font-weight', '500');
 *   document.querySelector('svg').append(p);
 *   const w = (s) => { p.textContent = s; return p.getComputedTextLength(); };
 *   [...'abc…'].map((c) => [c, (w('nn' + c + 'nn') - w('nnnn')) / 20]);
 */
const ADVANCE: [string, number][] = [
  [" ", 0.2],
  ["iíljIÍ", 0.27],
  ["tfr", 0.41],
  ["szckJvxyuTúeé", 0.53],
  ["hnLñoSógFabdpqYáEZÉP", 0.6],
  ["BVRKXCUÚAÁHNÑD", 0.74],
];

/** Las letras que no están en la tabla —una ese larga, un dígito, un guion— se
 *  cobran como la clase más ancha: sobrar es lo correcto aquí. */
const WIDEST = 0.92;

/**
 * Cuánto mide un rótulo, en unidades del viewBox.
 *
 * Se estima por exceso a propósito: de esta cuenta dependen los choques, y un
 * rótulo que se creyera más estrecho de lo que es se colocaría encima de otro.
 */
function labelWidth(text: string, { fontSize, letterSpacing }: LabelType): number {
  let advance = 0;
  for (const letter of text) {
    advance += ADVANCE.find(([set]) => set.includes(letter))?.[1] ?? WIDEST;
  }
  return advance * fontSize + letterSpacing * text.length;
}

/**
 * El avance que se escribe junto al nombre del pueblo, o nada.
 *
 * ES LO CUBIERTO —la misma cuenta y la misma palabra que la tarjeta del
 * municipio, «15 % cubierto»— y no lo que falta. La forma se colorea con lo que
 * FALTA, que es el inverso de esto (`needsTier`), y justo por eso los dos van
 * en la misma dirección y no se pueden contradecir: cuanto más alto el número,
 * menos rojo queda. Al revés sería la trampa —un 85 % enorme al lado de un
 * pueblo en el que apenas se ha empezado, y la misma pantalla diciendo 15 en la
 * tarjeta y 85 en el mapa—.
 *
 * Sin meta, o sin documentar, no se escribe nada. Un `0 %` sobre un pueblo al
 * que nadie ha llegado es un dato inventado: no es que no se haya cubierto, es
 * que todavía no hay nada pedido. Misma regla que la barra de la tarjeta.
 */
export function labelPercent(pin: Pick<MapPin, "progress">): string | null {
  if (!pin.progress || pin.progress.total === 0) return null;
  return `${progressPercent(pin.progress.ratio)} %`;
}

/**
 * Lo que ocupa el rótulo entero de un pueblo: su nombre y, si hay avance que
 * contar, el número que va detrás.
 *
 * El número se escribe DENTRO del mismo rótulo, así que tiene que entrar en esta
 * cuenta y no solo en el dibujo: un rótulo que se creyera del ancho de su nombre
 * buscaría hueco para menos de lo que ocupa, y los sesenta y tantos puntos del
 * avance acabarían encima del vecino. Es la misma razón por la que el ancho de
 * las letras se estima por exceso.
 */
function pinLabelWidth(pin: MapPin): number {
  const percent = labelPercent(pin);
  return (
    labelWidth(pin.name, CITY_LABEL) +
    (percent === null ? 0 : PERCENT_GAP + labelWidth(percent, PERCENT_LABEL))
  );
}

/**
 * Holgura alrededor de la tinta, en unidades del dibujo: el halo de papel del
 * rótulo asoma 3,25 unidades por fuera de la letra y el ancho del nombre va
 * estimado, así que la caja se ensancha por las dos razones a la vez.
 *
 * No sube con el cuerpo aunque el halo suba: es un despeje del dibujo, como el
 * hueco del punto o el alcance del propio punto. Probado con los treinta
 * documentados, ponerlo en cuatro décimas de cuerpo empeora el reparto —de cuatro
 * cajas que se rozan a nueve, de ninguna tinta que se toque a una, y de trece
 * nombres cerca de un punto ajeno a diecinueve—: la holgura que sobra le quita
 * huecos buenos a la colocación.
 */
const LABEL_PAD = 8;

/** Cuánto sube o baja el nombre centrado respecto a su punto: el radio del punto
 *  con su halo, la mitad del renglón y un aire. Solo existen estas dos alturas,
 *  así que un nombre centrado nunca necesita guía. */
export const MIDDLE_RISE = DOT_REACH + lineHeight(CITY_LABEL) / 2 + 6;

/**
 * La guía que une un punto con su nombre, o null cuando el nombre está pegado a
 * él y se entiende sin trazar nada.
 *
 * Vive aquí y no en el componente porque la decisión es de la colocación: solo
 * ella sabe si ese rótulo se ha tenido que apartar, y de cuánto. El extremo cae
 * en el propio rótulo a propósito: los nombres se pintan después y con halo de
 * papel, así que le tapan la punta y la guía no le entra en la tinta.
 */
export function leaderFor(pin: PlacedPin): { x1: number; y1: number; x2: number; y2: number } | null {
  const nudged =
    pin.anchor === "middle"
      ? Math.abs(pin.labelY - pin.y) > MIDDLE_RISE + 2
      : Math.abs(pin.labelY - pin.y) > 2 || Math.abs(Math.abs(pin.labelX - pin.x) - LABEL_GAP) > 2;

  return nudged ? { x1: pin.x, y1: pin.y, x2: pin.labelX, y2: pin.labelY } : null;
}

/** Lo que un rótulo ocupa del mapa, en unidades del viewBox. */
type Box = { x1: number; y1: number; x2: number; y2: number };

/** El renglón se dibuja media caja alta por debajo del punto de anclaje, que es
 *  lo que deja el bloque de mayúsculas centrado en la latitud de la ciudad; por
 *  eso la caja se puede tomar centrada en `labelY`. La caja alta de Outfit 500
 *  mide 0,70 del cuerpo, medida en el navegador, así que media son 0,35. */
export const LABEL_BASELINE = CITY_LABEL.fontSize * 0.35;

const overlaps = (a: Box, b: Box) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

const overlapArea = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) *
  Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));

const insideFrame = (box: Box) =>
  box.x1 >= VIEW_BOX.minX &&
  box.x2 <= VIEW_BOX.minX + VIEW_BOX.width &&
  box.y1 >= VIEW_BOX.minY &&
  box.y2 <= VIEW_BOX.minY + VIEW_BOX.height;

/**
 * La caja de un rótulo puesto a esa altura y con ese anclaje.
 *
 * Es la única cuenta de geometría de rótulo que hay en el archivo: la usan la
 * colocación, el rótulo del océano y `cityBox`. Cuando la caja la calculaba cada
 * uno por su cuenta, la colocación resolvía choques con una medida y el océano
 * los buscaba con otra.
 */
function labelBox(labelX: number, width: number, anchor: LabelAnchor, labelY: number): Box {
  const half = lineHeight(CITY_LABEL) / 2;
  const left = anchor === "end" ? labelX - width : anchor === "start" ? labelX : labelX - width / 2;

  return {
    x1: left - LABEL_PAD,
    x2: left + width + LABEL_PAD,
    y1: labelY - half - LABEL_PAD,
    y2: labelY + half + LABEL_PAD,
  };
}

function cityBox(pin: PlacedPin): Box {
  return labelBox(pin.labelX, pinLabelWidth(pin), pin.anchor, pin.labelY);
}

/**
 * La caja del nombre de una ciudad ya colocada, para que el mapa la pueda hacer
 * tocable.
 *
 * En un teléfono el nombre es el blanco más grande y más fácil que tiene un
 * municipio: «Quibdó» mide unos 30 × 10 px, y la forma de Bahía Solano, 21 px de
 * ancho en su parte más gruesa. Quien va a abrir un pueblo apunta a su nombre, no
 * a un polígono de veintiún píxeles.
 *
 * ES LA CAJA DE LA TINTA Y NO LA DE LA COLOCACIÓN, y la diferencia costaba seis
 * municipios. `cityBox` es la caja con la que se resuelven los choques: lleva
 * `LABEL_PAD` de holgura a cada lado y un renglón entero de alto —para «Istmina
 * 33 %», 85 × 19 px en un teléfono contra los 63 × 10 px que ocupa la palabra—.
 * Como estas piezas se pintan al final de la capa de frente, ese sobrante recibe
 * el cursor antes que la forma que tiene debajo: medido en el navegador
 * señalando el punto más hondo de cada uno de los treinta, seis municipios
 * —Condoto, el Río Iró, Tadó, Unión Panamericana, Lloró y el Carmen de Atrato—
 * abrían Istmina o Quibdó en vez de responder ellos.
 *
 * Así que el asidero es la tinta más su halo, que es exactamente lo que se ve:
 * el ancho del rótulo, el alto de la caja alta con acento (0,81 del cuerpo, la
 * misma medida que usa `lineHeight`) y el halo asomando por los cuatro lados.
 * Sigue siendo un blanco cómodo —63 × 15 px para «Istmina 33 %»— y ya no
 * reclama tierra donde no hay ninguna letra escrita.
 */
export function labelHitBox(pin: PlacedPin): { x: number; y: number; width: number; height: number } {
  const width = pinLabelWidth(pin) + LABEL_HALO;
  const height = CITY_LABEL.fontSize * 0.81 + LABEL_HALO;
  const left =
    pin.anchor === "end"
      ? pin.labelX - width + LABEL_HALO / 2
      : pin.anchor === "start"
        ? pin.labelX - LABEL_HALO / 2
        : pin.labelX - width / 2;

  return { x: left, y: pin.labelY - height / 2, width, height };
}

/**
 * Los vértices SOBRE la curva de un trazado del mapa.
 *
 * El mosaico ya no es un polígono de rectas: los lindes van en cubics de
 * Catmull–Rom (`C`). De cada cubic solo cuenta el punto final —el que está
 * sobre la curva—. Los dos de control se ignoran: si entrasen, el centro de
 * una forma y el sitio de un nombre se irían hacia fuera, donde el cubic se
 * hincha.
 */
export function polygonOf(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const match of d.matchAll(/([MLCQ])([^MLCQZ]*)/gi)) {
    const cmd = match[1].toUpperCase();
    const nums = [...match[2].matchAll(/-?[\d.]+/g)].map(Number);
    if (cmd === "M" || cmd === "L") {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        points.push({ x: nums[i], y: nums[i + 1] });
      }
    } else if (cmd === "C") {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        points.push({ x: nums[i + 4], y: nums[i + 5] });
      }
    } else if (cmd === "Q") {
      for (let i = 0; i + 3 < nums.length; i += 4) {
        points.push({ x: nums[i + 2], y: nums[i + 3] });
      }
    }
  }
  return points;
}

/** Área de un trazado del mapa, en unidades del viewBox al cuadrado. Es lo que
 *  permite comparar una pieza con el rótulo que quiere llevar dentro. */
function polygonArea(d: string): number {
  const points = polygonOf(d);
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * En cuántas franjas horizontales se corta una forma para buscarle sitio al
 * nombre. Un número fijo y no un paso: entre el Río Iró y Riosucio hay siete
 * veces de alto (35 unidades contra 247), y con un paso fijo el grande costaría
 * siete veces más que el pequeño para afinar lo que no se ve. Con veinticuatro,
 * la altura del nombre queda clavada a un veinticuatroavo de la figura, que en
 * la más pequeña es una unidad y media.
 */
const SPOT_BANDS = 24;

/**
 * Los tramos interiores de una forma, franja por franja y de más ancho a más
 * estrecho. Cada uno es un sitio donde el nombre cae DENTRO del municipio.
 *
 * Sale de cortar el polígono a la altura de cada franja: comparar los extremos
 * de cada arista con `>` —y no un signo— es lo que hace que una arista
 * horizontal no cuente y que un vértice justo sobre la línea sume dos cortes en
 * el mismo sitio en vez de uno. Los cortes siguen saliendo pares, que es de lo
 * único que depende saber qué tramo es interior y cuál es aire.
 */
function insideBands(d: string): { x: number; y: number; span: number }[] {
  const points = polygonOf(d);
  const top = Math.min(...points.map((point) => point.y));
  const bottom = Math.max(...points.map((point) => point.y));
  const height = (bottom - top) / SPOT_BANDS;
  const bands: { x: number; y: number; span: number }[] = [];

  for (let index = 0; index < SPOT_BANDS; index += 1) {
    const y = top + height * (index + 0.5);

    const cuts: number[] = [];
    for (let k = 0; k < points.length; k += 1) {
      const a = points[k];
      const b = points[(k + 1) % points.length];
      if ((a.y > y) === (b.y > y)) continue;
      cuts.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
    }

    cuts.sort((left, right) => left - right);
    for (let k = 0; k + 1 < cuts.length; k += 2) {
      bands.push({ x: (cuts[k] + cuts[k + 1]) / 2, y, span: cuts[k + 1] - cuts[k] });
    }
  }

  return bands.sort((a, b) => b.span - a.span);
}

/**
 * Dónde se escribe el nombre de un municipio del mosaico.
 *
 * De salida, el centro del tramo interior más ancho, y NO el centro de la
 * figura: la media de los vértices se sale de la forma en cuatro de los treinta
 * municipios —Quibdó, Istmina, Nuquí y el Medio San Juan—, porque el contorno
 * hace curva o porque trae la costa llena de puntos y el interior con cuatro. Un
 * nombre que aparece sobre el vecino no está diciendo de quién es la forma que
 * se acaba de encender: está mintiendo. Por franjas cae dentro por construcción
 * —comprobado en los treinta— y además en la parte más gorda, que es donde le
 * cabe.
 *
 * Y de ahí se aparta por una sola razón: los rótulos de los documentados se
 * pintan después, así que un nombre debajo de uno de ellos sale cortado por su
 * halo de papel. Con «Unión Panamericana», que mide veintidós unidades de ancho
 * y tiene el rótulo de Istmina justo al lado, las dos palabras salían una encima
 * de la otra. Se prueba otra franja de la propia forma; si el rótulo tapa la
 * forma entera —le pasa a los municipios pequeños del San Juan— el nombre se va
 * un renglón arriba o abajo, y hasta dos, buscando otra vez por franjas: se sale
 * de la pieza, que a cambio de leerse es un precio justo, porque está encendida
 * debajo y el nombre sigue centrado en una de sus columnas.
 *
 * Dos renglones y no uno porque un renglón no llega. Con los tres municipios de
 * los datos de muestra documentados y el cuerpo actual, «Lloró» cae bajo el
 * rótulo de Quibdó y «Tadó» y «Unión Panamericana» bajo el de Istmina; a un
 * renglón se libran los dos primeros y a dos se libran los veintisiete. Lo que se
 * aparta el que peor lo tiene son 104,8 unidades, 44 px en un teléfono de 390 px,
 * y es justo «Unión Panamericana»: su forma mide veintidós unidades y su nombre
 * trescientas y pico, así que ese nombre nunca estuvo dentro de su pieza.
 *
 * ---------------------------------------------------------------------------
 * Y HAY UN SEGUNDO CHOQUE, QUE ES CON LA PROPIA PIEZA
 *
 * El nombre se dibuja con halo de papel y encima de la forma que nombra, así que
 * en las piezas pequeñas TAPA el color que el resalte viene a enseñar. Medido en
 * el navegador pintando una pieza de un color que no está en la paleta y
 * contándole los píxeles con el rótulo puesto y quitado, a 390×844: Cértegui
 * pasaba de +4,7 % de superficie al pasar el cursor a −57,7 %, y el Medio Atrato
 * de +4,6 % a −34,2 %. O sea que resaltar esos municipios les quitaba más color
 * del que les devolvía, y el culpable no era el trazo —quitarlo cambia menos del
 * 1 %, porque `paint-order` ya lo deja entero por fuera— sino su propio nombre.
 *
 * De ahí la primera pregunta de la función: si la caja del rótulo mide más de la
 * mitad de la pieza, DENTRO no es un sitio. «Cértegui» ocupa 3,1 veces su
 * municipio y «Alto Baudó» 0,87 veces el suyo; a esos el nombre se les pone al
 * lado, a la latitud de su franja más ancha, que es lo que menos lo aparta de la
 * pieza sin posarse encima. Y no hace falta trazar guía: la pieza está encendida
 * al mismo tiempo y el nombre le queda pegado.
 */
export function shapeLabelSpot(
  shape: { d: string; name: string },
  placed: PlacedPin[],
): { x: number; y: number } {
  const bands = insideBands(shape.d);
  const width = labelWidth(shape.name, CITY_LABEL);
  const taken = placed.map(cityBox);
  const clear = (x: number, y: number) =>
    !taken.some((box) => overlaps(box, labelBox(x, width, "middle", y)));

  const widest = bands[0];
  const line = lineHeight(CITY_LABEL) + LABEL_PAD * 2;

  // Si el rótulo ocupa más de la mitad de la pieza, DENTRO no es un sitio: el
  // nombre taparía justo el color que el resalte viene a enseñar.
  if (labelWidth(shape.name, CITY_LABEL) * lineHeight(CITY_LABEL) <= polygonArea(shape.d) / 2) {
    if (clear(widest.x, widest.y)) return widest;
    const free = bands.find((band) => clear(band.x, band.y));
    if (free) return free;
  }

  // Al lado, a la latitud de la franja más ancha: es lo que menos aparta el
  // nombre de su pieza sin posarse encima de ella.
  const half = width / 2 + LABEL_PAD;
  for (const side of [-1, 1]) {
    const x = widest.x + side * (widest.span / 2 + half);
    const box = labelBox(x, width, "middle", widest.y);
    if (insideFrame(box) && clear(x, widest.y)) return { x, y: widest.y };
  }

  // Y si tampoco, arriba o abajo de la forma entera.
  const top = Math.min(...bands.map((band) => band.y));
  const bottom = Math.max(...bands.map((band) => band.y));
  for (const y of [top - line, bottom + line]) {
    if (insideFrame(labelBox(widest.x, width, "middle", y)) && clear(widest.x, y)) {
      return { x: widest.x, y };
    }
  }

  for (const dy of [-line, line, -line * 2, line * 2]) {
    const moved = bands.find((band) => clear(band.x, band.y + dy));
    if (moved) return { x: moved.x, y: moved.y + dy };
  }

  return widest;
}

/** Alturas que se prueban en los márgenes, de la propia hacia fuera y arriba
 *  antes que abajo. */
const HEIGHTS = (() => {
  const steps = [0];
  for (let step = LABEL_STEP; step <= LABEL_REACH; step += LABEL_STEP) steps.push(-step, step);
  return steps;
})();

type Slot = {
  anchor: LabelAnchor;
  labelX: number;
  labelY: number;
  box: Box;
  cost: number;
  onDot: boolean;
};

/**
 * Sitúa cada ciudad y coloca su rótulo donde no pise a nadie.
 *
 * ES UN COLOCADOR, NO UNA CORRECCIÓN. Antes se ponía cada rótulo al lado de su
 * punto y luego se empujaban hacia abajo los de la misma columna que se
 * solapaban, y eso se rompía por tres sitios a la vez: dos rótulos de columnas
 * distintas —uno mirando al este, otro volteado al oeste— podían caer en la
 * misma banda y nadie los miraba; el empujón solo iba hacia abajo, así que el
 * último de una cola se salía del marco por el pie (con los treinta
 * documentados, "Sipí" acababa 18 unidades fuera); y ningún rótulo miraba los
 * puntos de las demás ciudades, así que "Atrato" se posaba sobre el punto del
 * vecino. Con cuatro municipios documentados eso casi no se veía. Con treinta se
 * ve todo, y van a entrar más.
 *
 * Ahora cada pueblo trae una lista de sitios posibles —los dos márgenes, y
 * dentro de cada uno las alturas de `HEIGHTS`— ordenada por lo que cuesta cada
 * uno: quedarse a su latitud es gratis, alejarse cuesta lo que se aleje, y
 * cruzarse al margen contrario cuesta más que cualquier desvío vertical. Se
 * reparten los sitios de una pasada, y los pueblos con menos sitios libres
 * eligen primero: el que está encajonado se queda sin nada si va detrás, y el
 * que tiene el margen entero para él encuentra hueco igual.
 *
 * El resultado no depende del orden en que lleguen las ciudades ni de la hora:
 * todo sale de las coordenadas y de los nombres, así que el servidor y el
 * navegador dibujan el mismo mapa.
 */
export function placePins(pins: MapPin[]): PlacedPin[] {
  const seats = pins.map((pin) => {
    const { x, y } = projectToMap(pin.lat, pin.lng);
    return { pin, x, y, width: pinLabelWidth(pin), near: x < LAND.width / 2 };
  });

  const dots = seats.map(({ x, y }) => ({
    x1: x - DOT_REACH,
    x2: x + DOT_REACH,
    y1: y - DOT_REACH,
    y2: y + DOT_REACH,
  }));

  const slots = seats.map((seat, index) => {
    const list: Slot[] = [];
    // El punto propio queda pegado al rótulo por definición; los ajenos no.
    const add = (anchor: LabelAnchor, labelX: number, labelY: number, cost: number) => {
      const box = labelBox(labelX, seat.width, anchor, labelY);
      if (!insideFrame(box)) return;
      list.push({
        anchor,
        labelX,
        labelY,
        box,
        cost,
        onDot: dots.some((dot, other) => other !== index && overlaps(box, dot)),
      });
    };

    const near: LabelAnchor = seat.near ? "end" : "start";
    const far: LabelAnchor = seat.near ? "start" : "end";
    const reach = (anchor: LabelAnchor, out: number) =>
      anchor === "end" ? seat.x - LABEL_GAP - out : seat.x + LABEL_GAP + out;

    for (const dy of HEIGHTS) {
      for (const out of OUT_STEPS) {
        add(near, reach(near, out), seat.y + dy, Math.abs(dy) + out);
        add(far, reach(far, out), seat.y + dy, Math.abs(dy) + out + SIDE_COST);
      }
      // Centrado nunca puede quedar a la altura de su propio punto: la primera
      // altura posible es justo encima o justo debajo, y de ahí hacia fuera.
      for (const sign of [-1, 1]) {
        const rise = MIDDLE_RISE + Math.abs(dy);
        add("middle", seat.x, seat.y + sign * rise, rise + MIDDLE_COST);
      }
    }

    // Un nombre tan largo que no cabe en ningún sitio se queda a la latitud de
    // su pueblo y asomando: un rótulo de menos sería un municipio sin nombre.
    if (list.length === 0) {
      const labelX = reach(near, 0);
      list.push({
        anchor: near,
        labelX,
        labelY: seat.y,
        box: labelBox(labelX, seat.width, near, seat.y),
        cost: 0,
        onDot: false,
      });
    }

    return list.sort((a, b) => Number(a.onDot) - Number(b.onDot) || a.cost - b.cost);
  });

  // Los encajonados eligen primero. El desempate es por latitud y luego por el
  // orden de llegada, para que el reparto no dependa de nada más.
  const turns = seats
    .map((seat, index) => ({ index, free: slots[index].filter((slot) => !slot.onDot).length, y: seat.y }))
    .sort((a, b) => a.free - b.free || a.y - b.y || a.index - b.index)
    .map((turn) => turn.index);

  const picked: (Slot | undefined)[] = new Array(seats.length);

  /** El mejor sitio para este pueblo contando con lo que ya han cogido los
   *  demás. Sin ningún hueco limpio gana el que menos pisa: roza, pero no
   *  esconde un nombre. */
  const bestFor = (index: number) => {
    const others = picked.filter((slot, other) => slot && other !== index).map((slot) => slot!.box);
    const list = slots[index];
    const clean = list.find((slot) => !others.some((box) => overlaps(box, slot.box)));
    if (clean) return clean;

    const spillOf = (slot: Slot) => others.reduce((sum, box) => sum + overlapArea(box, slot.box), 0);
    return list.reduce((best, slot) => (spillOf(slot) < spillOf(best) ? slot : best), list[0]);
  };

  for (const index of turns) picked[index] = bestFor(index);

  // Y una segunda vuelta, que es la que arregla lo que el reparto de una pasada
  // no puede ver: el primero en elegir se queda con el hueco que era la única
  // salida del último. Cada pueblo suelta su sitio y vuelve a elegir contando
  // con los demás ya colocados; en cuanto una vuelta no mueve a nadie, se para.
  // Con los treinta documentados converge en tres.
  for (let round = 0; round < 6; round += 1) {
    let moved = false;
    for (const index of turns) {
      const before = picked[index];
      const after = bestFor(index);
      if (after !== before) {
        picked[index] = after;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return seats.map((seat, index) => {
    const { anchor, labelX, labelY } = picked[index]!;
    return { ...seat.pin, x: seat.x, y: seat.y, labelX, labelY, anchor };
  });
}

/** Resolución de la tabla de la costa. El contorno viene simplificado a 170
 *  puntos sobre mil unidades de alto, así que muestrear más fino no descubriría
 *  ninguna entrada de mar que el propio dibujo no tenga ya redondeada. */
const COAST_STEP = 4;

/**
 * Borde oeste del dibujo a cada altura, tabulado una vez al cargar el módulo.
 *
 * El rótulo del océano tiene que caer en el agua, y dónde acaba el agua lo dice
 * la silueta y nada más. `CHOCO_PATH` pasa por cubics, y `polygonOf` entrega
 * los puntos SOBRE la curva: cortar esas cuerdas basta para colocar un
 * rótulo. Se tabula porque la búsqueda pregunta cientos de veces y el mapa se
 * rehace en cada visita.
 */
const COAST = (() => {
  const points = polygonOf(CHOCO_PATH);
  const west: number[] = [];
  const east: number[] = [];
  for (let index = 0; index * COAST_STEP <= LAND.height; index += 1) {
    const y = index * COAST_STEP;
    let w = Infinity;
    let e = -Infinity;

    for (let k = 0; k < points.length; k += 1) {
      const a = points[k];
      const b = points[(k + 1) % points.length];
      if (a.y === b.y || (a.y - y) * (b.y - y) > 0) continue;
      const x = a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
      w = Math.min(w, x);
      e = Math.max(e, x);
    }

    west.push(w);
    east.push(e);
  }
  return { west, east };
})();

/** Dónde empieza la tierra a esa altura. Infinity donde no hay dibujo. */
function westEdgeAt(y: number): number {
  const index = Math.round(y / COAST_STEP);
  return COAST.west[Math.min(Math.max(index, 0), COAST.west.length - 1)] ?? Infinity;
}

/** Dónde acaba el departamento hacia el este. -Infinity donde no hay dibujo. */
function eastEdgeAt(y: number): number {
  const index = Math.round(y / COAST_STEP);
  return COAST.east[Math.min(Math.max(index, 0), COAST.east.length - 1)] ?? -Infinity;
}

/**
 * Tramo de latitud en el que el vecino del oeste es de verdad el Pacífico: de
 * Punta Ardita, donde la costa del departamento toca Panamá, a la boca del San
 * Juan, donde empieza el Valle del Cauca. Más al norte lo que hay al oeste del
 * dibujo es el Darién, y un rótulo del Pacífico ahí estaría nombrando otra cosa.
 */
const PACIFIC = { northLat: 7.22, southLat: 4.2 };

/** Diferencias de holgura menores que esto no son motivo para mover el rótulo
 *  doscientas unidades, así que empatan y decide la altura. */
const CLEARANCE_STEP = 5;

/** Cada cuánto se prueba una altura. Cinco unidades son medio punto de pantalla
 *  en el tamaño más grande en que se ve el mapa: afinar más solo añadiría vueltas
 *  al bucle para mover el rótulo lo que no se ve. */
const BAND_STEP = 5;

/**
 * Dónde cabe el rótulo del océano, o null si no cabe en ninguna parte.
 *
 * Se coloca después de los nombres de los municipios y les cede el sitio, nunca
 * al revés: los nombres son el contenido del mapa y el del mar es atmósfera, el
 * mismo orden que en un mapa impreso.
 *
 * Antes estaba clavado a media altura del encuadre, y ahí compartía carril con
 * las etiquetas del oeste —que salen de la costa hacia el mar, porque el mar es
 * lo que tienen al lado— así que "BAHÍA SOLANO" lo cruzaba. El conflicto no era
 * de ese nombre sino del carril: con Juradó, Nuquí o el Bajo Baudó documentados
 * volvería a pasar, y con otro nombre cada vez.
 *
 * Así que la altura se busca. Recorre las alturas posibles del tramo de costa,
 * descuenta del agua lo que ocupan la tierra y las etiquetas que cruzan la
 * franja, y se queda con el hueco más ancho de todos; si dos empatan gana el de
 * media costa. El rótulo va girado, así que ocupa una franja estrecha y larga y
 * cualquier etiqueta que la toque la invalida entera.
 */
export function placeOceanLabel(placed: PlacedPin[]): { x: number; y: number } | null {
  const half = labelWidth(OCEAN_LABEL.text, OCEAN_LABEL) / 2;
  const thickness = lineHeight(OCEAN_LABEL);

  const north = projectToMap(PACIFIC.northLat, 0).y;
  const south = projectToMap(PACIFIC.southLat, 0).y;
  const middle = (north + south) / 2;

  const boxes = placed.map(cityBox);
  let best: { x: number; y: number; clearance: number } | null = null;

  for (let y = north + half; y <= south - half; y += BAND_STEP) {
    const top = y - half;
    const bottom = y + half;

    let coast = westEdgeAt(bottom);
    for (let sample = top; sample < bottom; sample += COAST_STEP) {
      coast = Math.min(coast, westEdgeAt(sample));
    }
    if (!Number.isFinite(coast)) continue;

    // Lo que queda del agua entre el filo del encuadre y la costa una vez
    // apartadas las etiquetas que cruzan la franja.
    const shore = coast - LABEL_GAP;
    const taken = boxes
      .filter((box) => box.y1 < bottom && box.y2 > top)
      .map((box) => [Math.max(box.x1, MIN_X), Math.min(box.x2, shore)] as const)
      .filter(([x1, x2]) => x2 > x1)
      .sort((a, b) => a[0] - b[0]);

    const gaps: [number, number][] = [];
    let edge = MIN_X;
    for (const [x1, x2] of taken) {
      if (x1 > edge) gaps.push([edge, x1]);
      edge = Math.max(edge, x2);
    }
    if (edge < shore) gaps.push([edge, shore]);

    for (const [x1, x2] of gaps) {
      const clearance = (x2 - x1 - thickness) / 2;
      if (clearance < 0) continue;

      const step = Math.round(clearance / CLEARANCE_STEP);
      const bestStep = best ? Math.round(best.clearance / CLEARANCE_STEP) : -1;
      if (
        step > bestStep ||
        (step === bestStep && best && Math.abs(y - middle) < Math.abs(best.y - middle))
      ) {
        best = { x: (x1 + x2) / 2, y, clearance };
      }
    }
  }

  return best && { x: best.x, y: best.y };
}

/**
 * El mismo oficio que el rótulo del Pacífico, al otro lado: nombra lo que no
 * es dato. El este del encuadre es el resto de Colombia, y sin palabra esa
 * mancha de `tierra` se leía como un error de recorte. Va girado, cede el
 * sitio a los nombres de municipio, y busca el carril más ancho entre el
 * linde oriental del departamento y el filo del marco.
 */
export function placeLandLabel(placed: PlacedPin[]): { x: number; y: number } | null {
  const half = labelWidth(LAND_LABEL.text, LAND_LABEL) / 2;
  const thickness = lineHeight(LAND_LABEL);

  const north = projectToMap(PACIFIC.northLat, 0).y;
  const south = projectToMap(PACIFIC.southLat, 0).y;
  const middle = (north + south) / 2;

  const boxes = placed.map(cityBox);
  let best: { x: number; y: number; clearance: number } | null = null;

  for (let y = north + half; y <= south - half; y += BAND_STEP) {
    const top = y - half;
    const bottom = y + half;

    let coast = eastEdgeAt(bottom);
    for (let sample = top; sample < bottom; sample += COAST_STEP) {
      coast = Math.max(coast, eastEdgeAt(sample));
    }
    if (!Number.isFinite(coast)) continue;

    const shore = coast + LABEL_GAP;
    const taken = boxes
      .filter((box) => box.y1 < bottom && box.y2 > top)
      .map((box) => [Math.max(box.x1, shore), Math.min(box.x2, MAX_X)] as const)
      .filter(([x1, x2]) => x2 > x1)
      .sort((a, b) => a[0] - b[0]);

    const gaps: [number, number][] = [];
    let edge = shore;
    for (const [x1, x2] of taken) {
      if (x1 > edge) gaps.push([edge, x1]);
      edge = Math.max(edge, x2);
    }
    if (edge < MAX_X) gaps.push([edge, MAX_X]);

    for (const [x1, x2] of gaps) {
      const clearance = (x2 - x1 - thickness) / 2;
      if (clearance < 0) continue;

      const step = Math.round(clearance / CLEARANCE_STEP);
      const bestStep = best ? Math.round(best.clearance / CLEARANCE_STEP) : -1;
      if (
        step > bestStep ||
        (step === bestStep && best && Math.abs(y - middle) < Math.abs(best.y - middle))
      ) {
        best = { x: (x1 + x2) / 2, y, clearance };
      }
    }
  }

  return best && { x: best.x, y: best.y };
}
