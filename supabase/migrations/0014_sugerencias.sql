-- Chocó-up: el buzón de sugerencias y de errores del portal.
--
-- Se puede ejecutar más de una vez sin errores.
--
-- El público necesita un sitio para decir que algo no funciona o para pedir una
-- función, y ese sitio no puede ser el canal de una fundación —eso es de las
-- familias y de los municipios, no del software—. Tampoco puede ser un correo
-- publicado: no hay uno del portal, y inventarlo sería un destino más que
-- nadie atiende.
--
-- Así que las notas caen aquí, las lee el equipo y no se publican. El contacto
-- es opcional: se puede avisar de un fallo sin dejar un teléfono.

create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  kind       text        not null,
  body       text        not null,
  contact    text        not null default '',
  page_path  text        not null default '',
  created_at timestamptz not null default now(),
  constraint feedback_kind_valid
    check (kind in ('error', 'idea')),
  constraint feedback_body_len
    check (char_length(body) between 4 and 2000),
  constraint feedback_contact_len
    check (char_length(contact) <= 200),
  constraint feedback_page_len
    check (char_length(page_path) <= 300)
);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;

revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to anon, authenticated;
grant select on public.feedback to authenticated;
grant delete on public.feedback to authenticated;

drop policy if exists feedback_anyone_insert on public.feedback;
create policy feedback_anyone_insert on public.feedback
  for insert to anon, authenticated
  with check (kind in ('error', 'idea'));

drop policy if exists feedback_team_read on public.feedback;
create policy feedback_team_read on public.feedback
  for select to authenticated
  using (private.is_team());

-- Borrar una nota lo decide coordinación: documentación las lee, no las
-- limpia. Igual que las ofertas.
drop policy if exists feedback_coordination_delete on public.feedback;
create policy feedback_coordination_delete on public.feedback
  for delete to authenticated
  using (private.is_coordination());
