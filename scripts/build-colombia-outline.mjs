/**
 * Rehace el contorno de Colombia en las coordenadas del mapa del Chocó.
 *
 * Hasta ahora había dos siluetas del departamento: la de lib/choco-map.ts (170
 * puntos, la que se dibuja de verdad) y una copia de 70 puntos dentro del marco
 * del localizador. Dos simplificaciones distintas del mismo borde no encajan
 * por bien que se ajuste el acercamiento, y el empalme entre los dos mapas se
 * notaba. Este script quita la copia: deja una sola silueta —la del mapa
 * detallado— y trae a Colombia a su sistema de coordenadas.
 *
 * Hace tres cosas:
 *
 *   1. Registra las dos siluetas para deducir la transformación entre los dos
 *      marcos. El marco viejo del localizador no documentaba su proyección, así
 *      que se deduce ajustando una forma sobre la otra (Nelder-Mead sobre
 *      escala y desplazamiento en x e y, con la distancia media recortada entre
 *      los dos contornos como objetivo).
 *
 *   2. Empalma la costa. El borde oeste y norte del Chocó ES el borde de
 *      Colombia: donde los dos contornos se cruzan, el del país pasa a seguir
 *      punto por punto al del departamento. Así el verde llega exactamente hasta
 *      la línea de costa en vez de desbordarla y tener que recortarlo.
 *
 *   3. Emite el trazado resultante para pegarlo en lib/colombia-map.ts.
 *
 * Uso:  node scripts/build-colombia-outline.mjs
 *
 * No se ejecuta en cada build a propósito: el contorno del país y el del
 * departamento vienen del Marco Geoestadístico Nacional del DANE (2018) y no
 * cambian. Esto es la herramienta que dejó escrito de dónde salió el número,
 * para el día que haya que rehacerlo.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Saca una constante de trazado del fuente TypeScript sin importarlo: este
 *  script se ejecuta con node a secas y los módulos del proyecto son TS. */
function pathConst(file, name) {
  const src = readFileSync(join(ROOT, file), "utf8");
  const found = src.match(new RegExp(`export const ${name} =\\s*\\n?\\s*"([^"]+)"`));
  if (!found) throw new Error(`no encuentro ${name} en ${file}`);
  return found[1];
}

const points = (d) =>
  [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }));

/**
 * Las dos constantes del marco retirado, tal como estaban en lib/colombia-map.ts
 * antes de esta traducción.
 *
 * Viven aquí y no en lib/ porque ya no las dibuja nadie: son la entrada de un
 * cálculo que se hizo una vez. La silueta de 70 puntos, en concreto, es
 * justamente la copia que se quitó del portal; se conserva porque sin ella no se
 * puede volver a deducir la transformación entre los dos marcos, que es lo único
 * que el marco viejo nunca documentó.
 */
const LEGACY_COLOMBIA =
  "M132.7 445.5L118.0 437.4L101.1 425.9L91.4 431.4L62.2 426.6L53.8 411.8L47.4 412.4L13.0 392.7L8.3 382.0L21.2 379.4L19.6 362.1L27.7 349.6L44.8 347.3L59.2 325.7L72.4 307.6L59.7 299.4L66.2 279.4L58.5 247.8L65.8 238.8L60.4 209.6L46.5 191.3L50.9 174.5L62.0 177.0L68.5 166.7L60.5 146.4L64.6 141.4L82.4 142.5L108.2 118.4L122.4 114.8L122.7 103.4L129.0 74.2L148.8 58.2L170.4 57.6L173.2 50.4L200.1 53.3L227.1 35.9L240.5 28.1L257.2 11.5L269.4 13.7L278.4 22.7L271.7 34.3L249.6 40.1L240.9 57.3L227.6 67.2L217.6 80.0L213.4 104.6L203.9 124.8L221.6 127.1L226.0 143.0L233.6 150.5L236.3 164.4L232.2 177.2L233.4 184.4L241.9 187.2L250.1 199.3L294.3 196.0L314.3 200.3L338.5 230.0L352.4 226.3L377.2 228.2L396.8 224.2L408.9 230.2L402.7 248.7L395.0 260.3L392.4 285.0L399.3 307.9L409.0 318.2L410.2 325.9L392.8 343.1L405.3 350.7L414.4 362.7L424.9 397.1L418.4 401.3L411.7 381.0L402.2 370.1L390.8 381.9L323.8 381.2L324.2 402.7L344.4 406.3L343.2 419.5L336.3 415.9L317.0 421.6L316.8 446.7L332.0 459.2L337.4 479.0L336.6 493.9L321.2 588.5L303.9 570.1L293.7 569.3L315.9 534.2L289.5 518.1L268.9 521.1L256.5 515.1L237.5 524.2L211.9 519.9L191.7 483.7L175.7 474.9L164.8 458.6L141.9 442.3L132.7 445.5Z";

