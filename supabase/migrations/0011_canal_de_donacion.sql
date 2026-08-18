-- Chocó-up: el canal de donación de cada municipio y de cada caso, y fuera la
-- llave global del portal.
--
-- Va detrás de 0010 y deshace su idea central. Se puede ejecutar más de una vez
-- sin errores.
--
-- Qué estaba mal:
--
-- 0010 leyó `@soschoco` como «la llave del portal», una para todo el Chocó, y
-- eso no es lo que es. `@soschoco` es el canal del caso de Quibdó y de nadie
-- más. No hay ni va a haber un canal general: cada municipio va a tener el suyo
-- y cada caso el suyo. Una llave global no es solo un dato de más, es un dato
-- que miente sobre a dónde va el dinero: quien la copiaba desde la ficha de una
-- familia creía estar dándole a esa familia, y la ficha del municipio la
-- presentaba como la vía de ese pueblo. No se conserva ni como canal del portal
-- —renombrarla no arreglaría lo único que estaba roto, que es que nadie eligió
-- ese destino para lo que la pantalla dice—.

-- ---------------------------------------------------------------------------
-- Dónde vive el canal de un municipio: aquí, y no en su fundación
--
-- Es la pregunta obvia, porque el modelo ya tiene un sitio para el destino del
-- dinero de un pueblo: `foundations.donation_url` (0004). Tres razones para no
-- ponerlo ahí, y la primera decide sola:
--
--   * Quibdó no tiene fundación, y es el único municipio real publicado. Colgar
--     el canal de la fundación deja sin canal posible justo al pueblo que hoy
--     tiene una persona documentada esperando. Un municipio existe siempre; una
--     fundación es opcional y en la base real no hay ninguna.
--   * Inventar una fundación para colgar de ella una llave sería publicar el
--     nombre de una organización que no existe. La tarjeta de la fundación
--     escribe su nombre, su descripción y su contacto: una fundación de mentira
--     es una mentira en la tarjeta más delicada del portal, y encima con un
--     botón de dinero dentro.
--   * Son dos cosas distintas y las dos son legítimas. El enlace de una
--     fundación es DE ESA FUNDACIÓN: sale dentro de su tarjeta, bajo su nombre,
--     y es ella quien rinde cuentas de lo que entra por ahí. El canal del
--     municipio es del municipio, lo abre coordinación para ese pueblo y no
--     pertenece a ninguna organización. Cada uno sale rotulado con de quién es,
--     así que no se repite el fallo de 0004 —dos botones iguales y nada en la
--     pantalla que dijera cuál recibía—.
--
-- Y el caso ya tenía su sitio: `cases.donation_url`, de 0006. Se queda donde
-- está y se le añaden las tres columnas que le faltaban para poder ser una
-- llave y no solo un enlace.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Un canal es una llave o un enlace, nunca las dos cosas
--
-- Unos destinos son llaves de transferencia —`@soschoco`, que se copia y se
-- pega en la app del banco— y otros son enlaces de recaudación —una Vaki, que
-- se pulsa—. Los dos formatos hacen falta en los dos niveles, y no caben en un
-- solo campo: una llave metida en un campo de URL sale como `https://@soschoco`
-- —eso hace `externalUrl()` con lo que no trae esquema—, o sea un enlace roto en
-- el botón más importante de la pantalla.
--
-- Por eso son dos columnas y una restricción que impide llenar las dos. No es
-- una manía de forma: con las dos puestas, «el canal» volvería a ser «el que la
-- página mire primero», que es exactamente el destino del dinero decidido por un
-- orden que 0004 tuvo que arreglar en las fundaciones. Y en terreno el caso real
-- es cambiar de destino con prisa: pegar el enlace nuevo y olvidar borrar la
-- llave vieja dejaría dos destinos vivos sin que nada avisara.
--
-- `donation_app` y `donation_holder` solo acompañan a una llave. El titular es
-- el que más pesa: la llave no dice nada por sí misma y el nombre que la app
-- muestra antes de confirmar es la única comprobación que le queda a quien dona
-- el día que la llave sea otra. Vacío es un estado válido y es la verdad cuando
-- no consta; inventarlo enseñaría a ignorar esa comprobación.
-- ---------------------------------------------------------------------------

