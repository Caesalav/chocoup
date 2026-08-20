"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/ui/Photo";
import { BackIcon } from "@/components/ui/icons";
import { iconOnPhoto, shell } from "@/components/ui/styles";
import { savedFrame } from "@/lib/photo-frame";
import type { Photo as PhotoRow } from "@/lib/types";

/**
 * SIETE SEGUNDOS POR FOTO.
 *
 * El número sale de lo que hay que hacer con cada imagen, no de lo que tarda en
 * cansar: son fotos de campo sin componer —una fachada agrietada, el suelo de un
 * coliseo con colchones— y hasta entender qué se está mirando pasan tres o cuatro
 * segundos. A cinco el carrete va justo; a siete se puede mirar y volver a la
 * página, que es donde está lo que se ha venido a leer.
 *
 * Y hay un umbral encima: WCAG 2.2.2 exige poder parar cualquier cosa que se
 * mueva sola más de cinco segundos. Con siete se cae de lleno dentro, así que la
 * parada no es una cortesía: es la condición para que esto exista. Lo de abajo
 * es cómo se para.
 */
const PHOTO_STEP_MS = 7000;

/**
 * Igual que en la apertura del mapa (MapIntro): con `prefers-reduced-motion` el
 * automático no se suaviza, no llega a existir. Se pregunta en cada latido —y no
 * solo al montar— porque este temporizador vive lo que dure la visita a la
 * ficha, y quien enciende la preferencia a mitad de camino la enciende para ya.
 * También decide el salto de una barra: instantáneo en vez de desplazado.
 */
function motionOff() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Las fotos del caso, a sangre y una detrás de otra.
 *
 * El carrete es desplazamiento con ajuste de CSS: se pasa con el dedo sin que
 * intervenga JavaScript, y esa parte funciona siempre. Encima de eso el cliente
 * añade tres cosas, y las tres están pensadas para poder faltar:
 *
 *   - se entera de en cuál estás, para encender su tramo del indicador y cambiar
 *     el pie de foto;
 *   - pasa las fotos solo, una vez;
 *   - y en escritorio pone dos flechas.
 *
 * LAS BARRAS SON ENLACES Y NO BOTONES, y ahí está la parte que importa: cada
 * foto lleva un ancla y cada barra apunta a la suya, así que sin JavaScript la
 * barra sigue llevando a su foto —el navegador desplaza el carrete él solo, que
 * es lo mismo que hace el «Donar» de la barra fija cuando salta a la sección del
 * dinero—. Con JavaScript se le quita el salto para no ensuciar el historial con
 * una entrada por foto mirada.
 *
 * Las flechas no pueden hacer eso: «la siguiente» depende de dónde estás, y eso
 * no se sabe escribir en un HTML quieto. Así que sin JavaScript no aparecen, por
 * el mismo motivo por el que no aparece el botón de copiar la llave: un mando que
 * no hace nada es peor que ninguno.
 *
 * Sin JavaScript el indicador marca la primera, que es la que se está viendo al
 * abrir, y de ahí no se mueve. Tampoco se movía antes al pasar las fotos con el
 * dedo: lo que dice es dónde empieza el carrete y cuántas hay, y eso es cierto en
 * los dos casos.
 *
 * Tramos y no puntos, como en la referencia: con cuatro fotos los puntos son
 * cuatro motas de dos píxeles y no se distingue cuál está encendida.
 */
