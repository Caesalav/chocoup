-- Chocó-up: el registro público de lo que se ha ofrecido.
--
-- Va detrás de 0011. No toca `public.aid_log` ni ninguna política. Se puede
-- ejecutar más de una vez sin errores.
--
-- CUIDADO CON EL ORDEN, dos veces y en direcciones distintas:
--
--   * Hacia atrás: 0001 crea `public.offers` con `offers_status_valid` en su
--     versión de tres estados, escrita dentro del `create table`. Sobre una base
--     que ya tiene la tabla, volver a pegar 0001 no la recrea y la restricción se
--     queda como la deja este archivo. Pero reconstruyendo el esquema desde cero
--     hay que pegar esto detrás, o `retirada` deja de ser un estado válido y la
--     bandeja del equipo se queda sin poder quitar nada de lo publicado.
--
--   * Hacia dentro: el `revoke` del final es de este archivo y tiene que
--     quedarse aquí. `create view` hace una vista nueva, y una vista nueva de
--     `public` nace con el juego entero de privilegios concedido a `anon` y a
--     `authenticated` —los privilegios por defecto que Supabase deja armados—,
--     así que volver a pegar este archivo la reabre y este mismo archivo la
--     vuelve a cerrar. Es lo que 0005 no podía hacer por sí sola y por lo que su
--     cabecera manda pegar 0008 detrás. Aquí no hace falta pegar nada detrás.
--     `verify:sql` compara el mapa entero de privilegios de `public` contra su
--     lista, así que esta vista no puede quedarse sin pasar por aquí sin que las
--     pruebas lo digan.
--
-- Por qué existe:
--
-- Una oferta entra por /ofrecer, la ve el equipo en /admin/ofertas y no vuelve a
-- existir en público hasta que alguien anota una fecha de entrega. El portal
-- cuenta la historia en dos tiempos —«Necesidades», lo que falta, y «Ayudas que
-- llegaron», lo que llegó— y le falta el de en medio: lo prometido.
--
-- El hueco tiene una forma concreta y está en los propios datos de prueba: una
-- ferretería ofrece 600 tejas y dice que no cubre el transporte, y una empresa
-- de logística ofrece un camión que sube vacío. Las dos están en la tabla, las
-- dos esperando, y nadie puede cruzarlas salvo que una persona del equipo se
-- acuerde de las dos a la vez. Publicarlas es lo que permite que las cruce
-- cualquiera.
--
-- Se publica la oferta, NUNCA el contacto. El emparejamiento pasa por el portal
-- y no por el teléfono de quien ofreció: quien quiera completar una oferta manda
-- la suya, y las dos llegan emparejadas a la bandeja del equipo.

-- ---------------------------------------------------------------------------
-- Un estado más: retirada
--
-- Un muro que se publica sin revisión previa necesita salida rápida, y las tres
-- palabras que había no sirven para eso. «Rechazada» dice que el equipo habló
-- con esa persona y dijo que no; usarla para quitar del muro una oferta que
-- nadie ha valorado todavía escribiría una conversación que no ocurrió, en el
-- único campo con el que después se le responde a quien la mandó.
--
-- `offers_delivery_requires_acceptance` (0002) no se toca a propósito: una
-- retirada nunca lleva fecha de entrega, así que la regla —solo lo aceptado
-- puede figurar como entregado— sigue diciendo lo que tiene que decir sin
-- nombrar este estado.
--
-- Y el público no puede escribirlo: `offers_anyone_insert` (0002) exige
-- `status = 'pendiente'` al insertar, de modo que retirar sigue siendo del
-- equipo aunque ahora haya una palabra más en la lista.
-- ---------------------------------------------------------------------------

alter table public.offers drop constraint if exists offers_status_valid;
alter table public.offers add constraint offers_status_valid
  check (status in ('pendiente', 'aceptada', 'rechazada', 'retirada'));

