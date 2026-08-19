-- Chocó-up: un solo canal general, fuera las fundaciones y fuera los canales de
-- municipio; y las dos piezas nuevas de «Quiero ayudar», el correo de avisos y
-- el contador de aportes.
--
-- Va detrás de 0014 y se puede ejecutar más de una vez sin errores.
--
-- ===========================================================================
-- ESTA MIGRACIÓN Y EL DESPLIEGUE VAN JUNTOS. NO SE APLICA ANTES.
--
-- Es la primera del proyecto que no se puede pegar por adelantado, y conviene
-- saber por qué antes de abrir el editor de SQL. Aquí se borran columnas y una
-- tabla que el código que hay AHORA MISMO en producción sigue leyendo:
--
--   * `donationChannel(city)` hace `row.donation_key.trim()` sobre las columnas
--     del municipio. Sin ellas es un `undefined.trim()`, o sea la ficha de
--     cualquier municipio y /donaciones caídas enteras, no degradadas.
--   * `getCityDonationEntries()` pide `foundations(*)` en la misma consulta que
--     los municipios. Sin la tabla, la consulta falla y /donaciones se queda sin
--     un solo pueblo, en silencio.
--
-- Así que el orden es: subir el código y pegar esto, o pegar esto y subir el
-- código en el mismo rato. Entre una cosa y la otra el portal está roto para
-- quien llegue desde un WhatsApp, y este portal se abre sobre todo desde ahí.
-- ===========================================================================
--
-- ===========================================================================
-- ESTA MIGRACIÓN INVIERTE UNA DECISIÓN DE 0011, Y A PROPÓSITO
--
-- 0011 escribió que no hay ni va a haber un canal general, y retiró el que 0010
-- había creado. El motivo era bueno y sigue siéndolo: un destino que nadie
-- eligió para una familia, presentado en su ficha como si fuera el suyo, manda
-- dinero a otro sitio sin que se note mirando la pantalla.
--
-- Lo que cambia es el modelo, no la preocupación. La primera etapa del portal se
-- queda con una sola cosa —casos: una persona, un colegio, un animal o una
-- fundación— y cada caso tiene canal de donación. Si no trae uno propio, usa el
-- general, que coordinación verifica en primera instancia y que reparte entre
-- las causas publicadas aquí. Un caso sin canal dejaba de poder recibir nada, y
-- eso también es una forma de fallarle.
--
-- La condición con la que entra el canal general es la que 0011 defendía: LA
-- FICHA TIENE QUE DECIRLO CON ESAS PALABRAS. Un caso que usa el general no puede
-- presentarlo como suyo. Eso no lo garantiza este archivo —lo garantizan
-- `caseDonation()` en lib/donation-channel.ts, que devuelve de dónde sale el
-- canal junto con el canal, y `GeneralChannelNote`, que escribe la frase en un
-- solo sitio— pero es la razón por la que aquí hay una tabla aparte y no una
-- columna más: mientras el general viva en su propia fila, ninguna consulta
-- puede confundirlo con el de una familia por descuido.
--
-- QUÉ RECUPERA DE 0010 Y QUÉ NO. Recupera la forma —una fila única, con el
-- cerrojo puesto, editable desde el panel sin desplegar— y el rastro de quién la
-- tocó, que era lo mejor que tenía. NO recupera su tabla: `public.donation_key`
-- se queda borrada y este archivo no la resucita. La tabla nueva se llama
-- `public.donation_channel` y tiene tres formatos —llave, enlace y teléfono—,
-- que `public.donation_key` no tenía.
--
-- Que sean dos nombres distintos es deliberado y es lo que mantiene sano el
-- histórico. Pegadas en orden, 0010 crea `donation_key`, 0011 la borra y este
-- archivo crea `donation_channel`: no hay colisión y el estado final es el
-- mismo se pegue una vez o tres. Si alguien pega 0010 SUELTA sigue apareciendo
-- la llave global vieja, con su aviso de 0011 encima; si alguien pega este
-- archivo suelto, aparece el canal general nuevo y nada más. Reconstruir el
-- histórico entero no deja dos canales generales, porque solo uno de los dos
-- sobrevive a su migración siguiente.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- El canal general del portal
--
-- Una fila y solo una, garantizado por el tipo: `true` es el único valor que
-- pasa la comprobación y la clave primaria impide un segundo `true`. Es el mismo
-- cerrojo de 0010 y por el mismo motivo, que allí quedó bien escrito: sin él «el
-- canal general» sería «el primero que devuelva la consulta», que es el destino
-- del dinero decidido por un orden.
--
-- Las cinco columnas del destino se llaman igual que en `public.cases` a
-- propósito: `donationChannel()` (lib/donation-channel.ts) lee una fila con esa
-- forma y no sabe de quién es. Así el canal general y el de una familia se
-- pintan con la misma pieza y ninguno de los dos puede quedarse atrás cuando la
-- otra cambie. De quién es el canal no lo dice la fila: lo dice quien la lee.
--
-- Vive en la base de datos y no en una constante del proyecto por lo que 0010
-- dejó escrito y sigue siendo cierto: la llave va a cambiar, y va a cambiar con
-- el equipo en terreno, desde un móvil y con mala señal. Una constante se cambia
-- con un despliegue; una fila, desde /admin/donaciones en un minuto.
-- ---------------------------------------------------------------------------

