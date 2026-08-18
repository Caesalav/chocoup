-- Chocó-up: el teléfono como tercer formato del canal de donación.
--
-- Se puede ejecutar más de una vez sin errores.
--
-- En terreno, la mayoría de las fichas no tiene llave de transferencia ni
-- enlace de recaudación. Lo que sí hay —y sale en cada ficha de campo— es un
-- número al que llamar o escribir para coordinar cualquier tipo de donación
-- directa. Sin este formato, la sección «Enviar dinero» decía que no había a
-- dónde enviar, y eso era mentira: había un número, y no se enseñaba.
--
-- Sigue siendo un canal y no un dato de contacto más. Vive en las mismas
-- columnas de destino, con la misma valla de coordinación, y se excluye con la
-- llave y el enlace: un número y una llave a la vez volverían a ser dos
-- destinos, que es lo que 0011 impidió.

alter table public.cities
  add column if not exists donation_phone text not null default '';

alter table public.cases
  add column if not exists donation_phone text not null default '';

alter table public.cities drop constraint if exists cities_donation_one_channel;
alter table public.cases drop constraint if exists cases_donation_one_channel;

alter table public.cities add constraint cities_donation_one_channel
  check (
    (donation_key = '')::int +
    (donation_url = '')::int +
    (donation_phone = '')::int >= 2
  );

alter table public.cases add constraint cases_donation_one_channel
  check (
    (donation_key = '')::int +
    (donation_url = '')::int +
    (donation_phone = '')::int >= 2
  );

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

  if tg_op = 'INSERT' then
    if (new.donation_key <> '' or new.donation_url <> ''
        or new.donation_phone <> ''
        or new.donation_app <> '' or new.donation_holder <> '')
       and not private.is_coordination() then
      raise exception 'El canal de donación lo pone coordinación'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if (new.donation_key    is distinct from old.donation_key
   or new.donation_url    is distinct from old.donation_url
   or new.donation_phone  is distinct from old.donation_phone
   or new.donation_app    is distinct from old.donation_app
   or new.donation_holder is distinct from old.donation_holder)
     and not private.is_coordination() then
    raise exception 'Cambiar el canal de donación es de coordinación'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
