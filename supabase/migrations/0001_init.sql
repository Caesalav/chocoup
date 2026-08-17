-- Chuc-up: esquema inicial.
-- Portal de documentación del viaje a Chocó (terremoto).
--
-- Reglas de acceso:
--   * Cualquiera lee lo que está publicado.
--   * Cualquiera puede insertar una oferta de recurso, pero nadie del público
--     puede leer ofertas (contienen datos de contacto de terceros).
--   * Solo el equipo (allowlist en private.team_members) escribe el resto.
--
-- Se puede ejecutar más de una vez sin errores: cada objeto se crea con
-- `if not exists` o se reemplaza.

-- ---------------------------------------------------------------------------
-- Allowlist del equipo
--
-- Vive en un esquema no expuesto por la Data API, así que ni el público ni un
-- usuario recién registrado pueden leerla o modificarla desde la API.
-- ---------------------------------------------------------------------------

create schema if not exists private;

create table if not exists private.team_members (
  email      text primary key,
  nombre     text,
  created_at timestamptz not null default now()
);

-- El esquema no está expuesto, pero la lista de correos del equipo es
-- justo lo que no debe filtrarse: se cierra por partida doble.
alter table private.team_members enable row level security;
revoke all on private.team_members from anon, authenticated;

create or replace function private.is_team()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.team_members tm
    where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_team() to anon, authenticated;

-- Envoltorio invocable desde la app con supabase.rpc('is_team').
-- No es security definer: solo reenvía la comprobación.
create or replace function public.is_team()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_team();
$$;

grant execute on function public.is_team() to anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ciudades
-- ---------------------------------------------------------------------------

create table if not exists public.cities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  lat        double precision not null,
  lng        double precision not null,
  summary    text not null default '',
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_lat_range check (lat between -90 and 90),
  constraint cities_lng_range check (lng between -180 and 180)
);

drop trigger if exists cities_touch_updated_at on public.cities;
create trigger cities_touch_updated_at
  before update on public.cities
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Fundaciones (la "fundación madre" de cada ciudad y otras aliadas)
-- ---------------------------------------------------------------------------

