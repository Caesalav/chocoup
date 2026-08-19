import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Las fotos vienen de Supabase Storage ya comprimidas en el navegador, y
      // servirlas directas desde el CDN evita configurar el optimizador con la
      // URL del proyecto y pagar transformaciones que no hacen falta.
      "@next/next/no-img-element": "off",

      // Nadie vuelve a contar necesidades abiertas a mano.
      //
      // El fallo que justifica esto estuvo publicado: la ficha de Quibdó decía
      // «0 necesidades abiertas» mientras /municipios y el mapa decían diez del
      // mismo municipio. No lo causó un cálculo mal hecho, sino que cada
      // pantalla se había escrito su propio `status !== "cubierta"` sobre un
      // conjunto distinto, y nada obligaba a que los tres coincidieran. Es un
      // fallo que no se ve leyendo ninguno de los tres archivos por separado, y
      // que en un portal de donaciones dice «aquí no falta nada» donde faltan
      // diez cosas.
      //
      // Así que la comparación se prohíbe y la definición vive en un sitio
      // (lib/needs.ts). Se prohíbe solo `cubierta` —no `parcial` ni `abierta`—
      // porque es la palabra que decide de qué lado cae una necesidad, que es
      // lo que estas pantallas contaban distinto. `lib/needs.ts` la usa: es el
      // único archivo con la excepción, más abajo.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'BinaryExpression[operator=/^[!=]==$/] > Literal[value="cubierta"]',
          message:
            "No compares el estado con 'cubierta' a mano: usa isOpenNeed, isCoveredNeed, countOpenNeeds o countCoveredNeeds de lib/needs.ts, que es donde está escrito qué cuenta como abierta.",
        },
        {
          selector:
            'CallExpression[callee.property.name=/^(eq|neq)$/] > Literal[value="cubierta"]',
          message:
            "Filtra por lo que está abierto y no por lo que no está cubierto: .in('status', [...OPEN_STATUSES]) de lib/needs.ts.",
        },

        // Y nadie vuelve a contar aportes a mano, por lo mismo.
        //
        // El contador de «Quiero ayudar» tiene la misma forma de romperse que
        // tenían las necesidades abiertas: es un número con un rótulo, sale de un
        // conjunto que hay que filtrar —lo rechazado no cuenta, lo de un municipio
        // sin publicar tampoco— y nadie lo compara con nada al mirarlo. La
        // diferencia es dónde vive la definición: allí en JavaScript, y aquí en la
        // vista `public.offer_tally` (0015), porque el público no puede leer la
        // tabla de ofertas.
        //
        // Eso deja una sola cosa que proteger desde el lint, que es que haya UNA
        // puerta a ese número. Con dos consultas, la segunda acabaría con su
        // propio filtro y el portal diría dos cifras del mismo día. El nombre de
        // la vista se escribe una vez, en `CONTRIBUTION_TALLY_VIEW`, y quien lo
        // necesite pasa por `getContributionTally()`.
        //
        // Lo que esta regla no puede demostrar —igual que la de arriba— es que
        // las pantallas rotulen el número con las frases de lib/contributions.ts.
        // Lo que sí hace es que solo haya un sitio donde cambiarlas.
        {
          selector: 'Literal[value="offer_tally"]',
          message:
            "El contador sale de getContributionTally() y de ningún otro sitio: el nombre de la vista se escribe una vez, en lib/contributions.ts. Ver ahí qué cuenta exactamente.",
        },
        {
          selector: 'Literal[value="city_offer_activity"]',
          message:
            "El movimiento hacia un pueblo sale de getCityCards() y de ningún otro sitio: el nombre de la vista se escribe una vez, en lib/city-activity.ts.",
        },
      ],
    },
  },
  {
    // Los archivos que definen la palabra tienen que poder escribirla.
    files: ["lib/needs.ts", "lib/contributions.ts", "lib/city-activity.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
