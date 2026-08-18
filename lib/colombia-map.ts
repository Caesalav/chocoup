/**
 * Mapa localizador: Colombia con el Chocó resaltado.
 *
 * Sirve para orientar a quien no sabe dónde queda el Chocó, que es
 * prácticamente cualquiera fuera de Colombia. Va antes del esquema detallado del
 * departamento, como el recuadro de situación de un mapa impreso.
 *
 * Está dibujado en las coordenadas del mapa del Chocó (lib/choco-map.ts) y no en
 * un marco propio. Tenía uno, y dentro una segunda silueta del departamento
 * simplificada a 70 puntos: esa copia era el problema. Dos simplificaciones
 * distintas del mismo borde no encajan por bien que se ajuste el acercamiento,
 * así que el relevo entre los dos mapas se veía por más que se afinara el zoom.
 * Ahora la silueta del Chocó es una sola —CHOCO_PATH, la que dibuja el mapa de
 * verdad— y lo que cambió de marco fue el país.
 *
 * De regalo, el borde compartido dejó de ser dos líneas. El límite oeste y norte
 * del departamento ES el borde de Colombia, y aquí el contorno del país sigue
 * punto por punto al del Chocó en ese tramo: el verde llega exactamente hasta la
 * costa en vez de desbordarla unas unidades y tener que recortarlo contra el
 * país, que era lo que le daba el filo picado.
 *
 * Contorno de Colombia continental (sin San Andrés), del Marco Geoestadístico
 * Nacional del DANE. La traducción de marco y el empalme los hizo
 * scripts/build-colombia-outline.mjs, que también deja escrito cómo se dedujo la
 * correspondencia entre los dos sistemas de coordenadas.
 */

import { VIEW_BOX } from "./choco-map";

export const COLOMBIA_PATH =
  "M524.1 1802.3L438.6 1755.0L340.3 1687.7L283.9 1719.9L114.0 1691.8L65.2 1605.3L28.0 1608.8L-172.1 1493.6L-199.4 1431.1L-124.4 1415.9L-133.7 1314.7L-86.6 1241.6L12.8 1228.2L96.6 1101.9L173.4 996.0L109.4 954.5L109.1 956.9L94.0 939.2L96.1 908.6L102.4 905.7L102.0 912.7L114.4 907.0L110.3 902.0L130.4 878.5L133.4 816.9L139.1 814.4L129.6 807.5L133.1 804.3L124.1 771.9L116.4 682.5L121.1 674.3L113.1 674.9L109.1 665.8L91.2 665.3L101.2 641.3L131.4 638.8L148.1 613.3L132.0 562.1L102.6 523.6L107.7 507.7L119.3 516.3L125.1 490.9L117.0 485.7L127.0 481.0L124.4 475.8L134.0 451.9L119.6 437.5L118.2 424.5L107.4 420.3L96.0 430.3L81.9 397.9L66.5 386.5L59.0 391.5L57.7 380.3L67.9 367.8L66.7 361.3L22.5 317.2L40.6 268.5L50.8 267.6L58.6 258.8L49.7 239.4L53.3 221.3L69.7 229.9L77.7 252.4L85.4 259.0L94.3 246.2L100.6 247.1L105.7 229.4L109.8 229.4L120.8 208.4L130.1 207.9L126.3 195.2L134.2 181.0L167.3 173.7L153.1 149.2L153.7 132.6L137.9 103.1L129.2 100.4L127.3 79.4L118.7 64.2L109.8 63.4L111.0 48.1L120.9 42.0L117.3 30.6L124.0 29.2L128.0 24.3L231.5 30.7L381.6 -110.2L464.2 -131.2L465.9 -197.9L502.5 -368.6L617.7 -462.2L743.3 -465.7L759.6 -507.8L916.1 -490.8L1073.1 -592.6L1151.0 -638.2L1248.1 -735.2L1319.1 -722.4L1371.4 -669.8L1332.5 -601.9L1203.9 -568.0L1153.3 -467.4L1076.0 -409.6L1017.8 -334.7L993.4 -190.9L938.2 -72.8L1041.1 -59.3L1066.7 33.6L1110.9 77.5L1126.6 158.8L1102.7 233.6L1109.7 275.7L1159.2 292.1L1206.8 362.8L1463.9 343.5L1580.2 368.7L1721.0 542.3L1801.8 520.7L1946.1 531.8L2060.0 508.4L2130.4 543.5L2094.4 651.7L2049.6 719.5L2034.5 863.9L2074.6 997.8L2131.0 1058.0L2138.0 1103.0L2036.8 1203.6L2109.5 1248.0L2162.4 1318.2L2223.5 1519.3L2185.7 1543.9L2146.7 1425.2L2091.4 1361.5L2025.1 1430.5L1635.5 1426.4L1637.8 1552.1L1755.3 1573.1L1748.3 1650.3L1708.2 1629.3L1595.9 1662.6L1594.8 1809.4L1683.2 1882.4L1714.6 1998.2L1709.9 2085.3L1620.4 2638.4L1519.7 2530.9L1460.4 2526.2L1589.5 2321.0L1436.0 2226.8L1316.2 2244.4L1244.1 2209.3L1133.6 2262.5L984.7 2237.3L867.2 2025.7L774.1 1974.2L710.7 1878.9L577.6 1783.6L524.1 1802.3Z";