create table if not exists public.foundations (
  id           uuid primary key default gen_random_uuid(),
  city_id      uuid not null references public.cities (id) on delete cascade,
  name         text not null,
  description  text not null default '',
  contact_name text not null default '',
  phone        text not null default '',
  whatsapp     text not null default '',
  email        text not null default '',
  website      text not null default '',
  -- Enlace oficial de donación (su web, una Vaki, etc.). Alimenta el botón
  -- "Donar dinero" de la página pública y el envío de dinero a cada caso.
  donation_url text not null default '',
  address      text not null default '',
  is_primary   boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Para una base de datos creada antes de existir esta columna.
alter table public.foundations add column if not exists donation_url text not null default '';

create index if not exists foundations_city_idx on public.foundations (city_id);

-- ---------------------------------------------------------------------------
-- Casos de personas
--
-- Un caso solo puede publicarse si la persona dio su consentimiento.
-- ---------------------------------------------------------------------------

create table if not exists public.cases (
  id                  uuid primary key default gen_random_uuid(),
  city_id             uuid not null references public.cities (id) on delete cascade,
  display_name        text not null,
  household           text not null default '',
  story               text not null default '',
  consent_to_publish  boolean not null default false,
  published           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint cases_publish_requires_consent check (not published or consent_to_publish)
);

create index if not exists cases_city_idx on public.cases (city_id);

drop trigger if exists cases_touch_updated_at on public.cases;
create trigger cases_touch_updated_at
  before update on public.cases
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Fotos (de la ciudad o de un caso concreto)
-- ---------------------------------------------------------------------------

-- thumb_path es la versión de 400 px que se sirve en cuadrículas y tarjetas.
-- Vacío significa que no se pudo generar y hay que usar la grande.
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  city_id      uuid not null references public.cities (id) on delete cascade,
  case_id      uuid references public.cases (id) on delete cascade,
  storage_path text not null,
  thumb_path   text not null default '',
  caption      text not null default '',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.photos add column if not exists thumb_path text not null default '';

create index if not exists photos_city_idx on public.photos (city_id, sort_order);
create index if not exists photos_case_idx on public.photos (case_id, sort_order);

-- ---------------------------------------------------------------------------
-- Necesidades
--
-- case_id nulo = necesidad de la zona. case_id presente = de esa persona.
-- ---------------------------------------------------------------------------

create table if not exists public.needs (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references public.cities (id) on delete cascade,
  case_id    uuid references public.cases (id) on delete cascade,
  category   text not null,
  title      text not null,
  details    text not null default '',
  quantity   text not null default '',
  status     text not null default 'abierta',
  urgent     boolean not null default false,
  created_at timestamptz not null default now(),
  constraint needs_category_valid check (category in (
    'agua', 'alimentos', 'medicamentos', 'techo', 'ropa',
    'transporte', 'dinero', 'mano_de_obra', 'otro'
  )),
  constraint needs_status_valid check (status in ('abierta', 'parcial', 'cubierta'))
);

create index if not exists needs_city_idx on public.needs (city_id);
create index if not exists needs_case_idx on public.needs (case_id);

-- ---------------------------------------------------------------------------
-- Ofertas de recursos del público
-- ---------------------------------------------------------------------------

create table if not exists public.offers (
  id              uuid primary key default gen_random_uuid(),
  city_id         uuid references public.cities (id) on delete set null,
  case_id         uuid references public.cases (id) on delete set null,
  need_id         uuid references public.needs (id) on delete set null,
  offerer_name    text not null,
  offerer_contact text not null,
  resource        text not null,
  category        text not null default 'otro',
  message         text not null default '',
  status          text not null default 'pendiente',
  team_notes      text not null default '',
  created_at      timestamptz not null default now(),
  constraint offers_status_valid check (status in ('pendiente', 'aceptada', 'rechazada')),
  constraint offers_name_length check (char_length(offerer_name) between 2 and 120),
  constraint offers_contact_length check (char_length(offerer_contact) between 5 and 200),
  constraint offers_resource_length check (char_length(resource) between 2 and 200),
  constraint offers_message_length check (char_length(message) <= 2000)
);

create index if not exists offers_status_idx on public.offers (status, created_at desc);
create index if not exists offers_need_idx on public.offers (need_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.cities      enable row level security;
alter table public.foundations enable row level security;
alter table public.cases       enable row level security;
alter table public.photos      enable row level security;
alter table public.needs       enable row level security;
alter table public.offers      enable row level security;

-- Supabase ya concede estos permisos por defecto a las tablas nuevas de public.
-- Se repiten aquí para no depender de esa configuración: con RLS activo, el
-- permiso de tabla no abre nada que una política no permita.
grant select on public.cities, public.foundations, public.cases, public.photos, public.needs
  to anon, authenticated;
grant insert on public.offers to anon, authenticated;
grant select, insert, update, delete
  on public.cities, public.foundations, public.cases, public.photos, public.needs, public.offers
  to authenticated;

drop policy if exists cities_public_read on public.cities;
drop policy if exists cities_team_all on public.cities;
drop policy if exists foundations_public_read on public.foundations;
drop policy if exists foundations_team_all on public.foundations;
drop policy if exists cases_public_read on public.cases;
drop policy if exists cases_team_all on public.cases;
drop policy if exists photos_public_read on public.photos;
drop policy if exists photos_team_all on public.photos;
drop policy if exists needs_public_read on public.needs;
drop policy if exists needs_team_all on public.needs;
drop policy if exists offers_public_insert on public.offers;
drop policy if exists offers_team_all on public.offers;

-- Ciudades
create policy cities_public_read on public.cities
  for select to anon, authenticated
  using (published);

create policy cities_team_all on public.cities
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- Fundaciones: visibles si su ciudad está publicada
create policy foundations_public_read on public.foundations
  for select to anon, authenticated
  using (exists (
    select 1 from public.cities c
    where c.id = foundations.city_id and c.published
  ));

create policy foundations_team_all on public.foundations
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- Casos: publicados, con consentimiento y en ciudad publicada
create policy cases_public_read on public.cases
  for select to anon, authenticated
  using (
    published
    and consent_to_publish
    and exists (
      select 1 from public.cities c
      where c.id = cases.city_id and c.published
    )
  );

create policy cases_team_all on public.cases
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- Fotos: de ciudad publicada y, si pertenecen a un caso, de un caso visible
create policy photos_public_read on public.photos
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.cities c
      where c.id = photos.city_id and c.published
    )
    and (
      photos.case_id is null
      or exists (
        select 1 from public.cases k
        where k.id = photos.case_id and k.published and k.consent_to_publish
      )
    )
  );

create policy photos_team_all on public.photos
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- Necesidades: mismas condiciones que las fotos
create policy needs_public_read on public.needs
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.cities c
      where c.id = needs.city_id and c.published
    )
    and (
      needs.case_id is null
      or exists (
        select 1 from public.cases k
        where k.id = needs.case_id and k.published and k.consent_to_publish
      )
    )
  );

create policy needs_team_all on public.needs
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- Ofertas: cualquiera puede ofrecer, solo el equipo puede leer y gestionar.
-- Sin política de select para anon: los datos de contacto no son públicos.
create policy offers_public_insert on public.offers
  for insert to anon, authenticated
  with check (status = 'pendiente' and team_notes = '');

create policy offers_team_all on public.offers
  for all to authenticated
  using (private.is_team())
  with check (private.is_team());

-- ---------------------------------------------------------------------------
-- Storage: fotos
--
-- Bucket público para que las imágenes se sirvan por CDN sin firmar URLs.
-- Subir, reemplazar y borrar queda restringido al equipo.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

drop policy if exists fotos_public_read on storage.objects;
drop policy if exists fotos_team_insert on storage.objects;
drop policy if exists fotos_team_update on storage.objects;
drop policy if exists fotos_team_delete on storage.objects;

create policy fotos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fotos');

create policy fotos_team_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and private.is_team());

create policy fotos_team_update on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and private.is_team())
  with check (bucket_id = 'fotos' and private.is_team());

create policy fotos_team_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and private.is_team());
