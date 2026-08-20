import Link from "next/link";
import {
  CHOCO_PATH,
  CITY_LABEL,
  LABEL_BASELINE,
  LABEL_HALO,
  labelHitBox,
  labelPercent,
  leaderFor,
  LAND_LABEL,
  OCEAN_LABEL,
  PERCENT_GAP,
  PERCENT_LABEL,
  placeLandLabel,
  placeOceanLabel,
  placePins,
  shapeLabelSpot,
  viewBoxAttr,
  type MapPin,
} from "@/lib/choco-map";
import { COLOMBIA_PATH } from "@/lib/colombia-map";
import { townByName } from "@/lib/choco-towns";
import { plural } from "@/lib/format";
import {
  paintMunicipalities,
  TIER_FILL,
  type NeedsTier,
} from "@/lib/needs-scale";

type Props = {
  pins: MapPin[];
  /** Construye el enlace de cada municipio documentado. Sin esto el mapa es un
   *  dibujo: se usa así en la ficha, donde no hay a dónde ir. */
  hrefFor?: (pin: MapPin) => string;
  /** Municipio del recado: lleva contorno de tinta, que es la marca de "este
   *  es". No es lo mismo que estar bajo el cursor y no se parece. */
  activeSlug?: string;
  /** Solo la silueta y el punto, para usos diminutos donde el mosaico se
   *  convertiría en papilla: a 96 px de ancho, la separación entre municipios
   *  mide menos de medio píxel. */
  bare?: boolean;
  /** Prefijo de los identificadores de las treinta formas. Solo hay que dárselo
   *  al segundo mosaico de una misma página, y el motivo está en `SHAPE`. */
  prefix?: string;
  /** El tamaño lo decide quien lo usa: /mapa lo limita en alto, la ficha de un
   *  municipio en ancho.
   *
   *  Sin `bare` tiene que venir de las dos dimensiones, y no es un capricho: el
   *  mosaico declara su caja como contenedor de CSS para saber a qué escala se
   *  está dibujando —de eso depende que el porcentaje del rótulo solo salga donde
   *  se lee, ver `.map-box`—, y un contenedor de tamaño no mira su contenido, así
   *  que un alto sacado de la proporción del encuadre se quedaría en cero. Medido:
   *  el mapa de la ficha, que pide `h-auto w-20`, pasa de 80 × 111 px a 80 × 0. */
  className: string;
};

/**
 * Lechada del mosaico, en píxeles. Es la pieza de la que depende que el filete
 * entre municipios pueda ser de pelo en vez de una franja de cuatro píxeles.
 *
 * Va DEBAJO de los treinta rellenos, así que dentro de cada municipio la tapa su
 * propio color y no le cuesta ni un píxel de superficie a nadie. Lo único que se
 * ve de ella es lo que asoma por las costuras del catálogo: el mosaico del DANE
 * no es una teselación perfecta ni después de soldarlo —quedan 103 manchas de
 * hueco interior y la más ancha mide 5,6 unidades, 2,4 px a 390×844; está medido
 * en lib/choco-texture.ts—. Sin lechada, con un filete de pelo, esos huecos
 * dejarían ver el respaldo por una rendija con forma de costura.
 *
 * Seis píxeles porque la mitad cae de cada lado, y tres tienen que llegar a cubrir
 * los 2,4 px del hueco más ancho.
 *
 * VA RECORTADA CON LA SILUETA, y eso es la mitad de la decisión: ver el
 * `clipPath` de las definiciones. Sin recortar, sus tres píxeles de fuera dibujan
 * una banda gris a lo largo de toda la costa, que es el defecto que vino a
 * arreglar.
 *
 * Y de paso: el «borde gris» del lado izquierdo del Bajo Baudó eran TRES grises
 * seguidos y ninguno era la costa. Medido píxel a píxel cruzando ese litoral a la
 * altura y = 682,5: papel 3,0 px · `land` 3,0 px · papel 4,0 px · relleno del
 * municipio. El primero era la almohadilla de 18 unidades de `land` de la silueta
 * —7,6 px, de los que se veían 3,8—, el tercero el canal de papel de la pieza, y
 * en medio asomaba el relleno de la propia silueta, que llega hasta 5,7 unidades
 * más al oeste que el mosaico porque los dos catálogos vienen simplificados por
 * separado. Los tres se han ido: la almohadilla y el canal ya no existen, y lo
 * que la silueta se adelanta lo cierra su propio filete de tinta.
 */
