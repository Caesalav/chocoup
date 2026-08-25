import { subscribeToUpdates } from "@/app/(public)/ofrecer/actions";
import { alertBox, button, field } from "@/components/ui/styles";
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
  return (
    <section className="rounded-3xl border border-line bg-canvas p-5" aria-labelledby="aviso-apertura">
      <h2 id="aviso-apertura" className="font-display text-[17px] leading-tight text-ink">
        ¿Todavía no puedes ofrecer nada?
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        Déjanos un correo y te escribimos el día que el tablero sea público.
        Solo lo ve el equipo de {SITE_NAME}, no se publica, y nunca te vamos a
        pedir dinero por correo.
      </p>

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
        <form action={subscribeToUpdates} className="mt-4">
          <input type="hidden" name="desde" value="/proximamente" />
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

          {/* Botón secundario y sin el aro que late. Los dos eran de cuando
              este era el único gesto de la pantalla; con el de apuntarse
              delante, un botón macizo que además parpadea compite con la
              acción que de verdad sirve hoy. */}
          <button type="submit" className={`${button.secondary} mt-3`}>
            Avísame
          </button>
        </form>
      )}
    </section>
  );
}
