import { subscribeToUpdates } from "@/app/(public)/ofrecer/actions";
import { alertBox, card, field } from "@/components/ui/styles";
import { SITE_NAME } from "@/lib/constants";

/**
 * El correo para contar cómo avanza la plataforma.
 *
 * Es un formulario aparte del de ofrecer, y eso no es maquetación: son dos
 * consentimientos distintos. Quien deja un contacto en una oferta lo deja para
 * que le respondan por ESA oferta, y usarlo para mandar novedades sería escribirle
 * por una vía que no autorizó. Por eso son también dos tablas
 * (supabase/migrations/0015_canal_general.sql) y por eso se puede dejar el correo
 * sin ofrecer nada.
 *
 * SIN JAVASCRIPT FUNCIONA IGUAL, y esa es la razón de que no sea un componente de
 * cliente con `useActionState` como el de /ofrecer o el del buzón. Aquí no hace
 * falta estado: el formulario se envía, el servidor redirige, y la respuesta viaja
 * en la dirección —`?avisos=recibido`— para que el aviso se pinte en el HTML de la
 * página siguiente. Un caso que se abre con mala señal y se comparte por WhatsApp
 * no puede depender de que se hidrate nada para decir «lo recibimos».
 *
 * Sobre el texto. Se pidió que fuera persuasivo, y en un portal que documenta un
 * terremoto persuasivo es creíble: se dice qué llega, cuándo llega y qué no llega.
 * Nada de «novedades exclusivas» ni de plazos inventados. Lo que convence de
 * verdad es la frase de que si no pasa nada no se escribe, porque es la promesa
 * que quien duda de un formulario de correo está esperando oír.
 */
export function UpdatesSignup({
  /** A dónde vuelve el envío, para no sacar a nadie del caso que estaba mirando. */
  from,
  /** Qué contestó el servidor la última vez, leído de la dirección. */
  state,
}: {
  from: string;
  state: "recibido" | "correo" | null;
}) {
  return (
    <section className={`${card} mt-12 p-5`} aria-labelledby="avisos">
      <h2 id="avisos" className="font-display text-[20px] leading-tight text-ink">
        Te contamos cómo avanza
      </h2>

      <p className="mt-2 text-[14px] leading-relaxed text-body">
        Déjanos un correo y te escribimos cuando pase algo que se pueda comprobar en el portal:
        una causa nueva documentada, una necesidad cubierta, una ayuda que llegó.
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Escribimos poco, porque solo escribimos cuando hay algo. Nunca te vamos a pedir dinero por
        correo: para eso está el canal que enseña cada ficha. Solo lo ve el equipo de{" "}
        {SITE_NAME}, no se publica y no se usa para nada más. Si quieres que lo borremos, dilo en
        sugerencias y lo quitamos.
      </p>

      {/* El aviso va antes del campo y no debajo del botón: sin JavaScript la
          página se recarga entera y el navegador vuelve arriba de la sección, así
          que un mensaje al pie se queda fuera de pantalla justo cuando hace falta
          leerlo. */}
      {state === "recibido" && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-accent-soft px-3.5 py-2.5 text-sm leading-relaxed text-accent-strong"
        >
          Recibido. Te escribimos a ese correo cuando haya algo que contar.
        </p>
      )}
      {state === "correo" && (
        <p role="alert" className={`${alertBox} mt-4`}>
          Ese correo no parece un correo. Míralo y vuelve a enviarlo.
        </p>
      )}

      <form action={subscribeToUpdates} className="mt-4">
        <input type="hidden" name="desde" value={from} />

        {/* Campo trampa para bots: invisible y sin foco por teclado. El mismo de
            /ofrecer y del buzón. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] size-0"
        />

        <label className="block">
          <span className={field.label}>Tu correo</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            required
            maxLength={200}
            autoComplete="email"
            className={field.input}
            placeholder="nombre@correo.com"
          />
        </label>

        <button
          type="submit"
          className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-panel-high px-6 py-3 text-sm font-medium text-body transition-[translate,scale,background-color,border-color,color] duration-150 hover:border-ink/40 hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Avísame
        </button>
      </form>
    </section>
  );
}
