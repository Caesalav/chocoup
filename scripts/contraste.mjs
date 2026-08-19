#!/usr/bin/env node
/**
 * Mide los contrastes de la paleta LEYENDO app/globals.css.
 *
 * Existe para que la tabla de MARCA.md no se pueda quedar mentirosa. Los números
 * de un brand book se copian una vez y nadie los vuelve a comprobar; en cuanto
 * alguien afina una ficha de color, el documento sigue prometiendo el contraste
 * de antes. Aquí no hay valores escritos a mano: se sacan del mismo archivo que
 * usa el navegador, así que `node scripts/contraste.mjs` es la prueba y no una
 * segunda copia de la paleta que también habría que mantener.
 *
 * Y mide tres cosas y no una, porque el portal tiene que aguantar las tres:
 *   - contraste en color, que es lo que pide WCAG;
 *   - contraste en escala de grises, que es como se imprime y como se ve en un
 *     móvil viejo con la pantalla lavada al sol;
 *   - contraste en deuteranopía, que es el caso en el que la escala de necesidad
 *     se rompería sin que nadie del equipo lo notara.
 *
 * Uso:  node scripts/contraste.mjs           tabla completa
 *       node scripts/contraste.mjs --estados solo la prueba de los cuatro estados
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(RAIZ, "app/globals.css"), "utf8");

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

/** sRGB 0-255 -> lineal 0-1. La curva de la rampa de sRGB, no una gamma de 2,2. */
const aLineal = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const aSrgb = (v) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};

/** Luminancia relativa de WCAG 2.x. */
const luminancia = ([r, g, b]) =>
  0.2126 * aLineal(r) + 0.7152 * aLineal(g) + 0.0722 * aLineal(b);

const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * Composita `frente` con alfa sobre `fondo`.
 *
 * Se hace en sRGB y no en lineal a propósito: es lo que hace el navegador al
 * pintar un `rgb(... / 18%)` encima de una superficie, y lo que interesa medir
 * aquí es lo que se ve, no lo que sería físicamente correcto.
 */
const encima = (frente, alfa, fondo) =>
  frente.map((c, i) => c * alfa + fondo[i] * (1 - alfa));

/** Escala de grises: el gris de la misma luminancia. */
const gris = (rgb) => {
  const y = aSrgb(luminancia(rgb));
  return [y, y, y];
};

/**
 * Deuteranopía. Matriz de Viénot, Brettel y Mollon (1999) aplicada en RGB
 * lineal, que es la simulación estándar y la que usan las herramientas de
 * accesibilidad. No es un filtro de saturación: colapsa el eje rojo-verde, que
 * es exactamente el eje sobre el que se apoyaría una escala de necesidad mal
 * hecha.
 */
const deuteranopia = (rgb) => {
  const [r, g, b] = rgb.map(aLineal);
  return [
    0.625 * r + 0.375 * g,
    0.7 * r + 0.3 * g,
    0.3 * g + 0.7 * b,
  ].map(aSrgb);
};

// ---------------------------------------------------------------------------
// Lectura de las fichas de app/globals.css
// ---------------------------------------------------------------------------

const hexARgb = (hex) => {
  const s = hex.replace("#", "");
  const n = s.length === 3 ? [...s].map((c) => c + c) : s.match(/../g);
  return n.slice(0, 3).map((p) => parseInt(p, 16));
};

/**
 * OKLab, de Björn Ottosson. Es el espacio en el que está derivada la escala de
 * necesidad, así que el script tiene que entenderlo de verdad y no aproximarlo:
 * si la ficha dice `oklch(0.58 0.157 46)`, el número que sale de aquí es el
 * mismo que pinta el navegador.
 */
const oklabARgbLineal = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const rgbLinealAOklab = ([r, g, b]) => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const oklchARgb = (L, C, H) => {
  const rad = (H * Math.PI) / 180;
  return oklabARgbLineal([L, C * Math.cos(rad), C * Math.sin(rad)]).map(aSrgb);
};