create table if not exists public.donation_channel (
  singleton       boolean primary key default true,

  -- La llave tal y como se teclea en la app: `@soschoco`. Se guarda literal, sin
  -- normalizar ni añadirle nada, porque cualquier arreglo automático sobre un
  -- destino de dinero es un destino distinto del que alguien escribió.
  donation_key    text not null default '',

  -- El enlace de recaudación, para el día en que el canal general sea una Vaki y
  -- no una llave. Se excluye con los otros dos, abajo.
  donation_url    text not null default '',

  -- Y el número al que se llama o se escribe para coordinar un aporte, que es lo
  -- que hay en la mayoría de las fichas de campo (0013).
  donation_phone  text not null default '',

  -- En qué app se pega la llave: «Bre-B», «Nequi», «Daviplata». Vacío es válido y
  -- entonces el portal dice la versión general —la app del banco o la
  -- billetera—, que es cierta igual y no inventa una marca.
  donation_app    text not null default '',

  -- A nombre de quién tiene que aparecer al confirmar. Es la única comprobación
  -- que le queda a quien dona el día que la llave sea otra: la llave no dice nada
  -- por sí misma y el nombre que la app enseña antes de confirmar sí. Vacío no
  -- promete ningún nombre, que es mejor que prometer uno equivocado.
  donation_holder text not null default '',

  updated_at      timestamptz not null default now(),

  -- Quién lo tocó la última vez, tomado del token y nunca del formulario. Es el
  -- campo que se lee el día que el dinero aparezca en otra cuenta: dice desde qué
  -- sesión se cambió el destino de todo el portal a la vez.
  updated_by      text not null default '',

  constraint donation_channel_one_row check (singleton),

  -- Un canal es una llave, un enlace o un número, nunca dos. Misma regla y misma
  -- forma que `cases_donation_one_channel` (0011, ampliada en 0013): con dos
  -- puestos, «el canal» volvería a ser «el que la página mire primero».
  constraint donation_channel_one_kind check (
    (donation_key = '')::int +
    (donation_url = '')::int +
    (donation_phone = '')::int >= 2
  )
);

-- Las dos columnas del rastro las escribe la base de datos y no quien llama.
-- `private.touch_updated_at()` de 0001 no sirve aquí porque solo pone la fecha, y
-- una fecha sin nombre no contesta la pregunta que se va a hacer.
--
-- El correo sale de `auth.jwt()`, así que un cliente no puede firmarlo con el de
-- otra persona. Sin correo en el token —el SQL Editor de Supabase, o esta misma
-- migración— queda vacío, que es la verdad: no hubo sesión.
create or replace function private.stamp_donation_channel()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce(auth.jwt() ->> 'email', '');
  return new;
end;
$$;

