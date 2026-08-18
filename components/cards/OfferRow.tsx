import Link from "next/link";
import { CategoryChip, OfferStateChip } from "@/components/ui/Chip";
import { card } from "@/components/ui/styles";
import { formatDay, plural } from "@/lib/format";
import type { OfferRecord } from "@/lib/types";

/**
 * A partir de cuántas semanas sin confirmar una promesa baja de tono.
 *
 * La vista `public.offer_log` ya solo trae ocho semanas, así que esto no decide
 * qué se publica —eso está en la base de datos— sino cuándo, dentro de esa
 * ventana, el silencio empieza a ser información.
 *
 * Tres, y no dos ni seis. A las dos semanas el silencio todavía es una bandeja
 * con cola: el equipo está de viaje y esto lo mira gente que además está
 * documentando municipios, así que atenuar ahí dejaría medio muro apagado en su
 * estado normal y se leería como abandono. A las seis solo quedarían dos semanas
 * de aviso antes de que la fila desaparezca sola, y el lector se habría pasado
 * más de un mes viéndola igual de firme que la de ayer. A las tres semanas nadie
 * puede seguir suponiendo que la respuesta está en camino, y quedan cinco de las
 * ocho semanas con la marca puesta, que es lo que hace que la cola de la lista se
 * lea como cola.
 *
 * Si el equipo termina contestando en dos días, este número sobra y hay que
 * bajarlo; el que no sirve es uno que nadie alcance nunca, porque entonces la
 * pantalla afirma que todo lo que hay está vivo.
 */
const WEEKS_UNTIL_STALE = 3;

/**
 * Cuántas semanas enteras lleva esperando algo que se ofreció ese día.
 *
 * El reloj se lee aquí y no en la fila porque las páginas que la pintan son
 * dinámicas y esto corre en el servidor una vez por petición: el número que sale
 * es el mismo durante todo el dibujado, y el navegador no vuelve a calcularlo ni
 * puede decir otra cosa. Es el mismo trato que hace `relativeDays` con la fecha de
 * actualización del portal, y la razón de que no sea una constante del módulo:
 * congelada al arrancar, el servidor se quedaría con el día del despliegue.
 *
 * `offered_on` es un día de Colombia sin hora y se ancla en UTC igual que hace
 * `formatDay`, así que la cuenta puede irse hasta cinco horas. Da lo mismo contra
 * un umbral medido en semanas, y es lo que evita que el mismo dato se imprima con
 * un día y se cuente con otro.
 */
function weeksWaiting(offeredOn: string): number {
  const days = Math.floor((Date.now() - Date.parse(`${offeredOn}T00:00:00Z`)) / 86_400_000);
  return Math.floor(days / 7);
}

/**
 * Una promesa, como la lee cualquiera desde /ofrecido.
 *
 * El titular es lo que se ofrece, al contrario que en el registro de ayudas, que
 * pone la categoría porque es lo único que publica de una entrega. Aquí la frase
 * de quien ofrece sí sale —recortada en la vista, nunca en esta plantilla— y es
 * justo lo que da sentido a la pantalla: «600 tejas de zinc» y «flete de 8
 * toneladas» solo se pueden cruzar si se leen. Describe cosas y no personas, que
 * es lo que la hacía impublicable al otro lado.
 *
 * Salvo cuando la oferta iba dirigida a una familia: entonces la frase describe a
 * alguien y la vista no la publica, así que llega nula y el titular lo dice. Ver
 * el comentario del `h3`.
 *
 * Dos cosas tiene que contestar la fila de un vistazo, y en este orden: cuánto se
 * puede contar con esto, y desde cuándo está ahí. La pastilla de estado va
 * primera por eso —antes que la categoría, al revés que en `NeedRow`—: el estado
 * es la advertencia y la categoría solo es el cajón.
 *
 * No lleva el botón de «puedo completar esto» todavía. El destino que necesita
 * —`getOfferTarget` con `completa`— no existe aún, y un enlace a un formulario que
 * no sabe a qué está respondiendo es peor que ninguno.
 */