/** Coordenadas OKLCH de un sRGB, para poder informar del registro de un color. */
const aOklch = (rgb) => {
  const [L, a, b] = rgbLinealAOklab(rgb.map(aLineal));
  const H = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), H: H < 0 ? H + 360 : H };
};

/**
 * Distancia en OKLab entre dos colores.
 *
 * El contraste de WCAG solo mira la luminancia, así que da 1,13:1 para un verde
 * y un naranja que cualquiera distingue: sirve para texto y no para dos áreas
 * de color una al lado de la otra, que es lo que son dos municipios del mapa.
 * Esta es la medida que sí ve el tono, y por eso las dos se informan juntas.
 */
const distancia = (a, b) => {
  const x = rgbLinealAOklab(a.map(aLineal));
  const y = rgbLinealAOklab(b.map(aLineal));
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

/**
 * El croma máximo que el sRGB admite a esa luminosidad y ese tono.
 *
 * La comprobación va sobre el RGB LINEAL sin recortar, y no sobre el sRGB que
 * devuelve `oklchARgb`: `aSrgb` recorta a [0, 1] por definición, así que un color
 * fuera de gama sale de ahí ya recortado y parecería estar dentro siempre. Con
 * ese fallo la búsqueda no encontraba borde ninguno y devolvía el tope de 0,5.
 */
const cromaMaximo = (L, H) => {
  const rad = (H * Math.PI) / 180;
  const dentro = (C) =>
    oklabARgbLineal([L, C * Math.cos(rad), C * Math.sin(rad)]).every(
      (c) => c >= -0.0015 && c <= 1.0015,
    );
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dentro(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
};

/**
 * Saturación relativa: qué fracción de lo que el sRGB permite a esa luminosidad
 * y ese tono está usando el color.
 *
 * Es la única medida de «lo vivo que es» que se puede comparar entre tonos
 * distintos. En croma absoluto `lavanda` (0,077) parece cuatro veces más apagada
 * que `need-high` (0,164), y en realidad la lavanda está pegada al borde del
 * sRGB y el rojo no: son el mismo grado de saturación en dos sitios donde el
 * espacio de color tiene tamaños distintos. Igualar esta cifra, y no el croma,
 * es lo que hace que dos familias de tono distinto se lean del mismo sistema.
 */
const saturacionRelativa = (rgb) => {
  const { L, C, H } = aOklch(rgb);
  const max = cromaMaximo(L, H);
  return max > 0 ? C / max : 0;
};

/**
 * Devuelve { rgb, alfa } de un valor de ficha. Entiende las tres formas que usa
 * la paleta —`#rrggbb`, `rgb(r g b / a%)` y `oklch(L C H)` con alfa opcional— y
 * avisa a gritos de cualquier otra en vez de devolver un color inventado: un
 * negro por defecto aquí sería un contraste falso en el documento, que es justo
 * lo que este archivo evita.
 */
const leerValor = (valor) => {
  const v = valor.trim();
  if (v.startsWith("#")) return { rgb: hexARgb(v), alfa: 1 };
  const m = v.match(/^rgb\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)%\s*\)$/);
  if (m) {
    return { rgb: [+m[1], +m[2], +m[3]], alfa: +m[4] / 100 };
  }
  const o = v.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%\s*)?\)$/,
  );
  if (o) {
    return { rgb: oklchARgb(+o[1], +o[2], +o[3]), alfa: o[4] === undefined ? 1 : +o[4] / 100 };
  }
  return null;
};

const fichas = new Map();
for (const [, nombre, valor] of CSS.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)) {
  const leido = leerValor(valor);
  if (leido) fichas.set(nombre, leido);
  else console.error(`  ! ficha no interpretable: --color-${nombre}: ${valor.trim()}`);
}

/** El color plano de una ficha, compositada sobre `fondo` si es translúcida. */
const color = (nombre, fondo = "panel") => {
  const f = fichas.get(nombre);
  if (!f) throw new Error(`no existe --color-${nombre} en app/globals.css`);
  if (f.alfa === 1) return f.rgb;
  return encima(f.rgb, f.alfa, color(typeof fondo === "string" ? fondo : "panel"));
};

const hex = (rgb) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

