-- Chocó-up: seguimiento y donación de cada caso.
--
-- Va detrás de 0005. Dos huecos que el caso no tenía:
--
--   1. Un destino de dinero propio. Hasta ahora el aporte a una familia pasaba
--      siempre por la fundación del municipio, y eso sigue siendo el recaudo
--      por omisión. Pero hay familias con Vaki, Nequi o cuenta propias, y el
--      equipo tiene que poder apuntar ahí sin inventar una segunda fundación.
--      Vacío significa «usa el de la fundación».
--
--   2. Un diario fechado. Las necesidades dicen qué falta y si ya se cubrió;
--      no dicen qué pasó el martes. El equipo cura cada caso añadiendo notas
--      con fecha: la visita, lo que llegó, lo que sigue pendiente. Eso es la
--      trazabilidad. La barra de progreso se calcula de las necesidades
--      (cubierta = 1, parcial = ½) y el diario es el relato.
--
-- Se puede ejecutar más de una vez sin errores.

-- ---------------------------------------------------------------------------
-- Destino de donación del caso
-- ---------------------------------------------------------------------------

alter table public.cases
  add column if not exists donation_url text not null default '';

-- ---------------------------------------------------------------------------
-- Diario de seguimiento
--
-- `happened_on` es el día que el equipo quiere contar, no el de la escritura:
-- una nota del domingo se puede cargar el lunes. `city_id` se duplica a
-- propósito, igual que en fotos y necesidades: las políticas miran el
-- municipio, no hacen un join al caso en cada fila.
-- ---------------------------------------------------------------------------

create table if not exists public.case_updates (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases (id) on delete cascade,
  city_id     uuid not null references public.cities (id) on delete cascade,
  happened_on date not null,
  title       text not null,
  body        text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists case_updates_case_idx
  on public.case_updates (case_id, happened_on desc);

alter table public.case_updates enable row level security;

grant select on public.case_updates to anon, authenticated;
grant select, insert, update, delete on public.case_updates to authenticated;

-- El caso tiene que ser de ese municipio. Sin esto, una nota de Quibdó se
-- colgaría de una familia de Istmina y las políticas —que miran city_id—
-- la darían por buena.
drop trigger if exists case_updates_case_belongs_to_city on public.case_updates;
create trigger case_updates_case_belongs_to_city
  before insert or update on public.case_updates
  for each row execute function private.guard_case_city();

-- ---------------------------------------------------------------------------
-- Lectura pública: la misma cascada que las fotos del caso
-- ---------------------------------------------------------------------------

drop policy if exists case_updates_public_read on public.case_updates;

create policy case_updates_public_read on public.case_updates
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.cities c
      where c.id = case_updates.city_id and c.published
    )
    and exists (
      select 1 from public.cases k
      where k.id = case_updates.case_id
        and k.published
        and k.consent_to_publish
    )
  );

-- ---------------------------------------------------------------------------
-- Equipo: quien documenta el municipio escribe el diario
-- ---------------------------------------------------------------------------

drop policy if exists case_updates_team_read      on public.case_updates;
drop policy if exists case_updates_assigned_write on public.case_updates;
drop policy if exists case_updates_assigned_update on public.case_updates;
drop policy if exists case_updates_assigned_delete on public.case_updates;

create policy case_updates_team_read on public.case_updates
  for select to authenticated
  using (private.is_team());

create policy case_updates_assigned_write on public.case_updates
  for insert to authenticated
  with check (private.can_write_city(city_id));

create policy case_updates_assigned_update on public.case_updates
  for update to authenticated
  using (private.can_write_city(city_id))
  with check (private.can_write_city(city_id));

create policy case_updates_assigned_delete on public.case_updates
  for delete to authenticated
  using (private.can_write_city(city_id));
