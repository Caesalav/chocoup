import { externalUrl, formatPhone } from "./format";

/**
 * A dónde se envía el dinero de un municipio o de una familia.
 *
 * Un canal es una llave de transferencia, un enlace de recaudación o un
 * número de contacto, y nunca dos a la vez: son tres gestos distintos —una
 * llave se copia y se pega en otra aplicación, un enlace se pulsa, un
 * teléfono se llama o se escribe— y por eso el tipo es una unión y no un
 * objeto con los tres campos dentro. Quien pinta un canal no tiene que
 * decidir cuál enseñar, porque no puede haber dos.
 *
 * La base de datos impone lo mismo (`cities_donation_one_channel` y
 * `cases_donation_one_channel`, migraciones 0011 y 0013). Esto es la segunda
 * barrera, y está aquí porque es donde se decide qué sale en pantalla.
 */
export type DonationChannel =
  | {
      kind: "llave";
      /** La llave tal cual se teclea en la app: `@soschoco`. */
      value: string;
      /** En qué app se pega. Vacío: se dice la versión general, sin inventar
       *  una marca. */
      app: string;
      /** A nombre de quién tiene que aparecer al confirmar. Es la única
       *  comprobación que le queda a quien dona si un día la llave es otra. */
      holder: string;
    }
  | { kind: "enlace"; url: string }
  | {
      kind: "telefono";
      /** El número tal cual se llama, normalmente diez dígitos colombianos. */
      value: string;
    };

type ChannelColumns = {
  donation_key: string;
  donation_url: string;
  donation_phone: string;
  donation_app: string;
  donation_holder: string;
};

/**
 * El canal de una fila, o nulo si esa fila no tiene ninguno.
 *
 * Nulo es un estado normal y frecuente: es como nace cada municipio y cada caso,
 * y es como se queda hasta que coordinación registre a dónde va el dinero de esa
 * persona o de ese pueblo. **No se hereda nada**: un caso sin canal no toma el de
 * su municipio, y esta función no recibe más fila que la suya para que no pueda
 * hacerlo por descuido. Heredarlo mandaría el dinero a un sitio que nadie eligió
 * para esa persona, y sin que se notara en la pantalla.
 *
 * Con dos columnas de destino llenas devuelve nulo en vez de elegir una. No
 * debería poder pasar —lo impide una restricción de la base de datos—, pero si
 * pasara, elegir por orden sería el destino del dinero decidido por un orden,
 * que es exactamente lo que hubo que arreglar en las fundaciones (0004). Ante
 * la ambigüedad, la ficha se queda sin canal y lo dice, igual que allí se queda
 * sin botón de donar.
 *
 * El enlace pasa por `externalUrl()`, así que lo que no sea http o https no llega
 * a un `href`, y una llave escrita por error en el campo del enlace tampoco: sale
 * como `https://@soschoco`, que no es un destino, pero es un enlace válido y por
 * eso el panel lo rechaza antes de guardarlo.
 */
export function donationChannel(row: ChannelColumns): DonationChannel | null {
  const key = row.donation_key.trim();
  const url = row.donation_url.trim();
  const phone = row.donation_phone.trim();
  const filled = [key, url, phone].filter(Boolean).length;

  if (filled > 1) return null;

  if (key) {
    return {
      kind: "llave",
      value: key,
      app: row.donation_app.trim(),
      holder: row.donation_holder.trim(),
    };
  }

  if (phone) {
    return { kind: "telefono", value: phone };
  }

  const href = externalUrl(url);
  return href ? { kind: "enlace", url: href } : null;
}

/**
 * Un destino de dinero, como se lee en la pantalla de repaso del panel.
 *
 * Es la vista plana de algo que vive en tres sitios —el municipio, su fundación y
 * cada caso—, y se aplana justo para poder recorrerlos todos seguidos: cada uno
 * pertenece a alguien distinto, así que ninguna consulta los junta y sin esta
 * lista no hay forma de mirar el conjunto.
 */
export type MoneyDestination = {
  level: "municipio" | "caso" | "fundacion";
  /** De quién es: el nombre del pueblo, el de la familia o el de la fundación. */
  owner: string;
  cityName: string;
  /** A dónde va, escrito entero para poder compararlo con lo que se acordó. */
  target: string;
  /** Si hoy se ve en el portal público, con la cascada de publicación aplicada. */
  live: boolean;
  /** La ficha donde se edita, que es la de quien lo recibe. */
  href: string;
};

type CityLike = ChannelColumns & { name: string; slug: string; published: boolean };
type CaseLike = ChannelColumns & {
  id: string;
  display_name: string;
  published: boolean;
  consent_to_publish: boolean;
};
type FoundationLike = { name: string; donation_url: string };

/**
 * Los destinos de un municipio: el suyo, el de su fundación y el de cada uno de
 * sus casos.
 *
 * Vive aquí y no en la capa de datos para que la lista del panel y la de muestra
 * se armen con la misma regla y no con dos parecidas. Lo que decide si un destino
 * está vivo es la cascada de publicación entera, igual que en las RLS: un caso
 * publicado en un municipio sin publicar no se ve, y un caso sin consentimiento
 * tampoco.
 */
export function moneyDestinationsOf(
  city: CityLike,
  foundation: FoundationLike | null,
  cases: CaseLike[],
): MoneyDestination[] {
  const cityHref = `/admin/ciudades/${city.slug}`;
  const rows: MoneyDestination[] = [];
  const own = donationChannel(city);

  if (own) {
    rows.push({
      level: "municipio",
      owner: city.name,
      cityName: city.name,
      target: describeChannel(own),
      live: city.published,
      href: cityHref,
    });
  }

  const foundationUrl = externalUrl(foundation?.donation_url ?? "");
  if (foundation && foundationUrl) {
    rows.push({
      level: "fundacion",
      owner: foundation.name,
      cityName: city.name,
      target: foundationUrl,
      live: city.published,
      href: cityHref,
    });
  }

  for (const row of cases) {
    const channel = donationChannel(row);
    if (!channel) continue;
    rows.push({
      level: "caso",
      owner: row.display_name,
      cityName: city.name,
      target: describeChannel(channel),
      live: city.published && row.published && row.consent_to_publish,
      href: `${cityHref}/casos/${row.id}`,
    });
  }

  return rows;
}

/**
 * El destino escrito tal cual, para poder compararlo con lo que se acordó.
 *
 * De una llave se escribe también el titular, porque una llave sin nombre y una
 * llave con el nombre de otra cuenta se leen igual mirando solo la llave, y la
 * segunda es la forma silenciosa de este daño.
 */
function describeChannel(channel: DonationChannel): string {
  if (channel.kind === "enlace") return channel.url;
  if (channel.kind === "telefono") return formatPhone(channel.value);
  return [channel.value, channel.app, channel.holder].filter(Boolean).join(" · ");
}
