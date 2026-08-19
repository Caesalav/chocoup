/**
 * Cuántos aportes van hacia un municipio y todavía no han llegado.
 *
 * Existe por lo mismo que lib/contributions.ts: es un número con un rótulo, sale
 * de `public.offers` —que el público no puede leer— y si cada pantalla se
 * escribiera su propio filtro el mapa diría que hay más gente en camino de la
 * que hay. La cuenta la hace la vista `public.city_offer_activity`
 * (supabase/migrations/0018_tablero.sql) y aquí solo se recoge.
 *
 * Qué cuenta: ofertas en pie (`pendiente` o `aceptada`) de un municipio
 * publicado, sin fecha de entrega. Lo rechazado y lo retirado no son movimiento.
 * Lo ya entregado tampoco: eso ya se ve en el registro de ayudas y, si el
 * equipo anotó la necesidad, en la barra de avance. Este número es el gesto
 * Helldivers que no miente: hay gente yendo, no que ya se cubrió.
 *
 * La regla `no-restricted-syntax` de eslint.config.mjs prohíbe leer la vista
 * fuera de la capa de datos.
 */

export const CITY_OFFER_ACTIVITY_VIEW = "city_offer_activity";

export type CityOfferActivity = {
  city_id: string;
  en_camino: number;
};