// ---------------------------------------------------------------------------
// Salida
// ---------------------------------------------------------------------------

const marca = (r, minimo) => (r >= minimo ? "ok" : "FALLA");
const fmt = (n) => n.toFixed(2).replace(".", ",");

/** Los cinco rellenos del mapa, en el orden de la leyenda. */
const TRAMOS = ["need-blank", "need-none", "need-low", "need-mid", "need-high"];

const fila = (etiqueta, r, minimo = 4.5) =>
  `  ${etiqueta.padEnd(46)} ${fmt(r).padStart(6)}:1  ${marca(r, minimo)}`;

const soloEstados = process.argv.includes("--estados");

if (!soloEstados) {
  console.log("\n=== FICHAS LEÍDAS DE app/globals.css ===");
  for (const [nombre, f] of fichas) {
    const plano = color(nombre);
    console.log(
      `  --color-${nombre.padEnd(16)} ${hex(f.rgb)}${
        f.alfa < 1 ? ` al ${Math.round(f.alfa * 100)}% -> ${hex(plano)} sobre panel` : ""
      }`,
    );
  }

  console.log("\n=== TEXTO SOBRE SUPERFICIE (AA normal 4,5:1 · AA grande 3:1) ===");
  const superficies = ["paper", "panel", "panel-high", "canvas", "land"];
  for (const tinta of ["ink", "body", "muted", "faint", "accent", "accent-strong"]) {
    for (const s of superficies) {
      console.log(fila(`${tinta} sobre ${s}`, contraste(color(tinta), color(s))));
    }
  }
  console.log(
    "\n  El único par por debajo de AA es `faint` sobre `land`, y no existe en el portal:\n" +
      "  las superficies hundidas (el hueco de una foto que falta, el marco del retrato)\n" +
      "  escriben en `muted`. Está en la lista de pares prohibidos de MARCA.md.",
  );

  console.log("\n=== BLOQUES DE MARCA: tinta oscura sobre superficie de color ===");
  console.log(fila("luz sobre selva", contraste(color("luz"), color("selva")), 7));
  console.log(fila("paper sobre selva", contraste(color("paper"), color("selva")), 7));
  console.log(fila("brote sobre selva", contraste(color("brote"), color("selva")), 7));
  console.log(fila("selva sobre brote", contraste(color("selva"), color("brote")), 7));
  console.log(fila("ink sobre brote", contraste(color("ink"), color("brote")), 7));
  console.log(fila("ink sobre lavanda", contraste(color("ink"), color("lavanda")), 7));
  console.log(fila("selva sobre lavanda", contraste(color("selva"), color("lavanda")), 7));
  console.log(fila("accent-strong sobre lavanda", contraste(color("accent-strong"), color("lavanda"))));

  console.log("\n=== HASTA DÓNDE LLEGA LA RAMPA DE TINTA SOBRE UNA SUPERFICIE DE COLOR ===");
  console.log("Sobre brote y lavanda la rampa se agota antes: son claras pero cromáticas, y");
  console.log("los dos pesos de abajo se quedan cortos. Ahí los enlaces van en accent-strong.\n");
  for (const superficie of ["brote", "lavanda"]) {
    for (const tinta of ["ink", "body", "muted", "faint", "accent", "accent-strong", "selva"]) {
      const r = contraste(color(tinta), color(superficie));
      console.log(
        `  ${(tinta + " sobre " + superficie).padEnd(46)} ${fmt(r).padStart(6)}:1  ` +
          `${r >= 4.5 ? "ok" : "NO USAR"}`,
      );
    }
  }

  console.log("\n=== LO QUE NO PUEDE SER TEXTO (por eso es superficie) ===");
  for (const n of ["brote", "liana", "lavanda", "need-low", "need-mid"]) {
    const blanco = contraste(color(n), color("panel-high"));
    const papel = contraste(color(n), color("paper"));
    console.log(
      `  ${n.padEnd(20)} sobre blanco ${fmt(blanco).padStart(6)}:1   sobre papel ${fmt(papel).padStart(6)}:1  ` +
        `${Math.min(blanco, papel) >= 4.5 ? "aguantaría" : "SOLO SUPERFICIE"}`,
    );
  }
  console.log(
    "\n  `need-mid` pasa AA sobre blanco puro y no sobre papel, y eso no lo convierte\n" +
      "  en tinta: escribir con él dependería de la superficie que tenga debajo, que es\n" +
      "  exactamente la clase de regla que nadie recuerda. Su trabajo es el relleno del\n" +
      "  mapa; el peso que escribe palabras es `need-mid-strong`.",
  );

  console.log("\n=== LA ESCALA CUANDO ESCRIBE: los dos pesos con tinta ===");
  const lavado = (ficha, fondo) => {
    const f = fichas.get(ficha);
    return encima(f.rgb, f.alfa, color(fondo));
  };
  for (const fondo of ["paper", "panel", "panel-high"]) {
    console.log(fila(`need-high sobre ${fondo}`, contraste(color("need-high"), color(fondo))));
  }
  for (const fondo of ["paper", "panel"]) {
    console.log(
      fila(
        `need-high sobre need-high-soft sobre ${fondo}`,
        contraste(color("need-high"), lavado("need-high-soft", fondo)),
      ),
    );
  }
  for (const fondo of ["paper", "panel"]) {
    console.log(
      fila(
        `need-mid-strong sobre need-mid-soft sobre ${fondo}`,
        contraste(color("need-mid-strong"), lavado("need-mid-soft", fondo)),
      ),
    );
  }
  for (const fondo of ["paper", "panel", "panel-high"]) {
    console.log(
      fila(`need-mid-strong sobre ${fondo}`, contraste(color("need-mid-strong"), color(fondo))),
    );
  }

  console.log("\n=== FRONTERA DE UN CONTROL CONTRA EL PAPEL (WCAG 1.4.11 pide 3:1) ===");
  for (const n of ["selva", "brote", "liana", "lavanda", "accent", "line-strong"]) {
    const r = contraste(color(n), color("paper"));
    console.log(
      `  ${(n + " vs paper").padEnd(46)} ${fmt(r).padStart(6)}:1  ` +
        `${r >= 3 ? "se recorta solo" : "NECESITA FILETE si es pulsable"}`,
    );
  }

  console.log("\n=== CINTAS: que el texto pueda cruzarlas ===");
  const alfaCinta = +(CSS.match(/stroke-opacity='\.(\d+)'/)?.[1] ?? 0) / 100;
  const cintaSobreSelva = encima(color("liana"), alfaCinta, color("selva"));
  const cintaSobreBrote = encima(color("liana"), alfaCinta, color("brote"));
  console.log(`  liana al ${Math.round(alfaCinta * 100)} % (leído del SVG de .cintas)`);
  console.log(fila("luz sobre cinta sobre selva", contraste(color("luz"), cintaSobreSelva), 7));
  console.log(fila("luz sobre liana maciza (lo que se evita)", contraste(color("luz"), color("liana")), 7));
  console.log(fila("selva sobre cinta sobre brote", contraste(color("selva"), cintaSobreBrote), 7));

  console.log("\n=== VELOS SOBRE LA FOTO IMPOSIBLE (blanco puro quemado) ===");
  console.log("La garantía se mide contra una foto quemada a blanco puro, no contra las de");
  console.log("muestra, que son oscuras y perdonan cualquier cosa. Las paradas de arriba del");
  console.log("degradado NO son zona de texto y por eso no se les exige AA: lo que sostienen");
  console.log("es que un mando con su propia pastilla no se pierda contra una fachada blanca.\n");
  for (const [a, zona] of [
    [0.88, "texto"],
    [0.82, "texto"],
    [0.78, "texto"],
    [0.7, "texto"],
    [0.64, "texto (límite inferior)"],
    [0.46, "solo mandos"],
    [0.4, "solo mandos"],
  ]) {
    const v = encima([0, 0, 0], a, [255, 255, 255]);
    const r = contraste(color("paper"), v);
    const etiqueta = `paper sobre negro al ${Math.round(a * 100)} % — ${zona}`;
    console.log(
      `  ${etiqueta.padEnd(46)} ${fmt(r).padStart(6)}:1  ` +
        (zona.startsWith("texto") ? marca(r, 4.5) : "n/a"),
    );
  }

  console.log("\n=== EL REGISTRO: saturación relativa al techo del sRGB ===");
  console.log("Es la cifra que iguala el registro entre familias de tono distinto, y la ley");
  console.log("de la que sale la escala de necesidad. El núcleo cromático de la marca vive");
  console.log("al 92-97 %; la escala cálida está derivada a la media de esos tres, el 95 %.\n");
  for (const n of [
    "lavanda",
    "liana",
    "accent",
    "brote",
    "selva",
    "need-none",
    "need-low",
    "need-mid",
    "need-high",
    "need-mid-strong",
    "need-blank",
  ]) {
    const c = color(n);
    const { L, C, H } = aOklch(c);
    console.log(
      `  ${n.padEnd(18)} ${hex(c)}  L ${L.toFixed(3)}  C ${C.toFixed(3)}  ` +
        `H ${H.toFixed(0).padStart(3)}   sat ${(100 * saturacionRelativa(c)).toFixed(1).padStart(5)} %`,
    );
  }

  console.log("\n=== MAPA: los cinco tramos de la escala ===");
  for (const n of TRAMOS) {
    const c = color(n);
    console.log(
      `  ${n.padEnd(46)} ${hex(c)}  luminancia ${luminancia(c).toFixed(4)}` +
        `  vs paper ${fmt(contraste(c, color("paper"))).padStart(6)}:1`,
    );
  }
  console.log(fila("contour sobre land (filete entre municipios)", contraste(color("contour"), color("land")), 1.5));

  console.log("\n=== MAPA: SEPARACIÓN ENTRE TRAMOS ===");
  console.log("La prueba más dura de la paleta, y no es una pastilla con su palabra: son");
  console.log("áreas pequeñas, sin etiqueta al lado, sobre papel, y el mapa no las ordena —");
  console.log("cualquier municipio puede tocar a cualquier otro—. Por eso se miden LOS DIEZ");
  console.log("pares y no solo los consecutivos, y se mira ΔE además del contraste: WCAG");
  console.log("solo ve la luminancia y da 1,34:1 para un verde y un naranja que se");
  console.log("distinguen de sobra.\n");
  console.log(
    `  ${"par".padEnd(22)}${"ΔE".padStart(7)}${"color".padStart(9)}${"gris".padStart(9)}` +
      `${"deuter.".padStart(9)}${"ΔE gris".padStart(9)}`,
  );
  const pareja = (a, b) => {
    const [A, B] = [color(a), color(b)];
    return {
      dE: distancia(A, B),
      color: contraste(A, B),
      gris: contraste(gris(A), gris(B)),
      deuter: contraste(deuteranopia(A), deuteranopia(B)),
      dEgris: distancia(gris(A), gris(B)),
    };
  };
  const corto = (n) => n.replace("need-", "");
  const peor = { dE: Infinity, color: Infinity, gris: Infinity, deuter: Infinity, dEgris: Infinity };
  for (let i = 0; i < TRAMOS.length; i++) {
    for (let j = i + 1; j < TRAMOS.length; j++) {
      const p = pareja(TRAMOS[i], TRAMOS[j]);
      const consecutivo = j === i + 1 ? " *" : "";
      console.log(
        `  ${(corto(TRAMOS[i]) + " / " + corto(TRAMOS[j]) + consecutivo).padEnd(22)}` +
          `${p.dE.toFixed(3).padStart(7)}${fmt(p.color).padStart(7)}:1${fmt(p.gris).padStart(7)}:1` +
          `${fmt(p.deuter).padStart(7)}:1${p.dEgris.toFixed(3).padStart(9)}`,
      );
      for (const k of Object.keys(peor)) peor[k] = Math.min(peor[k], p[k]);
    }
  }
  console.log("  (* = consecutivos en el orden de la leyenda)");
  console.log(
    `\n  PEOR PAR DE LOS DIEZ    ${peor.dE.toFixed(3).padStart(7)}${fmt(peor.color).padStart(7)}:1` +
      `${fmt(peor.gris).padStart(7)}:1${fmt(peor.deuter).padStart(7)}:1${peor.dEgris.toFixed(3).padStart(9)}`,
  );
  console.log(
    `  escala heredada           0,136   1,13:1   1,13:1   1,08:1    0,032`,
  );
  console.log(
    "\n  Los cinco números de arriba son mayores que los cinco de abajo, que son los\n" +
      "  de la escala de papel y ámbar que había antes: la escala nueva no es solo\n" +
      "  coherente con la paleta, se distingue mejor en los tres filtros.",
  );

  console.log("\n=== «SIN DOCUMENTAR» NO ES UN TRAMO ===");
  console.log("`need-blank` tiene que leerse como ausencia de dato y no como el tramo más");
  console.log("suave. Lo que lo saca de la escala no es su luminosidad —está en el mismo");
  console.log("sitio que siempre— sino su croma: es el único de los cinco sin color.\n");
  for (const n of TRAMOS) {
    const c = color(n);
    const { C } = aOklch(c);
    console.log(
      `  ${n.padEnd(20)} croma ${C.toFixed(3)}  ` +
        `saturación ${(100 * saturacionRelativa(c)).toFixed(1).padStart(5)} %  ` +
        `${C < 0.03 ? "<- sin color: ausencia de dato" : ""}`,
    );
  }
}

