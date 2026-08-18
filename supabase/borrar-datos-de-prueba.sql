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
-- De los diez de la semilla quedan cuatro: los seis que no llegaron a tener fotos
-- se quitaron para revisar el diseño sin tarjetas vacías. Vuelven pasando otra vez
-- supabase/seed.sql, que los reinserta con sus coordenadas y sin publicar.

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

update public.cities
set name = replace(name, ' (prueba)', ''),
    summary = '',
    published = false
where name like '%(prueba)%';

commit;

-- Comprobación: las cinco tablas de contenido vacías y los diez municipios sin
-- publicar. Si algo no da cero, quedó contenido sin marcar.
select (select count(*) from public.cases)       as casos,
       (select count(*) from public.needs)       as necesidades,
       (select count(*) from public.photos)      as fotos,
       (select count(*) from public.offers)      as ofertas,
       (select count(*) from public.foundations) as fundaciones,
       (select count(*) from public.cities)      as municipios,
       (select count(*) from public.cities where published) as publicados;
