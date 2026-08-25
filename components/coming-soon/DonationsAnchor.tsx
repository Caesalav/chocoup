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
    <section
      id="donaciones"
      aria-labelledby="donaciones-titulo"
      className="scroll-mt-6 rounded-3xl border border-selva/20 bg-brote p-5"
    >
      <h2 id="donaciones-titulo" className="font-display text-[17px] leading-tight text-selva">
        Las donaciones sí están registradas
      </h2>
      <p className="mt-2 font-display text-[26px] leading-none tabular-nums text-selva">
        {formatCOP(totalCop)}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-selva/80">
        en {count === 1 ? "una donación confirmada" : `${count} donaciones confirmadas`}.
      </p>
      <p className="mt-3 text-[13px] leading-relaxed text-selva/80">
        El registro con el detalle se abre junto con el tablero. Si donaste, el
        correo que te enviamos lleva el enlace a la ficha de la familia a la que
        fue tu aporte, y ahí aparece con su valor y su fecha.
      </p>
    </section>
  );
}