// ---------------------------------------------------------------------------
// La prueba que importa: los cuatro estados de necesidad
// ---------------------------------------------------------------------------

console.log("\n=== LOS CUATRO ESTADOS DE NECESIDAD ===");
console.log("Las recetas son las de components/ui/Chip.tsx. Se pintan sobre `panel`,");
console.log("que es la superficie de la fila de una necesidad.\n");

const estados = [
  { nombre: "Urgente", relleno: color("need-high"), tinta: color("paper"), forma: "macizo" },
  { nombre: "Abierta", relleno: color("need-mid-soft"), tinta: color("need-mid-strong"), forma: "macizo" },
  { nombre: "Parcial", relleno: color("panel"), tinta: color("need-mid-strong"), forma: "filete, sin relleno" },
  { nombre: "Cubierta", relleno: color("accent-soft"), tinta: color("accent-strong"), forma: "macizo + VISTO" },
];

for (const e of estados) {
  console.log(
    `  ${e.nombre.padEnd(9)} relleno ${hex(e.relleno)}  tinta ${hex(e.tinta)}  ` +
      `${fmt(contraste(e.tinta, e.relleno)).padStart(6)}:1  ${marca(contraste(e.tinta, e.relleno), 4.5)}` +
      `  [${e.forma}]`,
  );
}

