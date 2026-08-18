-- Chocó-up: el retrato de una persona.
--
-- Va detrás de 0001_init.sql y 0002_roles_y_ayudas.sql, en ese orden, y no
-- sustituye a ninguna de las dos. Se puede ejecutar más de una vez sin errores.
--
-- Por qué existe:
--
-- En la ficha de un municipio, cada persona documentada tiene una tarjeta con su
-- cara. Ese hueco lo llenaba «la primera foto del caso», por convenio, y el
-- convenio es falso: la primera foto que hace el equipo al entrar en una casa es
-- la casa —la pared caída, el techo apoyado sobre la viga partida—, así que la
-- tarjeta acababa enseñando un recorte redondo de escombros donde tiene que ir
-- una persona. Cuál de sus fotos la representa no se deduce de un orden; lo
-- decide quien estuvo delante.
--
-- Y es UNA DE SUS FOTOS, no una subida aparte. Una imagen que entrara por otra
-- puerta se saltaría todo lo que protege a las demás: el consentimiento se dio
-- sobre las fotos del caso, las políticas de 0002 comprueban el municipio por la
-- carpeta del archivo, y el pie de foto y el orden se escriben en el panel del
-- caso. Un retrato que no está en el carrusel es además una foto que nadie puede
-- comprobar de dónde salió.
--
-- Lo que este archivo NO toca: ninguna política. La columna nueva es de
-- `public.cases`, y quién puede escribir en un caso ya está decidido en 0002
-- (`cases_assigned_update`): coordinación en cualquier municipio, documentación
-- en los que tenga asignados. El retrato no es un permiso nuevo, es un campo
-- más del caso, y hereda esa frontera sin añadir una regla que haya que recordar
-- aparte.

-- ---------------------------------------------------------------------------
-- La foto elegida
--
-- `on delete set null` y no `cascade`: retirar la foto de una persona
-- identificable tiene que poder hacerse en el momento y desde el municipio (ver
-- `photos_assigned_delete` en 0002), y si eso se llevara por delante el caso
-- entero nadie se atrevería a hacerlo. Borrar el retrato deja a la persona sin
-- retrato, que es un estado normal del portal y no una avería: la mayoría de los
-- casos no va a tener uno.
--
-- El índice parcial es por el borrado, no por la lectura: cada `delete` de una
-- foto obliga a Postgres a buscar quién la señalaba, y en campo se borran fotos
-- a menudo y con mala señal.
-- ---------------------------------------------------------------------------

alter table public.cases
  add column if not exists portrait_photo_id uuid
  references public.photos (id) on delete set null;

create index if not exists cases_portrait_idx on public.cases (portrait_photo_id)
  where portrait_photo_id is not null;

-- ---------------------------------------------------------------------------
-- El retrato tiene que ser una foto de esa persona
--
-- La clave ajena solo garantiza que apunta a una foto que existe, y eso no basta:
-- con el identificador de una foto cualquiera en el campo, la tarjeta de una
-- familia enseñaría la cara de otra. No es un error de forma, es una confusión de
-- identidad en un portal de personas reales con consentimiento.
--
-- Va en un disparador y no en una restricción porque hay que consultar otra
-- tabla, que es lo que un `check` no puede hacer. Es la misma forma que
-- `guard_case_city` de 0002 y por el mismo motivo: dos columnas que apuntan a
-- sitios distintos pasan las políticas y salen publicadas.
--
-- Queda un resto que este disparador no cierra: mover una foto ya registrada a
-- otro caso —cosa que el panel no ofrece, pero la API sí— deja el puntero
-- señalando a una foto que ya no es de esa persona. No se cierra con una valla
-- porque el portal no lo necesita: la capa de datos busca el retrato ENTRE LAS
-- FOTOS DEL PROPIO CASO (ver `portraitOf` en lib/data.ts), así que un puntero
-- huérfano se lee como «sin retrato» y nunca como la cara de otra. La regla dura
-- vive donde se puede sostener; el resto, donde se absorbe.
-- ---------------------------------------------------------------------------

create or replace function private.guard_case_portrait()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.portrait_photo_id is not null and not exists (
    select 1 from public.photos p
    where p.id = new.portrait_photo_id and p.case_id = new.id
  ) then
    raise exception 'El retrato tiene que ser una foto de esa persona'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists cases_portrait_belongs_to_case on public.cases;
create trigger cases_portrait_belongs_to_case
  before insert or update on public.cases
  for each row execute function private.guard_case_portrait();