const LEGACY_CHOCO_IN_COLOMBIA =
  "M77.5 155.7L78.9 162.2L72.6 171.8L79.0 178.9L83.6 179.3L88.4 183.5L94.2 194.4L91.6 199.6L82.5 199.0L84.2 203.2L78.1 205.3L78.1 209.8L84.8 217.2L84.2 223.4L86.4 227.3L104.0 227.1L105.2 232.9L109.4 235.1L108.2 244.2L111.0 246.4L104.1 255.9L109.1 263.9L108.1 269.8L100.6 276.6L100.1 281.6L97.3 283.9L98.5 285.5L92.2 288.6L95.6 297.4L91.8 302.8L87.7 303.6L78.4 298.3L69.2 297.0L67.7 294.4L61.8 297.4L61.3 301.1L58.7 298.0L59.1 292.8L62.2 292.5L65.0 287.6L66.5 276.6L63.9 269.4L63.4 252.6L58.2 251.1L60.0 247.0L65.2 246.6L68.0 242.2L60.2 226.8L61.1 224.1L63.1 225.6L62.7 220.3L65.6 214.5L62.9 209.8L59.1 210.8L56.6 205.3L52.7 204.2L54.0 199.0L46.4 191.4L49.5 183.1L52.6 181.4L51.7 175.0L57.2 181.5L64.9 172.7L65.6 168.1L71.3 166.8L61.4 147.9L62.7 142.3L64.6 141.9L68.3 148.3L77.5 155.7Z";

// La silueta viva: la que dibuja el mapa del Chocó y, desde este cálculo, la
// única que existe.
const CHOCO = points(pathConst("lib/choco-map.ts", "CHOCO_PATH"));
const OLD_COLOMBIA = points(LEGACY_COLOMBIA);
const OLD_CHOCO = points(LEGACY_CHOCO_IN_COLOMBIA);

// ---------------------------------------------------------------------------
// Geometría de andar por casa
// ---------------------------------------------------------------------------

function closestOnSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0));
  return { d: Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)), t };
}

function distanceToOutline(p, ring) {
  let best = Infinity;
  for (let i = 0; i < ring.length; i += 1) {
    best = Math.min(best, closestOnSegment(p, ring[i], ring[(i + 1) % ring.length]).d);
  }
  return best;
}

/** Reparte n puntos a paso constante por el contorno. Las dos siluetas tienen
 *  muy distinta densidad de vértices; sin esto la distancia media la decidiría
 *  el tramo mejor dibujado y no el parecido de las formas. */
function walkEvenly(ring, n) {
  const legs = ring.map((p, i) => {
    const q = ring[(i + 1) % ring.length];
    return { p, q, len: Math.hypot(q.x - p.x, q.y - p.y) };
  });
  const total = legs.reduce((sum, leg) => sum + leg.len, 0);
  const out = [];
  let leg = 0;
  let walked = 0;
  for (let i = 0; i < n; i += 1) {
    const target = (i * total) / n;
    while (walked + legs[leg].len < target && leg < legs.length - 1) {
      walked += legs[leg].len;
      leg += 1;
    }
    const t = legs[leg].len ? (target - walked) / legs[leg].len : 0;
    out.push({
      x: legs[leg].p.x + (legs[leg].q.x - legs[leg].p.x) * t,
      y: legs[leg].p.y + (legs[leg].q.y - legs[leg].p.y) * t,
    });
  }
  return out;
}

const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
};

function crossing(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, u, x: a.x + t * r.x, y: a.y + t * r.y };
}

const move = (ring, [sx, sy, tx, ty]) => ring.map((p) => ({ x: p.x * sx + tx, y: p.y * sy + ty }));

// ---------------------------------------------------------------------------
// 1. Registro: ¿qué transformación lleva del marco viejo al del Chocó?
// ---------------------------------------------------------------------------

/** Media recortada al 90 % de la distancia simétrica entre dos contornos. Se
 *  recorta porque las dos simplificaciones difieren de verdad en unos pocos
 *  entrantes de costa, y sin recortar esos pocos puntos arrastran el ajuste. */
function outlineGap(a, b, trim = 1) {
  const wa = walkEvenly(a, 400);
  const wb = walkEvenly(b, 400);
  const all = [...wa.map((p) => distanceToOutline(p, b)), ...wb.map((p) => distanceToOutline(p, a))];
  all.sort((x, y) => x - y);
  const keep = all.slice(0, Math.max(1, Math.floor(all.length * trim)));
  return {
    mean: keep.reduce((s, v) => s + v, 0) / keep.length,
    p95: all[Math.floor(all.length * 0.95)],
    max: all[all.length - 1],
  };
}