-- ---------------------------------------------------------------------------
-- El registro público de lo prometido
--
-- Misma forma que `public.aid_log` y por los mismos motivos, que están escritos
-- en 0002 y en 0005 y no se repiten aquí: la vista es la ÚNICA puerta del
-- público a la tabla de ofertas —`anon` no tiene política de select sobre
-- `public.offers` ni, desde 0008, permiso de tabla—, se consulta con los
-- derechos de su propietario (`security_invoker = false`) para poder enmascarar
-- columnas, y por eso la cascada de publicación está reescrita a mano en el
-- filtro y en los dos joins. Si se toca esta vista hay que revisar esas tres
-- condiciones. `security_barrier` evita que una condición añadida desde fuera se
-- evalúe antes que las de la vista y filtre filas por el mensaje de un error.
--
-- El recorte vive aquí y no en la página porque la vista ES la API: cualquiera
-- puede pedirle las columnas que quiera, así que la única forma de que un dato
-- no se publique es que no exista en ella. `offerer_contact`, `message`,
-- `team_notes`, `case_id` y `delivered_on` no están escondidos: no están.
--
-- De esos cinco, el que hay que justificar es `message`. Es el campo largo
-- —hasta 2000 caracteres— y el único que nadie mira antes de que se guarde. El
-- riesgo por carácter es el mismo que en `resource` y no aporta nada al
-- emparejamiento: para cruzar 600 tejas con un camión hace falta saber qué hay,
-- no leer la carta que lo acompañaba. Se queda en la tabla, que es donde el
-- equipo la lee para responder.
--
-- Los dos registros son disjuntos y eso es una propiedad, no una casualidad:
-- `delivered_on is null` aquí y `delivered_on is not null` en `aid_log`. En
-- cuanto una ayuda llega, sale de «lo ofrecido» y aparece en «lo que llegó», sin
-- que nadie tenga que retirarla de un sitio al escribirla en el otro.
-- ---------------------------------------------------------------------------

drop view if exists public.offer_log;

