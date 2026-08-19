-- Chocó-up: el tablero compartido — foco del momento y movimiento hacia un pueblo.
--
-- Se puede ejecutar más de una vez sin errores.
--
-- El mapa pinta cuánto falta en cada municipio documentado. Encima, coordinación
-- puede marcar un recado («ahora, aquí»), y el público puede ver cuántos aportes
-- van de camino a un pueblo SIN leer la tabla de ofertas.
--
-- El avance de un pueblo no vive aquí: se calcula en la app sobre las
-- necesidades, que el público ya lee. Lo que sí tiene que vivir en la base de
-- datos es el recado (una fila, editable desde el panel) y el recuento de
-- movimiento (una vista sobre `offers`, que el público no puede leer).

-- ---------------------------------------------------------------------------
-- El foco del momento
--
-- Una fila y solo una, el mismo cerrojo que `donation_channel` (0015). Vacía
-- es un estado válido: entonces el aviso del inicio cae en el pueblo más
-- atrasado. Un segundo recado volvería a ser «el primero que devuelva la
-- consulta».
-- ---------------------------------------------------------------------------

create table if not exists public.campaign_focus (
  singleton  boolean primary key default true,
  city_id    uuid references public.cities (id) on delete set null,
  case_id    uuid references public.cases (id) on delete set null,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text not null default '',
  constraint campaign_focus_one_row check (singleton),
  constraint campaign_focus_note_len check (char_length(note) <= 280)
);

create or replace function private.stamp_campaign_focus()
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

drop trigger if exists campaign_focus_stamp on public.campaign_focus;
create trigger campaign_focus_stamp
  before insert or update on public.campaign_focus
  for each row execute function private.stamp_campaign_focus();

-- Si el recado es de una causa, el pueblo es el de esa causa. El formulario
-- también lo hace, y esto es la segunda barrera: marcar una familia de Quibdó
-- y un pueblo distinto señalaría dos sitios.
create or replace function private.guard_campaign_focus()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  case_city uuid;
begin
  if new.case_id is not null then
    select c.city_id into case_city
      from public.cases c
     where c.id = new.case_id;
    if case_city is null then
      raise exception 'La causa del foco no existe';
    end if;
    new.city_id = case_city;
  end if;
  return new;
end;
$$;

drop trigger if exists campaign_focus_guard on public.campaign_focus;
create trigger campaign_focus_guard
  before insert or update on public.campaign_focus
  for each row execute function private.guard_campaign_focus();

insert into public.campaign_focus (singleton)
values (true)
on conflict (singleton) do nothing;

alter table public.campaign_focus enable row level security;

revoke all on public.campaign_focus from anon, authenticated;
grant select on public.campaign_focus to anon;
grant select, update on public.campaign_focus to authenticated;

drop policy if exists campaign_focus_public_read on public.campaign_focus;
create policy campaign_focus_public_read on public.campaign_focus
  for select to anon, authenticated
  using (true);

drop policy if exists campaign_focus_coordination on public.campaign_focus;
create policy campaign_focus_coordination on public.campaign_focus
  for update to authenticated
  using (private.is_coordination())
  with check (private.is_coordination());

-- ---------------------------------------------------------------------------
-- Movimiento hacia un pueblo
--
-- Cuántos aportes en pie de un municipio publicado todavía no han llegado.
-- No es cobertura: no pinta el mapa. Es «hay gente yendo».
--
-- `security_invoker = false` porque cuenta `public.offers`, que el público no
-- puede leer. La cascada de publicación va reescrita a mano, igual que en
-- `offer_tally` (0015): una vista con los derechos de su propietario no hereda
-- las RLS.
-- ---------------------------------------------------------------------------

drop view if exists public.city_offer_activity;

create view public.city_offer_activity
with (security_invoker = false, security_barrier = true)
as
select
  o.city_id,
  count(*)::int as en_camino
from public.offers o
where o.city_id is not null
  and o.status in ('pendiente', 'aceptada')
  and o.delivered_on is null
  and exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
group by o.city_id;

revoke all on public.city_offer_activity from anon, authenticated;
grant select on public.city_offer_activity to anon, authenticated;
