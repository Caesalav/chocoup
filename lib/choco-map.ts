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
 * simplificado a 170 puntos.
 */

/** Silueta del departamento en coordenadas del viewBox. */
export const CHOCO_PATH =
  "M203.0 108.8L211.4 146.4L199.7 156.3L192.1 185.0L180.0 195.3L173.5 195.0L174.5 202.4L207.0 232.6L211.8 243.9L238.9 246.2L266.7 270.9L276.0 298.5L292.9 309.9L300.4 334.7L285.0 365.1L280.0 358.7L263.9 355.3L232.1 361.3L241.9 385.9L231.8 395.6L223.9 391.0L206.8 398.2L205.5 412.7L211.8 417.7L206.4 424.1L214.2 432.3L220.0 429.0L217.6 436.2L226.9 436.7L219.3 445.7L221.7 449.4L226.1 447.3L234.8 463.9L239.6 460.7L245.6 467.8L240.4 471.6L245.5 485.7L242.1 485.7L242.2 503.5L248.2 505.1L255.0 526.6L269.9 528.5L278.7 523.6L302.7 530.1L346.9 520.3L357.1 525.3L364.5 558.9L372.6 562.4L378.0 558.6L388.8 572.2L386.8 585.3L379.2 592.6L386.7 611.1L381.6 625.0L397.7 638.2L397.2 649.3L381.9 656.1L382.2 671.3L375.3 678.7L360.7 680.1L357.7 693.3L374.0 728.7L387.2 740.1L379.6 757.3L381.2 774.3L373.0 782.1L376.2 784.8L370.0 796.1L356.7 797.8L337.4 814.4L341.3 823.3L334.7 843.0L330.1 851.7L318.3 857.0L325.4 866.2L302.8 881.3L288.5 883.9L286.6 890.1L297.8 914.0L308.1 918.6L308.4 935.5L286.3 967.1L281.7 970.1L274.1 961.7L262.7 971.7L225.5 958.2L208.3 940.5L189.3 945.5L175.1 941.3L167.5 927.9L154.7 933.2L146.4 917.7L137.7 931.3L128.5 924.9L120.6 934.9L111.9 935.3L109.1 956.9L94.0 939.2L96.1 908.6L102.4 905.7L102.0 912.7L114.4 907.0L110.3 902.0L130.4 878.5L133.4 816.9L139.1 814.4L129.6 807.5L133.1 804.3L124.1 771.9L116.4 682.5L121.1 674.3L113.1 674.9L109.1 665.8L91.2 665.3L101.2 641.3L131.4 638.8L148.1 613.3L132.0 562.1L102.6 523.6L107.7 507.7L119.3 516.3L125.1 490.9L117.0 485.7L127.0 481.0L124.4 475.8L134.0 451.9L119.6 437.5L118.2 424.5L107.4 420.3L96.0 430.3L81.9 397.9L66.5 386.5L59.0 391.5L57.7 380.3L67.9 367.8L66.7 361.3L22.5 317.2L40.6 268.5L50.8 267.6L58.6 258.8L49.7 239.4L53.3 221.3L69.7 229.9L77.7 252.4L85.4 259.0L94.3 246.2L100.6 247.1L105.7 229.4L109.8 229.4L120.8 208.4L130.1 207.9L126.3 195.2L134.2 181.0L167.3 173.7L153.1 149.2L153.7 132.6L137.9 103.1L129.2 100.4L127.3 79.4L118.7 64.2L109.8 63.4L111.0 48.1L120.9 42.0L117.3 30.6L128.3 28.3L141.7 45.0L149.5 65.3L173.2 77.7L191.8 109.3L203.0 108.8Z";

/** Marco que ocupa la silueta. Chocó es alto y estrecho: casi 2,4 a 1. */
export const LAND = { width: 420.3, height: 1000 };

/**
 * Margen a cada lado para las etiquetas de las ciudades.
 *
 * Era 150, y con eso el dibujo ocupaba el 58 % del ancho del SVG: el resto era
 * aire reservado por si algún rótulo lo necesitaba, y en pantallas anchas el
 * departamento acababa siendo una tira diminuta en medio de un SVG vacío.
 *
 * Con 100 el Chocó ocupa el 68 % y los rótulos siguen cabiendo: el más largo de
 * los treinta municipios, "El Carmen de Atrato", mide unas 280 unidades a la
 * escala del rótulo (ver `labelWidth` y `CITY_LABEL`), y desde el borde este del
 * departamento hacia dentro le sobran. La cuenta la vuelve a hacer el código en
 * cada colocación, así que subir el cuerpo del rótulo no rompe nada: como mucho
 * manda algún nombre al otro lado.
 */
