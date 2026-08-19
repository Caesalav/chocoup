-- Chocó-up: el presupuesto de cada causa y las tres formas de ofrecer ayuda.
--
-- Va detrás de 0019 y se puede ejecutar más de una vez sin errores.
--
-- Las necesidades dejan de ser lo que mueve una ficha. Cada causa tiene un
-- presupuesto partido en ítems con precio, y el equipo marca cuáles ya se
-- compraron con lo donado. Lo recaudado no se teclea: sigue saliendo de
-- `public.donations` (0017), que solo escribe el webhook.
--
-- Ofrecer ya no apunta a una familia. Hay tres formularios —voluntario,
-- profesión, recurso— y lo que entra solo lo lee el equipo.

-- ---------------------------------------------------------------------------
-- Ítems del presupuesto
-- ---------------------------------------------------------------------------

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  city_id uuid not null references public.cities (id) on delete cascade,
  title text not null,
  amount_cop bigint not null,
  purchased boolean not null default false,
  purchased_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint budget_items_title_len
    check (char_length(btrim(title)) between 1 and 200),
  constraint budget_items_amount_positive
    check (amount_cop > 0),
  constraint budget_items_purchased_on_consistent
    check (
      (purchased and purchased_on is not null)
      or (not purchased and purchased_on is null)
    )
);

create index if not exists budget_items_case_idx
  on public.budget_items (case_id, sort_order, created_at);

comment on table public.budget_items is
  'Líneas del presupuesto de una causa: qué hay que comprar y cuánto cuesta. purchased es lo que el equipo ya pagó con lo donado.';

create or replace function private.budget_items_fill_city()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  home uuid;
begin
  select city_id into home from public.cases where id = new.case_id;
  if home is null then
    raise exception 'El ítem tiene que pertenecer a una causa';
  end if;
  new.city_id := home;
  if new.purchased then
    new.purchased_on := coalesce(new.purchased_on, (timezone('utc', now()))::date);
  else
    new.purchased_on := null;
  end if;
  return new;
end;
$$;

revoke all on function private.budget_items_fill_city() from public, anon, authenticated;

drop trigger if exists budget_items_fill_city on public.budget_items;
create trigger budget_items_fill_city
  before insert or update on public.budget_items
  for each row execute function private.budget_items_fill_city();

alter table public.budget_items enable row level security;

revoke all on public.budget_items from anon, authenticated;
grant select on public.budget_items to anon;
grant select, insert, update, delete on public.budget_items to authenticated;

drop policy if exists budget_items_public_read on public.budget_items;
create policy budget_items_public_read on public.budget_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.cities c
      where c.id = budget_items.city_id and c.published
    )
    and exists (
      select 1 from public.cases k
      where k.id = budget_items.case_id
        and k.published
        and k.consent_to_publish
    )
  );

drop policy if exists budget_items_team_read on public.budget_items;
create policy budget_items_team_read on public.budget_items
  for select to authenticated
  using (private.is_team());

drop policy if exists budget_items_team_insert on public.budget_items;
create policy budget_items_team_insert on public.budget_items
  for insert to authenticated
  with check (private.can_write_city(city_id));

drop policy if exists budget_items_team_update on public.budget_items;
create policy budget_items_team_update on public.budget_items
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

drop policy if exists budget_items_team_delete on public.budget_items;
create policy budget_items_team_delete on public.budget_items
  for delete to authenticated
  using (private.can_write_city(city_id));

-- ---------------------------------------------------------------------------
-- Recaudado + usado + meta, para pintar la barra sin leer donaciones
--
-- `security_invoker = false` porque el público no lee `public.donations` y
-- igual tiene que ver el total confirmado por causa. No salen nombres ni
-- referencias de pago: tres enteros.
-- ---------------------------------------------------------------------------

drop view if exists public.case_budget;

create view public.case_budget
with (security_invoker = false, security_barrier = true)
as
select
  c.id as case_id,
  c.city_id,
  coalesce((
    select sum(i.amount_cop) from public.budget_items i where i.case_id = c.id
  ), 0)::bigint as goal_cop,
  coalesce((
    select sum(i.amount_cop) from public.budget_items i
    where i.case_id = c.id and i.purchased
  ), 0)::bigint as used_cop,
  coalesce((
    select sum(d.amount_cop) from public.donations d
    where d.case_id = c.id and d.status = 'confirmada'
  ), 0)::bigint as donated_cop
from public.cases c
join public.cities t on t.id = c.city_id
where c.published
  and c.consent_to_publish
  and t.published;

comment on view public.case_budget is
  'Meta, usado y recaudado de cada causa publicada. El recaudado sale de donaciones confirmadas, no de un campo editable.';

revoke all on public.case_budget from anon, authenticated;
grant select on public.case_budget to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Las tres ofertas: voluntario, profesión, recurso
-- ---------------------------------------------------------------------------

create table if not exists public.support_offers (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  person_name text not null,
  contact text not null,
  email text not null default '',
  city_name text not null default '',
  message text not null default '',

  availability text not null default '',
  skills text not null default '',
  duration text not null default '',
  has_transport boolean not null default false,

  profession text not null default '',
  experience text not null default '',
  modality text not null default '',
  credentials text not null default '',

  resource text not null default '',
  quantity text not null default '',
  condition text not null default '',
  can_deliver boolean not null default false,
  category text not null default '',

  created_at timestamptz not null default now(),

  constraint support_offers_kind_valid
    check (kind in ('voluntario', 'profesion', 'recurso')),
  constraint support_offers_name_len
    check (char_length(person_name) between 2 and 120),
  constraint support_offers_contact_len
    check (char_length(contact) between 5 and 200),
  constraint support_offers_email_len
    check (char_length(email) <= 200),
  constraint support_offers_city_len
    check (char_length(city_name) <= 120),
  constraint support_offers_message_len
    check (char_length(message) <= 2000),
  constraint support_offers_text_lens
    check (
      char_length(availability) <= 400
      and char_length(skills) <= 800
      and char_length(duration) <= 200
      and char_length(profession) <= 160
      and char_length(experience) <= 800
      and char_length(credentials) <= 400
      and char_length(resource) <= 200
      and char_length(quantity) <= 120
    ),
  constraint support_offers_modality_valid
    check (modality in ('', 'presencial', 'remoto', 'ambos')),
  constraint support_offers_condition_valid
    check (condition in ('', 'nuevo', 'usado')),
  constraint support_offers_category_valid
    check (
      category in (
        '', 'agua', 'alimentos', 'medicamentos', 'techo', 'ropa',
        'transporte', 'dinero', 'mano_de_obra', 'otro'
      )
    )
);

create index if not exists support_offers_kind_idx
  on public.support_offers (kind, created_at desc);

comment on table public.support_offers is
  'Lo que la gente ofrece desde /ofrecer: voluntariado, profesión o un recurso. Solo lo lee el equipo.';

alter table public.support_offers enable row level security;

revoke all on public.support_offers from anon, authenticated;
grant insert on public.support_offers to anon, authenticated;
grant select on public.support_offers to authenticated;
grant delete on public.support_offers to authenticated;

drop policy if exists support_offers_anyone_insert on public.support_offers;
create policy support_offers_anyone_insert on public.support_offers
  for insert to anon, authenticated
  with check (kind in ('voluntario', 'profesion', 'recurso'));

drop policy if exists support_offers_team_read on public.support_offers;
create policy support_offers_team_read on public.support_offers
  for select to authenticated
  using (private.is_team());

drop policy if exists support_offers_coordination_delete on public.support_offers;
create policy support_offers_coordination_delete on public.support_offers
  for delete to authenticated
  using (private.is_coordination());
