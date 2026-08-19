import { redirect } from "next/navigation";

/**
 * La bandeja de ofertas se llama ahora /admin/recursos.
 *
 * Esta página existe solo para no romper lo que ya está escrito en otro sitio: un
 * enlace guardado en el navegador de alguien, un mensaje del grupo de WhatsApp con
 * «revisa esto», el marcador de quien lleva un mes entrando por aquí. Nada de eso
 * se puede editar desde el repositorio, así que la dirección vieja tiene que seguir
 * llevando a algún sitio, y el sitio correcto es la pantalla que hace lo mismo.
 *
 * Va como página con `redirect()` y no en `redirects` de next.config por dos
 * motivos que apuntan al mismo lado: la configuración de este proyecto está vacía
 * —una regla suelta allí es una regla que nadie encuentra— y aquí el desvío vive en
 * la carpeta de la ruta que desvía, así que el día que se borre esta carpeta se
 * borra con ella. Una regla en la configuración habría sobrevivido a la carpeta y
 * seguiría desviando una ruta que ya no existe.
 *
 * `redirect()` responde un 307 y no un 308: es lo que hace Next por omisión y es lo
 * que conviene aquí, porque no afirma que la mudanza sea para siempre y no se queda
 * cacheado en el navegador de nadie. Si dentro de unos meses ya no hay marcadores
 * viejos, este archivo se borra y no queda rastro que limpiar.
 */
export default function OldOffersPage() {
  redirect("/admin/recursos");
}
