/**
 * Simplifica las treinta formas del Chocó sin romper la teselación.
 *
 * Cada linde se escribe UNA vez: Visvalingam–Whyatt quita los dientes y cada
 * codo se filetea con un Q, para que las piezas se lean como un tablero y no
 * como un litoral dentado. Las dos formas de un linde recortan el mismo punto,
 * así que no se abren huecos; el hueco del vértice lo tapa la lechada.
 *
 * Uso: node scripts/simplify-choco-mosaic.mjs
 *
 * Reescribe las `d` de lib/choco-texture.ts. CHOCO_PATH no se sustituye por el
 * anillo del mosaico (eso descosía Colombia); sí se simplifica y filetea por
 * su cuenta, para que la costa no sea una sierra.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXTURE = join(ROOT, "lib/choco-texture.ts");
const MAP = join(ROOT, "lib/choco-map.ts");

/** Área mínima de un codo, en unidades². A 390×844 una unidad son 0,42 px.
 *  Los nudos en T no los quita Visvalingam (son extremos de cadena); por eso
 *  antes se colapsan aristas más cortas que SNAP, que es lo que convertía
 *  Istmina en una sierra. */
const SNAP = 16;
const MIN_AREA = 180;
const COAST_AREA = 420;
const TENSION = 5;

const key = (p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const pt = (k) => {
  const [x, y] = k.split(",").map(Number);
  return { x, y };
};
const round = (v) => Math.round(v * 10) / 10;
const fmt = (p) => `${round(p.x).toFixed(1)} ${round(p.y).toFixed(1)}`;

function parseRing(d) {
  const pts = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map((m) => ({
    x: +m[1],
    y: +m[2],
  }));
  if (pts.length > 1 && key(pts[0]) === key(pts[pts.length - 1])) pts.pop();
  return pts;
}

function signedArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j].x * ring[i].y - ring[i].x * ring[j].y;
  }
  return a / 2;
}

function triangleArea(a, b, c) {
  return Math.abs((a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2);
}

function visvalingam(points, minArea) {
  if (points.length <= 2) return points.map((p) => ({ ...p }));
  const nodes = points.map((p) => ({ ...p }));
  const effective = () =>
    nodes.map((p, i) =>
      i === 0 || i === nodes.length - 1
        ? Infinity
        : triangleArea(nodes[i - 1], p, nodes[i + 1]),
    );
  let areas = effective();
  while (nodes.length > 2) {
    let min = Infinity;
    let at = -1;
    for (let i = 1; i < nodes.length - 1; i += 1) {
      if (areas[i] < min) {
        min = areas[i];
        at = i;
      }
    }
    if (min >= minArea || at < 0) break;
    nodes.splice(at, 1);
    areas = effective();
  }
  return nodes;
}

function dedupeRing(ring) {
  const out = [];
  for (const p of ring) {
    const q = { x: round(p.x), y: round(p.y) };
    if (out.length === 0 || key(out[out.length - 1]) !== key(q)) out.push(q);
  }
  if (out.length > 1 && key(out[0]) === key(out[out.length - 1])) out.pop();
  return out;
}

/**
 * Junta nudos que están a menos de SNAP. Sin esto, el norte de Istmina es una
 * cadena de T de 4 unidades: el filete no llega a verse porque cada arista
 * capá el radio. Las dos formas de un linde colapsado siguen compartiendo el
 * punto medio, así que la teselación no se abre.
 */
function collapseShortEdges(input) {
  const origArea = new Map(
    input.map((s) => [s.id, Math.abs(signedArea(s.ring))]),
  );
  let shapes = input.map((s) => ({ ...s, ring: dedupeRing(s.ring) }));
  const skip = new Set();
  const edgeKey = (a, b) => [key(a), key(b)].sort().join("|");

  for (let guard = 0; guard < 500; guard += 1) {
    let best = null;
    for (const s of shapes) {
      const ring = s.ring;
      for (let i = 0; i < ring.length; i += 1) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        const len = Math.hypot(a.x - b.x, a.y - b.y);
        if (len < 0.15 || len >= SNAP || skip.has(edgeKey(a, b))) continue;
        if (!best || len < best.len) best = { a, b, len };
      }
    }
    if (!best) break;

    const mid = {
      x: round((best.a.x + best.b.x) / 2),
      y: round((best.a.y + best.b.y) / 2),
    };
    const ka = key(best.a);
    const kb = key(best.b);
    const next = shapes.map((s) => ({
      ...s,
      ring: dedupeRing(
        s.ring.map((p) => (key(p) === ka || key(p) === kb ? mid : p)),
      ),
    }));
    const ok = next.every(
      (s) =>
        s.ring.length >= 4 &&
        Math.abs(signedArea(s.ring)) >= origArea.get(s.id) * 0.5,
    );
    if (!ok) {
      skip.add(edgeKey(best.a, best.b));
      continue;
    }
    shapes = next;
  }
  return shapes;
}