alter table public.cities
  add column if not exists donation_key    text not null default '',
  add column if not exists donation_url    text not null default '',
  add column if not exists donation_app    text not null default '',
  add column if not exists donation_holder text not null default '';

-- `cases.donation_url` ya existe desde 0006, así que solo se añade lo que le
-- faltaba para poder ser también una llave.
alter table public.cases
  add column if not exists donation_key    text not null default '',
  add column if not exists donation_app    text not null default '',
  add column if not exists donation_holder text not null default '';

do $do$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cities_donation_one_channel'
  ) then
    alter table public.cities add constraint cities_donation_one_channel
      check (donation_key = '' or donation_url = '');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cases_donation_one_channel'
  ) then
    alter table public.cases add constraint cases_donation_one_channel
      check (donation_key = '' or donation_url = '');
  end if;
end
$do$;

-- ---------------------------------------------------------------------------
-- Solo coordinación pone o cambia un canal
--
-- Es el mismo círculo pequeño en el que ya están las fundaciones y su
-- `donation_url` (0002), y por el mismo motivo: quien edita este campo puede
-- desviar las donaciones de una persona con nombre y cara publicados, y un canal
-- cambiado se ve igual de bien que el bueno.
--
-- Pero aquí no basta con la política de la tabla, y esa es la diferencia con las
-- fundaciones. Quien documenta SÍ puede —y tiene que poder— escribir en los
-- casos y en los municipios que tiene asignados: es su trabajo, lo hace desde el
-- móvil y delante de la familia. `cases_assigned_update` le deja escribir la
-- fila entera, así que el canal necesita su propia comprobación dentro de esa
-- misma escritura que ya está permitida.
--
-- Eso no cabe en una política —hay que comparar la fila nueva con la vieja— y va
-- en un disparador, igual que publicar un municipio (`cities_guard_publication`,
-- 0002).
--
-- Sin correo en el token no se comprueba nada: eso es el SQL Editor de Supabase
-- o esta misma migración, que se saltan las RLS de todos modos. Poner aquí una
-- valla solo rompería el mantenimiento legítimo del proyecto.
-- ---------------------------------------------------------------------------

create or replace function private.guard_donation_channel()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') = '' then
    return new;
  end if;

  -- En un alta se mira el valor a secas: no hay fila vieja con la que comparar,
  -- y crear un caso ya con canal es exactamente lo mismo que ponérselo después.
  if tg_op = 'INSERT' then
    if (new.donation_key <> '' or new.donation_url <> ''
        or new.donation_app <> '' or new.donation_holder <> '')
       and not private.is_coordination() then
      raise exception 'El canal de donación lo pone coordinación'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- En una edición se mira el cambio y no el valor, para que quien documenta
  -- pueda seguir guardando la ficha entera —la historia, el consentimiento, el
  -- retrato— sin tropezar con un canal que ya estaba puesto y que no toca.
  if (new.donation_key    is distinct from old.donation_key
   or new.donation_url    is distinct from old.donation_url
   or new.donation_app    is distinct from old.donation_app
   or new.donation_holder is distinct from old.donation_holder)
     and not private.is_coordination() then
    raise exception 'Cambiar el canal de donación es de coordinación'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists cities_guard_donation_channel on public.cities;
create trigger cities_guard_donation_channel
  before insert or update on public.cities
  for each row execute function private.guard_donation_channel();

drop trigger if exists cases_guard_donation_channel on public.cases;
create trigger cases_guard_donation_channel
  before insert or update on public.cases
  for each row execute function private.guard_donation_channel();

-- ---------------------------------------------------------------------------
-- Fuera la llave global
--
-- El valor que había dentro, `@soschoco`, es el canal del caso de Quibdó, y ahí
-- lo escribió coordinación desde el panel. No se copia desde aquí a ninguna
-- parte: mover un destino de dinero por su cuenta sería adivinar de quién es, y
-- adivinar de quién es el dinero es justo lo que esta migración viene a quitar.
--
-- El orden importa una vez, y hacia atrás: si algún día hay que reconstruir el
-- esquema pegando las migraciones en orden, 0010 vuelve a crear la tabla con
-- `@soschoco` dentro y esta la vuelve a borrar. Pegar 0010 SUELTA, sin esta
-- detrás, devuelve la llave global al portal.
-- ---------------------------------------------------------------------------

drop table if exists public.donation_key;
drop function if exists private.stamp_donation_key();