drop trigger if exists donation_channel_stamp on public.donation_channel;
create trigger donation_channel_stamp
  before insert or update on public.donation_channel
  for each row execute function private.stamp_donation_channel();

-- `on conflict do nothing` es lo que hace que este archivo se pueda volver a
-- pegar. Todas las migraciones del proyecto se vuelven a pegar cuando hay que
-- reconstruir algo, y un `do update` aquí devolvería el canal a `@soschoco` el
-- día que ya fuera otro: un mantenimiento rutinario, sin ningún error a la vista,
-- mandando las donaciones a una cuenta vieja. Es la misma línea de 0010 y por la
-- misma razón.
insert into public.donation_channel (singleton, donation_key)
values (true, '@soschoco')
on conflict (singleton) do nothing;

-- Leerlo es de todo el mundo: para eso está, y no pertenece a ningún municipio,
-- así que no hay cascada de publicación que aplicar. La condición es `true`
-- escrita a mano para que no se lea como un olvido.
--
-- Cambiarlo es de coordinación, y aquí basta la política: esta tabla no tiene más
-- escrituras legítimas que esa. En `public.cases` sí hace falta un disparador
-- además, porque quien documenta tiene que poder guardar la ficha entera y el
-- canal viaja dentro de esa misma escritura; ver el bloque de más abajo.
--
-- `for update` y nada más, igual que en 0010: la fila la escribe esta migración,
-- no hay nada que crear ni nada que borrar, y vaciar la tabla dejaría al portal
-- sin el único destino que tienen los casos sin canal propio. Insertar y borrar
-- quedan cerrados por dos lados que no dependen el uno del otro: ninguna política
-- los permite y ningún permiso de tabla los concede.
alter table public.donation_channel enable row level security;

revoke all on public.donation_channel from anon, authenticated;
grant select on public.donation_channel to anon;
grant select, update on public.donation_channel to authenticated;

drop policy if exists donation_channel_public_read on public.donation_channel;
create policy donation_channel_public_read on public.donation_channel
  for select to anon, authenticated
  using (true);

drop policy if exists donation_channel_coordination on public.donation_channel;
create policy donation_channel_coordination on public.donation_channel
  for update to authenticated
  using (private.is_coordination())
  with check (private.is_coordination());

-- ---------------------------------------------------------------------------
-- El caso real de Quibdó pasa a usar el general, y el dinero no se mueve
--
-- En la base real hay un caso con `donation_key = '@soschoco'` escrito como
-- canal propio: es lo que coordinación registró desde el panel cuando 0011 quitó
-- la llave global y esa familia se quedaba sin nada. Ahora `@soschoco` es el
-- canal general, así que repetirlo en la ficha diría que es suyo cuando no lo es.
--
-- EL DESTINO NO CAMBIA. La misma llave, la misma cuenta, el mismo titular. Lo
-- único que cambia es lo que la ficha afirma: antes «el canal que el equipo
-- registró para ella», ahora «el canal general del portal, que reparte entre las
-- causas publicadas». Esa frase pasa a ser cierta, que es justo lo que hoy no lo
-- era.
--
-- Se busca por el valor literal y no por un identificador: lo que hay que
-- reconciliar es exactamente «un caso cuyo canal propio es el canal general», y
-- escribir aquí el UUID de una persona ataría esta migración a una fila que
-- mañana puede no estar. Es idempotente porque después de correr no queda ningún
-- caso con ese valor.
--
-- Si un día coordinación le abre un canal propio de verdad, lo escribe desde el
-- panel y la ficha vuelve a decir que es suyo, sin tocar este archivo.
-- ---------------------------------------------------------------------------

update public.cases
   set donation_key = '', donation_app = '', donation_holder = ''
 where donation_key = '@soschoco';

