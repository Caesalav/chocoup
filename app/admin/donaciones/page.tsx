import { redirect } from "next/navigation";

/**
 * El repaso del dinero se llama ahora /admin/casos/dinero.
 *
 * Igual que /admin/ofertas: la dirección vieja está escrita en marcadores y en
 * mensajes que no se pueden editar desde aquí, y también en dos archivos del
 * repositorio que este agente no puede tocar —README.md y ANTES-DEL-VIAJE.md, que
 * la nombran como la pantalla del repaso—. Mientras esas dos guías sigan diciendo
 * `/admin/donaciones`, esta página es lo que hace que no mientan del todo.
 *
 * La lista de correos de los avisos, que estaba debajo de aquella pantalla, NO está
 * al otro lado de este desvío: se fue a /admin/recursos/avisos. Quien venga
 * buscándola por aquí va a aterrizar en el repaso del dinero y no la va a
 * encontrar, y eso es correcto —está en la barra y en la puerta— pero conviene
 * saberlo si alguien pregunta.
 */
export default function OldMoneyPage() {
  redirect("/admin/casos/dinero");
}
