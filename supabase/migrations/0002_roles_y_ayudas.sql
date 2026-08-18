-- Chocó-up: roles del equipo y registro público de ayudas entregadas.
--
-- Va detrás de 0001_init.sql y no lo sustituye. Cuidado con el orden: 0001
-- recrea las políticas del equipo en su versión sin roles, así que si alguna vez
-- se vuelve a pegar, hay que volver a pegar este archivo justo después.
--
-- Por qué existe:
--
--   1. La allowlist era plana: entrar al panel era poder tocarlo todo —crear
--      municipios, publicarlos, cambiar el enlace de donación de cualquier
--      fundación y leer el teléfono de cualquiera que hubiera ofrecido ayuda—.
--      El equipo que viaja y documenta es más grande que el que decide, y
--      documenta con el móvil que tenga a mano delante de la familia.
--
--   2. El registro de ayudas entregadas se hace público, y anónimo: cualquiera
--      puede comprobar qué llegó de verdad, sin que eso publique quién ayudó ni
--      a qué persona fue. El detalle público es grueso a propósito —el mes y el
--      municipio— y el recorte vive en la vista, no en la página.
--
-- Lo que este archivo NO toca: las políticas de lectura pública de 0001
-- (`published`, `consent_to_publish` y su cascada). Siguen tal cual. Aquí solo
-- se estrecha lo que puede hacer el equipo y se abre una puerta pública nueva,
-- que vuelve a aplicar esa misma cascada por su cuenta (ver `public.aid_log`).
--
-- Se puede ejecutar más de una vez sin errores.

-- ---------------------------------------------------------------------------
-- Rol de cada persona del equipo
--
-- Dos roles y ni uno más. Cualquier rol intermedio que se nos ocurra hoy sería
-- una regla que en terreno nadie recuerda:
--
--   coordinacion   Todo, incluido invitar personas, darles rol y asignarles
--                  municipios. También el dinero: la fundación de cada
--                  municipio y su enlace de donación.
--   documentacion  Fotos, casos y necesidades de los municipios que tenga
--                  asignados. Nada fuera de ellos.
--
-- El valor por omisión es el rol pequeño: una invitación mal rellenada tiene que
-- dar de menos y no de más. Quien ya estaba en la lista antes de esta migración
-- sí sube a coordinación, porque ya podía hacer todo esto y quitárselo a mitad
-- de viaje sería una avería, no una mejora de seguridad. El reparto fino se hace
-- después desde /admin/equipo.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'private'
      and table_name = 'team_members'
      and column_name = 'role'
  ) then
    alter table private.team_members add column role text not null default 'documentacion';
    update private.team_members set role = 'coordinacion';
  end if;
end
$$;

alter table private.team_members drop constraint if exists team_members_role_valid;
alter table private.team_members add constraint team_members_role_valid
  check (role in ('coordinacion', 'documentacion'));

-- ---------------------------------------------------------------------------
-- Municipios asignados
--
-- Vive en `private` por lo mismo que la allowlist: la relación entre un correo y
-- un municipio dice quién está donde, y eso no se publica.
--
-- La clave es el correo y no un id de usuario de auth: se invita a alguien antes
-- de que entre por primera vez, y hasta que se le da de alta la cuenta no existe
-- ninguna fila suya en auth.users. La invitación tiene que poder existir antes
-- que la persona.
-- ---------------------------------------------------------------------------

create table if not exists private.team_city_assignments (
  email      text not null references private.team_members (email) on delete cascade,
  city_id    uuid not null references public.cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (email, city_id)
);

alter table private.team_city_assignments enable row level security;
revoke all on private.team_city_assignments from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Las tres preguntas que hacen las políticas
--
-- Todas leen la identidad del JWT y la comprueban contra la base de datos. Nada
-- de esto se puede afirmar desde el cliente: el rol no viaja en el token, se
-- consulta aquí.
-- ---------------------------------------------------------------------------

create or replace function private.team_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select tm.role
  from private.team_members tm
  where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

-- El coalesce no es cosmético. Sin él, quien tiene sesión pero no está en la lista
-- del equipo no da falso: da nulo, porque no tiene rol con el que comparar. Las
-- políticas tratan el nulo como un no, pero un `if not ...` de plpgsql tampoco
-- entra —`not null` es nulo—, y `private.require_coordination()` dejaba pasar
-- justo al que no es nadie. Aquí la respuesta es siempre sí o no.
create or replace function private.is_coordination()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.team_role() = 'coordinacion', false);
$$;