-- ---------------------------------------------------------------------------
-- Fuera el canal de municipio
--
-- Ya no hay canales por ciudad. La pregunta que contestaba —«¿a dónde va el
-- dinero de este pueblo?»— dejó de tener respuesta en el modelo nuevo: el dinero
-- va a un caso, y los casos que no tienen canal propio usan el general. Un canal
-- de municipio sería un tercer destino que no le pertenece a nadie con nombre.
--
-- Se borran las columnas y no se dejan vacías. Una columna que nadie escribe pero
-- que sigue ahí es un canal que puede volver a llenarse desde la Data API sin que
-- ninguna pantalla lo enseñe, que es la peor de las dos formas de tener un
-- destino de dinero. Con la columna fuera, el disparador y la restricción del
-- municipio ya no tienen nada que vigilar y se van con ellas.
--
-- `private.guard_donation_channel()` NO se toca: sigue en pie para
-- `public.cases`, que es donde de verdad hace falta.
--
-- En la base real esto se lleva por delante un `donation_url` de un municipio de
-- prueba (Istmina) y nada más: Quibdó nunca tuvo canal propio.
-- ---------------------------------------------------------------------------

drop trigger if exists cities_guard_donation_channel on public.cities;
alter table public.cities drop constraint if exists cities_donation_one_channel;

alter table public.cities
  drop column if exists donation_key,
  drop column if exists donation_url,
  drop column if exists donation_phone,
  drop column if exists donation_app,
  drop column if exists donation_holder;

-- ---------------------------------------------------------------------------
-- Fuera las fundaciones
--
-- Desaparecen como entidad del modelo. No se convierten en otra cosa ni se
-- migran: una fundación que trabaje en el Chocó entra ahora como un caso más
-- —igual que una persona, un colegio o un animal—, con su historia, sus
-- necesidades y su canal si lo tiene.
--
-- Se borran los datos y no solo el código, y eso hay que justificarlo porque es
-- irreversible. En la base real hay dos filas y las dos llevan «(prueba)» en el
-- nombre: son la carga de muestra de supabase/datos-de-prueba.sql. No existe
-- ninguna fundación real registrada —lo dice 0010 y sigue siendo cierto—, así
-- que aquí no hay ningún dato bueno que conservar. Dejar la tabla vacía «por si
-- acaso» tampoco protegería nada: lo que protegía era `donation_url`, y ese
-- destino ya no lo publica ninguna pantalla.
--
-- `cascade` se lleva las tres políticas de la tabla —`foundations_public_read`
-- (0001), `foundations_team_read` y `foundations_coordination` (0002)— y la
-- restricción `foundations_one_per_city` (0004). No hay claves ajenas apuntando
-- aquí: `offers` y `needs` cuelgan de municipio y de caso, nunca de fundación.
--
-- CUIDADO CON EL ORDEN, hacia atrás. Pegadas en orden no pasa nada: 0001 crea la
-- tabla, 0002 le pone políticas, 0004 la reforma, 0008 le recorta permisos y
-- esto la borra al final. Pero 0001, 0002, 0004 y 0008 SUELTAS, sin este archivo
-- detrás, devuelven al portal una tabla de fundaciones con su enlace de donación
-- y su lectura pública. Es la misma trampa que 0010 y 0011, y se resuelve igual:
-- las migraciones se pegan enteras y en orden, o no se pegan.
-- ---------------------------------------------------------------------------

drop table if exists public.foundations cascade;

-- ---------------------------------------------------------------------------
-- El correo de avisos de «Quiero ayudar»
--
-- Quien ofrece algo deja un contacto para que el equipo le responda por esa
-- oferta, y eso ya está en `public.offers`. Esto es otra cosa: un correo para que
-- le contemos cómo avanza el portal. Son dos consentimientos distintos y por eso
-- son dos tablas: usar el contacto de una oferta para mandar novedades sería
-- escribirle a alguien que no lo pidió.
--
-- EL PÚBLICO INSERTA Y NADIE LEE SALVO COORDINACIÓN. Ni la lista, ni el recuento,
-- ni por la API, y eso se sostiene en dos barreras que no dependen la una de la
-- otra —la misma pareja que 0008 dejó escrita para el contacto de quien ofrece—:
--
--   * El permiso de tabla. `anon` tiene `insert` y nada más, así que pedir la
--     tabla no devuelve una lista vacía: devuelve un error de permisos. Y un
--     recuento por la API (`Prefer: count=exact`) es una consulta de lectura, de
--     modo que sin `select` tampoco hay número.
--
--   * La política. `newsletter_coordination_read` es de coordinación, no de todo
--     el equipo. Quien documenta un municipio no tiene por qué leer una lista de
--     correos que no es de nadie en particular.
--
-- El día que alguien añada una política de lectura para depurar algo, el permiso
-- de tabla sigue diciendo que no. Y al revés.
--
-- Y no se guarda de dónde vino ni cuándo se abrió la página: un correo y una
-- fecha. Cuanto menos haya en esta tabla, menos hay que cuidar.
-- ---------------------------------------------------------------------------