create view public.offer_log
with (security_invoker = false, security_barrier = true)
as
select
  o.id,
  -- La categoría contra el vocabulario cerrado, igual que en 0005 y por lo
  -- mismo: `public.offers.category` es texto libre —no tiene el `check` que sí
  -- tienen las necesidades—, así que sin este `case` bastaría escribir una frase
  -- en el campo de la categoría para publicarla por una puerta que nadie está
  -- mirando. La lista está escrita tal cual en `needs_category_valid` (0001) y en
  -- NEED_CATEGORIES (lib/constants.ts), y las tres tienen que decir lo mismo.
  case
    when o.category in (
      'agua', 'alimentos', 'medicamentos', 'techo', 'ropa',
      'transporte', 'dinero', 'mano_de_obra', 'otro'
    ) then o.category
    else 'otro'
  end as category,
  -- Qué se ofrece: solo si la oferta no va dirigida a una familia, y con los
  -- teléfonos y los correos tapados.
  --
  -- Este texto sí se publica, y es la única diferencia de fondo con `aid_log`,
  -- donde 0005 lo quitó entero. Merece explicación porque parece una vuelta
  -- atrás y no lo es: son dos textos que cuentan cosas distintas.
  --
  -- En `aid_log` el texto describe lo que RECIBIÓ una familia —el equipo ya
  -- había emparejado esa oferta con su caso—, y «tratamiento para la tensión,
  -- tres meses» junto a la ficha de una señora con hipertensión la señala sin
  -- nombrarla. Quitarlo costaba precisión y no rompía nada: para comprobar que
  -- algo llegó basta la categoría, el mes y el municipio.
  --
  -- Aquí el texto ES la función, mientras la oferta no apunte a nadie. Un
  -- registro de lo prometido que no diga qué se promete no sirve para lo único
  -- que existe, que es que alguien vea las 600 tejas sin transporte y el camión
  -- que sube vacío y las cruce. «Techo» y «transporte» no cruzan nada. Y lo que
  -- describe entonces es el inventario de quien ofrece —«600 tejas de zinc de
  -- 2,44 m»—, no la situación de nadie.
  --
  -- Cuando la oferta va dirigida a una familia cambian las dos cosas a la vez, y
  -- de ahí el `case` de abajo. El texto pasa a poder describirla: se ofrece desde
  -- /ofrecer?caso=… o contra una necesidad suya, o sea leyendo su ficha, así que
  -- «tratamiento para la tensión, tres meses» vuelve a ser exactamente el rodeo
  -- que 0005 cerró al otro lado. Y deja de ser lo que hace falta para cruzar
  -- nada: esa oferta ya tiene destino, no está buscando con qué emparejarse.
  --
  -- Por qué se anula el texto y no se saca la fila entera, que era la otra
  -- salida: la fila sin texto sigue sirviendo. Dice que hay una oferta de Techo
  -- en Quibdó sin confirmar, y eso es lo que alguien necesita para completarla
  -- —poner el transporte que le falta, la mitad que no cubre—, que es el motivo
  -- de que esta pantalla exista. Sacarla se llevaría por delante precisamente
  -- las ofertas que más lo necesitan: material prometido a una familia concreta y
  -- sin forma de llegar hasta ella. Lo que describe a la familia es la frase, no
  -- que la fila esté ahí, así que se quita la frase.
  --
  -- La condición mira las DOS columnas por las que una oferta puede apuntar a
  -- una familia, y no solo `case_id`. Hoy `/ofrecer` rellena las dos —
  -- `getOfferTarget` copia `case_id` de la necesidad—, así que la segunda no
  -- cambia ninguna fila de las que hay; está para el día en que un flujo nuevo
  -- guarde solo la necesidad. Es lo mismo que hace el join de las necesidades
  -- unas líneas más abajo, y por lo mismo: el título de una necesidad de un caso
  -- y el texto de quien responde a ella señalan a la misma persona.
  --
  -- Lo que hay que tapar en el texto que sí sale es el atajo: la gente va a
  -- escribir «600 tejas, llámame al 316…» precisamente porque el formulario no
  -- publica su contacto, y entonces el contacto sale igual por el campo de al
  -- lado. Son dos pasadas:
  --
  --   1. Cualquier palabra con arroba dentro. `aid_log` descarta el nombre
  --      entero si lleva una (0002); aquí no se puede descartar el texto, así
  --      que se tapa la palabra. Coge el correo completo y también el «@usuario»
  --      de una red social, que es un contacto igual.
  --
  --   2. Siete dígitos o más, contando los que van separados por espacios o por
  --      guiones. Siete es el umbral que ya usa el guardián del nombre en 0002, y
  --      el conteo a través de los separadores es lo que hace que aguante las
  --      tres formas en que se escribe un móvil colombiano: `3167778899`,
  --      `316 777 8899` y `316-777-8899`, con o sin `+57` delante.
  --
  -- El punto NO es separador, y esa exclusión es deliberada: con él dentro,
  -- «1.000.000 de pesos» se publicaría tapado, y una oferta de dinero escrita
  -- con separadores de millar es más frecuente que un teléfono escrito con
  -- puntos. Por el mismo conteo, `1000000` a secas y una fecha como
  -- `2026-08-12` sí se tapan: son falsos positivos asumidos, y en un campo cuyo
  -- oficio es proteger un contacto tapar de más se lee y tapar de menos no.
  --
  -- Lo que esto no cierra, y conviene saberlo antes de leer la lista: un dominio
  -- sin arroba ni dígitos —`wa.me/mensaje`— pasa. La salida para eso no es un
  -- patrón más, que siempre irá un paso por detrás de quien lo intente, sino que
  -- el equipo vea el texto completo en su bandeja y pueda retirar la oferta de un
  -- clic.
  case
    when o.case_id is null
      and not exists (
        select 1 from public.needs cn
        where cn.id = o.need_id and cn.case_id is not null
      )
    then regexp_replace(
      regexp_replace(o.resource, '[^[:space:]]*@[^[:space:]]*', '[contacto oculto]', 'g'),
      '[+]?[0-9](?:[- ]?[0-9]){6,}', '[número oculto]', 'g'
    )
  end as resource,
  -- El día en que se ofreció, y aquí el día sí puede salir. Lo que 0002 no
  -- publica de una entrega es su fecha, porque una lista de qué llegó, a qué
  -- pueblo y qué día es un calendario de reparto y de un calendario se sirve
  -- cualquiera que quiera esperar el siguiente. Esto no dice cuándo llega algo a
  -- un sitio: dice cuándo alguien escribió desde su casa que podía dar algo. Y
  -- hace falta, porque una promesa de hace seis semanas sin confirmar no vale lo
  -- mismo que la de ayer y la lista tiene que poder decirlo.
  --
  -- Se convierte a la hora de Colombia antes de recortar el día por el motivo
  -- que 0002 dejó escrito al elegir `date` para `delivered_on`: una oferta
  -- enviada a las 20:00 en Quibdó se guarda como la 01:00 UTC del día siguiente,
  -- así que un `::date` a secas publicaría el día de después y dependería además
  -- de la zona horaria de la conexión que pregunte.
  (o.created_at at time zone 'America/Bogota')::date as offered_on,
  -- El estado, recortado a los dos valores que le dicen algo a quien lee.
  --
  -- No se reutiliza el vocabulario del equipo. «Pendiente» describe la bandeja
  -- —hay algo esperando a que alguien lo mire— y en público se lee como que el
  -- portal va lento. «Sin confirmar» describe lo que el lector necesita saber,
  -- que es qué fiabilidad tiene lo que está viendo: alguien lo ha ofrecido y
  -- nadie ha hablado con esa persona todavía.
  --
  -- El `else` es la parte que trabaja: si algún día entra en el filtro un estado
  -- que hoy no existe, se publica como lo dudoso y nunca como lo confirmado.
  -- Afirmar de menos es recuperable; afirmar de más, no.
  case when o.status = 'aceptada' then 'confirmada' else 'sin_confirmar' end as state,
  -- El nombre de quien ofrece, con tres condiciones y no con una.
  --
  -- `publish_name` es la autorización, y no basta. Cuando alguien la marca en
  -- /ofrecer está pidiendo figurar en el registro de lo que llegó: una lista de
  -- cosas hechas, donde su nombre acompaña a algo que ya ocurrió. Aquí figuraría
  -- al lado de una promesa que nadie del equipo ha valorado y que puede acabar
  -- rechazada o retirada, y eso no es lo que autorizó. Por eso se exige además
  -- `aceptada`: cuando la oferta está aceptada hay una conversación detrás, y
  -- entonces el nombre acompaña a un acuerdo y no a una intención.
  --
  -- La tercera es el guardián de 0002, literal: un nombre no lleva siete dígitos
  -- seguidos ni una arroba, así que «Marta, 3167778899» no es un nombre, es un
  -- contacto escrito en el campo del nombre. Ante la duda no se publica —aquí sí
  -- se puede descartar el valor entero, porque el registro se sostiene sin él—.
  case
    when o.status = 'aceptada'
      and o.publish_name
      and o.offerer_name !~ '[0-9]{7}'
      and o.offerer_name not like '%@%'
    then o.offerer_name
  end as offerer_name,
  c.name as city_name,
  c.slug as city_slug,
  -- El título de una necesidad DE ZONA sí: lo escribe el equipo, describe al
  -- municipio y no a nadie —«tejas de zinc para 40 viviendas»— y dice para qué
  -- se ofreció aquello. Las de un caso siguen fuera, por el join de abajo.
  n.title as need_title
