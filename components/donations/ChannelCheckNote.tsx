import { channelCheck, type DonationChannel } from "@/lib/donation-channel";
import { formatDay } from "@/lib/format";

/**
 * Desde cuándo nadie ha comprobado a dónde va este dinero.
 *
 * Es lo que se pone donde una plataforma de recaudación pondría su insignia de
 * «donación protegida», y no es la misma cosa ni se le parece: aquí una insignia
 * así sería mentira, porque el dinero no pasa por el portal —lo dice cada tarjeta
 * de canal, en las tres formas— y no hay nada que el portal pueda proteger,
 * retener ni devolver. Quien lee una garantía así dona con una red que no existe.
 *
 * Lo honesto que sí se puede afirmar es mucho más pequeño y es cierto: alguien de
 * coordinación llamó a este número, o mandó una cantidad pequeña a esta llave y
 * miró qué nombre salía, tal día. Eso es todo lo que dice esta frase, y por eso la
 * frase es una fecha y un acto y no un sello.
 *
 * ---------------------------------------------------------------------------
 * ESTÁ EN UN COMPONENTE PORQUE SE LEE EN DOS SITIOS Y TIENE QUE DECIR LO MISMO
 *
 * Se pinta debajo de la tarjeta del canal en la ficha de una causa y DENTRO del
 * pop-up de donar, que es donde acaba el pulgar de quien llega desde un WhatsApp y
 * pulsa el botón de la barra. Escrita dos veces a mano, la del pop-up acabaría
 * siendo la corta —hay menos sitio— y la corta es justo la que más se lee.
 *
 * En el pop-up se pinta desde `DonateOverlay`, así que esta frase viaja también a
 * la rejilla de /donaciones sin que nadie tenga que acordarse de pasarla. Eso es
 * deliberado: la única forma de que no se olvide en una pantalla nueva es que no
 * haya que ponerla.
 *
 * ---------------------------------------------------------------------------
 * SIN FECHA NO SE DICE NADA
 *
 * `channelCheck()` devuelve nulo cuando nadie lo ha comprobado, que es la verdad
 * de casi todos los canales el día que se registran, y entonces aquí no se pinta
 * nada. Callar es correcto y NO es lo mismo que escribir «Sin comprobar»: esa
 * frase, debajo del canal de una familia, se lee como una advertencia sobre ella
 * y no sobre nuestro trabajo, que es de quien habla.
 *
 * ---------------------------------------------------------------------------
 * Y NO LLEVA COLOR, NI CUANDO YA TIENE TIEMPO
 *
 * La tentación era pintar la versión vieja en el cálido de la escala, que es el
 * color de lo que espera. No: un renglón naranja pegado al canal de una familia se
 * lee como un aviso sobre ELLA —«cuidado con esta»— cuando lo que ha pasado es que
 * el equipo no ha vuelto por allí. Envejece con palabras, que es lo que 0016 dejó
 * escrito, y las palabras dicen de quién es la culpa.
 *
 * Lo único que cambia es el peso del texto: la versión vieja sube a `muted` porque
 * es la frase más larga y la que hay que leer entera, y la reciente se queda en
 * `faint`, que es el nivel de la letra pequeña que acompaña sin reclamar nada.
 */
export function ChannelCheckNote({
  channel,
  className = "",
}: {
  channel: DonationChannel;
  className?: string;
}) {
  const check = channelCheck(channel);
  if (!check) return null;

  const on = formatDay(check.on);

  // Los días se dicen con el número que sale de la cuenta y no con «hace más de
  // dos meses»: el umbral vive en `CHANNEL_CHECK_STALE_DAYS` y puede subir el día
  // que el equipo comprueba los canales cada mes, y entonces esta frase estaría
  // diciendo una cifra que ya no es la del código. El número exacto es además más
  // útil, porque 61 días y 240 días no son lo mismo y las dos cosas son «viejas».
  if (check.stale) {
    return (
      <p className={`text-[12px] leading-relaxed text-muted ${className}`}>
        Alguien del equipo comprobó este destino el {on}, hace {check.days} días. Desde entonces
        nadie lo ha vuelto a mirar.
      </p>
    );
  }

  return (
    <p className={`text-[12px] leading-relaxed text-faint ${className}`}>
      Comprobado el {on}: alguien del equipo llamó, o envió una cantidad pequeña, y miró a nombre
      de quién llegaba.
    </p>
  );
}
