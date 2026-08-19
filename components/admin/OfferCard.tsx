import Link from "next/link";
import {
  acceptOffer,
  markOfferDelivered,
  rejectOffer,
  reopenOffer,
  setOfferOnWall,
  updateOffer,
  withdrawOffer,
} from "@/app/admin/actions";
import { today } from "@/app/admin/today";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { CategoryChip, OfferStatusChip } from "@/components/ui/Chip";
import { field, panel } from "@/components/ui/styles";
import { contactHref, formatDateTime, formatDay } from "@/lib/format";
import type { NeedOption, OfferWithContext } from "@/lib/types";

/**
 * Un recurso ofrecido, con las tres decisiones a un toque.
 *
 * ANTES ERA UN FORMULARIO DE CINCO CAMPOS Y UN «GUARDAR». Aceptar una oferta —la
 * cosa más frecuente que se hace aquí— era elegir en un desplegable, bajar y
 * pulsar, y ese envío escribía además la fecha de entrega, el vínculo con la
 * necesidad, las notas del equipo y la casilla del nombre, porque lo que no le
 * llega a esa acción le llega vacío. De ahí venía que `withdrawOffer` tuviera que
 * nacer aparte: un clic no podía borrar las notas al pasar. Esa excepción era el
 * diseño correcto y ahora lo son las cuatro.
 *
 * QUIÉN USA ESTO Y DÓNDE: alguien de pie, con el teléfono en una mano y la persona
 * que ofrece las tejas al teléfono en la otra, con la señal del Chocó. Por eso los
 * botones van arriba —antes de la ficha, no debajo—, miden 44 px, caben en el
 * pulgar y cada uno hace una sola cosa que se puede leer en su palabra. Y por eso
 * cada uno es su propio `<form action={...}>`: sin JavaScript funcionan igual, que
 * es la única forma de que funcionen cuando la página se quedó a medio cargar.
 *
 * QUÉ BOTONES SALEN EN CADA ESTADO, que es la parte pensada:
 *
 *   * PENDIENTE: aceptar, ya llegó, negar y quitar del muro. Son cuatro porque una
 *     oferta pendiente ya está publicada sin que nadie la haya leído, así que
 *     además de decidir hay que poder limpiarla en un gesto.
 *   * ACEPTADA sin entrega: ya llegó, y negar. Deshacer el «sí» —volver a pendiente
 *     o retirar— se va al `<details>`: detrás de una aceptada hay una conversación,
 *     y perderla de un toque cuesta más que el toque que se ahorra.
 *   * ENTREGADA: ninguno. Lo que llegó no se cambia de un toque; para deshacerlo
 *     hay que quitar la fecha, que está dentro.
 *   * RECHAZADA o RETIRADA: volver a pendiente. Un botón que esconde lo que toca se
 *     usa con miedo si no hay forma rápida de reponerlo.
 *
 * Lo que no es una decisión —la fecha exacta, la necesidad que cubre, las notas,
 * quitar el nombre— vive en un `<details>`, que es un desplegable del navegador y
 * no necesita JavaScript. No se ha perdido nada de lo que había: están los cinco
 * campos del formulario viejo y se llega a los cuatro estados, con una sola
 * diferencia que es deliberada. Del desplegable se podía saltar de «rechazada» a
 * «aceptada» en un envío; ahora son dos toques, porque se pasa por pendiente. Es la
 * misma escalera que impide que una entrega convierta en aceptada una oferta que el
 * equipo negó: cambiar de opinión sobre un «no» tiene que ser un gesto y no un
 * efecto.
 */