const GROUT = 12;

/**
 * LOS TRAZOS DEL MOSAICO SE MIDEN EN PÍXELES, NO EN UNIDADES DEL DIBUJO.
 *
 * El mapa no tiene un tamaño: medido en el navegador, el mosaico se dibuja a 262
 * px de ancho en un teléfono, a 529 en una tableta y a entre 278 y 464 en
 * escritorio, según lo alta que sea la ventana. Son más del doble de diferencia,
 * y con trazos proporcionales eso significa que la misma señal vale el doble en
 * un sitio que en otro: el contorno del municipio elegido salía a 2,1 px en la
 * tableta y a 0,7 px en un escritorio bajo, o sea que desaparecía justo donde el
 * mapa ya es más pequeño.
 *
 * Con `non-scaling-stroke` el grosor se mide después de la escala, así que la
 * separación entre municipios, el filete del cursor y la tinta del elegido miden
 * lo mismo en cualquier pantalla. Es lo que hace cualquier mapa de verdad: el
 * dibujo se acerca, el grosor del linde no.
 *
 * Va en las formas declaradas y no en las capas porque `vector-effect` no se
 * hereda: puesto aquí, lo recogen las cuatro capas que las reutilizan.
 */
const NON_SCALING = "non-scaling-stroke";

/**
 * Radio del asidero de un municipio documentado, en unidades del viewBox: unos
 * 14 px de diámetro en un teléfono. Ver la capa de frente.
 */
const GRIP_RADIUS = 16;

/**
 * Prefijo de los identificadores de las treinta formas, y el que usa cualquier
 * mosaico que no pida otro.
 *
 * Las formas se declaran una vez y las capas las reutilizan con `<use>`: son
 * doce kilobytes de trazado y hacen falta cuatro veces (color, canal, elegido y
 * frente). Repetirlas costaría 36 KB de HTML en cada visita, y /mapa se sirve en
 * caliente. El precio es que dos mosaicos en la misma página declararían los
 * mismos identificadores, y ante dos `id` iguales el navegador se queda con el
 * que llegó antes: las cuatro capas del segundo dibujarían las formas del
 * primero. De ahí la prop `prefix`, que es lo único que hace falta darle a ese
 * segundo mosaico —el Chocó dentro de Colombia, por ejemplo— para que sus
 * formas sean suyas.
 */
const SHAPE = "choco-mun-";