export function PhotoGallery({
  photos,
  className = "",
  showCaption = true,
  auto = true,
}: {
  photos: Pick<PhotoRow, "id" | "storage_path" | "caption" | "focus_x" | "focus_y" | "zoom">[];
  className?: string;
  /** En la ficha el titular va sobre la foto y el pie se comería. */
  showCaption?: boolean;
  /**
   * El paso automático. Se puede apagar desde la pantalla que monta el carrete
   * sin tocar nada de aquí: en una ficha con retrato y nombre encima es una
   * decisión de tono, no de componente.
   */
  auto?: boolean;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);

  /**
   * El mando ya está en otra mano.
   *
   * Es el único estado que añade el paso automático, y se enciende y no se apaga:
   * en cuanto alguien pasa el cursor, enfoca con el teclado, arrastra con el dedo
   * o pulsa una barra, el carrete deja de moverse solo PARA EL RESTO DE LA VISITA.
   * Volver a arrancarlo al soltar el ratón —que es lo que hace casi cualquier
   * carrusel— es cambiarle la foto a alguien en el momento en que está decidiendo
   * cuál mirar; y aquí, además, lo que hay debajo del velo es la casa de una
   * familia con nombre y apellido, no un escaparate.
   */
  const [stopped, setStopped] = useState(false);

  const many = photos.length > 1;
  const caption = photos[index]?.caption ?? "";

  /**
   * UNA SOLA PASADA, y al llegar a la última se queda.
   *
   * No es una limitación: es la regla de movimiento de la casa —«nada se mueve en
   * bucle infinito salvo el latido de la acción principal, y ese se detiene solo a
   * los pocos ciclos», ver el bloque «Movimiento» de app/globals.css—. Un carrete
   * dando vueltas al lado de un titular con el nombre de alguien es un anuncio; el
   * mismo carrete pasando las fotos una vez es alguien enseñándolas.
   *
   * El sitio donde estamos se lee del carrete y no del estado: el desplazamiento
   * es la única verdad de esta pieza y la lleva el navegador, así que sumarle uno a
   * lo que dice él no puede desincronizarse con el dedo.
   */
  useEffect(() => {
    const node = rail.current;
    if (!node || !auto || stopped || !many) return;
    if (motionOff()) return;

    const step = window.setInterval(() => {
      // Una pestaña que no se ve no tiene fotos que pasar. Igual que el sondeo del
      // registro de donaciones, que tampoco pregunta con la pestaña escondida.
      if (document.hidden || motionOff()) return;

      const at = Math.round(node.scrollLeft / node.clientWidth);
      if (at >= photos.length - 1) {
        window.clearInterval(step);
        return;
      }
      node.scrollTo({ left: node.clientWidth * (at + 1), behavior: "smooth" });
    }, PHOTO_STEP_MS);

    return () => window.clearInterval(step);
  }, [auto, many, photos.length, stopped]);

  /** Ir a una foto: lo pide una barra o una flecha, y las dos ceden el mando. */
  function show(position: number) {
    const node = rail.current;
    if (!node) return;
    setStopped(true);
    node.scrollTo({
      left: node.clientWidth * position,
      behavior: motionOff() ? "instant" : "smooth",
    });
  }

  return (
    <>
      {/* Sin JavaScript las flechas no sabrían cuál es la siguiente. La tira de
          barras sí funciona: son enlaces. */}
      <noscript>
        <style>{`.foto-flechas{display:none!important}`}</style>
      </noscript>

      <div
        className={`relative ${className}`}
        /* Las tres formas de tomar el mando que no pasan por un mando: el cursor
           por encima, el foco del teclado entrando en la pieza y el dedo
           arrastrando la foto. `onFocus` vale para toda la caja porque en React
           sube desde dentro. */
        onPointerEnter={() => setStopped(true)}
        onPointerDown={() => setStopped(true)}
        onFocus={() => setStopped(true)}
      >
        <ul
          ref={rail}
          onScroll={() => {
            const node = rail.current;
            if (!node) return;
            const next = Math.round(node.scrollLeft / node.clientWidth);
            setIndex((current) => (current === next ? current : next));
          }}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((photo, position) => (
            <li
              key={photo.id}
              id={`foto-${photo.id}`}
              className="size-full shrink-0 snap-center"
            >
              <Photo
                path={photo.storage_path}
                frame={savedFrame(photo)}
                alt={photo.caption || "Situación documentada"}
                eager={position === 0}
                className="size-full"
              />
            </li>
          ))}
        </ul>

        <span aria-hidden className="veil-t pointer-events-none absolute inset-x-0 top-0 h-28" />
        <span aria-hidden className="veil-b pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />

        {many && (
          /* La tira sigue midiendo lo mismo y estando donde estaba —el filete de
             3 px arranca a 24 px del borde—, pero ahora cada tramo es un enlace de
             44 px de alto, que es la medida del pulgar de components/ui/styles.ts.
             El alto se lo lleva el enlace y el aire entre barras es su relleno, no
             un hueco del flex: así la tira entera está viva y no hay franjas
             muertas de 6 px entre dos objetivos.

             Los 64 px de reserva a los lados son los 20 del margen del móvil
             (`shell`) más los 44 del mando redondo de la cabecera, que la página
             pinta después y por tanto gana el toque donde se cruzan. Por dentro de
             ellos la tira no llega a pisarlo: con ocho fotos —el caso más largo
             que hay— las barras encogen antes de desbordar y se quedan en 33 px de
             ancho en un teléfono de 390, y en 24 en uno de 320.

             Y la tira no recibe el dedo, solo las barras: su caja cruza la foto de
             lado a lado y entera se comería el arrastre de los 48 px de arriba,
             que es donde empieza el gesto cuando la mano viene de la cabecera. */
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center px-16">
            {photos.map((photo, position) => {
              const here = position === index;
              return (
                <a
                  key={photo.id}
                  href={`#foto-${photo.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    show(position);
                  }}
                  aria-current={here ? "true" : undefined}
                  aria-label={`Ver la fotografía ${position + 1} de ${photos.length}`}
                  /* El aro del foco va en papel y no en `accent`: encima de una
                     foto velada el verde de la marca se apaga, y es la misma
                     decisión que ya lleva `iconOnPhoto`. */
                  className="group pointer-events-auto flex h-11 w-[34px] items-center rounded-full px-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                >
                  <span
                    className={`h-[3px] w-full rounded-full transition-colors duration-200 ${
                      here ? "bg-paper" : "bg-paper/40 group-hover:bg-paper/70"
                    }`}
                  />
                </a>
              );
            })}
          </div>
        )}

        {many && (
          /* Solo de `lg` en adelante: en el móvil el carrete se arrastra con el
             dedo y dos pastillas encima le quitarían sitio a lo único que hay que
             mirar. Van en el mismo carril que los mandos de la cabecera (`shell`),
             así que las cuatro piezas comparten margen.

             El carril no recibe el dedo y los botones sí: sin eso, la banda que
             cruza el centro de la foto se comería el arrastre en una tableta
             ancha, que es donde las flechas ya existen y el dedo también. */
          <div
            className={`${shell} foto-flechas pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-between lg:flex`}
          >
            <button
              type="button"
              onClick={() => show(index - 1)}
              disabled={index === 0}
              aria-label="Ver la fotografía anterior"
              className={`${iconOnPhoto} pointer-events-auto disabled:opacity-40`}
            >
              <BackIcon className="size-5" />
            </button>
            {/* La misma flecha del volver, girada. Los iconos del portal se
                dibujan en un solo sitio y comparten grosor y remate; una punta
                nueva aquí sería el mismo trazo con otra mano. */}
            <button
              type="button"
              onClick={() => show(index + 1)}
              disabled={index === photos.length - 1}
              aria-label="Ver la fotografía siguiente"
              className={`${iconOnPhoto} pointer-events-auto disabled:opacity-40`}
            >
              <BackIcon className="size-5 rotate-180" />
            </button>
          </div>
        )}

        {/* El pie va alto porque la hoja de contenido sube sobre la galería con la
            esquina redondeada y se comería la última línea. */}
        {showCaption && caption && (
          <p className="pointer-events-none absolute inset-x-0 bottom-16 px-6 text-center text-[12px] leading-snug text-paper/90">
            {caption}
          </p>
        )}

        <p className="sr-only">
          {photos.length === 1
            ? "1 fotografía"
            : `${photos.length} fotografías. Se pasan deslizando, y las barras de arriba llevan a cada una.`}
        </p>
      </div>
    </>
  );
}