export const GUTTER = 100;

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
  /** Avance del pueblo: de aquí sale el color. Sin el dato, la forma se pinta
   *  como no documentada, que es lo que de verdad sabemos. */
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
 * El paso es media línea: más fino solo afinaría lo que no se ve y
 * multiplicaría las pruebas. El alcance da para apilar unos cinco rótulos por
 * columna alrededor de una misma latitud, que es el nudo que forman los
 * municipios pequeños del San Juan cuando estén los treinta documentados.
 */
const LABEL_STEP = 7;
const LABEL_REACH = 154;

/**
 * Lo que cuesta mandar un rótulo al margen contrario, medido en las mismas
 * unidades que el desvío vertical.
 *
 * Cruzar de lado obliga a la guía a atravesar el departamento entero, así que
 * sale más caro que bajar el rótulo nueve pasos. Se paga cuando no queda otra
 * —"El Carmen de Atrato" no cabe por el este— y no por gusto.
 */
const SIDE_COST = 145;

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
 * Tipografía de los dos rótulos del mapa.
 *
 * Vive aquí, junto a las cuentas que la usan, y no en el componente que la
 * dibuja: la colocación decide de qué lado cae cada nombre midiéndolo, y con el
 * cuerpo en un archivo y la medida en otro, el día que alguien suba una letra el
 * cálculo deja de valer sin avisar.
 */
export const CITY_LABEL = { fontSize: 20, letterSpacing: 0.6 };
export const OCEAN_LABEL = { text: "Océano Pacífico", fontSize: 18, letterSpacing: 2.4 };

type LabelType = { fontSize: number; letterSpacing: number };

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

/** Alto del renglón. Un pelo más que la tinta —mayúsculas acentuadas incluidas—
 *  porque de estas cajas dependen las colisiones y aquí sobrar es lo correcto. */
const lineHeight = ({ fontSize }: LabelType) => fontSize * 1.4;

/** Holgura alrededor de la tinta: el rótulo lleva un halo del color del papel de
 *  cinco unidades y su ancho es estimado, así que la caja se ensancha por las
 *  dos razones a la vez. */
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

/** El renglón se dibuja siete unidades por debajo del punto de anclaje, que es lo
 *  que deja el bloque de mayúsculas centrado en la latitud de la ciudad; por eso
 *  la caja se puede tomar centrada en `labelY`. */
export const LABEL_BASELINE = 7;

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
  return labelBox(pin.labelX, labelWidth(pin.name, CITY_LABEL), pin.anchor, pin.labelY);
}

/**
 * La caja del nombre de una ciudad ya colocada, para que el mapa la pueda hacer
 * tocable.
 *
 * En un teléfono el nombre es el blanco más grande y más fácil que tiene un
 * municipio: «Quibdó» mide unos 30 × 10 px, y la forma de Bahía Solano, 21 px de
 * ancho en su parte más gruesa. Quien va a abrir un pueblo apunta a su nombre, no
 * a un polígono de veintiún píxeles.
 */
export function labelHitBox(pin: PlacedPin): { x: number; y: number; width: number; height: number } {
  const box = cityBox(pin);
  return { x: box.x1, y: box.y1, width: box.x2 - box.x1, height: box.y2 - box.y1 };
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
    return { pin, x, y, width: labelWidth(pin.name, CITY_LABEL), near: x < LAND.width / 2 };
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
 * la silueta y nada más. `CHOCO_PATH` es un polígono de rectas, así que basta
 * cortar sus aristas a la altura que se pregunte y quedarse con la x menor. Se
 * tabula porque la búsqueda pregunta cientos de veces y el mapa se rehace en
 * cada visita.
 */
const COAST = (() => {
  const points = [...CHOCO_PATH.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }));

  const rows: number[] = [];
  for (let index = 0; index * COAST_STEP <= LAND.height; index += 1) {
    const y = index * COAST_STEP;
    let west = Infinity;

    for (let k = 0; k < points.length; k += 1) {
      const a = points[k];
      const b = points[(k + 1) % points.length];
      if (a.y === b.y || (a.y - y) * (b.y - y) > 0) continue;
      west = Math.min(west, a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y));
    }

    rows.push(west);
  }
  return rows;
})();

/** Dónde empieza la tierra a esa altura. Infinity donde no hay dibujo. */
function westEdgeAt(y: number): number {
  const index = Math.round(y / COAST_STEP);
  return COAST[Math.min(Math.max(index, 0), COAST.length - 1)] ?? Infinity;
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
