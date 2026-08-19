import { CHANNEL_CHECK_STALE_DAYS, channelCheck } from "@/lib/donation-channel";
import { formatDay, plural } from "@/lib/format";

/**
 * Desde cuándo nadie ha comprobado un destino de dinero, en el panel.
 *
 * Es la misma información que la ficha pública enseña a quien dona, escrita de otra
 * manera y por un motivo que conviene tener delante: EN EL PANEL SÍ SE DICE «SIN
 * COMPROBAR». lib/donation-channel.ts explica por qué en público hay que callar
 * —«Sin comprobar» debajo del canal de una familia se lee como una advertencia
 * sobre ella y no sobre nuestro trabajo—, y aquí no hay nadie a quien señalar: la
 * frase habla de coordinación, que es quien lo comprueba y quien está leyendo. Es
 * además el número que hace útil la pantalla: sin él, repasar los destinos es leer
 * catorce llaves sin saber por cuál empezar.
 *
 * Tres estados y no dos, porque el del medio es la mitad del valor de este campo:
 * una comprobación de hace cinco meses presentada igual que la de anteayer diría
 * que esto está vigilado cuando lleva cinco meses sin mirarse. El umbral y la
 * cuenta de días viven en `channelCheck()`; aquí solo se eligen las palabras.
 *
 * El tipo se toma de `channelCheck` y no se vuelve a escribir: es un objeto de tres
 * campos que ya tiene dueño, y copiarlo aquí sería un sitio más donde quedarse
 * viejo el día que gane un cuarto.
 */
export function ChannelCheck({ check }: { check: ReturnType<typeof channelCheck> }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-[12px] leading-5";

  if (!check) {
    return (
      <span className={`${base} border border-need-mid-strong/35 text-need-mid-strong`}>
        Sin comprobar nunca
      </span>
    );
  }

  if (check.stale) {
    return (
      <span className={`${base} bg-need-mid-soft font-medium text-need-mid-strong`}>
        Comprobado hace {plural(check.days, "día", "días")}
      </span>
    );
  }

  return (
    <span className={`${base} bg-accent-soft text-accent-strong`}>
      Comprobado el {formatDay(check.on)}
    </span>
  );
}

/**
 * La frase larga, para cuando hay sitio: qué significa esa pastilla y qué habría
 * que hacer.
 *
 * Va aparte porque la pastilla se lee de reojo en una lista y esto se lee una vez,
 * en la ficha o debajo del formulario. Con el texto dentro de la pastilla, una
 * lista de catorce destinos sería catorce párrafos.
 */
export function channelCheckNote(check: ReturnType<typeof channelCheck>): string {
  if (!check) {
    return `Nadie ha comprobado este destino todavía. Comprobar es llamar al número, o mandar mil pesos a la llave y mirar qué nombre sale; el día se anota en el formulario del canal.`;
  }
  if (check.stale) {
    return `La última comprobación es de hace ${plural(check.days, "día", "días")}, y a los ${CHANNEL_CHECK_STALE_DAYS} deja de valer como reciente: la ficha pública ya no lo presenta como comprobado. Vuelve a comprobarlo y anota el día.`;
  }
  return `Comprobado el ${formatDay(check.on)}. Vale como reciente hasta los ${CHANNEL_CHECK_STALE_DAYS} días.`;
}
