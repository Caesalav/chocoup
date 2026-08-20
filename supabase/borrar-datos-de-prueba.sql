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
--   Ofertas         el nombre de quien ofrece lleva '(prueba)'
--   Fotos           la ruta empieza por 'demo/' (los JPG de public/demo)
--
-- Las fundaciones de prueba ya no se nombran aquí, y no por descuido: la tabla no
-- existe desde 0015_canal_general.sql, que se llevó por delante las dos que había
-- —las dos marcadas—. Nombrarla ahora haría fallar el archivo entero.
--
-- El orden importa: los municipios se renombran AL FINAL, porque los pasos
-- anteriores buscan por esa misma marca.
--
-- Los municipios NO se borran: son los del Chocó de verdad y hacen falta. Solo se
-- les quita la marca, el resumen inventado y la publicación. Un pueblo sin casos
-- no tiene que volver: el portal solo enseña donde hay familias documentadas.
--
-- Si Quibdó desapareciera, vuelve a pasar supabase/seed.sql, que lo reinserta
-- con sus coordenadas y sin publicar. Los demás municipios se crean desde el
-- panel cuando se documentan.
--
-- Lo que este archivo NO toca, y conviene saberlo antes de ejecutarlo con prisa:
-- los casos reales de Quibdó —publicados, con consentimiento, retrato, fotos en
-- Storage, avances, necesidades y el canal de donación `@soschoco`—, y el propio
-- Quibdó. Se salvan por no llevar marca, y cuántos sean cambia con lo que se vaya
-- documentando, así que tampoco se cuentan aquí.

begin;

-- Donaciones de los casos de prueba. Van primero porque `donations.case_id`
-- es `on delete restrict` (0017): si se dejaran, borrar el caso fallaría y el
-- archivo entero se revertiría, con Istmina (prueba) y Bahía Solano (prueba)
-- todavía publicados. Las donaciones de las causas reales no se tocan.
delete from public.donations
where case_id in (
  select id from public.cases
  where story like 'CASO DE PRUEBA%'
     or id::text like '00000000-0000-4000-8000-%'
);

-- Ofertas. Van después de las donaciones y antes de los casos porque apuntan a casos y necesidades que están a punto de
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

-- Fotos de zona de la carga de prueba. Se borra la fila; el archivo no hay que
-- tocarlo, porque estas fotos nunca estuvieron en Storage: viven en public/demo.
-- Las portadas `demo/ciudad-*` no son de esa carga: son el paisaje de archivo
-- del municipio documentado, hasta que el equipo suba la foto del pueblo.
delete from public.photos
where storage_path like 'demo/%'
  and storage_path not like 'demo/ciudad-%';

-- Los municipios se quedan y solo pierden la marca. Aquí se vaciaba además su
-- canal de donación de muestra, que era lo único de este archivo que, olvidado,
-- dejaba un destino de dinero inventado colgando de un municipio del Chocó de
-- verdad y ya sin la marca «(prueba)» que lo delataba. Esas columnas no existen
-- desde 0015: no hay canales de municipio, así que ese riesgo se fue con ellas.
update public.cities
set name = replace(name, ' (prueba)', ''),
    summary = '',
    published = false
where name like '%(prueba)%';

commit;

-- Comprobación: que no quede nada marcado y que el contenido real siga en pie.
--
-- Esto NO cuenta filas totales, y el cambio importa. Contarlas fue lo primero
-- que se escribió aquí, cuando la base solo tenía la carga de prueba: entonces
-- «cero casos» quería decir «no quedó nada sin marcar». Desde que hay casos
-- reales documentados en Quibdó, con sus fotos, sus avances y sus necesidades,
-- ese cero ya no puede darse nunca y leerlo como un fallo llevaría a borrar a
-- mano justo lo que hay que conservar.
--
-- Lo que tiene que dar cero es la primera columna. Las otras son el caso real,
-- que este archivo no toca.
select (select count(*) from public.cases where story like 'CASO DE PRUEBA%')
     + (select count(*) from public.photos where storage_path like 'demo/%' and storage_path not like 'demo/ciudad-%')
     + (select count(*) from public.offers where offerer_name like '%(prueba)%')
     + (select count(*) from public.cities where name like '%(prueba)%')
         as restos_de_prueba, -- tiene que ser 0
       (select count(*) from public.cases)  as casos_que_quedan,
       (select count(*) from public.needs)  as necesidades_que_quedan,
       (select count(*) from public.photos) as fotos_que_quedan,
       (select count(*) from public.cities) as municipios,
       (select count(*) from public.cities where published) as publicados;

-- Y los destinos de dinero que quedan, uno por línea. Cualquier canal de muestra
-- que sobreviviera al borrado es lo peor que puede quedarse: un destino inventado
-- en una ficha que ya no dice «prueba» en ninguna parte.
--
-- El canal general sale siempre y tiene que salir: es de todo el portal y no lo
-- carga ni lo borra este archivo. Los de caso, solo los que alguien registró a
-- mano; los casos sin canal propio reciben por el general y no aparecen aquí,
-- porque no tienen ningún destino escrito en su fila.
--
-- Sale también la fecha de comprobación que añadió 0016, porque una fecha
-- sobreviviente miente igual que un destino sobreviviente: la ficha diría
-- «Comprobado el …» de una llave de muestra que nadie llamó nunca. Y al revés,
-- un destino de verdad con la casilla vacía es correcto: quiere decir que está
-- sin comprobar, y la ficha entonces no dice nada.
select 'general' as nivel, 'Canal general del portal' as quien,
       donation_key, donation_url, donation_phone, donation_verified_on
from public.donation_channel
union all
select 'caso', display_name, donation_key, donation_url, donation_phone,
       donation_verified_on
from public.cases where donation_key <> '' or donation_url <> '' or donation_phone <> '';

-- Y si algún día vuelve a haber contenido de prueba que este archivo no cubra,
-- lo delata su identificador: todo lo que carga supabase/datos-de-prueba.sql
-- lleva uno que empieza por 00000000-0000-4000-8000-.
select 'casos' as tabla, count(*) from public.cases where id::text like '00000000-0000-4000-8000-%'
union all select 'fotos', count(*) from public.photos where id::text like '00000000-0000-4000-8000-%'
union all select 'necesidades', count(*) from public.needs where id::text like '00000000-0000-4000-8000-%'
union all select 'avances', count(*) from public.case_updates where id::text like '00000000-0000-4000-8000-%'
union all select 'ofertas', count(*) from public.offers where id::text like '00000000-0000-4000-8000-%'
union all select 'donaciones', count(*) from public.donations where id::text like '00000000-0000-4000-8000-%';
