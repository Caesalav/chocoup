"use client";

type Props = {
  /** URL absoluta de lo que se comparte. La calcula el servidor. */
  url: string;
  /** Lo que acompaña al enlace en el mensaje. */
  title: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Compartir, que es lo que ocupa el sitio del corazón de favoritos de la
 * referencia.
 *
 * Guardar en favoritos a una familia que perdió su casa no significa nada y
 * suena mal. Compartir sí: este portal se mueve por WhatsApp y esa es la acción
 * que de verdad hace que llegue ayuda.
 *
 * Es un enlace de verdad a wa.me, no un botón: sin JavaScript sigue abriendo
 * WhatsApp con el mensaje escrito, que es el camino que va a usar casi todo el
 * mundo. Si el navegador trae hoja nativa de compartir, se usa esa —así también
 * salen Telegram, correo o copiar el enlace—, y si falla por algo que no sea que
 * la persona la ha cerrado, se cae de vuelta a WhatsApp.
 */
export function ShareLink({ url, title, className, children }: Props) {
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return (
    <a
      href={whatsapp}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
      onClick={(event) => {
        if (typeof navigator === "undefined" || !navigator.share) return;
        event.preventDefault();
        navigator.share({ title, url }).catch((error: DOMException) => {
          if (error?.name !== "AbortError") window.open(whatsapp, "_blank", "noopener");
        });
      }}
    >
      {children}
    </a>
  );
}