-- Verdadero si quien pregunta puede escribir en ese municipio.
--
-- Coordinación ignora el argumento a propósito, incluido el nulo: hay filas sin
-- municipio —una oferta genérica, que no apunta a ningún sitio— y alguien tiene
-- que poder atenderlas. Documentación con nulo da falso, que es lo correcto: no
-- se puede tener asignado "ninguno".
create or replace function private.can_write_city(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case private.team_role()
    when 'coordinacion' then true
    when 'documentacion' then exists (
      select 1
      from private.team_city_assignments a
      where a.city_id = target
        and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    else false
  end;
$$;

grant execute on function private.team_role(), private.is_coordination() to authenticated;
grant execute on function private.can_write_city(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lo que el panel necesita saber de la sesión
--
-- Devuelve rol y municipios asignados en una sola llamada. Las páginas del panel
-- lo usan para no ofrecer botones que la base de datos va a rechazar, y las
-- Server Actions para comprobar la autorización antes de escribir. Es la
-- respuesta a "quién eres" y la da el servidor, no el navegador.
-- ---------------------------------------------------------------------------

create or replace function public.team_session()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'email', tm.email,
    'role', tm.role,
    'cityIds', coalesce(
      (
        select jsonb_agg(a.city_id)
        from private.team_city_assignments a
        where lower(a.email) = lower(tm.email)
      ),
      '[]'::jsonb
    )
  )
  from private.team_members tm
  where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

-- Postgres concede EXECUTE a todo el mundo al crear una función, así que hay que
-- quitarlo explícitamente: nada de esto se llama sin sesión.
--
-- Y `public` no basta. Supabase concede EXECUTE directamente a `anon` por
-- privilegios por defecto del esquema, y una concesión directa no se va al
-- revocar el pseudo-rol: hay que nombrar a `anon` aparte o la función queda
-- abierta en /rest/v1/rpc sin sesión.
revoke execute on function public.team_session() from public, anon;
grant execute on function public.team_session() to authenticated;

-- ---------------------------------------------------------------------------
-- Gestión del equipo desde el panel
--
-- La allowlist no está expuesta en la Data API y así se queda: la lista de
-- correos del equipo es justo lo que no debe filtrarse. Por eso el panel entra
-- por estas tres funciones y no por la tabla, y cada una comprueba por su cuenta
-- que quien llama es coordinación. Quien las invoque directamente contra la API
-- con una sesión de documentación recibe un error, no una lista.
-- ---------------------------------------------------------------------------

create or replace function private.require_coordination()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_coordination() then
    raise exception 'Solo coordinación puede gestionar el equipo'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.team_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_coordination();

  return coalesce(
    (
      select jsonb_agg(entry order by entry ->> 'email')
      from (
        select jsonb_build_object(
          'email', tm.email,
          'nombre', coalesce(tm.nombre, ''),
          'role', tm.role,
          'createdAt', tm.created_at,
          'cityIds', coalesce(
            (
              select jsonb_agg(a.city_id)
              from private.team_city_assignments a
              where lower(a.email) = lower(tm.email)
            ),
            '[]'::jsonb
          )
        ) as entry
        from private.team_members tm
      ) as members
    ),
    '[]'::jsonb
  );
end;
$$;

-- Invita o reescribe a una persona: el mismo gesto crea y edita, porque en el
-- panel es el mismo formulario. Los municipios llegan como lista completa y
-- sustituyen los que hubiera: es lo que la pantalla muestra, y un "añadir" que
-- no quita dejaría asignaciones viejas invisibles.
create or replace function public.team_save_member(
  p_email   text,
  p_role    text,
  p_cities  uuid[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_self  text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  perform private.require_coordination();

  if position('@' in v_email) < 2 or length(v_email) > 200 then
    raise exception 'Escribe un correo válido' using errcode = '22023';
  end if;

  if p_role not in ('coordinacion', 'documentacion') then
    raise exception 'Rol desconocido: %', p_role using errcode = '22023';
  end if;

  -- Nadie se cambia el rol a sí mismo. No es desconfianza: es el seguro contra
  -- quedarse sin nadie que pueda repartir permisos, que en mitad del viaje no
  -- tiene arreglo desde la interfaz.
  if v_email = v_self and p_role <> 'coordinacion' then
    raise exception 'No puedes quitarte a ti misma la coordinación: pídeselo a otra persona de coordinación'
      using errcode = '42501';
  end if;

  -- "Charlie@ejemplo.com" y "charlie@ejemplo.com" son la misma persona. La clave
  -- de la tabla distingue mayúsculas y las comprobaciones de rol no, así que dos
  -- filas de la misma persona darían un permiso que depende de cuál se lea
  -- primero. Se guarda siempre en minúsculas y se retira la variante vieja.
  delete from private.team_members tm where lower(tm.email) = v_email and tm.email <> v_email;

  insert into private.team_members (email, role)
  values (v_email, p_role)
  on conflict (email) do update set role = excluded.role;

  delete from private.team_city_assignments a where lower(a.email) = v_email;

  if p_cities is not null and array_length(p_cities, 1) > 0 then
    insert into private.team_city_assignments (email, city_id)
    select v_email, unnest(p_cities)
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.team_remove_member(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  perform private.require_coordination();

  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'No puedes sacarte a ti misma de la lista del equipo'
      using errcode = '42501';
  end if;

  delete from private.team_members tm where lower(tm.email) = v_email;
end;
$$;

-- `anon` aparte de `public`, por lo mismo que en team_session().
revoke execute on function
  public.team_directory(),
  public.team_save_member(text, text, uuid[]),
  public.team_remove_member(text)
from public, anon;

grant execute on function
  public.team_directory(),
  public.team_save_member(text, text, uuid[]),
  public.team_remove_member(text)
to authenticated;

-- ---------------------------------------------------------------------------
-- Ofertas: qué llegó y quién quiere aparecer
--
-- `delivered_on` es una fecha y no un estado más. Los tres estados de hoy
-- —pendiente, aceptada, rechazada— cuentan la conversación con quien ofrece;
-- que la ayuda llegara es otra cosa, y sustituir "aceptada" por "entregada"
-- borraría que hubo un acuerdo. Además el registro público tiene que decir
-- CUÁNDO llegó, y un estado no lleva fecha.
--
-- Es `date` y no `timestamptz` por dos motivos de terreno: el equipo sabe el día
-- —"llegó ayer"—, no la hora exacta, y una entrega a las 20:00 en Colombia se
-- publicaría con la fecha del día siguiente si se guardara en UTC.
--
-- `publish_name` empieza en falso siempre. Quien ofrece ayuda no tiene que hacer
-- nada para conservar su privacidad; aparecer con nombre es lo que hay que pedir
-- expresamente.
-- ---------------------------------------------------------------------------

alter table public.offers add column if not exists delivered_on date;
alter table public.offers add column if not exists publish_name boolean not null default false;

-- Lo rechazado no puede figurar como entregado en una lista pública. Es la única
-- garantía del registro que no depende de la interfaz.
alter table public.offers drop constraint if exists offers_delivery_requires_acceptance;
alter table public.offers add constraint offers_delivery_requires_acceptance
  check (delivered_on is null or status = 'aceptada');

create index if not exists offers_delivered_idx on public.offers (delivered_on desc)
  where delivered_on is not null;

-- ---------------------------------------------------------------------------
-- Registro público de ayudas
--
-- Público a propósito y anónimo por defecto. La vista es la ÚNICA puerta del
-- público a la tabla de ofertas, y lo que la sostiene son dos barreras
-- independientes: que `anon` no tenga política de select sobre public.offers y
-- que tampoco tenga permiso de tabla. Ninguna de las dos vive en el código de la
-- web, así que el contacto de quien ofrece no es alcanzable ni por la API ni por
-- error de una consulta de la app.
--
-- La política es de aquí. El permiso NO, y conviene saberlo: este archivo
-- prometió las dos desde el primer día y en la base de datos solo estuvo la
-- primera. Supabase concede el juego completo a `anon` sobre toda tabla nueva de
-- `public`, y volver a conceder lo justo —que es lo que hace 0001— no retira lo
-- que sobra. Eso lo retira 0008_permiso_de_tabla_del_publico.sql; sin él aquí
-- hay una barrera y no dos.
--
-- La vista se consulta con los derechos de su propietario (security_invoker off)
-- porque enmascarar una columna —el nombre solo si lo autorizaron— es lo único
-- que las políticas de fila no saben hacer. La contrapartida es que aquí no se
-- aplican las RLS de las tablas del fondo, así que la cascada de publicación se
-- vuelve a escribir a mano en el filtro y en los joins: despublicar un municipio
-- se lleva sus entregas de aquí igual que se lleva sus fotos y sus casos. Si se
-- toca esta vista, hay que revisar esas tres condiciones.
--
-- security_barrier evita que una condición añadida desde fuera se evalúe antes
-- que las de la vista y filtre filas por el mensaje de un error.
--
-- Lo que la vista NO deja salir, además del contacto, y por qué:
--
--   * El día exacto de la entrega. La fecha completa es del equipo, que la
--     necesita para saber qué se movió y cuándo. Publicada es otra cosa: una
--     lista abierta que diga qué llegó, a qué pueblo y qué día es un calendario
--     de reparto, y de un calendario se sirve cualquiera que quiera esperar el
--     siguiente. Con el mes la comprobación se sostiene igual —lo que está aquí
--     ya llegó y se puede preguntar por ello— y el calendario desaparece.
--
--   * El caso al que fue: ni nombre, ni identificador, ni el título de una
--     necesidad suya. Quien sale en un caso dio permiso para contar su situación
--     y publicar sus fotos, no para que se publique lo que recibe; y lo que
--     recibe cuenta cosas —una medicación, un tratamiento— que no le tocan a
--     nadie. El destino público es el municipio, que basta para rendir cuentas y
--     no señala a ninguna persona.
--
-- Las dos cosas se recortan aquí, en la vista, y no en la página: la vista ES la
-- API. Cualquiera puede pedirle las columnas que quiera, así que la única forma
-- de que un dato no se publique es que no exista en ella. Es el mismo criterio
-- con el que el contacto no está: no se esconde, no está.
--
-- Queda un resto que esta vista no puede cerrar: `resource` lo escribe quien
-- ofrece —"tratamiento para la tensión, tres meses"— y en un municipio pequeño,
-- con la ficha de un caso delante, alguien decidido puede atar cabos. Cerrarlo
-- del todo sería no publicar qué llegó, que es el registro entero. Lo que queda
-- en manos de quien registra la entrega es no marcarla si ese texto señala a una
-- persona.
-- ---------------------------------------------------------------------------

drop view if exists public.aid_log;

create view public.aid_log
with (security_invoker = false, security_barrier = true)
as
select
  o.id,
  o.resource,
  o.category,
  -- Texto 'YYYY-MM' y no una fecha con el día puesto a 1: una fecha se leería
  -- como el día 1, y aquí no hay ningún día que leer.
  to_char(o.delivered_on, 'YYYY-MM') as delivered_month,
  -- El nombre solo con autorización expresa. Y no si dentro hay un teléfono o un
  -- correo: pasa —"Marta, 3167778899"— y publicarlo tal cual sería publicar el
  -- contacto que esa persona no autorizó. Un nombre no lleva siete dígitos
  -- seguidos ni una arroba; ante la duda, no se publica.
  case
    when o.publish_name
      and o.offerer_name !~ '[0-9]{7}'
      and o.offerer_name not like '%@%'
    then o.offerer_name
  end as offerer_name,
  c.name as city_name,
  c.slug as city_slug,
  n.title as need_title
from public.offers o
  left join public.cities c
    on c.id = o.city_id
   and c.published
  -- Solo las necesidades de municipio. El título de una necesidad de un caso
  -- —"bloque y cemento para rehacer la pared del fondo"— está escrito tal cual en
  -- la ficha de esa familia: publicarlo aquí es nombrarla dando un rodeo. Y el
  -- identificador tampoco sale, que por él se llega al caso con una consulta.
  left join public.needs n
    on n.id = o.need_id
   and n.case_id is null
   and exists (select 1 from public.cities nc where nc.id = n.city_id and nc.published)
-- Una entrega en un municipio sin publicar no aparece, igual que no aparecen sus
-- fotos ni sus casos. El municipio nulo sí: es la ayuda que no iba a un sitio
-- concreto —un camión, un cupo de carga— y no cuenta nada de nadie.
where o.delivered_on is not null
  and (
    o.city_id is null
    or exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
  );

grant select on public.aid_log to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Políticas por rol
--
-- Se reemplazan las seis `*_team_all` de 0001, que daban todo a cualquiera de la
-- lista. Las `*_public_read` no se tocan.
--
-- Leer sigue siendo de todo el equipo: quien documenta necesita ver el portal
-- entero para no duplicar trabajo ni pisar lo que otra persona escribió esta
-- mañana. Lo que se estrecha es escribir, y el único dato de terceros que había
-- suelto —el contacto de quien ofrece ayuda— pasa a verse solo donde se trabaja.
-- ---------------------------------------------------------------------------

drop policy if exists cities_team_all      on public.cities;
drop policy if exists foundations_team_all on public.foundations;
drop policy if exists cases_team_all       on public.cases;
drop policy if exists photos_team_all      on public.photos;
drop policy if exists needs_team_all       on public.needs;
drop policy if exists offers_team_all      on public.offers;
drop policy if exists offers_public_insert on public.offers;

drop policy if exists cities_team_read            on public.cities;
drop policy if exists cities_coordination_insert  on public.cities;
drop policy if exists cities_coordination_delete  on public.cities;
drop policy if exists cities_assigned_update      on public.cities;
drop policy if exists foundations_team_read       on public.foundations;
drop policy if exists foundations_coordination    on public.foundations;
drop policy if exists cases_team_read             on public.cases;
drop policy if exists cases_assigned_write        on public.cases;
drop policy if exists cases_assigned_update       on public.cases;
drop policy if exists cases_assigned_delete       on public.cases;
drop policy if exists photos_team_read            on public.photos;
drop policy if exists photos_assigned_write       on public.photos;
drop policy if exists photos_assigned_update      on public.photos;
drop policy if exists photos_assigned_delete      on public.photos;
drop policy if exists needs_team_read             on public.needs;
drop policy if exists needs_assigned_write        on public.needs;
drop policy if exists needs_assigned_update       on public.needs;
drop policy if exists needs_assigned_delete       on public.needs;
drop policy if exists offers_scoped_read          on public.offers;
drop policy if exists offers_scoped_update        on public.offers;
drop policy if exists offers_coordination_delete  on public.offers;
drop policy if exists offers_anyone_insert        on public.offers;

-- Municipios: crear y borrar es de coordinación; documentar, de quien lo tenga
-- asignado. Publicar también es de coordinación, pero eso no cabe en una
-- política —hay que comparar la fila nueva con la vieja— y lo hace el disparador
-- de más abajo.
create policy cities_team_read on public.cities
  for select to authenticated
  using (private.is_team());

create policy cities_coordination_insert on public.cities
  for insert to authenticated
  with check (private.is_coordination());

create policy cities_coordination_delete on public.cities
  for delete to authenticated
  using (private.is_coordination());

create policy cities_assigned_update on public.cities
  for update to authenticated
  using (private.can_write_city(id))
  with check (private.can_write_city(id));

-- Fundaciones: solo coordinación, y el motivo es el dinero. `donation_url` es el
-- destino del botón "Donar dinero" de la página pública: quien pueda editarlo
-- puede desviar donaciones a donde quiera. Es el campo más peligroso del portal
-- y se queda en el círculo pequeño. El equipo en terreno pasa los datos de la
-- fundación a coordinación y coordinación los registra.
create policy foundations_team_read on public.foundations
  for select to authenticated
  using (private.is_team());

create policy foundations_coordination on public.foundations
  for all to authenticated
  using (private.is_coordination())
  with check (private.is_coordination());

-- Casos, fotos y necesidades: el material que se levanta en campo. Incluye
-- borrar, y a propósito: retirar la foto de una persona identificable tiene que
-- poder hacerse en el momento y desde el municipio, no esperando a que
-- coordinación lea un WhatsApp.
create policy cases_team_read on public.cases
  for select to authenticated
  using (private.is_team());

create policy cases_assigned_write on public.cases
  for insert to authenticated
  with check (private.can_write_city(city_id));

create policy cases_assigned_update on public.cases
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

create policy cases_assigned_delete on public.cases
  for delete to authenticated
  using (private.can_write_city(city_id));

create policy photos_team_read on public.photos
  for select to authenticated
  using (private.is_team());

create policy photos_assigned_write on public.photos
  for insert to authenticated
  with check (private.can_write_city(city_id));

create policy photos_assigned_update on public.photos
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

create policy photos_assigned_delete on public.photos
  for delete to authenticated
  using (private.can_write_city(city_id));

create policy needs_team_read on public.needs
  for select to authenticated
  using (private.is_team());

create policy needs_assigned_write on public.needs
  for insert to authenticated
  with check (private.can_write_city(city_id));

create policy needs_assigned_update on public.needs
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

create policy needs_assigned_delete on public.needs
  for delete to authenticated
  using (private.can_write_city(city_id));

-- Ofertas. Sigue sin haber política de lectura para el público: el contacto de
-- quien ofrece no sale de aquí, y lo que se publica pasa por public.aid_log.
--
-- Dentro del equipo la lectura también se estrecha, porque cada oferta trae el
-- teléfono de una persona que no es del equipo: coordinación las ve todas
-- —incluidas las que no apuntan a ningún municipio— y documentación solo las de
-- los municipios que atiende. Un dato de contacto de más no ayuda a nadie a
-- documentar mejor.
create policy offers_anyone_insert on public.offers
  for insert to anon, authenticated
  with check (status = 'pendiente' and team_notes = '' and delivered_on is null);

create policy offers_scoped_read on public.offers
  for select to authenticated
  using (private.can_write_city(city_id));

create policy offers_scoped_update on public.offers
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

-- Borrar una oferta borra el rastro de una ayuda que quizá ya está en el
-- registro público. Eso lo decide coordinación.
create policy offers_coordination_delete on public.offers
  for delete to authenticated
  using (private.is_coordination());

-- ---------------------------------------------------------------------------
-- Publicar un municipio es de coordinación
--
-- Una política no puede comparar la fila nueva con la vieja, así que la regla va
-- en un disparador. Publicar un municipio saca a la calle sus fotos, sus casos y
-- las historias de personas identificables: es la decisión editorial del portal
-- y no la toma quien esté documentando desde el móvil.
--
-- Sin correo en el token no se comprueba nada: eso es el SQL Editor de Supabase
-- o una clave de servicio, que se salta las RLS de todos modos. Poner aquí una
-- valla solo rompería el mantenimiento legítimo del proyecto.
-- ---------------------------------------------------------------------------

create or replace function private.guard_city_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') = '' then
    return new;
  end if;

  if new.published is distinct from old.published and not private.is_coordination() then
    raise exception 'Publicar o despublicar un municipio es de coordinación'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists cities_guard_publication on public.cities;
create trigger cities_guard_publication
  before update on public.cities
  for each row execute function private.guard_city_publication();

-- ---------------------------------------------------------------------------
-- Un caso y su municipio no se pueden separar
--
-- Las políticas de fotos y necesidades miran `city_id`. Con el municipio propio
-- en una columna y el id de un caso de otro pueblo en la otra, la fila pasaba las
-- políticas y salía publicada en la ficha de una familia que no es de ese
-- municipio. Ahora las dos columnas tienen que apuntar al mismo sitio.
-- ---------------------------------------------------------------------------

create or replace function private.guard_case_city()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.case_id is not null and not exists (
    select 1 from public.cases k
    where k.id = new.case_id and k.city_id = new.city_id
  ) then
    raise exception 'El caso no pertenece a ese municipio'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists needs_case_belongs_to_city on public.needs;
create trigger needs_case_belongs_to_city
  before insert or update on public.needs
  for each row execute function private.guard_case_city();

drop trigger if exists photos_case_belongs_to_city on public.photos;
create trigger photos_case_belongs_to_city
  before insert or update on public.photos
  for each row execute function private.guard_case_city();

-- ---------------------------------------------------------------------------
-- Storage: cada quien sube a su municipio
--
-- Las rutas son `<city_id>/…` y `<city_id>/casos/<case_id>/…` (ver
-- lib/photos.ts), así que el municipio se lee del propio nombre del archivo. Sin
-- esto, quien documenta podría subir fotos a la carpeta de cualquier municipio
-- aunque no pudiera registrar la fila: el archivo queda en un bucket público y
-- su URL es adivinable.
-- ---------------------------------------------------------------------------

-- Devuelve nulo en vez de reventar cuando la ruta no empieza por un uuid: dentro
-- de una política, un error de cast dejaría al equipo sin poder subir nada.
create or replace function private.city_of_path(path text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return nullif(split_part(coalesce(path, ''), '/', 1), '')::uuid;
exception
  when others then return null;
end;
$$;

grant execute on function private.city_of_path(text) to authenticated;

drop policy if exists fotos_team_insert on storage.objects;
drop policy if exists fotos_team_update on storage.objects;
drop policy if exists fotos_team_delete on storage.objects;

create policy fotos_team_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and private.can_write_city(private.city_of_path(name)));

create policy fotos_team_update on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and private.can_write_city(private.city_of_path(name)))
  with check (bucket_id = 'fotos' and private.can_write_city(private.city_of_path(name)));

create policy fotos_team_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and private.can_write_city(private.city_of_path(name)));