from public.offers o
  left join public.cities c
    on c.id = o.city_id
   and c.published
  -- Solo las necesidades de municipio, misma regla que en 0002 y 0005. El título
  -- de una necesidad de un caso —«bloque y cemento para rehacer la pared del
  -- fondo»— está escrito tal cual en la ficha de esa familia: nombrarlo aquí es
  -- señalarla dando un rodeo. Y el identificador tampoco sale, que por él se
  -- llega al caso con una consulta.
  left join public.needs n
    on n.id = o.need_id
   and n.case_id is null
   and exists (select 1 from public.cities nc where nc.id = n.city_id and nc.published)
-- Qué filas entran, y las cuatro condiciones dicen cosas distintas:
--
--   * Pendiente o aceptada. Lo rechazado no se publica porque el equipo ya dijo
--     que no —enseñarlo invitaría a completar algo que no va a existir— y lo
--     retirado porque para eso está ese estado.
--
--   * Sin entregar. Es lo que hace disjuntos los dos registros: en cuanto llega,
--     sale de aquí y aparece en `aid_log`.
--
--   * Dentro de las últimas ocho semanas, que es la caducidad. Es automática por
--     fecha y no una columna que alguien tenga que mantener, porque una oferta
--     no muere: se olvida. Nadie va a entrar a marcar que las tejas que ofreció
--     en junio ya se vendieron, y un muro donde la mitad de lo que se lee ya no
--     existe deja de servir para cruzar nada. Ocho semanas es el plazo en el que
--     una promesa material sigue siendo razonablemente cierta; pasado eso, la
--     lista prefiere quedarse corta a quedarse falsa.
--
--   * Municipio publicado, o ninguno. Igual que en `aid_log`: despublicar un
--     municipio se lleva sus ofertas de aquí como se lleva sus fotos y sus casos.
--     El municipio nulo sí sale, que es la oferta que no iba a un sitio concreto
--     —un camión, un cupo de carga— y no cuenta nada de nadie.
--
-- Lo que este filtro NO hace, a propósito: no excluye las ofertas que apuntan a
-- una familia. Se quedan, y lo que se les quita es el texto —está arriba, en el
-- `case` de `resource`, con el razonamiento entero—. El reparto es ese y no otro
-- porque las dos mitades de la fila no valen lo mismo: la frase puede describir a
-- la familia y hay que quitarla, y el resto —una oferta de Techo en Quibdó sin
-- confirmar— es lo que permite completarla y no cuenta nada de nadie. Filtrar
-- aquí habría cobrado las dos.
where o.status in ('pendiente', 'aceptada')
  and o.delivered_on is null
  and o.created_at > now() - interval '8 weeks'
  and (
    o.city_id is null
    or exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
  );

-- ---------------------------------------------------------------------------
-- Quién puede leerla, y nada más
--
-- Se revoca todo y se vuelve a conceder la lista corta, en lugar de nombrar los
-- privilegios que sobran: es lo que hace 0008 y por su misma razón, que así este
-- bloque dice la verdad entera —esto y nada más— sin depender de que quien lo
-- escriba acierte a enumerar los ocho privilegios que hay. Postgres 17 añadió
-- `maintain`, que se concede y que ni asoma en
-- `information_schema.role_table_grants`; una lista a mano ya nacería
-- incompleta.
--
-- Y es `select` para los dos roles y nada más: es una vista de consulta, no hay
-- nada que escribir en ella, y sobre la tabla del fondo `anon` solo inserta.
-- ---------------------------------------------------------------------------

revoke all on public.offer_log from anon, authenticated;
grant select on public.offer_log to anon, authenticated;
