-- Chocó-up: cuánto pesa cada foto en Storage.
--
-- El plan gratuito de Supabase deja 1 GB de archivos. Sin el peso en la fila,
-- el panel no puede decir cuánto come cada municipio ni cada causa: habría que
-- listar el bucket entero, y esa lista no viaja a quien documenta en campo.
--
-- Se guardan dos números, los de la pareja que ya se sube (0001): la grande
-- (hasta 1600 px) y la miniatura (400 px). Cero significa «todavía no se
-- midió» —fotos antiguas, o una miniatura que no llegó— y no «no pesa nada».
-- El archivo no se toca.
--
-- El relleno desde `storage.objects` solo corre si esa tabla trae `metadata`
-- (el proyecto real de Supabase sí; el arnés de PGlite no). Alterar el
-- esquema `storage` desde aquí rompería el proyecto real, porque esa tabla
-- no es nuestra.
--
-- Se puede ejecutar más de una vez sin errores.

alter table public.photos
  add column if not exists byte_size bigint not null default 0,
  add column if not exists thumb_byte_size bigint not null default 0;

alter table public.photos drop constraint if exists photos_byte_size_nonneg;
alter table public.photos add constraint photos_byte_size_nonneg
  check (byte_size >= 0 and thumb_byte_size >= 0);

comment on column public.photos.byte_size is
  'Bytes del JPEG grande en Storage. Cero si todavía no se midió.';
comment on column public.photos.thumb_byte_size is
  'Bytes de la miniatura. Cero si no hay miniatura o no se midió.';

-- Lo que ya está subido: el tamaño vive en metadata.size del objeto.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'objects'
      and column_name = 'metadata'
  ) then
    update public.photos p
    set
      byte_size = coalesce(
        (
          select (o.metadata ->> 'size')::bigint
          from storage.objects o
          where o.bucket_id = 'fotos'
            and o.name = p.storage_path
            and o.metadata ->> 'size' ~ '^[0-9]+$'
        ),
        p.byte_size
      ),
      thumb_byte_size = coalesce(
        (
          select (o.metadata ->> 'size')::bigint
          from storage.objects o
          where o.bucket_id = 'fotos'
            and o.name = p.thumb_path
            and p.thumb_path <> ''
            and o.metadata ->> 'size' ~ '^[0-9]+$'
        ),
        p.thumb_byte_size
      );
  end if;
end $$;