function nelderMead(cost, start, step) {
  const n = start.length;
  let corners = [start.slice()];
  for (let i = 0; i < n; i += 1) {
    const v = start.slice();
    v[i] += step[i];
    corners.push(v);
  }
  let values = corners.map(cost);

  for (let round = 0; round < 4000; round += 1) {
    const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
    corners = order.map((i) => corners[i]);
    values = order.map((i) => values[i]);

    const middle = start.map((_, j) => corners.slice(0, n).reduce((s, v) => s + v[j], 0) / n);
    const worst = corners[n];
    const reflected = middle.map((c, j) => c + (c - worst[j]));
    const fr = cost(reflected);

    if (fr < values[0]) {
      const stretched = middle.map((c, j) => c + 2 * (c - worst[j]));
      const fe = cost(stretched);
      [corners[n], values[n]] = fe < fr ? [stretched, fe] : [reflected, fr];
    } else if (fr < values[n - 1]) {
      corners[n] = reflected;
      values[n] = fr;
    } else {
      const pulled = middle.map((c, j) => c + 0.5 * (worst[j] - c));
      const fc = cost(pulled);
      if (fc < values[n]) {
        corners[n] = pulled;
        values[n] = fc;
      } else {
        for (let i = 1; i <= n; i += 1) {
          corners[i] = corners[i].map((v, j) => corners[0][j] + 0.5 * (v - corners[0][j]));
          values[i] = cost(corners[i]);
        }
      }
    }
  }
  return corners[values.indexOf(Math.min(...values))];
}

