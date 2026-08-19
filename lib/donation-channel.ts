import { MONEY_REVIEW_PATH } from "./admin-sections";
import { externalUrl, formatPhone } from "./format";

/**
 * A dónde se envía el dinero de un caso, o el del portal entero.
 *
 * Un canal es una llave de transferencia, un enlace de recaudación o un
 * número de contacto, y nunca dos a la vez: son tres gestos distintos —una
 * llave se copia y se pega en otra aplicación, un enlace se pulsa, un
 * teléfono se llama o se escribe— y por eso el tipo es una unión y no un
 * objeto con los tres campos dentro. Quien pinta un canal no tiene que
 * decidir cuál enseñar, porque no puede haber dos.
 *
 * La base de datos impone lo mismo (`cases_donation_one_channel` y
 * `donation_channel_one_kind`, migraciones 0011, 0013 y 0015). Esto es la
 * segunda barrera, y está aquí porque es donde se decide qué sale en pantalla.
 */
type ChannelDestination =
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

/**
 * El destino, y desde cuándo nadie lo ha comprobado.
 *
 * La fecha va pegada al destino y no en un campo aparte de la página, y eso es
 * deliberado: es la mitad de lo que hace útil a la otra. Una llave sin fecha y una
 * llave comprobada anteayer se leen igual si la fecha viaja por su cuenta y la
 * pantalla se olvida de pintarla; viajando dentro del mismo valor, quien tiene el
 * canal delante tiene también su antigüedad.
 *
 * Es la propiedad común de las tres formas y no una cuarta forma: se puede leer sin
 * mirar `kind`, porque un teléfono se comprueba igual que una llave —se llama— y
 * los tres pueden estar sin comprobar.
 */
export type DonationChannel = ChannelDestination & {
  /** 'YYYY-MM-DD', o nulo si nadie lo ha comprobado. Ver `channelCheck()`. */
  verifiedOn: string | null;
};

type ChannelColumns = {
  donation_key: string;
  donation_url: string;
  donation_phone: string;
  donation_app: string;
  donation_holder: string;
  donation_verified_on: string | null;
};

/**
 * El canal de una fila, o nulo si esa fila no tiene ninguno.
 *
 * Nulo es un estado normal y frecuente: es como nace cada caso, y es como se
 * queda mientras coordinación no le registre uno propio. **Esta función no
 * hereda nada y no puede hacerlo**: recibe una fila y nada más, así que no
 * conoce el canal general ni el de nadie. Quien decide qué se enseña cuando no
 * hay canal propio es `caseDonation()`, que está justo debajo y devuelve además
 * de dónde sale.
 *
 * Con dos columnas de destino llenas devuelve nulo en vez de elegir una. No
 * debería poder pasar —lo impide una restricción de la base de datos—, pero si
 * pasara, elegir por orden sería el destino del dinero decidido por un orden,
 * que es exactamente lo que hubo que arreglar en las fundaciones (0004). Ante
 * la ambigüedad, la fila se queda sin canal.
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

  const verifiedOn = row.donation_verified_on;

  if (key) {
    return {
      kind: "llave",
      value: key,
      app: row.donation_app.trim(),
      holder: row.donation_holder.trim(),
      verifiedOn,
    };
  }

  if (phone) {
    return { kind: "telefono", value: phone, verifiedOn };
  }

  const href = externalUrl(url);
  return href ? { kind: "enlace", url: href, verifiedOn } : null;
}

/**
 * A partir de cuántos días una comprobación del canal deja de valer como
 * comprobación reciente.
 *
 * 60, y el número tiene que ser uno que se alcance. Un umbral que nadie alcanza
 * nunca convierte la frase en un adorno permanente —«Comprobado» fijo debajo de
 * cada llave— que es justo lo que este campo vino a sustituir: la insignia de
 * «donación protegida» que aquí sería mentira, porque el dinero no pasa por el
 * portal y no hay nada que el portal pueda proteger.
 *
 * Dos meses es lo que tarda esta información en dejar de decir algo. Un canal se
 * comprueba llamando o mandando mil pesos, y entre viaje y viaje del equipo pasan
 * semanas; a los treinta días medio portal estaría marcado como viejo en su estado
 * normal y la marca se leería como avería. A los ciento ochenta, la ficha afirmaría
 * media campaña que esto está vigilado.
 *
 * Si el equipo acaba comprobando los canales cada mes, este número sobra y hay que
 * subirlo. El que no sirve es uno que no se alcance.
 */
export const CHANNEL_CHECK_STALE_DAYS = 60;

