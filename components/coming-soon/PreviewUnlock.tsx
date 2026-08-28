"use client";

import { useActionState, useState } from "react";
import { unlockPreview, type PreviewState } from "@/app/(gate)/proximamente/actions";
import { alertBox, button, field } from "@/components/ui/styles";

/**
 * La puerta con clave de la landing.
 *
 * ---------------------------------------------------------------------------
 * DEJA DE SER UN PUNTO INVISIBLE, Y NO ES UN CAPRICHO
 *
 * Era un punto de 8 px al 7 % de opacidad y sin etiqueta, con la idea de que
 * «quien no lo busca no lo ve». El problema es que quien SÍ lo buscaba tampoco
 * lo veía: el equipo no conseguía entrar en su propio portal, que es el único
 * uso que tiene esta puerta.
 *
 * Ahora es una línea legible y pequeña. Sigue siendo discreta —texto de 12 px
 * en gris, al final de la columna, sin botón ni recuadro— pero se encuentra
 * mirando. Y esconderla ya no aportaba seguridad: lo que protege el tablero es
 * la clave, que hasta hoy estaba escrita en un repositorio público y ahora vive
 * en el entorno (ver actions.ts). Un cerrojo se sostiene por la llave, no por
 * disimular la cerradura.
 * ---------------------------------------------------------------------------
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
        onClick={() => setOpen(true)}
        className="group mt-3 inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full text-[12px] text-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-ink/20 transition-colors group-hover:bg-ink/50"
        />
        Entrar con clave
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