create table if not exists public.newsletter_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  created_at timestamptz not null default now(),

  -- La comprobación es de forma y es corta a propósito. Un patrón exhaustivo de
  -- correos válidos no existe, y el que lo intenta acaba rechazando el correo
  -- real de alguien: aquí solo se pide que haya algo, una arroba, algo, un punto
  -- y algo, que es lo que descarta un teclazo sin descartar a nadie.
  constraint newsletter_email_shape
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  constraint newsletter_email_len
    check (char_length(email) between 6 and 200)
);

-- Un correo, una fila, sin distinguir mayúsculas: `Ana@…` y `ana@…` son la misma
-- persona y dos filas serían dos avisos.
create unique index if not exists newsletter_email_unique
  on public.newsletter_signups (lower(email));

-- ---------------------------------------------------------------------------
-- Apuntarse dos veces no dice que ya estabas apuntada
--
-- Con el índice único a secas, insertar un correo repetido devuelve un error y
-- ese error es una respuesta: convierte el formulario en una forma de preguntar
-- «¿está esta persona en la lista?», que es justo lo que la tabla no publica.
--
-- El disparador devuelve `null`, que en un `before insert` cancela la fila y deja
-- que la sentencia termine bien. Desde fuera las dos respuestas son idénticas
-- —nadie puede distinguir el alta nueva de la repetida— y la lista no se llena de
-- duplicados. El índice único se queda igualmente: es lo que sostiene esta
-- comprobación y lo que la haría cumplir si un día el disparador no estuviera.
-- ---------------------------------------------------------------------------

create or replace function private.skip_repeated_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.newsletter_signups s
    where lower(s.email) = lower(new.email)
  ) then
    return null;
  end if;

  return new;
end;
$$;

-- `security definer` porque el disparador tiene que poder mirar una tabla que
-- quien inserta no puede leer. Es lo justo para eso: consulta una fila por su
-- correo y devuelve sí o no, sin exponer nada. Ejecutarla suelta no la puede
-- llamar nadie —es de `private`, que no está en la API—, y aun así se le retira
-- el `execute` al público, que también lo concede el esquema por defecto.
revoke all on function private.skip_repeated_signup() from anon, authenticated;

drop trigger if exists newsletter_skip_repeated on public.newsletter_signups;
create trigger newsletter_skip_repeated
  before insert on public.newsletter_signups
  for each row execute function private.skip_repeated_signup();

alter table public.newsletter_signups enable row level security;

revoke all on public.newsletter_signups from anon, authenticated;
grant insert on public.newsletter_signups to anon, authenticated;
grant select, delete on public.newsletter_signups to authenticated;

drop policy if exists newsletter_public_insert on public.newsletter_signups;
create policy newsletter_public_insert on public.newsletter_signups
  for insert to anon, authenticated
  with check (true);

drop policy if exists newsletter_coordination_read on public.newsletter_signups;
create policy newsletter_coordination_read on public.newsletter_signups
  for select to authenticated
  using (private.is_coordination());

-- Darse de baja es un derecho y hoy se ejerce escribiendo al equipo, así que
-- alguien tiene que poder borrar la fila. Es de coordinación por lo mismo que
-- leerla.
drop policy if exists newsletter_coordination_delete on public.newsletter_signups;
create policy newsletter_coordination_delete on public.newsletter_signups
  for delete to authenticated
  using (private.is_coordination());