/**
 * El Chocó como mosaico de sus 30 municipios, coloreados por cuánto falta
 * por cubrir.
 *
 * Sin JavaScript y sin servicio de mapas: es SVG renderizado en el servidor y
 * los enlaces son <a>, así que /mapa funciona con la señal del Chocó y
 * compartido por WhatsApp. Las formas son del DANE (lib/choco-texture) y no se
 * mueven nunca: no hay cámara, ni zoom, ni máscara, ni detalle de calles.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTÁ EN CAPAS POR OFICIO Y NO EN UNA PIEZA POR MUNICIPIO
 *
 * En SVG no hay z-index: manda el orden del documento. Mientras cada municipio
 * era un grupo con su relleno y su filete de papel, resaltar uno no servía de
 * nada, porque los treinta se pintan en cadena y los que van escritos DESPUÉS le
 * pintaban encima el filete y el color. Medido en el navegador sobre el contorno
 * de la forma resaltada: a Atrato le tapaban 278 de 360 puntos Lloró, Cértegui y
 * Río Quito; a Cértegui, 265; a Istmina, 229 entre seis vecinos. Y los tres que
 * salían limpios eran justo los que se escriben al final. El `z-index: 4` del
 * hover se calculaba —el navegador lo informaba— y no hacía absolutamente nada.
 *
 * Así que el mosaico se ordena por oficio, y el orden de pintado deja de ser un
 * accidente del catálogo del DANE:
 *
 *   1. silueta   el departamento con su filete de tinta, que es lo que lo recorta
 *                del agua de la ventana. Ver el `<use>` de `.map-edge`.
 *   2. lechada   los treinta contornos gruesos, DEBAJO de los rellenos y
 *                recortados con la silueta: tapan las costuras del catálogo sin
 *                costar superficie ni salirse a la costa. Ver `GROUT`.
 *   3. color     los treinta rellenos. Son colindantes, no se solapan.
 *   4. linde     el filete de los treinta, DE UNA VEZ y encima de todos los
 *                colores. Antes cada uno pintaba el suyo, y el del último mordía
 *                el relleno del primero: la separación salía distinta según
 *                quién estuviera escrito antes.
 *   5. elegido   el contorno de tinta del municipio del recado. Uno como mucho.
 *   6. frente    los treinta otra vez, invisibles, y ES LO ÚNICO QUE RECIBE EL
 *                CURSOR. El que está debajo del puntero se enciende aquí, encima
 *                de todo el mosaico. Como en esta capa nunca hay más de uno
 *                visible, que un vecino le pinte encima no es que no pase: no
 *                puede pasar. Aquí va también el nombre de las formas sin
 *                documentar, que aparece con la pieza y no está escrito en
 *                ninguna otra parte del dibujo.
 *   7. rótulos   guías, puntos y nombres. Un nombre no lo tapa nada.
 *
 * Nada de esto necesita JavaScript ni `:has()`: es `<use>`, `:hover` y
 * `:focus-visible`, que existen desde siempre.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ EL FILETE ES DE PELO Y NO DE CUATRO PÍXELES
 *
 * Un trazo de SVG se pinta centrado en el trazado, así que la mitad cae DENTRO
 * de la forma. El filete de separación medía cuatro píxeles, o sea dos por
 * dentro de cada municipio, y en un mosaico de astillas eso no es un detalle:
 * medido en el navegador a 390×844, pintando una pieza de un color que no está
 * en la paleta y contando sus píxeles con el filete puesto y quitado, las
 * treinta juntas pasaban de 25.935 px² de color a 17.606. **El 32 % del mapa se
 * lo comía la separación.** Y no repartido: Unión Panamericana perdía el 91 %
 * (95 px² de color reducidos a 8), Río Iró el 74 %, el Medio San Juan el 72 %,
 * Nuquí el 68 %, el Cantón del San Pablo el 68 % y Bahía Solano el 59 %. La
 * cuenta cuadra con la geometría: el círculo inscrito más grande de Unión
 * Panamericana mide 5,9 px de diámetro a ese tamaño, así que dos píxeles por
 * cada lado no le dejan nada.
 *
 * Y encima ese filete era de PAPEL, que contra el gris de «sin documentar» está
 * a 1,06:1: entre dos vecinos sin documentar —que son 27 de los 30— no se veía
 * absolutamente nada. Pagaba el 32 % del color por dibujar una línea invisible.
 *
 * Ahora el filete es de `contour`, que es para lo que existe esa ficha («el
 * filete entre municipios del mapa», MARCA.md), y mide 1,25 px, el mismo pelo
 * que la guía de un rótulo. Contra los cinco tramos da 2,19 · 1,26 · 1,14 ·
 * 1,69 · 3,42 : 1, y el caso que de verdad importa es el primero, gris contra
 * gris, porque es el 90 % de los lindes del mapa. Cuesta el 11 % en vez del
 * 33 %, y lo que la lechada de debajo garantiza es que ese pelo no tenga que
 * hacer además de tapadera de las costuras del catálogo.
 */
