import { subscribeToUpdates } from "@/app/(public)/ofrecer/actions";
import { alertBox, button } from "@/components/ui/styles";
import { SITE_NAME } from "@/lib/constants";

/**
 * El correo para avisar cuando el tablero se abra.
 *
 * Es el mismo gesto y la misma tabla que «Te contamos cómo avanza» en /ofrecer
 * (`newsletter_signups`): un consentimiento de avisos, no el contacto de una
 * oferta. La acción redirige con `?avisos=` para que el aviso llegue en el HTML
 * aunque el JavaScript no cargue.
 */
export function WaitlistForm({ state }: { state: "recibido" | "correo" | null }) {
  /**
   * Baja de tono a propósito, y es una decisión de jerarquía y no de estilo.
   *
   * Esto era un bloque macizo de `lavanda` con el titular al mismo tamaño que
   * el de apuntarse. Puesto debajo del formulario de ofrecer ayuda, el bloque
   * de color se llevaba la mirada: la acción SECUNDARIA —dejar un correo y
   * esperar— pesaba más que la principal, que es lo único que el equipo puede
   * usar hoy. Ahora es un panel con filete y un titular menor, y el color de
   * esta columna se lo quedan las tres pastillas de arriba.
   */
  /**
   * Baja de tono a propósito, y es una decisión de jerarquía y no de estilo.
   *
   * Esto era un bloque macizo de `lavanda` con el titular al mismo tamaño que
   * el de apuntarse. Puesto debajo del formulario de ofrecer ayuda, el bloque
   * de color se llevaba la mirada: la acción SECUNDARIA —dejar un correo y
   * esperar— pesaba más que la principal, que es lo único que el equipo puede
   * usar hoy. Ahora es un panel con filete y un titular menor, y el color de
   * esta columna se lo quedan las tres pastillas de arriba.
   *
   * Y va en una línea: titular, correo y botón en la misma fila cuando cabe.
   * Tres párrafos y un campo debajo son cuatro renglones de alto para pedir un
   * dato, y esta pantalla tiene que caber entera sin bajar.
   */
  return (
    <section className="rounded-2xl border border-line bg-canvas p-4" aria-labelledby="aviso-apertura">
      <h2 id="aviso-apertura" className="text-[14px] font-medium leading-tight text-ink">
        ¿Todavía no puedes ofrecer nada?{" "}
        <span className="font-normal text-muted">
          Te avisamos cuando el tablero se abra. Solo lo ve el equipo de{" "}
          {SITE_NAME}.
        </span>
      </h2>

      {state === "recibido" && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-selva px-3.5 py-2.5 text-sm leading-relaxed text-luz"
        >
          Recibido. Te escribimos a ese correo cuando se abra.
        </p>
      )}
      {state === "correo" && (
        <p role="alert" className={`${alertBox} mt-4`}>
          Ese correo no parece un correo. Míralo y vuelve a enviarlo.
        </p>
      )}

      {state !== "recibido" && (
        <form action={subscribeToUpdates} className="mt-3">
          <input type="hidden" name="desde" value="/proximamente" />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] size-0"
          />

          {/* Botón secundario y sin el aro que late. Los dos eran de cuando
              este era el único gesto de la pantalla; con el de apuntarse
              delante, un botón macizo que además parpadea compite con la
              acción que de verdad sirve hoy. */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="min-w-[12rem] flex-1">
              <span className="sr-only">Tu correo</span>
              <input
                name="email"
                type="email"
                inputMode="email"
                required
                maxLength={200}
                autoComplete="email"
                className="mt-0 h-11 w-full rounded-lg border border-line bg-panel-high px-3.5 text-[14px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                placeholder="nombre@correo.com"
              />
            </label>
            <button type="submit" className={`${button.secondary} min-h-11 shrink-0 px-5`}>
              Avísame
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
