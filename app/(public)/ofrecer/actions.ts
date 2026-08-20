"use server";

import { redirect } from "next/navigation";
import { NEED_CATEGORIES } from "@/lib/constants";
import { looksLikeEmail } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export type OfferFormState = { error: string } | null;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function uuidOrNull(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export async function submitOffer(
  _previous: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  // Campo trampa: los formularios rellenados por bots lo completan. Se responde
  // como si todo hubiera ido bien para no darles pistas.
  if (text(formData, "website")) redirect("/ofrecer/gracias");

  const name = text(formData, "offerer_name");
  const contact = text(formData, "offerer_contact");
  const resource = text(formData, "resource");
  const message = text(formData, "message");
  const category = text(formData, "category") || "otro";

  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (contact.length < 5) {
    return { error: "Déjanos un teléfono, WhatsApp o correo para poder responderte." };
  }
  if (resource.length < 2) return { error: "Cuéntanos qué puedes aportar." };
  if (name.length > 120 || contact.length > 200 || resource.length > 200) {
    return { error: "Alguno de los campos es demasiado largo." };
  }
  if (message.length > 2000) return { error: "El comentario es demasiado largo." };
  if (!NEED_CATEGORIES.some((option) => option.value === category)) {
    return { error: "Elige un tipo de recurso válido." };
  }

  const supabase = await createSupabaseServerClient();

  // Sin .select(): el público no tiene permiso de lectura sobre las ofertas.
  //
  // `publish_name` es lo único que decide si esta persona aparece con nombre en el
  // registro público, y solo puede llegar de aquí: el panel del equipo puede
  // retirar el nombre pero no concederlo. Si la casilla no viene, va en falso,
  // que es el valor por omisión de la columna.
  const { error } = await supabase.from("offers").insert({
    offerer_name: name,
    offerer_contact: contact,
    resource,
    category,
    message,
    publish_name: checked(formData, "publish_name"),
    need_id: uuidOrNull(formData, "need_id"),
    case_id: uuidOrNull(formData, "case_id"),
    city_id: uuidOrNull(formData, "city_id"),
  });

  if (error) {
    return { error: "No pudimos guardar tu oferta. Inténtalo de nuevo en un momento." };
  }

  redirect("/ofrecer/gracias");
}

/**
 * Solo acepta un camino interno del portal. Es el mismo recorte que hace
 * /sugerencias con `page_path`: el campo viene de un formulario, así que puede
 * llegar cualquier cosa, y sin esto un `//dominio.ajeno` en la dirección de vuelta
 * convertiría este botón en un redirector abierto —quien lo pulsara acabaría fuera
 * del portal creyendo que sigue dentro—.
 */
function safeReturn(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/ofrecer";
  }
  return value.slice(0, 300);
}

/**
 * Apuntar un correo a los avisos del portal.
 *
 * NO devuelve estado: redirige. Es la diferencia con `submitOffer`, y es
 * deliberada —sin JavaScript, `useActionState` necesita que se hidrate algo para
 * pintar la respuesta, y esto tiene que decir «lo recibimos» en un móvil con la
 * señal del Chocó y el JavaScript sin cargar—. La respuesta viaja en la
 * dirección, así que llega en el HTML de la página siguiente.
 *
 * Y vuelve a la página desde la que se envió, con su caso o su necesidad dentro:
 * quien estaba a medio ofrecer algo para una familia no puede perder ese contexto
 * por dejar un correo.
 *
 * Un correo repetido responde exactamente lo mismo que uno nuevo, y eso no es una
 * comodidad: la base de datos descarta el duplicado en silencio
 * (`newsletter_skip_repeated`, 0015) justo para que este formulario no pueda usarse
 * para averiguar si una dirección está en la lista.
 */
export async function subscribeToUpdates(formData: FormData) {
  const back = safeReturn(text(formData, "desde"));
  const separator = back.includes("?") ? "&" : "?";
  const done = `${back}${separator}avisos=recibido`;

  if (text(formData, "website")) redirect(done);

  const email = text(formData, "email").toLowerCase();

  // La forma se comprueba aquí y en la base de datos (`newsletter_email_shape`),
  // y las dos hacen falta por lo de siempre: esto es para que el aviso se
  // entienda, y aquello para que valga también cuando la llamada no venga de esta
  // pantalla.
  if (!looksLikeEmail(email)) {
    redirect(`${back}${separator}avisos=correo`);
  }

  const supabase = await createSupabaseServerClient();

  // Sin `.select()`: el público no tiene permiso de lectura sobre esta tabla, ni
  // siquiera para releer la fila que acaba de escribir. Añadirlo aquí haría que el
  // formulario dejara de guardar en vez de publicar una lista de correos, que es
  // el orden en el que se prefieren los fallos.
  const { error } = await supabase.from("newsletter_signups").insert({ email });

  // Un fallo aquí no se le cuenta a quien lo dejó con un mensaje distinto: la
  // única diferencia visible entre «se guardó» y «no se guardó» sería otra forma
  // de preguntarle a la tabla por un correo. Queda en los registros del servidor.
  if (error) console.error("newsletter_signups", error.message);

  redirect(done);
}
