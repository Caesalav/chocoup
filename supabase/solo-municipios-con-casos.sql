-- Deja en la tabla solo los municipios que ya tienen al menos un caso.
--
-- El mapa público sigue dibujando los treinta del DANE. Esta tabla es el
-- inventario de pueblos documentados: un pueblo vacío no se enseña como si el
-- equipo ya hubiera estado. Quibdó (o cualquier otro con familias) se queda.
--
-- Las fotos, necesidades y asignaciones de un pueblo sin casos se van con él
-- (cascade). Las donaciones cuelgan de los casos, así que no hay nada que
-- bloquee el borrado de un pueblo vacío.

delete from public.cities
where id not in (select distinct city_id from public.cases);

select name, slug, published
from public.cities
order by name;
