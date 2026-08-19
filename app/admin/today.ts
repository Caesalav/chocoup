/**
 * Qué día es hoy en el Chocó, en 'YYYY-MM-DD'.
 *
 * Existe porque el panel escribe dos fechas de un toque —el día en que llegó una
 * ayuda y el día en que se comprobó un canal— y las dos van en columnas `date`,
 * sin hora. Con `new Date().toISOString()` el día se lee en UTC, y a las siete de
 * la tarde en Quibdó UTC ya es el día siguiente: el botón «Ya llegó» escribiría
 * mañana, y el `max` del campo de fecha dejaría elegir un día que la propia acción
 * rechaza por estar en el futuro. Es el mismo cuidado que 0002 dejó escrito al
 * elegir `date` para `delivered_on` y que 0012 repite en la vista de lo ofrecido:
 * una oferta enviada a las 20:30 en Quibdó se guarda como la 01:30 UTC del día
 * siguiente.
 *
 * Va por `Intl` y no restando cinco horas a mano porque una resta es un número
 * suelto que hay que reconocer; con la zona escrita, quien lo lea sabe de qué
 * reloj se habla. `en-CA` es el atajo estándar para que `Intl` devuelva el formato
 * que espera Postgres.
 *
 * Vive en un módulo aparte y no dentro de `actions.ts` porque ese archivo es
 * `"use server"` y allí todo lo que se exporta tiene que ser una Server Action.
 * Lo usan la acción y el formulario que la llama, y tienen que decir el mismo día:
 * un `max` calculado con otro reloj que la validación es un campo que acepta lo
 * que el servidor va a rechazar.
 */
const bogota = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function today(): string {
  return bogota.format(new Date());
}
