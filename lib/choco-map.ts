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

export type PlacedPin = MapPin & {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "end";
};

const LABEL_GAP = 14;
const MIN_LABEL_SPACING = 30;
const MAX_X = LAND.width + GUTTER;
const MIN_X = -GUTTER;

/**
 * Tipografía de los dos rótulos del mapa.
 *
 * Vive aquí, junto a las cuentas que la usan, y no en el componente que la
 * dibuja: la colocación decide de qué lado cae cada nombre midiéndolo, y con el
 * cuerpo en un archivo y la medida en otro, el día que alguien suba una letra el
 * cálculo deja de valer sin avisar.
 */
export const CITY_LABEL = { fontSize: 21, letterSpacing: 2 };
export const OCEAN_LABEL = { text: "OCÉANO PACÍFICO", fontSize: 20, letterSpacing: 5 };

type LabelType = { fontSize: number; letterSpacing: number };

/**
 * Cuánto mide un rótulo escrito en mayúsculas.
 *
 * El 0,6 del cuerpo es el avance medio de una mayúscula en esta familia; medido
 * contra lo que dibuja el navegador, el error no pasa de siete unidades
 * ("QUIBDÓ" se queda corto por la Q y la Ó, "ISTMINA" se pasa por las íes). Es
 * una estimación a propósito: medir de verdad exige una caja de texto y esto se
 * calcula en el servidor, así que todo lo que decide con ella lleva holgura por
 * encima de ese error.
 */
function labelWidth(text: string, { fontSize, letterSpacing }: LabelType): number {
  return text.length * (fontSize * 0.6 + letterSpacing);
}

/** Alto del renglón. Un pelo más que la tinta —mayúsculas acentuadas incluidas—
 *  porque de estas cajas dependen las colisiones y aquí sobrar es lo correcto. */
const lineHeight = ({ fontSize }: LabelType) => fontSize * 1.4;

/** Holgura alrededor de la tinta: el rótulo lleva un halo del color del papel de
 *  cinco unidades y su ancho es estimado, así que la caja se ensancha por las
 *  dos razones a la vez. */
const LABEL_PAD = 8;

/**
 * Sitúa cada ciudad y coloca su etiqueta hacia el margen más cercano, separando
 * en vertical las que se pisarían.
 *
 * Un nombre largo cerca del borde se voltea al otro lado: "El Carmen de Atrato"
 * está al este del departamento y su etiqueta no cabe por la derecha.
 */
export function placePins(pins: MapPin[]): PlacedPin[] {
  const placed = pins.map((pin) => {
    const { x, y } = projectToMap(pin.lat, pin.lng);
    const width = labelWidth(pin.name, CITY_LABEL);

    const fitsRight = x + LABEL_GAP + width <= MAX_X;
    const fitsLeft = x - LABEL_GAP - width >= MIN_X;

    let toLeft = x >= LAND.width / 2 ? false : true;
    if (toLeft && !fitsLeft && fitsRight) toLeft = false;
    if (!toLeft && !fitsRight && fitsLeft) toLeft = true;

    return {
      ...pin,
      x,
      y,
      labelX: toLeft ? x - LABEL_GAP : x + LABEL_GAP,
      labelY: y,
      anchor: (toLeft ? "end" : "start") as "start" | "end",
    };
  });

  for (const side of ["end", "start"] as const) {
    const column = placed
      .filter((pin) => pin.anchor === side)
      .sort((a, b) => a.labelY - b.labelY);

    for (let index = 1; index < column.length; index += 1) {
      const gap = column[index].labelY - column[index - 1].labelY;
      if (gap < MIN_LABEL_SPACING) {
        column[index].labelY = column[index - 1].labelY + MIN_LABEL_SPACING;
      }
    }
  }

  return placed;
}

/** Lo que un rótulo ya colocado le quita al mapa, en unidades del viewBox. */
type Box = { x1: number; y1: number; x2: number; y2: number };

/** El renglón se dibuja siete unidades por debajo del punto de anclaje, que es lo
 *  que deja el bloque de mayúsculas centrado en la latitud de la ciudad; por eso
 *  la caja se puede tomar centrada en `labelY`. */
export const LABEL_BASELINE = 7;

function cityBox(pin: PlacedPin): Box {
  const width = labelWidth(pin.name, CITY_LABEL);
  const half = lineHeight(CITY_LABEL) / 2;

  return {
    x1: (pin.anchor === "end" ? pin.labelX - width : pin.labelX) - LABEL_PAD,
    x2: (pin.anchor === "end" ? pin.labelX : pin.labelX + width) + LABEL_PAD,
    y1: pin.labelY - half - LABEL_PAD,
    y2: pin.labelY + half + LABEL_PAD,
  };
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
