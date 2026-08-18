-- Chocó-up: cada avance del caso lleva una foto.
--
-- Va detrás de 0006. El diario ya tenía fecha, título y texto. Faltaba la
-- prueba visual: el plano, el arquitecto en el lote, los bloques descargados.
-- Sin foto, el seguimiento es un recado; con ella, es el historial que se
-- puede enseñar.
--
-- La foto es una de las del propio caso —la misma tabla, el mismo Storage,
-- las mismas políticas—. No se inventa un segundo archivo. El disparador
-- impide colgar la foto de otra familia, igual que 0003 impide colgarle el
-- retrato de otra. Borrar la foto deja el avance sin imagen, no el diario
-- roto: ON DELETE SET NULL.
--
-- Se puede ejecutar más de una vez sin errores.

alter table public.case_updates
  add column if not exists photo_id uuid references public.photos (id) on delete set null;

-- La foto tiene que ser de ese caso
--
-- city_id ya lo mira `guard_case_city`. Esto mira el dueño de la foto: que
-- sea de esta familia y no del municipio en general, ni de la de al lado.

create or replace function private.guard_update_photo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.photo_id is not null and not exists (
    select 1 from public.photos p
    where p.id = new.photo_id and p.case_id = new.case_id
  ) then
    raise exception 'La foto del avance tiene que ser de ese caso'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists case_updates_photo_belongs_to_case on public.case_updates;
create trigger case_updates_photo_belongs_to_case
  before insert or update on public.case_updates
  for each row execute function private.guard_update_photo();
