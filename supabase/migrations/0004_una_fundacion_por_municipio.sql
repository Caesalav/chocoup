-- Chocó-up: una sola fundación por municipio.
--
-- Va detrás de 0001_init.sql, 0002_roles_y_ayudas.sql y 0003_retrato_del_caso.sql,
-- en ese orden, y no sustituye a ninguna. Se puede ejecutar más de una vez sin
-- errores.
--
-- Por qué existe:
--
-- `donation_url` es a dónde va el dinero de quien pulsa «Donar». La tabla admitía
-- varias fundaciones por municipio con una marcada como madre, y la ficha
-- resolvía cuál era con «la marcada, y si no la primera». Eso no es un desempate,
-- es un azar: con dos marcadas gana la que devuelva antes la consulta y sin
-- ninguna marcada gana la que se registró primero, así que el botón podía acabar
-- apuntando a un enlace que nadie eligió. Y no es un defecto que se note al
-- mirar la pantalla —se ve una tarjeta, como siempre—, que es lo que lo hace
-- peligroso.
--
-- La realidad del viaje es más simple que el modelo: en cada municipio trabaja
-- una fundación y es la que recibe. De modo que la garantía se escribe aquí —una
-- fila por municipio— y la marca desaparece, porque con una sola fundación no
-- distingue nada y en falso todavía puede mentir.
--
-- Lo que este archivo NO toca: ninguna política. Quién puede escribir en
-- `public.foundations` ya está decidido en 0002 (`foundations_coordination`), y
-- sigue siendo coordinación por el mismo motivo: el dinero.

-- ---------------------------------------------------------------------------
-- Antes de nada: ¿hay algún municipio con dos?
--
-- Si lo hay, esta migración no se aplica y dice en qué municipios. No se elige
-- una y se borra la otra, ni se desmarca la que sobra: son filas que alguien
-- escribió a mano en terreno y cada una lleva dentro un enlace de donaciones.
-- Elegir por esa persona sería decidir a dónde va el dinero de un municipio desde
-- un script, a ciegas y sin dejar rastro de lo que se descartó.
--
-- Lo que hay que hacer es lo contrario: abrir las dos, decidir con quien coordina
-- cuál es la fundación del municipio, borrar la otra a mano —el panel tiene el
-- botón— y volver a pasar este archivo. Son dos minutos y los hace alguien que
-- sabe de qué municipio está hablando.
--
-- El aviso nombra los municipios porque un «hay duplicados» a secas obliga a
-- escribir la consulta a mano, y esto se lee con prisa y con mala señal.
--
-- Va antes de tocar nada: el editor de SQL de Supabase ejecuta el archivo entero
-- en una transacción, así que un error aquí deja la base de datos como estaba.
-- ---------------------------------------------------------------------------

do $$
declare
  v_municipios text;
begin
  select string_agg(format('%s (%s fundaciones)', c.name, d.n), ', ' order by c.name)
    into v_municipios
    from (
      select city_id, count(*) as n
      from public.foundations
      group by city_id
      having count(*) > 1
    ) d
    join public.cities c on c.id = d.city_id;

  if v_municipios is not null then
    raise exception 'Hay municipios con más de una fundación: %', v_municipios
      using
        errcode = '23505',
        hint = 'Cada fundación lleva su propio enlace de donación, así que esta migración no elige por ti. Mira las dos, decide con coordinación cuál es la del municipio, borra las demás desde el panel y vuelve a pasar este archivo.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Una fila por municipio
--
-- La restricción va en la base de datos y no en el panel porque el panel no es la
-- única puerta: la Data API acepta un insert de cualquiera con sesión de
-- coordinación, y una segunda fundación creada por ahí no rompería nada visible
-- —la ficha seguiría pintando una— pero el destino del dinero del municipio
-- volvería a depender de cuál devuelva antes la consulta.
--
-- Cero fundaciones sigue siendo válido, y es el estado con el que nace cada
-- municipio: la restricción dice «no más de una», no «tiene que haber una».
-- Obligar a que hubiera una impediría crear el municipio antes de la visita, que
-- es justo el orden en que se trabaja.
--
-- Sustituye al índice por municipio de 0001: un índice único sirve para las mismas
-- búsquedas, y dejar los dos es mantener dos copias del mismo árbol.
-- ---------------------------------------------------------------------------

alter table public.foundations drop constraint if exists foundations_one_per_city;
alter table public.foundations add constraint foundations_one_per_city unique (city_id);

drop index if exists public.foundations_city_idx;

-- ---------------------------------------------------------------------------
-- Fuera la marca de fundación madre
--
-- Con una sola fundación por municipio la columna no distingue nada, y una
-- columna que no distingue nada todavía puede mentir: en falso hacía que la
-- tarjeta pública rotulara «Organización aliada» sobre el único canal de donación
-- del municipio. Quien registra la fundación deja de tener que acordarse de una
-- casilla para que el portal la trate como lo que es.
--
-- Se va después de la restricción a propósito, por si alguien pega el archivo a
-- trozos: en el orden contrario, una restricción que fallara dejaría la base de
-- datos sin la marca y con dos fundaciones, que es el único estado en el que la
-- marca todavía servía para algo.
-- ---------------------------------------------------------------------------

alter table public.foundations drop column if exists is_primary;
