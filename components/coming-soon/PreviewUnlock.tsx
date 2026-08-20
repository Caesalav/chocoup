"use client";

import { useActionState, useState } from "react";
import { unlockPreview, type PreviewState } from "@/app/(gate)/proximamente/actions";
import { alertBox, button, field } from "@/components/ui/styles";

/**
 * El punto discreto de la landing: sin etiqueta, casi del color del papel.
 * Abre un campo de clave. Quien no lo busca no lo ve.
 */
export function PreviewUnlock() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PreviewState, FormData>(unlockPreview, null);

  if (!open) {
    return (
      /* Lo que se ve es un punto de ocho píxeles; lo que se pulsa son los 44 px
         que pide el resto del portal. Un blanco de 8 × 8 no se acierta con el
         pulgar: se falla, se vuelve a intentar y se acaba pensando que la puerta
         no existe. El punto va pegado al borde izquierdo de la caja
         (`justify-start`) para no moverse de donde estaba al ganar el margen de
         toque, y la caja sube a `mt-6` para que quede a la misma altura.

         `shrink-0` porque esto es el último hijo de una columna flex que en
         escritorio se queda con el alto de la pantalla y desborda: medido en el
         navegador, a 1440×900 la columna pide 1.087 px y tiene 864, así que el
         reparto le comería el alto y lo dejaría en 44 × 0. Y un botón sin alto no
         se puede pulsar —comprobado: el clic no llega a ningún sitio—, o sea que
         la vista previa no se abría con el ratón en ninguna ventana de escritorio
         de alto normal. En el teléfono no pasaba porque ahí la columna no está
         topada y no desborda. */
      <button
        type="button"
        aria-label="Continuar"
        onClick={() => setOpen(true)}
        className="group mt-6 flex size-11 shrink-0 items-center justify-start rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden
          className="size-2 rounded-full bg-ink/[0.07] transition-colors group-hover:bg-ink/20"
        />
      </button>
    );
  }

  return (
    /* Abierto ya no es un punto: es un formulario, y en el teléfono tiene que
       parecerlo. Iba en 16 rem justos —256 px en una pantalla de 390— debajo del
       campo de correo, que va a todo el ancho, y se leía como una caja a medio
       pintar; y la etiqueta vivía solo en el marcador de posición, que
       desaparece en cuanto se escribe la primera letra. `button.ghost` es la
       otra mitad del problema: sin filete ni fondo, en un móvil —donde no hay
       ratón que lo ilumine al pasar por encima— «Entrar» es una palabra suelta
       colgando debajo del campo y no un botón. */
    <form action={action} className="mt-8 w-full max-w-sm shrink-0">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-0"
      />
      <label className="block">
        <span className={field.label}>Clave</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className={field.input}
        />
      </label>
      {state && "error" in state && <p className={`${alertBox} mt-3`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={`${button.secondary} mt-3`}>
        {pending ? "Abriendo…" : "Entrar"}
      </button>
    </form>
  );
}