console.log("\n  Separación entre RELLENOS, en los tres filtros:");
console.log(`  ${"par".padEnd(24)} ${"color".padStart(8)} ${"gris".padStart(8)} ${"deuter.".padStart(8)}`);
const pares = [
  ["Abierta / Cubierta", 1, 3],
  ["Urgente / Abierta", 0, 1],
  ["Urgente / Cubierta", 0, 3],
  ["Abierta / Parcial", 1, 2],
];
for (const [etiqueta, i, j] of pares) {
  const a = estados[i].relleno;
  const b = estados[j].relleno;
  console.log(
    `  ${etiqueta.padEnd(24)} ${fmt(contraste(a, b)).padStart(7)}:1 ` +
      `${fmt(contraste(gris(a), gris(b))).padStart(7)}:1 ` +
      `${fmt(contraste(deuteranopia(a), deuteranopia(b))).padStart(7)}:1`,
  );
}

const critico = contraste(
  deuteranopia(estados[1].relleno),
  deuteranopia(estados[3].relleno),
);
console.log(
  `\n  «Abierta» y «Cubierta» quedan a ${fmt(critico)}:1 en deuteranopía: el tono NO\n` +
    "  las separa, y no se pretende que lo haga. Las separa el visto de «Cubierta»,\n" +
    "  que es la única de las cuatro con dibujo, y eso sobrevive a los tres filtros.\n" +
    "  Ver la lámina en capturas-verificacion/marca/.",
);
console.log();
