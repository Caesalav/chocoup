import { SITE_NAME } from "@/lib/constants";

/**
 * La frase que dice que el canal que se está enseñando es el general y no el de
 * quien retrata la pantalla.
 *
 * Vive en un componente y no suelta en cada plantilla por lo mismo que
 * `OFFER_TO_A_CASE_HEADLINE`: la escriben tres pantallas —la ficha de un caso, la
 * rejilla de donaciones y el pop-up de donar— y las tres tienen que decir lo
 * mismo. Si cada una lo dijera con sus palabras, la de la rejilla acabaría siendo
 * más corta que la de la ficha, y la que se lee antes de pulsar «Donar» es
 * justamente la corta.
 *
 * Es la condición con la que entró el canal general (0015). Hasta entonces regía
 * «sin canal propio, no hay canal», para que el dinero no cayera nunca en un
 * destino que nadie eligió para esa persona. Ahora sí hay respaldo, y lo que
 * queda de aquella regla es esto: QUE SE DIGA. Un caso que usa el general no
 * puede presentarlo como suyo, y quien dona tiene que saber a dónde va y por qué
 * antes de copiar nada.
 *
 * Las dos frases dicen cosas distintas y las dos hacen falta. La primera, de
 * quién es el canal. La segunda, qué se hace con lo que entra: lo verifica
 * coordinación en primera instancia y se reparte entre las causas publicadas
 * aquí. Sin la segunda, «canal general» se lee como una cuenta común sin dueño,
 * que es lo que 0011 tenía razón en temer.
 */
export function GeneralChannelNote({
  /** El nombre del caso, cuando esto se lee dentro de su ficha. */
  caseName,
  className = "",
}: {
  caseName?: string;
  className?: string;
}) {
  return (
    <p className={`text-[14px] leading-relaxed text-muted ${className}`}>
      <span className="text-body">
        {caseName
          ? `${caseName} no tiene un canal de donación propio, así que recibe por el canal general de ${SITE_NAME}.`
          : `Este es el canal general de ${SITE_NAME}, y no el de una familia en particular.`}
      </span>{" "}
      Lo verificamos nosotros en primera instancia y desde ahí se reparte entre las causas
      publicadas en la plataforma. Nada de lo que dones pasa por este portal.
    </p>
  );
}