-- ---------------------------------------------------------------------------
-- El contador de aportes
--
-- QUÉ CUENTA, EXACTAMENTE, porque de esto ya salió un fallo grave en el portal:
-- tres pantallas contando conjuntos distintos con el mismo rótulo (ver
-- lib/needs.ts). La definición se escribe una vez, aquí, y son dos números que
-- salen de la misma fila para que no puedan contradecirse:
--
--   * `ofrecidos`: las ofertas que entraron por «Quiero ayudar» y siguen en pie
--     —`pendiente` o `aceptada`—. No es «cuánta gente ha escrito»: lo rechazado
--     y lo retirado no cuentan, porque un contador que sume el spam y lo que el
--     equipo descartó afirma una participación que no existe.
--
--   * `entregados`: de esos, los que ya llegaron. Es la misma condición que hace
--     pública una fila en `public.aid_log` (0005), reescrita, y tiene que seguir
--     siéndolo: este número y el largo de /ayudas se leen en la misma tarde y no
--     pueden decir dos cosas.
--
--     Lo suyo habría sido contar `public.aid_log` directamente, para que no
--     hubiera dos escrituras de la misma regla. No se puede: 0005 empieza con un
--     `drop view if exists public.aid_log`, y una vista que dependiera de ella
--     haría fallar ese `drop` la próxima vez que se peguen las migraciones en
--     orden —que es lo que hace `verify:sql` en su segundo pase—. Se paga con una
--     condición repetida y se compensa con una comprobación del arnés que exige
--     que los dos números coincidan; si alguien cambia lo que entra en `aid_log`
--     y se olvida de aquí, falla ahí antes que en la pantalla.
--
-- Los dos aplican la cascada de publicación —municipio publicado, o ninguno—,
-- reescrita a mano igual que en `aid_log` (0005) y en `offer_log` (0012) porque
-- una vista con los derechos de su propietario no hereda las RLS. Sin ella, el
-- contador diría que hay más aportes de los que se pueden ver, y quien contara
-- lo publicado encontraría otra cosa. Es literalmente el fallo de lib/needs.ts
-- con otro nombre.
--
-- Y los dos son ACUMULADOS, sin la caducidad de ocho semanas de `offer_log`. Un
-- contador que baja solo diría que se han hecho menos aportes de los que se han
-- hecho. El muro caduca porque su oficio es que lo que se lee siga estando
-- disponible; esto cuenta lo que ha pasado, y lo que ha pasado no expira. De ahí
-- que `ofrecidos` incluya también lo ya entregado: son aportes hechos.
--
-- Lo que este número NO es, y por eso la pantalla lo rotula con esas palabras:
-- no es dinero, no es kilos y no es familias atendidas. Es cuántos aportes se
-- han ofrecido desde el formulario. La frase que lo acompaña vive en
-- lib/contributions.ts y no en la plantilla, por lo mismo que la definición vive
-- aquí.
--
-- Es un agregado y no expone a nadie: dos enteros, sin fecha, sin municipio y sin
-- categoría. No hay forma de cruzarlo con una persona porque no distingue filas.
--
-- La vista, igual que `aid_log` y `offer_log`: `security_invoker = false` para
-- que pueda contar una tabla que el público no puede leer, y `security_barrier`
-- para que una condición añadida desde fuera no se evalúe antes que las de la
-- vista.
-- ---------------------------------------------------------------------------

drop view if exists public.offer_tally;

create view public.offer_tally
with (security_invoker = false, security_barrier = true)
as
select
  count(*) filter (
    where o.status in ('pendiente', 'aceptada')
      and (
        o.city_id is null
        or exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
      )
  )::int as ofrecidos,
  count(*) filter (
    where o.delivered_on is not null
      and (
        o.city_id is null
        or exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
      )
  )::int as entregados
from public.offers o;

-- Mismo recorte que en 0012: se revoca todo y se concede la lista corta, porque
-- una vista recién creada nace con el juego entero concedido a `anon` y a
-- `authenticated`. Volver a pegar este archivo la reabre y esta línea la vuelve a
-- cerrar, así que no hay que pegar nada detrás.
revoke all on public.offer_tally from anon, authenticated;
grant select on public.offer_tally to anon, authenticated;