/**
 * Qué se puede decir de la comprobación de un canal: nada, que es reciente, o que
 * ya tiene tiempo.
 *
 * Nulo cuando nadie lo ha comprobado, y entonces la pantalla no dice nada. Callar
 * es correcto: lo que no se puede hacer es dar por comprobado lo que no lo está, ni
 * escribir «Sin comprobar» debajo del canal de una familia, que se leería como una
 * advertencia sobre ella y no sobre nuestro trabajo.
 *
 * El reloj se lee aquí y en cada petición, igual que en `OfferRow`: las páginas que
 * lo pintan son dinámicas y esto corre en el servidor, así que el resultado es el
 * mismo durante todo el dibujado y el navegador no puede decir otra cosa. Congelado
 * en una constante del módulo, el servidor se quedaría con el día del despliegue.
 *
 * La fecha se ancla en UTC como hace `formatDay`, así que la cuenta puede irse
 * hasta cinco horas. Da igual contra un umbral de dos meses, y es lo que evita que
 * la misma fecha se imprima con un día y se cuente con otro.
 */
export function channelCheck(
  channel: DonationChannel,
): { on: string; stale: boolean; days: number } | null {
  if (!channel.verifiedOn) return null;

  const days = Math.floor((Date.now() - Date.parse(`${channel.verifiedOn}T00:00:00Z`)) / 86_400_000);
  return { on: channel.verifiedOn, stale: days >= CHANNEL_CHECK_STALE_DAYS, days };
}

/**
 * Qué canal enseña la ficha de un caso, y DE QUIÉN ES.
 *
 * Las dos cosas van juntas en el mismo valor a propósito, y es lo único
 * importante de este archivo.
 *
 * Hasta 0011 regía «sin canal propio, no hay canal»: un caso sin destino se
 * quedaba mudo antes que enseñar el de otro, porque el dinero que alguien manda
 * leyendo la ficha de una persona lo manda para esa persona, y hacerlo caer en
 * un destino que nadie eligió para ella —sin decirlo— es el daño más grande que
 * puede hacer esa pantalla, y no se nota mirándola.
 *
 * 0015 invierte la regla: ahora hay un canal general y los casos sin canal
 * propio lo usan. Lo que NO se invierte es la preocupación de la que salía. Por
 * eso esta función no devuelve un canal a secas: devuelve el canal y su
 * procedencia, y quien pinta la ficha tiene que escribir la segunda. Con una
 * firma que solo devolviera `DonationChannel | null`, olvidarse de decirlo
 * compilaría; así no, porque no hay forma de sacar el canal sin tener delante de
 * quién es.
 *
 * `ninguno` sigue existiendo, y no es teórico: es lo que se ve mientras la fila
 * del canal general esté vacía —coordinación puede vaciarla en un minuto si el
 * destino se compromete— y es lo que hay que poder decir sin inventar nada.
 */
export type CaseDonation =
  | { source: "propio"; channel: DonationChannel }
  | { source: "general"; channel: DonationChannel }
  | { source: "ninguno"; channel: null };

export function caseDonation(
  row: ChannelColumns,
  general: DonationChannel | null,
): CaseDonation {
  const own = donationChannel(row);
  if (own) return { source: "propio", channel: own };
  if (general) return { source: "general", channel: general };
  return { source: "ninguno", channel: null };
}

/**
 * El renglón de procedencia: de quién es el canal que esta ficha enseña.
 *
 * Es la versión corta de lo que `GeneralChannelNote` dice largo, y las dos hacen
 * falta porque se leen en dos momentos distintos. Esta va arriba, debajo de la
 * barra de avance, para que se lea ANTES de que el pulgar llegue a «Donar»; la
 * larga va en la sección del dinero, donde ya se está mirando la llave. Sin la de
 * arriba, quien pulsa el botón de la barra fija llega al pop-up sin haber leído
 * nada, y ese es exactamente el recorrido de quien abre esto desde un WhatsApp.
 *
 * Vive aquí y no en la plantilla por lo mismo que la frase larga vive en su
 * componente: la escriben la ficha y el panel, y con dos redacciones la del panel
 * acabaría siendo la optimista.
 *
 * Del canal propio se dice el titular cuando lo hay, y no la llave. El titular es
 * lo único de un canal que se puede reconocer de un vistazo —una llave no dice
 * nada por sí misma— y es además lo que quien dona compara con lo que la app le
 * enseña antes de confirmar. Sin titular registrado no se inventa uno: se dice que
 * el canal es suyo, que ya es la mitad de la información.
 */