/**
 * Encuadre del país. Enorme comparado con el del departamento —Colombia mide
 * unas 2.400 unidades de ancho donde el Chocó mide 375— porque las unidades son
 * ahora las del mapa detallado y no las de un marco propio normalizado.
 *
 * El aire alrededor del dibujo es el mismo que tenía en su marco viejo, un
 * 1,92 % a cada lado, para que /mapa?ver=colombia se siga viendo igual que
 * antes de mudarse de coordenadas.
 */
export const COLOMBIA_VIEW = { minX: -247.7, minY: -802.5, width: 2519.5, height: 3508.2 };

export const colombiaViewBoxAttr = `${COLOMBIA_VIEW.minX} ${COLOMBIA_VIEW.minY} ${COLOMBIA_VIEW.width} ${COLOMBIA_VIEW.height}`;

/** Centro visual del Chocó en este marco, para colocar la etiqueta. */
export const CHOCO_LABEL_ANCHOR = { x: 191.4, y: 529.5 };

/**
 * De dónde arranca el acercamiento de la apertura.
 *
 * La apertura dibuja el localizador dentro del encuadre del mapa del Chocó —el
 * mismo viewBox, el mismo tamaño en pantalla— y lo lleva de este estado a no
 * transformar nada. Ese final no es una escala afinada a ojo: es la identidad,
 * así que el departamento de la apertura acaba exactamente sobre el del mapa,
 * salga la pantalla que salga, sin depender de la proporción de la ventana.
 *
 * El estado inicial es el que mete el país entero en ese encuadre con el mismo
 * aire que tiene en su propia vista, centrado. Se calcula a partir de los dos
 * encuadres en vez de dejar un par de números en el CSS: el día que cambie el
 * margen del mapa del Chocó, esto se mueve solo.
 */
const zoomScale = Math.min(VIEW_BOX.width / COLOMBIA_VIEW.width, VIEW_BOX.height / COLOMBIA_VIEW.height);

/** Lo que hay que desplazar para que, a esa escala, el centro del país caiga
 *  donde el encuadre del mapa tiene el suyo. El del Chocó ya está ahí: su caja
 *  está centrada en el viewBox del mapa, y por eso al terminar no hace falta
 *  corregir nada. */
const zoomShift = {
  x: -zoomScale * (COLOMBIA_VIEW.minX + COLOMBIA_VIEW.width / 2 - (VIEW_BOX.minX + VIEW_BOX.width / 2)),
  y: -zoomScale * (COLOMBIA_VIEW.minY + COLOMBIA_VIEW.height / 2 - (VIEW_BOX.minY + VIEW_BOX.height / 2)),
};

export const INTRO_ZOOM_FROM = {
  scale: zoomScale.toFixed(4),
  shift: `${zoomShift.x.toFixed(1)}px ${zoomShift.y.toFixed(1)}px`,
};