const span = (ring) => {
  const xs = ring.map((p) => p.x);
  const ys = ring.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

const boxDetail = span(CHOCO);
const boxOld = span(OLD_CHOCO);
const guess = [
  (boxOld.maxX - boxOld.minX) / (boxDetail.maxX - boxDetail.minX),
  (boxOld.maxY - boxOld.minY) / (boxDetail.maxY - boxDetail.minY),
  0,
  0,
];
guess[2] = boxOld.minX - boxDetail.minX * guess[0];
guess[3] = boxOld.minY - boxDetail.minY * guess[1];

const toOld = nelderMead(
  (p) => (p[0] <= 0 || p[1] <= 0 ? 1e9 : outlineGap(move(CHOCO, p), OLD_CHOCO, 0.9).mean),
  guess,
  [0.004, 0.004, 1.5, 1.5],
);
const registered = outlineGap(move(CHOCO, toOld), OLD_CHOCO);

console.log("1. Registro de las dos siluetas del Chocó");
console.log(`   detallada → marco viejo:  x·${toOld[0].toFixed(6)}${toOld[2] >= 0 ? "+" : ""}${toOld[2].toFixed(3)}   y·${toOld[1].toFixed(6)}${toOld[3] >= 0 ? "+" : ""}${toOld[3].toFixed(3)}`);
console.log(`   distancia entre contornos: media ${registered.mean.toFixed(2)} u, p95 ${registered.p95.toFixed(2)} u, máx ${registered.max.toFixed(2)} u  (marco de 433,2 x 600)`);

// La inversa es la que interesa: lleva Colombia al marco del Chocó.
const toChoco = [1 / toOld[0], 1 / toOld[1], -toOld[2] / toOld[0], -toOld[3] / toOld[1]];
console.log(`   marco viejo → mapa del Chocó: x·${toChoco[0].toFixed(6)}${toChoco[2].toFixed(3)}   y·${toChoco[1].toFixed(6)}${toChoco[3].toFixed(3)}`);

// Contraste con el mundo real: si la transformación es buena, los extremos de
// Colombia tienen que caer donde están.
const BOUNDS = { minLng: -77.995626, maxLng: -75.893568, minLat: 3.824323, maxLat: 8.795889 };
const LAND = { width: 420.3, height: 1000 };
const degX = (BOUNDS.maxLng - BOUNDS.minLng) / LAND.width;
const degY = (BOUNDS.maxLat - BOUNDS.minLat) / LAND.height;
const colombiaInChoco = move(OLD_COLOMBIA, toChoco);
const world = span(colombiaInChoco);
console.log(
  `   comprobación: Colombia va de ${(BOUNDS.minLng + world.minX * degX).toFixed(2)}° a ${(BOUNDS.minLng + world.maxX * degX).toFixed(2)}° de longitud` +
    ` y de ${(BOUNDS.maxLat - world.maxY * degY).toFixed(2)}° a ${(BOUNDS.maxLat - world.minY * degY).toFixed(2)}° de latitud`,
);
console.log("   (de verdad: -79,02° a -66,85° y -4,23° a 12,46°)");

// ---------------------------------------------------------------------------
// 2. Empalme: donde el país y el departamento son el mismo borde, un solo trazo
// ---------------------------------------------------------------------------

const meetings = [];
for (let i = 0; i < colombiaInChoco.length; i += 1) {
  for (let j = 0; j < CHOCO.length; j += 1) {
    const hit = crossing(
      colombiaInChoco[i],
      colombiaInChoco[(i + 1) % colombiaInChoco.length],
      CHOCO[j],
      CHOCO[(j + 1) % CHOCO.length],
    );
    if (hit) meetings.push({ country: i, along: hit.t, dept: j, x: hit.x, y: hit.y });
  }
}

// En el orden en que se recorre el contorno del país: el primer cruce es por
// donde entra en el departamento y el último por donde sale. Los de en medio son
// la costa fina entrando y saliendo de la gruesa, y son justo los que sobran.
meetings.sort((a, b) => a.country - b.country || a.along - b.along);
const enters = meetings[0];
const leaves = meetings[meetings.length - 1];

const shared = [{ x: enters.x, y: enters.y }];
for (let j = (enters.dept + 1) % CHOCO.length; j !== (leaves.dept + 1) % CHOCO.length; j = (j + 1) % CHOCO.length) {
  shared.push(CHOCO[j]);
}
shared.push({ x: leaves.x, y: leaves.y });

const spliced = [
  ...colombiaInChoco.slice(0, enters.country + 1),
  ...shared,
  ...colombiaInChoco.slice(leaves.country + 1),
];

console.log("\n2. Empalme de la costa compartida");
console.log(`   cruces entre los dos contornos: ${meetings.length}`);
console.log(`   tramo compartido: ${shared.length} puntos del departamento sustituyen a ${leaves.country - enters.country} del país`);
console.log(`   vértices: ${colombiaInChoco.length} → ${spliced.length}`);
console.log(`   área: ${((signedArea(spliced) / signedArea(colombiaInChoco) - 1) * 100).toFixed(3)} %`);

let knots = 0;
for (let i = 0; i < spliced.length; i += 1) {
  for (let j = i + 2; j < spliced.length; j += 1) {
    if (i === 0 && j === spliced.length - 1) continue;
    const hit = crossing(spliced[i], spliced[(i + 1) % spliced.length], spliced[j], spliced[(j + 1) % spliced.length]);
    if (hit && hit.t > 1e-9 && hit.t < 1 - 1e-9 && hit.u > 1e-9 && hit.u < 1 - 1e-9) knots += 1;
  }
}
console.log(`   cruces del contorno consigo mismo: ${knots}${knots ? "  ← MAL" : ""}`);

// Cuánto se salía el departamento del país antes y cuánto se sale ahora.
function inside(p, ring) {
  let odd = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) odd = !odd;
  }
  return odd;
}
for (const [label, ring] of [["antes", colombiaInChoco], ["después", spliced]]) {
  const stray = walkEvenly(CHOCO, 1200)
    .filter((p) => !inside(p, ring))
    .map((p) => distanceToOutline(p, ring));
  stray.sort((a, b) => a - b);
  console.log(`   el departamento sobresale del país (${label}): máx ${(stray[stray.length - 1] ?? 0).toFixed(2)} u`);
}

// ---------------------------------------------------------------------------
// 3. Encuadre y salida
// ---------------------------------------------------------------------------

// El localizador conserva el aire que tenía en su marco viejo: allí el dibujo
// medía 416,6 x 577 dentro de 433,2 x 600, o sea un 1,9167 % de margen a cada
// lado. Se reproduce para que /mapa?ver=colombia siga viéndose igual.
const MARGIN = 0.019167;
const box = span(spliced);
const drawn = { width: box.maxX - box.minX, height: box.maxY - box.minY };
const view = {
  width: drawn.width / (1 - 2 * MARGIN),
  height: drawn.height / (1 - 2 * MARGIN),
};
view.minX = box.minX - (view.width - drawn.width) / 2;
view.minY = box.minY - (view.height - drawn.height) / 2;

console.log("\n3. Encuadre del localizador");
console.log(`   dibujo ${drawn.width.toFixed(1)} x ${drawn.height.toFixed(1)}`);
console.log(
  `   COLOMBIA_VIEW = { minX: ${view.minX.toFixed(1)}, minY: ${view.minY.toFixed(1)}, width: ${view.width.toFixed(1)}, height: ${view.height.toFixed(1)} }`,
);

const round = (v) => (Math.round(v * 10) / 10).toFixed(1);
const d = spliced.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join("") + "Z";
console.log(`\n   COLOMBIA_PATH (${d.length} caracteres):\n`);
console.log(d);