export function channelOriginLabel(donation: CaseDonation): string {
  if (donation.source === "general") return "Recibe por el canal general del portal";
  if (donation.source === "ninguno") return "Todavía no hay a dónde enviarle dinero";

  const channel = donation.channel;
  if (channel.kind === "llave") {
    return channel.holder
      ? `Canal propio a nombre de ${channel.holder}`
      : "Canal propio: una llave de transferencia";
  }
  if (channel.kind === "telefono") return "Canal propio: un número de contacto";
  return "Canal propio: un enlace de recaudación";
}

/**
 * Un destino de dinero, como se lee en la pantalla de repaso del panel.
 *
 * Es la vista plana de algo que vive en dos sitios —el canal general y cada
 * caso—, y se aplana justo para poder recorrerlos seguidos: sin esta lista no
 * hay forma de mirar el conjunto y detectar el que no debería estar ahí.
 *
 * Aquí había un tercer nivel, `municipio`, y un cuarto, `fundacion`. Los dos se
 * fueron con 0015: no hay canales de pueblo y las fundaciones no son una entidad
 * del portal.
 */
export type MoneyDestination = {
  level: "general" | "caso";
  /** De quién es: el nombre de la familia, o el del portal en el general. */
  owner: string;
  /** El municipio de la familia. Vacío en el general, que no es de ninguno. */
  cityName: string;
  /** A dónde va, escrito entero para poder compararlo con lo que se acordó. */
  target: string;
  /** Si hoy se ve en el portal público, con la cascada de publicación aplicada. */
  live: boolean;
  /** La ficha donde se edita, que es la de quien lo recibe. */
  href: string;
  /**
   * Cuándo se comprobó este destino, ya interpretado, o nulo si nadie lo ha
   * comprobado nunca.
   *
   * Está en esta lista porque es lo que la convierte en una pantalla de trabajo.
   * Sin la fecha, «repasar los destinos» es leer catorce llaves y no saber por
   * cuál empezar; con ella, la que lleva cuatro meses sin mirarse se ve sola. Es la
   * misma información que la ficha pública enseña a quien dona, y la pantalla que
   * la publica no puede saber menos que ella.
   */
  check: { on: string; stale: boolean; days: number } | null;
  /**
   * Cuántos casos publicados reciben por aquí sin haberlo elegido. Solo en el
   * general, y es el número que dice el alcance de ese destino: cambiarlo cambia
   * a dónde va el dinero de todos ellos a la vez.
   */
  usedBy?: number;
};

type CaseLike = ChannelColumns & {
  id: string;
  display_name: string;
  published: boolean;
  consent_to_publish: boolean;
  cityName: string;
  citySlug: string;
  cityPublished: boolean;
};

/**
 * Los destinos que publica el portal: el general primero y después el de cada
 * caso que tenga uno propio.
 *
 * Vive aquí y no en la capa de datos para que la lista del panel y la de muestra
 * se armen con la misma regla y no con dos parecidas. Lo que decide si un destino
 * está vivo es la cascada de publicación entera, igual que en las RLS: un caso
 * publicado en un municipio sin publicar no se ve, y un caso sin consentimiento
 * tampoco.
 *
 * El general va primero y siempre, tenga valor o no. Es el destino con más
 * alcance del portal y el que hay que mirar antes que ninguno; que esté vacío es
 * además una noticia —nadie que abra un caso sin canal propio encuentra a dónde
 * enviar—, no un motivo para no listarlo.
 */
export function moneyDestinationsOf(
  general: DonationChannel | null,
  cases: CaseLike[],
): MoneyDestination[] {
  const liveCase = (row: CaseLike) =>
    row.cityPublished && row.published && row.consent_to_publish;

  const rows: MoneyDestination[] = [
    {
      level: "general",
      owner: "Canal general del portal",
      cityName: "",
      target: general ? describeChannel(general) : "Sin canal general",
      live: Boolean(general),
      href: MONEY_REVIEW_PATH,
      check: general ? channelCheck(general) : null,
      usedBy: cases.filter((row) => !donationChannel(row) && liveCase(row)).length,
    },
  ];

  for (const row of cases) {
    const channel = donationChannel(row);
    if (!channel) continue;
    rows.push({
      level: "caso",
      owner: row.display_name,
      cityName: row.cityName,
      target: describeChannel(channel),
      live: liveCase(row),
      href: `/admin/ciudades/${row.citySlug}/casos/${row.id}`,
      check: channelCheck(channel),
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
