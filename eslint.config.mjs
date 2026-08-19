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
  {
    // ---------------------------------------------------------------------
    // El registro sobrio: dónde el color de marca no sube la voz
    //
    // La paleta sale de una lámina de una tienda de plantas de interior, y es
    // alegre por eso. Este portal publica fichas de personas identificables
    // —con nombre, con retrato y con el consentimiento firmado— cuya casa se
    // cayó en un terremoto. La misma paleta tiene que sostener las dos cosas,
    // así que se parte en dos registros: abierto en la portada, la navegación,
    // el mapa, los listados, `/donaciones` y las páginas que piden algo; sobrio
    // en la ficha de una persona y en las tarjetas que llevan su cara y su
    // nombre.
    //
    // El criterio de esta lista es el retrato, no la ruta. `/donaciones` es una
    // página de invitación y su cabecera va en registro abierto, pero la rejilla
    // de causas de esa misma página enseña la foto y el nombre de las cinco
    // personas publicadas: `DonationCauseCard` está aquí por eso, y estaría aquí
    // igual si viviera en la portada. Al revés también: una tarjeta sin cara
    // —`CityRow`, `NeedRow`, `OfferRow`— no entra en la lista aunque nombre de
    // pasada el caso del que sale, porque un nombre en `faint` de doce píxeles
    // no es un retrato.
    //
    // Esto vive en el lint y no solo en MARCA.md porque un criterio escrito en
    // un documento se lo salta cualquiera con buena intención: la portada queda
    // bien con un bloque de brote, y de ahí a copiarlo en la ficha de un caso
    // hay un `cmd+C`. Nadie lo hace de mala fe y nadie lo revisa después.
    //
    // Lo que se prohíbe son las piezas del registro abierto: las cintas
    // onduladas, `brote` y `liana` a plena potencia, y `lavanda`. Lo que NO se
    // prohíbe es `selva` ni `accent`: son los dos que funcionan en los dos
    // registros, y sin ellos la ficha de un caso se quedaría sin marca.
    //
    // Si algún día hay que romperlo, se rompe aquí y a la vista, no en la
    // pantalla.
    // ---------------------------------------------------------------------
    files: [
      "app/**/casos/*/page.tsx",
      "components/case/**",
      "components/cards/CaseRow.tsx",
      "components/cards/CaseBigCard.tsx",
      // Lleva la foto de portada de la causa y su nombre encima, así que es una
      // tarjeta con la cara de alguien aunque viva en la carpeta de donaciones.
      // La página que la contiene sí es del registro abierto: la regla mira el
      // retrato y no la ruta.
      "components/donations/DonationCauseCard.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/(cintas|bg-brote|bg-liana|bg-lavanda|border-brote|border-lavanda|text-brote)/]",
          message:
            "Registro sobrio: en la ficha de una persona no van cintas ni campos de brote, liana o lavanda. La foto y el nombre son lo único que puede levantar la voz aquí. Usa `selva`, `accent` y la escala de necesidad. Ver MARCA.md, «Los dos registros».",
        },
        {
          selector:
            "TemplateElement[value.raw=/(cintas|bg-brote|bg-liana|bg-lavanda|border-brote|border-lavanda|text-brote)/]",
          message:
            "Registro sobrio: en la ficha de una persona no van cintas ni campos de brote, liana o lavanda. Ver MARCA.md, «Los dos registros».",
        },
        {
          selector: "Identifier[name=/^(blockDark|blockLive|blockInvite)$/]",
          message:
            "Las tres superficies de bloque son del registro abierto: llevan cintas o color a plena potencia. En la ficha de una persona se usan `card` y `panel`. Ver MARCA.md, «Los dos registros».",
        },
        {
          selector: 'MemberExpression[object.name="button"][property.name="invite"]',
          message:
            "`button.invite` es el botón de brote del registro abierto. En la ficha de una persona la acción principal es `button.primary`, que es el bloque de selva. Ver MARCA.md, «Los dos registros».",
        },
      ],
    },
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
