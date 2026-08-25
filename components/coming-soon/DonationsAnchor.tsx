import { formatCOP } from "@/lib/format";

/**
 * Lo que ve quien llega desde el botón «Ver el registro de donaciones».
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTA SECCIÓN EXISTE, Y POR QUÉ NO ENSEÑA EL REGISTRO
 *
 * El correo de agradecimiento lleva un botón a `<portal>/#donaciones`. Con el
 * portal cerrado, esa dirección la reescribe el cerrojo a esta pantalla, así
 * que sin este bloque el botón principal del correo que reciben las personas
 * que acaban de donar no lleva a ninguna parte: caen en «el tablero todavía no
 * es público» sin una palabra sobre su donación. El ancla `#donaciones` está
 * puesta aquí para que ese enlace, que ya está enviado y no se puede corregir,
 * aterrice en algo cierto.
 *
 * NO SE LISTAN LAS DONACIONES, y no es por prudencia vaga: el registro nombra a
 * las familias a las que fue cada aporte, y publicar esa lista aquí sería
 * publicar el tablero por la puerta de atrás, que es exactamente lo que el
 * cerrojo está impidiendo. Lo que sí se puede decir sin abrir nada son las dos
 * cifras del conjunto y una frase que explique dónde está el detalle: en la
 * ficha de la familia, cuyo enlace viaja en el mismo correo y sí pasa el
 * cerrojo (ver `isGatePublicPath`).
 *
 * Con cero donaciones no se pinta: un «$ 0 recaudados» en la landing de un
 * portal que todavía no cobra no informa de nada y se lee como un fracaso.
 * ---------------------------------------------------------------------------
 */
export function DonationsAnchor({
  count,
  totalCop,
}: {
  count: number;
  totalCop: number;
}) {
  if (count === 0) return null;

  return (
    /* Panel callado y no un bloque macizo de `brote`. En verde entero esto era
       lo más llamativo de la columna, por encima del formulario de apuntarse, y
       la jerarquía quedaba al revés: la pantalla gritaba una cifra a todo el
       que llega y susurraba la acción que de verdad sirve. El lima se queda en
       la pastilla del importe, que es lo que hay que encontrar de un vistazo
       cuando se llega buscándolo desde el correo. */
    <section
      id="donaciones"
      aria-labelledby="donaciones-titulo"
      className="scroll-mt-6 rounded-3xl border border-line bg-canvas p-5"
    >
      <h2 id="donaciones-titulo" className="font-display text-[17px] leading-tight text-ink">
        Las donaciones sí están registradas
      </h2>
      <p className="mt-3 inline-flex items-baseline gap-2 rounded-full bg-brote px-3.5 py-1.5">
        <span className="font-display text-[20px] leading-none tabular-nums text-selva">
          {formatCOP(totalCop)}
        </span>
        <span className="text-[12px] text-selva/80">
          en {count === 1 ? "una donación" : `${count} donaciones`}
        </span>
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        El registro con el detalle se abre junto con el tablero. Si donaste, el
        correo que te enviamos lleva el enlace a la ficha de la familia a la que
        fue tu aporte, y ahí aparece con su valor y su fecha.
      </p>
    </section>
  );
}