export function OfferRow({ record }: { record: OfferRecord }) {
  const weeks = weeksWaiting(record.offered_on);

  // Solo se atenúa lo que espera. Una promesa confirmada envejece de otra manera:
  // alguien del equipo ya habló con esa persona, y que hayan pasado semanas desde
  // entonces no deshace esa conversación —lo que falta es el transporte, o el
  // viaje, y eso no lo dice esta pantalla—. Apagarla también dejaría la lista
  // entera en gris al final de la ventana y sin nada que distinguir.
  const waiting = record.state === "sin_confirmar" && weeks >= WEEKS_UNTIL_STALE;

  return (
    <article className={`${card} p-4`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <OfferStateChip state={record.state} />
        <CategoryChip category={record.category} />
      </div>

      {/* La atenuación es un escalón de tono en el texto y no una opacidad sobre
          la tarjeta: bajar la tarjeta entera se llevaría por delante la pastilla,
          que es lo único que explica por qué está apagada, y dejaría el filete
          medio borrado en una lista donde el resto lo tiene entero. Bajado un
          peldaño cada renglón —el titular de tinta a `muted`, el contexto de
          `muted` a `faint`— la fila se lee apagada al lado de una reciente y
          sigue por encima de 4,5:1 leída sola. Atenuar no es esconder: esto sigue
          publicado y se puede seguir cruzando con lo que haga falta. */}
      {/* Sin texto, el titular lo pone la fila. `resource` llega nulo cuando la
          oferta iba dirigida a una familia: la frase la escribió alguien con su
          ficha delante y la vista no la publica —0012—, así que aquí no hay nada
          que recortar ni nada que recuperar.

          Lo que va en su sitio tiene que ser lo único que el resto de la fila no
          dice ya. La categoría está en la pastilla y el municipio en el renglón de
          abajo, así que repetir cualquiera de las dos dejaría el titular diciendo
          dos veces lo mismo y el hueco seguiría notándose. Que la oferta va a una
          familia no está en ninguna otra parte, y es además lo que explica por qué
          no hay descripción: sin eso la fila se lee como un dato que se perdió al
          guardarlo, que es peor que el hueco.

          Y publicarlo no añade nada sobre esa familia. La categoría y el municipio
          ya salen, y es lo mismo que `aid_log` publica de una entrega a un caso
          desde 0002. Lo que la señalaría es la frase, y la frase no está.

          Va en el mismo hueco, con el mismo tamaño y con la misma atenuación que
          un titular de verdad: una fila más baja o más pálida que las de al lado
          diría que vale menos, y para quien pueda poner el transporte que falta
          vale exactamente igual. */}
      <h3
        className={`mt-3 font-display text-[17px] leading-snug ${waiting ? "text-muted" : "text-ink"}`}
      >
        {record.resource ?? "Una oferta para una familia documentada"}
      </h3>

      <p className={`mt-1.5 text-[13px] leading-relaxed ${waiting ? "text-faint" : "text-muted"}`}>
        {record.city_name && record.city_slug ? (
          <>
            Para{" "}
            <Link
              href={`/ciudades/${record.city_slug}`}
              className={`underline-offset-2 hover:underline ${waiting ? "text-muted" : "text-body"}`}
            >
              {record.city_name}
            </Link>
          </>
        ) : (
          "Sin municipio concreto: serviría para el trabajo en cualquiera"
        )}
        {record.need_title && (
          <>
            {", para "}
            <span className={waiting ? "text-muted" : "text-body"}>{record.need_title}</span>
          </>
        )}
      </p>

      {/* Sin nombre no se dice nada, al contrario que en el registro de ayudas.
          Allí el hueco es una decisión de quien dio algo —«prefiere no aparecer»—
          y merece decirse. Aquí es la regla de la casa: no se publica a nadie
          antes de que el equipo hable con esa persona, así que la mayoría de las
          filas no lo van a llevar, y repetir la misma advertencia seis veces la
          convierte en un adorno. La explicación va una vez, arriba, en la
          pantalla. */}
      {record.offerer_name && (
        <p className="mt-2 text-[12px] text-faint">Lo ofrece {record.offerer_name}</p>
      )}

      <p className="mt-2 text-[12px] text-faint">
        Ofrecido el {formatDay(record.offered_on)}
        {waiting && ` · lleva ${plural(weeks, "semana", "semanas")} esperando respuesta`}
      </p>
    </article>
  );
}