export function ChocoMap({
  pins,
  hrefFor,
  activeSlug,
  bare = false,
  prefix = SHAPE,
  className,
}: Props) {
  const painted = paintMunicipalities(pins);
  // Los documentados van al final de las capas: son el contenido del mapa, así
  // que su asidero manda sobre el de un vecino sin documentar (ver la capa de
  // frente) y su color entra en escena después del gris.
  const layered = [...painted].sort(
    (a, b) => Number(a.tier !== "blank") - Number(b.tier !== "blank"),
  );
  const placed = placePins(pins);
  const ocean = bare ? null : placeOceanLabel(placed);
  const inland = bare ? null : placeLandLabel(placed);
  const active = activeSlug
    ? painted.find((shape) => shape.city?.slug === activeSlug)
    : undefined;
  const interactive = Boolean(hrefFor) && !bare;
  const spotOf = new Map(placed.map((pin) => [pin.slug, pin]));

  return (
    <svg
      viewBox={viewBoxAttr}
      className={bare ? className : `map-box ${className}`}
      overflow="visible"
      role={interactive ? "group" : "img"}
      aria-label={
        bare
          ? "Situación del municipio dentro del Chocó"
          : `Mapa del Chocó con ${plural(pins.length, "municipio documentado", "municipios documentados")}`
      }
    >
      {bare ? (
        /* El filete va en PÍXELES y no en unidades, y aquí es donde más falta
           hace: este mapa se dibuja a 80 px de ancho en la ficha de un
           municipio, o sea 0,111 px por unidad, así que las 2,5 unidades que
           llevaba antes salían a 0,28 px —un cuarto de píxel— y la silueta se
           quedaba sin contorno. Y sin contorno no se ve: `land` sobre el papel
           de la tarjeta está a 1,05:1, que es el mismo problema de blanco sobre
           blanco del tablero grande, en pequeño. Con la línea de `selva` a un
           píxel y cuarto la silueta se recorta a 12,40:1. */
        <path
          d={CHOCO_PATH}
          className="fill-land stroke-selva"
          strokeWidth={1.25}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect={NON_SCALING}
        />
      ) : (
        <>
          {/* Dos lecturas, de atrás hacia adelante: el resto de Colombia en
              verde-gris y el Chocó en la escala. El agua no se pinta. Un campo
              de azul a sangre sobre el viewBox entero se lleva el dibujo por
              delante: ocupa más área que el departamento y compite con la
              escala de color, que es el único dato del mapa. Como en una carta
              impresa, el Pacífico se queda en el papel de la página y quien lo
              nombra es su rótulo. */}
          <path d={COLOMBIA_PATH} className="fill-tierra" />
          <defs>
            {/* `vector-effect` NO se hereda, así que va en la forma declarada y no
                en el `<use>` que la reutiliza: puesto arriba, el filete de 2,5 px
                se dibujaba a 2,5 unidades, o sea 1,06 px a 390×844, de los que se
                veía medio. Es el mismo motivo por el que lo llevan las treinta
                formas del mosaico (ver `NON_SCALING`), y aquí costó una captura. */}
            <path
              id={`${prefix}silueta`}
              d={CHOCO_PATH}
              vectorEffect={NON_SCALING}
            />
            {/* La lechada se recorta con la silueta, y esto es lo que hace que la
                costa sea UNA línea. Un trazo de SVG se pinta centrado, así que sin
                recortar los seis píxeles de lechada asoman tres por FUERA del
                departamento y dibujan una banda gris de `contour` sobre el papel
                de la ventana a lo largo de todo el litoral: exactamente el «borde
                gris» que se ve en el lado izquierdo del Bajo Baudó, otra vez y con
                otro nombre. Recortada, la lechada solo existe donde tiene trabajo
                —las costuras de dentro— y el borde del Chocó lo dibuja el filete
                de la silueta, que es una línea sola y de tinta. */}
            <clipPath id={`${prefix}dentro`}>
              <use href={`#${prefix}silueta`} />
            </clipPath>
            {layered.map((shape) => (
              <path
                key={shape.id}
                id={`${prefix}${shape.id}`}
                d={shape.d}
                vectorEffect={NON_SCALING}
              />
            ))}
          </defs>

          {/* EL CONTORNO DEL DEPARTAMENTO, que es la respuesta al blanco sobre
              blanco de dentro de la ventana.

              El problema, medido: `need-blank` (#e4e9e0) contra el papel de la
              ventana está a 1,14:1 y contra `land` a 1,04:1. Con 27 de 30 sin
              documentar, el Chocó y el agua de alrededor eran el mismo gris, y no
              hay forma de arreglarlo con un relleno: el escalón más grande que
              queda entre `need-blank` y una superficie clara del sistema es 1,23:1
              (contra el blanco de `panel-high`). O sea que la separación NO puede
              ser de tono, y tiene que ser una línea. `selva` sobre el papel de la
              ventana da 12,40:1: el departamento se recorta del agua de golpe.

              Va ENTERA POR FUERA de la silueta, con `paint-order: stroke fill`: el
              trazo se pinta antes del relleno y la mitad de dentro la tapa el
              propio respaldo. Es el mismo truco que el filete del Chocó dentro de
              Colombia, y aquí hace falta por lo mismo: por dentro empiezan los
              municipios de la costa, y una astilla como Bahía Solano —21 px en la
              parte más gruesa a 390×844— no puede pagar píxel y cuarto de tinta por
              cada lado.

              Dos veces y media el pelo del linde (1,25 px), y esa proporción es la
              jerarquía del dibujo: el perímetro del territorio es la línea fuerte,
              la división interna es la débil. Al revés el mapa se lee como treinta
              cosas y no como una. */}
          <use
            href={`#${prefix}silueta`}
            className="map-edge fill-need-blank stroke-ink"
            strokeWidth={2.5}
            aria-hidden
          />

          <g
            className="map-grout"
            strokeWidth={GROUT}
            clipPath={`url(#${prefix}dentro)`}
            aria-hidden
          >
            {layered.map((shape) => (
              <use key={shape.id} href={`#${prefix}${shape.id}`} />
            ))}
          </g>

          <g className="map-body" aria-hidden>
            {layered.map((shape, index) => (
              <use
                key={shape.id}
                href={`#${prefix}${shape.id}`}
                className={`map-fill ${TIER_FILL[shape.tier]}`}
                data-tier={shape.tier as NeedsTier}
                style={{ ["--i" as string]: index }}
              />
            ))}
          </g>

          <g className="map-linde" aria-hidden>
            {layered.map((shape) => (
              <use key={shape.id} href={`#${prefix}${shape.id}`} />
            ))}
          </g>

          {/* El elegido, con su propia capa por encima del linde: el contorno de
              tinta no se puede quedar a medias porque el papel de un vecino se
              pinte después. El aro que late es la llamada de atención y se va; la
              línea de tinta es el estado y se queda, que es lo que hace que
              siga diciéndolo sin movimiento. */}
          {active && (
            /* Lleva su tramo escrito como los puntos y las guías, y por lo mismo:
               el filtro de la leyenda apaga lo que no es de su color, y esta capa
               repinta el municipio del recado por encima del mosaico. Sin el
               tramo era la única pieza del tablero que no se enteraba de que
               estaban preguntando por otro. */
            <g className="map-chosen" data-tier={active.tier} aria-hidden>
              <use
                href={`#${prefix}${active.id}`}
                className="map-chosen-pulse"
              />
              <use href={`#${prefix}${active.id}`} className="map-chosen-pad" />
              <use
                href={`#${prefix}${active.id}`}
                className="map-chosen-line"
              />
              {/* Y su color otra vez encima de la línea, que es lo que la deja
                  ENTERA POR FUERA de la forma. Sin esta cuarta pasada la mitad
                  del trazo cae dentro, y a los municipios que son una astilla
                  —Bahía Solano mide veinticinco unidades de ancho— el contorno
                  se les comía un cuarto del color. Marcar un pueblo no puede
                  costarle el dato que lo pinta. */}
              <use
                href={`#${prefix}${active.id}`}
                className={`map-chosen-face ${TIER_FILL[active.tier]}`}
              />
            </g>
          )}

          <g className="map-front">
            {layered.map((shape) => {
              const href = shape.city && hrefFor ? hrefFor(shape.city) : null;
              const spot = shape.city ? spotOf.get(shape.city.slug) : undefined;
              const covered = shape.city ? labelPercent(shape.city) : null;
              // El DANE escribe las preposiciones con mayúscula —«El Litoral Del
              // San Juan»—, y mientras el nombre solo salía en el <title> del
              // navegador eso no se veía. Ahora se lee sobre el mapa, así que se
              // pide el nombre presentable donde ya está resuelto para los
              // treinta en vez de escribir una segunda tabla que se desincronice.
              const name =
                shape.city?.name ?? townByName(shape.name)?.name ?? shape.name;
              const tag = shape.city ? null : shapeLabelSpot(shape, placed);

              const body = (
                <>
                  <title>{name}</title>
                  <use
                    href={`#${prefix}${shape.id}`}
                    className={`map-shape ${TIER_FILL[shape.tier]}`}
                  />
                  {/* Dos asideros invisibles, y los dos son para el pulgar. Hay
                      municipios que son una astilla —la parte más gruesa de
                      Bahía Solano mide 21 px en un teléfono— y acertarles la
                      forma es un juego. Uno rodea el punto; el otro es el
                      NOMBRE, que es el blanco más grande y más fácil que tiene
                      un municipio y al que de hecho apunta la gente. Ninguno se
                      ve; los dos abren el pueblo al que pertenecen, y por eso
                      pasar por encima del nombre también lo enciende.

                      Y el del nombre es la CAJA DE LA TINTA, no la de la
                      colocación, que es lo que costaba seis municipios. Estas
                      piezas son las últimas de la capa, así que reciben el
                      cursor antes que nadie; con la caja de colocación —que
                      lleva ocho unidades de holgura a cada lado y un renglón
                      entero de alto— el asidero de «Istmina» tapaba Condoto, el
                      Río Iró, Tadó y Unión Panamericana, y el de «Quibdó» tapaba
                      Lloró y el Carmen de Atrato: medido señalando el punto más
                      hondo de cada forma, 24 de los 30 municipios respondían y
                      6 abrían el vecino documentado. Con la caja de la tinta el
                      asidero es exactamente la palabra que se ve, que es lo
                      único que alguien cree estar tocando. */}
                  {href && spot && (
                    <>
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={GRIP_RADIUS}
                        fill="transparent"
                        pointerEvents="fill"
                      />
                      <rect
                        {...labelHitBox(spot)}
                        fill="transparent"
                        pointerEvents="fill"
                      />
                    </>
                  )}
                </>
              );

              return href && shape.city ? (
                <Link
                  key={shape.id}
                  href={href}
                  scroll={false}
                  className="map-piece map-link"
                  aria-label={
                    covered
                      ? `${shape.city.name}, ${covered} cubierto`
                      : shape.city.name
                  }
                >
                  {body}
                </Link>
              ) : (
                /* Una pieza sin documentar no lleva a ninguna parte, y aun así es
                   una de las treinta: se puede señalar y dice cómo se llama.
                   Responde al cursor y al toque, y NO al tabulador.

                   El `-1` es exactamente eso: la hace enfocable al tocarla —de
                   ahí vive el `:focus` con el que el nombre se queda quieto
                   debajo del pulgar, que en un teléfono es la única manera de
                   leerlo— y la deja fuera del recorrido del teclado. Fuera es
                   donde le toca: no es un control, no tiene destino y no cambia
                   nada, así que en el recorrido serían veintisiete paradas que no
                   hacen nada DELANTE de los tres enlaces del mapa —los
                   documentados se pintan al final para que su asidero mande sobre
                   el del vecino, y el orden de pintado es también el del
                   tabulador—. Quien recorre el mapa con el teclado va a los tres
                   sitios a los que se puede ir.

                   Y sigue siendo una imagen con nombre, que es lo que hace que el
                   dato no se pierda: el municipio y su estado están en el árbol de
                   accesibilidad, donde se llega recorriendo el mapa y no
                   tabulando. El `role` no se contradice con el del `<svg>` porque
                   solo se pone donde el mosaico es un grupo; en la lámina de la
                   portada el `<svg>` entero es UNA imagen y dentro de una imagen
                   no hay nada que nombrar ni que recorrer. */
                <g
                  key={shape.id}
                  className="map-piece"
                  tabIndex={interactive ? -1 : undefined}
                  role={interactive ? "img" : undefined}
                  aria-label={
                    interactive ? `${name}, sin documentar` : undefined
                  }
                >
                  {body}
                  {/* El nombre, centrado en el tramo más ancho de la forma. No
                      recibe el puntero, y eso no es un detalle: en reposo está a
                      opacidad cero, pero un elemento invisible sigue recibiendo
                      el cursor, así que las cajas de nombre repartidas por el
                      mapa se lo robarían a las formas de debajo.

                      Lleva el cuerpo del rótulo fijo, `CITY_LABEL`, y no uno
                      propio. Es el mismo dato en la misma pantalla —el nombre de
                      un municipio del Chocó, leído a la misma distancia— y para
                      veintisiete de los treinta es el ÚNICO sitio donde se lee,
                      así que si algo necesita el cuerpo entero es este. Y además
                      la cuenta lo exige: `shapeLabelSpot` busca este hueco
                      midiendo con `CITY_LABEL`, así que un cuerpo aparte aquí
                      buscaría sitio para un ancho que no es el que se dibuja. */}
                  {tag && (
                    <text
                      className="map-tag fill-muted stroke-paper"
                      x={tag.x}
                      y={tag.y + LABEL_BASELINE}
                      textAnchor="middle"
                      fontSize={CITY_LABEL.fontSize}
                      letterSpacing={CITY_LABEL.letterSpacing}
                      strokeWidth={LABEL_HALO}
                      style={{ paintOrder: "stroke" }}
                      pointerEvents="none"
                      aria-hidden
                    >
                      {name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </>
      )}

      {ocean && (
        <text
          x={ocean.x}
          y={ocean.y}
          className="fill-faint"
          fontSize={OCEAN_LABEL.fontSize}
          letterSpacing={OCEAN_LABEL.letterSpacing}
          transform={`rotate(-90 ${ocean.x} ${ocean.y})`}
          textAnchor="middle"
        >
          {OCEAN_LABEL.text}
        </text>
      )}

      {inland && (
        <text
          x={inland.x}
          y={inland.y}
          className="fill-muted"
          fontSize={LAND_LABEL.fontSize}
          letterSpacing={LAND_LABEL.letterSpacing}
          transform={`rotate(90 ${inland.x} ${inland.y})`}
          textAnchor="middle"
        >
          {LAND_LABEL.text}
        </text>
      )}

      <g pointerEvents="none">
        {/* Las guías van todas juntas y antes de los nombres: cada nombre lleva
            un halo de papel, así que si un rótulo y una guía ajena se cruzan,
            gana el rótulo. Con una guía por pueblo dentro de su propio grupo, la
            del último cruzaba el nombre del primero. */}
        <g className="map-leaders" aria-hidden>
          {placed.map((pin) => {
            const leader = leaderFor(pin);
            return leader ? (
              <line
                key={pin.id}
                data-tier={tierOf(painted, pin.slug)}
                className="map-leader"
                {...leader}
              />
            ) : null;
          })}
        </g>

        {placed.map((pin) => {
          const isActive = pin.slug === activeSlug;
          const covered = labelPercent(pin);

          return (
            <g
              key={pin.id}
              data-tier={tierOf(painted, pin.slug)}
              className="map-pin"
            >
              <circle
                cx={pin.x}
                cy={pin.y}
                r={bare ? 15 : isActive ? 7.5 : 6.5}
                className={`stroke-paper ${bare ? "fill-accent" : "fill-ink"}`}
                strokeWidth={bare ? 5 : isActive ? 4 : 3}
              />

              {!bare && (
                <text
                  x={pin.labelX}
                  y={pin.labelY + LABEL_BASELINE}
                  textAnchor={pin.anchor}
                  fontSize={CITY_LABEL.fontSize}
                  letterSpacing={CITY_LABEL.letterSpacing}
                  fontWeight={isActive ? 600 : 500}
                  className={`stroke-paper ${isActive ? "fill-ink" : "fill-body"}`}
                  strokeWidth={LABEL_HALO}
                  style={{ paintOrder: "stroke" }}
                >
                  {pin.name}
                  {/* El avance, en el mismo rótulo y no en un renglón aparte: es
                      la precisión de quien ya está tocando el mapa, y el color de
                      la forma sigue siendo lo que se lee a un metro. Va detrás
                      del nombre en los dos márgenes —el rótulo se voltea, el
                      orden de lectura no— y tabular para que treinta números
                      apilados no bailen de ancho. Qué mide exactamente está en
                      `labelPercent`: es lo cubierto, lo mismo que la tarjeta.
                      Llega siempre en el HTML, y a qué tamaños se enseña lo
                      decide la hoja de estilos midiendo la caja del mapa; el
                      porqué está en `PERCENT_LABEL`. */}
                  {covered && (
                    <tspan
                      className="map-percent fill-muted tabular-nums"
                      dx={PERCENT_GAP}
                      fontSize={PERCENT_LABEL.fontSize}
                      letterSpacing={PERCENT_LABEL.letterSpacing}
                      fontWeight={500}
                    >
                      {covered}
                    </tspan>
                  )}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

const tierOf = (
  painted: { tier: NeedsTier; city: { slug: string } | null }[],
  slug: string,
) => painted.find((shape) => shape.city?.slug === slug)?.tier ?? "blank";
