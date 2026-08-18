-- Chocó-up: borrar los datos de prueba.
--
-- Deshace la carga de ejemplo que se hizo para revisar el diseño con el portal
-- lleno. NO es una migración: no cambia el esquema y no va en la carpeta de
-- migraciones. Se pega en el editor de SQL de Supabase cuando llegue el
-- contenido real, o antes de empezar a documentar de verdad.
--
-- Todo lo de prueba lleva una marca, y este archivo borra por la marca y no por
-- fecha ni por identificador. Es lo que lo hace seguro de ejecutar el día que ya
-- haya casos reales al lado: lo que no está marcado no se toca.
--
--   Municipios      el nombre acaba en ' (prueba)'
--   Casos           la historia empieza por 'CASO DE PRUEBA'
--   Fundaciones     el nombre lleva '(prueba)'
--   Ofertas         el nombre de quien ofrece lleva '(prueba)'
--   Fotos           la ruta empieza por 'demo/' (los JPG de public/demo)
--
-- El orden importa: los municipios se renombran AL FINAL, porque los pasos
-- anteriores buscan por esa misma marca.
--
-- Los municipios NO se borran: son los del Chocó de verdad y hacen falta. Solo se
-- les quita la marca, el resumen inventado y la publicación, que es como los deja
-- supabase/seed.sql.
--
-- Los diez de la semilla están cargados. Si alguna vez faltara alguno, vuelve
-- pasando otra vez supabase/seed.sql, que los reinserta con sus coordenadas y sin
-- publicar.
--
-- Lo que este archivo NO toca, y conviene saberlo antes de ejecutarlo con prisa:
-- el caso real de Quibdó —publicado, con consentimiento, retrato, doce fotos en
-- Storage, cinco avances, dos necesidades y su canal de donación `@soschoco`—, y
-- el propio Quibdó.

begin;

-- Ofertas. Van primero porque apuntan a casos y necesidades que están a punto de
-- desaparecer, y su clave ajena es `on delete set null`: si se dejaran para el
-- final, quedarían ofertas de prueba huérfanas y ya sin nada que las señalara.
delete from public.offers
where offerer_name like '%(prueba)%';

-- Casos. Al borrarlos se van por cascada sus fotos y sus necesidades, así que
-- esto se lleva la mayor parte de la carga de un golpe.
delete from public.cases
where story like 'CASO DE PRUEBA%';

-- Necesidades de zona: las que no colgaban de ningún caso y por eso siguen aquí.
delete from public.needs
where city_id in (select id from public.cities where name like '%(prueba)%');

-- Fotos de zona, por la misma razón. Se borra la fila; el archivo no hay que
-- tocarlo, porque estas fotos nunca estuvieron en Storage: viven en public/demo.
delete from public.photos
where storage_path like 'demo/%';

delete from public.foundations
where name like '%(prueba)%';

-- Los municipios de prueba llevan además un canal de donación de muestra, y se
-- vacía aquí con lo demás. Es lo único de este archivo que, si se olvidara,
-- dejaría un destino de dinero inventado colgando de un municipio del Chocó de
-- verdad, ya sin la marca «(prueba)» que lo delataba.
update public.cities
set name = replace(name, ' (prueba)', ''),
    summary = '',
    published = false,
    donation_key = '',
    donation_url = '',
    donation_phone = '',
    donation_app = '',
    donation_holder = ''
where name like '%(prueba)%';

commit;

-- Comprobación: que no quede nada marcado y que el contenido real siga en pie.
--
-- Esto NO cuenta filas totales, y el cambio importa. Contarlas fue lo primero
-- que se escribió aquí, cuando la base solo tenía la carga de prueba: entonces
-- «cero casos» quería decir «no quedó nada sin marcar». Hoy hay un caso real
-- publicado en Quibdó, con sus doce fotos, sus cinco avances y sus dos
-- necesidades, así que ese cero ya no puede darse nunca y leerlo como un fallo
-- llevaría a borrar a mano justo lo que hay que conservar.
--
-- Lo que tiene que dar cero es la primera columna. Las otras son el caso real,
-- que este archivo no toca.
select (select count(*) from public.cases where story like 'CASO DE PRUEBA%')
     + (select count(*) from public.photos where storage_path like 'demo/%')
     + (select count(*) from public.offers where offerer_name like '%(prueba)%')
     + (select count(*) from public.foundations where name like '%(prueba)%')
     + (select count(*) from public.cities where name like '%(prueba)%')
         as restos_de_prueba, -- tiene que ser 0
       (select count(*) from public.cases)  as casos_que_quedan,
       (select count(*) from public.needs)  as necesidades_que_quedan,
       (select count(*) from public.photos) as fotos_que_quedan,
       (select count(*) from public.cities) as municipios,
       (select count(*) from public.cities where published) as publicados;

-- Y los destinos de dinero que quedan publicados, uno por línea. Tiene que salir
-- solo el del caso real. Cualquier otra fila aquí es un canal de muestra que
-- sobrevivió al borrado, y eso es lo peor que puede quedarse: un destino
-- inventado en una ficha que ya no dice «prueba» en ninguna parte.
select 'municipio' as nivel, name as quien, donation_key, donation_url, donation_phone
from public.cities where donation_key <> '' or donation_url <> '' or donation_phone <> ''
union all
select 'caso', display_name, donation_key, donation_url, donation_phone
from public.cases where donation_key <> '' or donation_url <> '' or donation_phone <> ''
union all
select 'fundacion', name, '', donation_url, ''
from public.foundations where donation_url <> '';

-- Y si algún día vuelve a haber contenido de prueba que este archivo no cubra,
-- lo delata su identificador: todo lo que carga supabase/datos-de-prueba.sql
-- lleva uno que empieza por 00000000-0000-4000-8000-.
select 'casos' as tabla, count(*) from public.cases where id::text like '00000000-0000-4000-8000-%'
union all select 'fotos', count(*) from public.photos where id::text like '00000000-0000-4000-8000-%'
union all select 'necesidades', count(*) from public.needs where id::text like '00000000-0000-4000-8000-%'
union all select 'avances', count(*) from public.case_updates where id::text like '00000000-0000-4000-8000-%'
union all select 'ofertas', count(*) from public.offers where id::text like '00000000-0000-4000-8000-%'
union all select 'fundaciones', count(*) from public.foundations where id::text like '00000000-0000-4000-8000-%';