export function OfferCard({
  offer,
  needOptions,
}: {
  offer: OfferWithContext;
  needOptions: NeedOption[];
}) {
  const href = contactHref(offer.offerer_contact);
  const isPending = offer.status === "pendiente";
  const isDelivered = offer.delivered_on !== null;
  const isClosed = offer.status === "rechazada" || offer.status === "retirada";
  const onWall = offer.on_wall !== false && !isClosed && !isDelivered;

  return (
    <li
      className={`${panel} p-4 sm:p-5 ${
        // Lo que queda por revisar se distingue sin leer: el filete entero en cálido
        // y cuatro píxeles en el canto izquierdo, el mismo tramo de la escala con el
        // que se pintan la pastilla «Pendiente» y una necesidad abierta. Sin esto
        // hay que leer la pastilla de cada tarjeta para saber cuáles quedan, y en
        // una bandeja de treinta eso es la pantalla entera.
        //
        // Un solo color para los cuatro lados y el grosor solo a la izquierda, en
        // vez de un color distinto por lado: `border-color` y `border-left-color` se
        // resuelven por el orden de la hoja generada y no por el orden en que se
        // escriban aquí, así que mezclarlos es dejar el resultado en manos de cómo
        // ordene Tailwind ese día.
        isPending ? "border-l-4 border-need-mid-strong/45" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <OfferStatusChip status={offer.status} />
        <CategoryChip category={offer.category} />
        {!isClosed && !isDelivered && (
          <span
            className={`rounded-full px-3 py-1 text-[12px] ${
              onWall ? "bg-accent-soft text-accent-strong" : "bg-line text-muted"
            }`}
          >
            {onWall ? "En el muro" : "Fuera del muro"}
          </span>
        )}
        {offer.delivered_on && (
          <span className="text-xs text-accent-strong">
            Llegó el {formatDay(offer.delivered_on)}
          </span>
        )}
        <span className="text-xs text-faint">{formatDateTime(offer.created_at)}</span>
      </div>

      <h2 className="mt-2 font-display text-xl leading-tight text-ink">{offer.resource}</h2>

      <p className="mt-1 text-sm text-ink">
        {offer.offerer_name} ·{" "}
        {href ? (
          // El contacto es un enlace de verdad —WhatsApp o correo, según lo que
          // escribiera— porque llamar es el primer paso de las tres decisiones y
          // tiene que ser un toque más y no una copia a mano.
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent hover:underline"
          >
            {offer.offerer_contact}
          </a>
        ) : (
          <span className="text-muted">{offer.offerer_contact}</span>
        )}
      </p>

      {/* LOS BOTONES, ANTES DEL RESTO DE LA FICHA. Es lo que convierte la bandeja
          en un flujo: el pulgar no tiene que pasar por encima del mensaje, las
          notas y el municipio para llegar a lo que ha venido a hacer. */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        {isPending && (
          <form action={acceptOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton pendingLabel="Aceptando…">Aceptar</SubmitButton>
          </form>
        )}

        {!isClosed && !isDelivered && (
          <form action={markOfferDelivered}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton variant="secondary" pendingLabel="Anotando…">
              Ya llegó
            </SubmitButton>
          </form>
        )}

        {!isClosed && !isDelivered && (
          <form action={rejectOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton variant="ghost" pendingLabel="Negando…">
              Negar
            </SubmitButton>
          </form>
        )}

        {!isClosed && !isDelivered && (
          <form action={setOfferOnWall}>
            <input type="hidden" name="id" value={offer.id} />
            <input type="hidden" name="on_wall" value={onWall ? "" : "on"} />
            <SubmitButton variant="ghost" pendingLabel="Guardando…">
              {onWall ? "Quitar del muro" : "Poner en el muro"}
            </SubmitButton>
          </form>
        )}

        {isClosed && (
          <form action={reopenOffer}>
            <input type="hidden" name="id" value={offer.id} />
            <SubmitButton variant="secondary" pendingLabel="Devolviendo…">
              Volver a pendiente
            </SubmitButton>
          </form>
        )}

        {isDelivered && (
          <p className="max-w-prose text-xs leading-relaxed text-muted">
            Ya está en el registro de ayudas con el mes en que llegó. Para deshacerlo hay que
            quitarle la fecha, aquí abajo.
          </p>
        )}
      </div>

      {/* Qué hace cada botón donde no se puede no leerlo, y en una línea: «Aceptar»
          no dice por sí solo que además publica el nombre de quien ofreció, y esa
          es la consecuencia pública del toque más frecuente de esta pantalla. */}
      {isPending && (
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-faint">
          Aceptar dice que hablaste con esa persona y que cuentas con lo que ofrece
          {offer.publish_name ? ", y publica su nombre en el muro, que lo autorizó" : ""}. Negar es
          un no del equipo y queda escrito. Quitar del muro lo esconde de «Lo que se ha ofrecido»
          sin cambiar la verificación: sigue aquí, pendiente.
        </p>
      )}

      {offer.message && (
        <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">
          {offer.message}
        </p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-muted">
        {offer.needs && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0">Necesidad</dt>
            <dd className="text-ink">{offer.needs.title}</dd>
          </div>
        )}
        {offer.cases && (
          <div className="flex gap-2">
            <dt className="w-20 shrink-0">Caso</dt>
            <dd className="text-ink">{offer.cases.display_name}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">Municipio</dt>
          <dd className="text-ink">
            {offer.cities ? (
              <Link href={`/admin/ciudades/${offer.cities.slug}`} className="hover:underline">
                {offer.cities.name}
              </Link>
            ) : (
              "Sin municipio"
            )}
          </dd>
        </div>
      </dl>

      {/* Un `<details>` del navegador y no un panel que se abre con JavaScript: el
          panel se usa en campo y con mala señal, así que lo que se pliega tiene que
          plegarse sin que haya cargado nada. Cerrado por omisión, que es lo que
          quita de en medio los cinco campos del formulario viejo; el resumen mide
          44 px porque es un control más. */}
      <details className="mt-3 border-t border-line pt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm text-accent hover:underline">
          Más cosas de esta oferta
        </summary>

        <form action={updateOffer} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={offer.id} />

          {/* La fecha, para cuando no es hoy. El botón «Ya llegó» escribe el día de
              hoy porque es el gesto normal —alguien descarga las tejas y se anota—;
              aquí se escribe «llegó el martes pasado», y se borra para deshacer una
              entrega mal anotada.

              No se ofrece en las rechazadas ni en las retiradas: una entrega sobre
              un no del equipo es una contradicción que la acción rechaza y la base
              de datos también (`offers_delivery_requires_acceptance`), así que la
              pantalla tampoco la ofrece. Con máximo de hoy: el registro público es
              de lo que ya llegó, no de lo que va a llegar. */}
          {!isClosed && (
            <label className="block">
              <span className={field.label}>¿Qué día llegó?</span>
              <input
                type="date"
                name="delivered_on"
                // El mismo día que valida la acción, del mismo reloj: un `max`
                // calculado en UTC dejaría elegir mañana en Colombia a partir de
                // las siete de la tarde, y la acción lo rechazaría.
                max={today()}
                defaultValue={offer.delivered_on ?? ""}
                className={field.input}
              />
              <span className={field.hint}>
                Déjalo vacío mientras siga siendo una promesa. Al poner fecha, la oferta queda como
                aceptada y la entrega sale en el registro público con el mes, no con el día. Lo que
                sí se publica tal cual es el texto de la oferta: si ese texto señala a una persona
                concreta, háblalo antes de marcarla.
              </span>
            </label>
          )}

          <label className="block">
            <span className={field.label}>Vincular a necesidad</span>
            <select
              name="need_id"
              defaultValue={offer.need_id ?? "sin-vinculo"}
              className={field.select}
            >
              <option value="sin-vinculo">Sin vincular</option>
              {offer.needs && !needOptions.some((need) => need.id === offer.needs?.id) && (
                <option value={offer.needs.id}>{offer.needs.title} (cubierta)</option>
              )}
              {needOptions.map((need) => (
                <option key={need.id} value={need.id}>
                  {need.cityName}
                  {need.caseName ? ` · ${need.caseName}` : ""} · {need.title}
                </option>
              ))}
            </select>
            <span className={field.hint}>
              Vincular manda: la oferta se muda al municipio y al caso de la necesidad que cubre.
              Mucha gente ofrece sin decir a dónde va, y sin esto la entrega saldría en el registro
              público sin municipio aunque tú ya sepas a qué necesidad respondía.
            </span>
          </label>

          <label className="block">
            <span className={field.label}>Notas del equipo</span>
            <textarea
              name="team_notes"
              rows={2}
              defaultValue={offer.team_notes}
              className={field.textarea}
              placeholder="Quién llamó, qué se acordó, cuándo llega"
            />
          </label>

          {/* La autorización la marca quien ofrece, en su formulario, y el equipo no
              la puede marcar por ella. Al revés sí: alguien llama y pide que le
              quiten el nombre, y eso tiene que poder hacerse en el momento. */}
          {offer.publish_name ? (
            <label className={field.checkboxRow}>
              <input type="checkbox" name="revoke_name" className={field.checkbox} />
              <span>
                Quitar su nombre del registro público
                <span className="mt-0.5 block text-xs text-muted">
                  Autorizó aparecer como <span className="text-ink">{offer.offerer_name}</span>.
                  Marca esto si pide que lo quitemos.
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs leading-relaxed text-muted">
              No autorizó que se publique su nombre, así que la entrega aparecerá sin él. Solo
              puede autorizarlo la persona, desde el formulario.
            </p>
          )}

          <SubmitButton variant="secondary">Guardar estos campos</SubmitButton>
        </form>

        {/* Deshacer una aceptación: existe, y aquí dentro. Detrás de una aceptada
            hay una conversación con quien ofreció, y un toque no puede deshacerla;
            en las pendientes «Quitar del muro» sí está arriba, porque son las que se
            publican sin que nadie las lea.

            Los dos van en su propio `<form>` y no en el de arriba porque son tres
            envíos distintos y un `<form>` no puede vivir dentro de otro. Es además
            lo que los mantiene de un toque, sin arrastrar la fecha ni las notas. */}
        {offer.status === "aceptada" && !isDelivered && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm text-body">Si la aceptaste por error</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <form action={reopenOffer}>
                <input type="hidden" name="id" value={offer.id} />
                <SubmitButton variant="ghost" pendingLabel="Devolviendo…">
                  Volver a pendiente
                </SubmitButton>
              </form>
              <form action={withdrawOffer}>
                <input type="hidden" name="id" value={offer.id} />
                <SubmitButton variant="ghost" pendingLabel="Retirando…">
                  Retirar del todo
                </SubmitButton>
              </form>
            </div>
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
              Volver a pendiente deshace el «sí» y, si esa persona autorizó su nombre, lo quita
              otra vez del muro: en «Lo que se ha ofrecido» el nombre sale solo con las dos cosas
              juntas. Retirar del todo la deja como retirada, fuera de esta bandeja. Ninguna de las
              dos borra nada: la oferta sigue aquí, con su contacto y sus notas.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-sm text-body">Si no es una oferta de verdad</p>
            <div className="mt-2">
              <form action={withdrawOffer}>
                <input type="hidden" name="id" value={offer.id} />
                <SubmitButton variant="ghost" pendingLabel="Retirando…">
                  Retirar del todo
                </SubmitButton>
              </form>
            </div>
            <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
              La saca de pendientes y del muro. Para solo esconderla de «Lo que se ha ofrecido»
              mientras la revisas, usa el botón de arriba.
            </p>
          </div>
        )}
      </details>
    </li>
  );
}
