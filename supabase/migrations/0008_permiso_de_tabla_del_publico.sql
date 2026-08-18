-- Chocó-up: el permiso de tabla del público, al mínimo que hace falta.
--
-- Va detrás de 0007. No crea nada, no toca ninguna política y no cambia lo que
-- ve nadie: retira privilegios que ninguna migración concedió y que estaban
-- puestos desde antes de la primera. Se puede ejecutar más de una vez sin
-- errores.
--
-- CUIDADO CON EL ORDEN, y solo por la vista: `public.aid_log` se rehace entera
-- en 0005 —`drop view` y `create view`— y una vista recién creada vuelve a nacer
-- con el juego completo concedido, así que si alguna vez se vuelve a pegar 0005
-- hay que volver a pegar este archivo detrás. Las tablas no tienen ese
-- problema: 0001 y 0006 las crean con `if not exists`, de modo que volver a
-- pasarlas no las recrea y sus permisos se quedan como los deja este archivo.
--
-- Por qué existe:
--
-- 0002 dejó escrito que el contacto de quien ofrece ayuda está detrás de dos
-- barreras independientes: que `anon` no tenga permiso de select sobre
-- `public.offers`, y que tampoco tenga política que se lo dé. En la base de
-- datos de verdad solo se sostenía la segunda.
--
-- Supabase deja armados los privilegios por defecto del esquema `public`
-- (`alter default privileges ... grant all on tables to anon, authenticated`),
-- así que toda tabla que se crea ahí nace con el juego entero concedido a los
-- dos roles que atienden a la web. 0001 vuelve a conceder a mano lo que hace
-- falta —«para no depender de esa configuración»—, pero conceder otra vez no
-- retira lo que ya estaba: `anon` conservaba select sobre las ofertas, y con él
-- update, delete y truncate sobre todas las tablas del portal.
--
-- Fuga no había. La RLS está activa y la única política de `anon` sobre las
-- ofertas es de inserción, así que pedir la tabla por la API devolvía una lista
-- vacía. Pero una lista vacía y un error de permisos no son lo mismo, y esa
-- diferencia ES la segunda barrera: con una sola, el día que alguien añada una
-- política de lectura —para depurar algo, para una pantalla nueva— los
-- teléfonos de quienes ofrecieron ayuda salen por la API sin que falle nada más
-- que avise.
--
-- Lo que este archivo NO retira, y por qué:
--
--   * `service_role`. Conserva el juego completo porque su oficio es saltarse
--     todo esto: el rol tiene además `bypassrls`, así que recortarle privilegios
--     de tabla no cerraría nada, solo lo aparentaría. La garantía sobre esa
--     clave es no usarla, y es la que el README pide y el proyecto cumple.
--
--   * `storage.objects` y `storage.buckets`, donde `anon` tiene exactamente los
--     mismos privilegios de más. No es el mismo descuido: ahí son el contrato
--     del servicio de Storage con Postgres —hace `set role` con el rol del token
--     y deja que decidan las políticas—, están en un esquema que no es de este
--     proyecto y que Supabase vuelve a dejar a su gusto en cada actualización.
--     Lo nuestro allí son las políticas de 0001 y 0002, que ya dicen que subir,
--     reemplazar y borrar es de quien documenta ese municipio.
--
--   * Los privilegios por defecto del esquema. Cerrarlos evitaría que la tabla
--     de la próxima migración vuelva a nacer abierta, y aun así se quedaría a
--     medias: hay dos juegos, el de `postgres` y el de `supabase_admin`, y este
--     proyecto no es miembro del segundo ni puede tocarlo. Media garantía
--     escrita como si fuera entera es justo lo que hemos venido a quitar de
--     aquí. En su lugar las tablas se nombran abajo una a una y `verify:sql`
--     comprueba la lista entera, así que una tabla nueva que no pase por este
--     archivo hace fallar las pruebas antes de que nadie salga de viaje.

-- ---------------------------------------------------------------------------
-- Lo que le corresponde a cada rol, y nada más
--
-- Se revoca todo y se vuelve a conceder la lista corta, en lugar de nombrar los
-- privilegios que sobran. El efecto es el mismo y se lee distinto: así este
-- bloque dice la verdad entera —esto y nada más— sin depender de que quien lo
-- escribiera acertara a enumerar los ocho que hay. Postgres 17 añadió
-- `maintain`, que estaba concedido y que ni siquiera aparece en
-- `information_schema.role_table_grants`; una lista a mano ya nacía incompleta.
-- Es lo mismo que hace 0001 con `private.team_members`.
--
-- Las tablas van nombradas una a una, y no con `all tables in schema public`,
-- porque `anon` no tiene la misma lista en todas: sobre las ofertas solo
-- inserta y sobre el resto solo lee. Un `all tables` obligaría a reconceder la
-- excepción justo detrás, que es como se pierden las excepciones.
-- ---------------------------------------------------------------------------

revoke all on
  public.cities,
  public.foundations,
  public.cases,
  public.photos,
  public.needs,
  public.case_updates,
  public.offers,
  public.aid_log
from anon, authenticated;

-- El público lee el portal. Qué filas ve lo siguen decidiendo las políticas de
-- lectura de 0001 y 0006, que no se tocan: esto solo dice cuál es la operación
-- que puede llegar a pedir.
grant select on
  public.cities,
  public.foundations,
  public.cases,
  public.photos,
  public.needs,
  public.case_updates,
  public.aid_log
to anon;

-- Y escribe en un solo sitio: el formulario de /ofrecer, que es un insert y nada
-- más. Sin select, ni siquiera para releer la fila que acaba de escribir. La
-- Server Action ya inserta sin `.select()`, y este permiso es lo que hace que
-- siga siendo así el día que alguien lo añada por costumbre: en vez de publicar
-- un contacto, el formulario deja de guardar y se nota en el momento.
grant insert on public.offers to anon;

-- El equipo entra con sesión y trabaja las tablas enteras; lo que puede tocar de
-- cada fila lo deciden las políticas por rol de 0002, que tampoco se tocan. Aquí
-- no pierde nada que use: se queda sin truncate, references y trigger. El que
-- importa es truncate, y no porque fuera alcanzable —PostgREST no sabe pedirlo—
-- sino porque es el único de la lista que se salta la RLS entera. Vaciar
-- `public.cases` de un golpe no es una operación que le corresponda a nadie por
-- el hecho de tener un token de sesión.
grant select, insert, update, delete on
  public.cities,
  public.foundations,
  public.cases,
  public.photos,
  public.needs,
  public.case_updates,
  public.offers
to authenticated;

-- El registro de ayudas se lee y ya está, también con sesión: es una vista de
-- consulta y no hay nada que escribir en ella.
grant select on public.aid_log to authenticated;
