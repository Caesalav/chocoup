-- Portada de archivo del municipio que ya tiene casos.
--
-- No es una foto de una familia: es el paisaje que se propuso con los datos de
-- muestra (public/demo/ciudad-quibdo.jpg) hasta que el equipo suba la del
-- pueblo. No come del cupo de Storage: photoUrl() la sirve desde el código.
-- Bahía Solano e Istmina no entran: no hay casos ahí.

insert into public.photos (
  city_id, case_id, storage_path, thumb_path, caption, sort_order
)
select
  id,
  null,
  'demo/ciudad-quibdo',
  'demo/ciudad-quibdo-mini',
  'Atardecer sobre el Atrato, en Quibdó.',
  0
from public.cities
where slug = 'quibdo'
  and not exists (
    select 1
    from public.photos p
    where p.city_id = cities.id
      and p.case_id is null
      and p.storage_path = 'demo/ciudad-quibdo'
  );

select c.slug, p.storage_path, p.caption
from public.photos p
join public.cities c on c.id = p.city_id
where p.case_id is null
order by c.slug, p.sort_order;