/**
 * Catmull–Rom cerrado. Con pocos vértices (después del colapso y VW) esto
 * es lo que se lee orgánico: cada codo es una curva, no un filete pegado a
 * una L de medio punto. Las dos formas de un linde no comparten la curva
 * —solo los nudos— y la lechada tapa el lente.
 */
function catmullClosed(ring) {
  const n = ring.length;
  if (n < 3) return "";
  let d = `M${fmt(ring[0])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = ring[(i - 1 + n) % n];
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const p3 = ring[(i + 2) % n];
    const c1 = {
      x: p1.x + (p2.x - p0.x) / TENSION,
      y: p1.y + (p2.y - p0.y) / TENSION,
    };
    const c2 = {
      x: p2.x - (p3.x - p1.x) / TENSION,
      y: p2.y - (p3.y - p1.y) / TENSION,
    };
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return `${d}Z`;
}

/**
 * Catmull–Rom de una cadena ABIERTA. Los extremos (nudos T) se tratan con
 * tangente de un lado, para que el cubic de un linde no dependa de hacia
 * dónde sigue cada municipio. Las dos formas recorren los mismos puntos
 * al revés y obtienen la misma curva.
 */
function catmullOpen(pts) {
  if (pts.length < 2) return "";
  let d = "";
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p0 =
      i === 0 ? { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y } : pts[i - 1];
    const p3 =
      i + 2 < pts.length
        ? pts[i + 2]
        : { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y };
    const c1 = {
      x: p1.x + (p2.x - p0.x) / TENSION,
      y: p1.y + (p2.y - p0.y) / TENSION,
    };
    const c2 = {
      x: p2.x - (p3.x - p1.x) / TENSION,
      y: p2.y - (p3.y - p1.y) / TENSION,
    };
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
}

function pathFromChains(chains) {
  if (chains.length === 0) return "";
  let d = `M${fmt(chains[0][0])}`;
  for (const chain of chains) d += catmullOpen(chain);
  return `${d}Z`;
}

/**
 * Redondea cada codo. UNUSED PLACEHOLDER
 */
  const n = ring.length;
  if (n < 3) return "";
  const cuts = ring.map((b, i) => {
    const a = ring[(i - 1 + n) % n];
    const c = ring[(i + 1) % n];
    const d1 = Math.hypot(b.x - a.x, b.y - a.y);
    const d2 = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(FILLET, d1 * 0.48, d2 * 0.48);
    if (r < 1.2) return { sharp: true, p: b };
    return {
      sharp: false,
      start: {
        x: b.x + ((a.x - b.x) * r) / d1,
        y: b.y + ((a.y - b.y) * r) / d1,
      },
      ctrl: b,
      end: {
        x: b.x + ((c.x - b.x) * r) / d2,
        y: b.y + ((c.y - b.y) * r) / d2,
      },
    };
  });
  const origin = cuts[0].sharp ? cuts[0].p : cuts[0].start;
  let d = `M${fmt(origin)}`;
  for (let i = 0; i < n; i += 1) {
    const cur = cuts[i];
    const next = cuts[(i + 1) % n];
    if (!cur.sharp) d += `Q${fmt(cur.ctrl)} ${fmt(cur.end)}`;
    const dest = next.sharp ? next.p : next.start;
    const from = cur.sharp ? cur.p : cur.end;
    if (key(from) !== key(dest)) d += `L${fmt(dest)}`;
  }
  return `${d}Z`;
}

function directedId(start, step, end) {
  return `${start}>${step}>${end}`;
}

function storeChain(chain) {
  const pts = visvalingam(chain.map(pt), MIN_AREA);
  const start = chain[0];
  const step = chain[1];
  const end = chain[chain.length - 1];
  simplified.set(directedId(start, step, end), pts);
  const back = [...chain].reverse();
  simplified.set(directedId(back[0], back[1], back[back.length - 1]), [...pts].reverse());
}

const textureSrc = readFileSync(TEXTURE, "utf8");
const parsed = [
  ...textureSrc.matchAll(
    /\{ id: "([^"]+)", name: "([^"]+)", d: "([^"]+)" \}/g,
  ),
].map((m) => ({ id: m[1], name: m[2], ring: parseRing(m[3]) }));

const before = parsed.reduce((n, s) => n + s.ring.length, 0);
const shapes = collapseShortEdges(parsed);
console.log(
  `aristas cortas colapsadas: ${before} → ${shapes.reduce((n, s) => n + s.ring.length, 0)} vértices`,
);

const neighbors = new Map();
function addAdj(a, b) {
  if (a === b) return;
  if (!neighbors.has(a)) neighbors.set(a, new Set());
  if (!neighbors.has(b)) neighbors.set(b, new Set());
  neighbors.get(a).add(b);
  neighbors.get(b).add(a);
}

for (const shape of shapes) {
  const ring = shape.ring.map((p) => key({ x: round(p.x), y: round(p.y) }));
  for (let i = 0; i < ring.length; i += 1) {
    addAdj(ring[i], ring[(i + 1) % ring.length]);
  }
}

const isNode = (k) => (neighbors.get(k)?.size ?? 0) !== 2;

const simplified = new Map();
function walkChain(start, next) {
  const chain = [start, next];
  let prev = start;
  let cur = next;
  while (!isNode(cur)) {
    const opts = [...neighbors.get(cur)].filter((n) => n !== prev);
    if (opts.length !== 1) break;
    prev = cur;
    cur = opts[0];
    chain.push(cur);
  }
  return chain;
}

for (const [vertex, adj] of neighbors) {
  if (!isNode(vertex)) continue;
  for (const next of adj) {
    storeChain(walkChain(vertex, next));
  }
}

function rebuild(ring) {
  const snapped = ring.map((p) => key({ x: round(p.x), y: round(p.y) }));
  const n = snapped.length;
  const nodesOnRing = snapped
    .map((k, i) => (isNode(k) ? i : -1))
    .filter((i) => i >= 0);

  if (nodesOnRing.length < 2) {
    const loop = visvalingam(
      [
        ...ring.map((p) => ({ x: round(p.x), y: round(p.y) })),
        { x: round(ring[0].x), y: round(ring[0].y) },
      ],
      MIN_AREA,
    );
    loop.pop();
    return { ring: loop, d: filletPath(loop) };
  }

  const out = [];
  for (let nidx = 0; nidx < nodesOnRing.length; nidx += 1) {
    const i = nodesOnRing[nidx];
    const a = snapped[i];
    const b = snapped[nodesOnRing[(nidx + 1) % nodesOnRing.length]];
    const step = snapped[(i + 1) % n];
    const pts = simplified.get(directedId(a, step, b)) ?? [pt(a), pt(b)];
    if (out.length === 0) out.push(pts[0]);
    for (let k = 1; k < pts.length; k += 1) {
      if (key(out[out.length - 1]) !== key(pts[k])) out.push(pts[k]);
    }
  }
  if (out.length > 1 && key(out[0]) === key(out[out.length - 1])) out.pop();
  return { ring: out, d: filletPath(out) };
}

const rebuilt = shapes.map((shape) => {
  let next = rebuild(shape.ring);
  const originalSign = Math.sign(signedArea(shape.ring)) || 1;
  if (Math.sign(signedArea(next.ring)) !== originalSign) {
    next = rebuild([...shape.ring].reverse());
  }
  return { ...shape, ...next };
});

const after = rebuilt.reduce((n, s) => n + s.ring.length, 0);

console.log(`vértices del mosaico: ${before} → ${after} (${Math.round((after / before) * 100)} %)`);
for (const shape of rebuilt) {
  const orig = shapes.find((s) => s.id === shape.id);
  const da = ((signedArea(shape.ring) / signedArea(orig.ring) - 1) * 100).toFixed(2);
  console.log(`  ${shape.name}: ${orig.ring.length} → ${shape.ring.length}  área ${da}%`);
}

let nextTexture = textureSrc;
for (const shape of rebuilt) {
  nextTexture = nextTexture.replace(
    new RegExp(`(\\{ id: "${shape.id}", name: "${shape.name}", d: ")[^"]+(" \\})`),
    `$1${shape.d}$2`,
  );
}
const note =
  " * Encima de la soldadura hay una simplificación topológica\n" +
  " * (scripts/simplify-choco-mosaic.mjs): Visvalingam–Whyatt sobre cada linde\n" +
  " * compartido y filetes Q, para que las piezas se lean orgánicas y no como un\n" +
  " * litoral dentado. El contorno del departamento no se sustituye por el anillo\n" +
  " * del mosaico; sí se traza con las mismas curvas.";
if (!nextTexture.includes("filetes Q")) {
  nextTexture = nextTexture.replace(
    / \* Encima de la soldadura[\s\S]*? \* no se toca\.\n/,
    `${note}\n`,
  );
  if (!nextTexture.includes("filetes Q")) {
    nextTexture = nextTexture.replace(
      " * así que moverla descosería el país por la costa compartida.\n */",
      " * así que moverla descosería el país por la costa compartida.\n *\n" +
        note.replace(/^\s*\n/, "") +
        "\n */",
    );
  }
}
writeFileSync(TEXTURE, nextTexture);
console.log("escrito lib/choco-texture.ts");

const mapSrc = readFileSync(MAP, "utf8");
const chocoMatch = mapSrc.match(/export const CHOCO_PATH =\n  "([^"]+)"/);
if (!chocoMatch) {
  console.error("no se encontró CHOCO_PATH");
  process.exit(1);
}
const chocoRing = visvalingam(parseRing(chocoMatch[1]), MIN_AREA);
if (key(chocoRing[0]) === key(chocoRing[chocoRing.length - 1])) chocoRing.pop();
const chocoD = filletPath(chocoRing);
writeFileSync(MAP, mapSrc.replace(chocoMatch[0], `export const CHOCO_PATH =\n  "${chocoD}"`));
console.log(`CHOCO_PATH fileteado (${chocoRing.length} vértices).`);
