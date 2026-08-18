-- Chocó-up: el registro público de ayudas publica la categoría, no el texto.
--
-- Va detrás de 0001_init.sql, 0002_roles_y_ayudas.sql, 0003_retrato_del_caso.sql
-- y 0004_una_fundacion_por_municipio.sql, en ese orden. Se puede ejecutar más de
-- una vez sin errores.
--
-- CUIDADO CON EL ORDEN: 0002 crea `public.aid_log` en su versión con el texto
-- libre dentro. Si alguna vez se vuelve a pegar 0002, hay que volver a pegar este
-- archivo justo después o el registro público vuelve a publicar ese texto. Es el
-- mismo cuidado que 0002 pide respecto de 0001, y por eso `npm run verify:sql`
-- pasa las migraciones dos veces seguidas: lo que quede en pie al final del
-- segundo pase es lo que hay.
--
-- Y al revés: si se vuelve a pegar ESTE archivo, hay que pegar 0008 detrás. El
-- `create view` de abajo hace una vista nueva, y una vista nueva nace con el
-- juego de permisos completo concedido al público.
--
-- Por qué existe:
--
-- 0002 dejó escrito el resto que su propia vista no podía cerrar: `resource` lo
-- escribe quien ofrece la ayuda, con sus palabras y sin que nadie las revise
-- antes —«tratamiento para la tensión, tres meses»—, y en un municipio pequeño,
-- con la ficha de un caso delante que menciona a una señora con hipertensión, eso
-- basta para atar cabos. La vista no publica el caso, ni su identificador, ni el
-- título de una necesidad suya; y aun así el texto lo señalaba sin nombrarlo.
--
-- Allí se dejó en manos de quien registra la entrega: no marcarla si el texto
-- apunta a una persona. Eso es pedirle a alguien que trabaja con prisa y con la
-- familia delante que haga de censor de lo que escribió un tercero, y que acierte
-- todas las veces. Es la clase de regla que se cumple los primeros días.
--
-- Así que el registro deja de publicar el texto y publica la categoría. Lo que se
-- pierde es precisión —«Medicinas» en lugar de qué medicina— y lo que se sostiene
-- es lo que la página promete: que se pueda comprobar que algo llegó, a qué
-- municipio y en qué mes. El texto completo se queda en la tabla, que es donde
-- trabaja el equipo y donde hace falta para responderle a quien lo mandó.
--
-- La categoría se publica CONTRA EL VOCABULARIO CERRADO, y ese es el punto fino:
-- `public.offers.category` es texto libre —no tiene el `check` que sí tienen las
-- necesidades—, así que alguien puede escribir «tratamiento tensión» ahí y el
-- recorte no serviría de nada. Lo que no está en la lista sale como «otro».

-- ---------------------------------------------------------------------------
-- El registro público, sin el texto de quien ofrece
--
-- Todo lo demás se conserva igual que en 0002 y por los mismos motivos, que no se
-- repiten aquí: la vista es la ÚNICA puerta del público a la tabla de ofertas
-- (`anon` no tiene política de select sobre `public.offers` ni, desde 0008,
-- permiso de tabla), se consulta con los derechos de su propietario para poder
-- enmascarar el nombre,
-- y por eso la cascada de publicación está reescrita a mano en el filtro y en los
-- dos joins. Si se toca esta vista hay que revisar esas tres condiciones.
--
-- El recorte vive aquí y no en la plantilla porque la vista ES la API: cualquiera
-- puede pedirle las columnas que quiera, así que la única forma de que un dato no
-- se publique es que no exista en ella. Es el mismo criterio con el que no está el
-- contacto, ni el día exacto, ni el caso: no se esconden, no están.
-- ---------------------------------------------------------------------------

drop view if exists public.aid_log;

create view public.aid_log
with (security_invoker = false, security_barrier = true)
as
select
  o.id,
  -- La categoría, y solo si es una de las nueve. La lista está escrita tal cual en
  -- `needs_category_valid` (0001) y en NEED_CATEGORIES (lib/constants.ts), y las
  -- tres tienen que decir lo mismo: aquí es lo que se publica, allí lo que la
  -- interfaz sabe rotular.
  --
  -- El `else` no es una red de seguridad por si acaso: es lo que hace que este
  -- recorte signifique algo. Sin él bastaría escribir la frase entera en el campo
  -- de la categoría —por la API, o por un formulario futuro con un campo suelto—
  -- para que saliera publicada por la puerta que acabamos de cerrar. «Otro» no
  -- miente: dice que llegó algo que no encaja en las nueve palabras, que es
  -- exactamente lo que se sabe.
  case
    when o.category in (
      'agua', 'alimentos', 'medicamentos', 'techo', 'ropa',
      'transporte', 'dinero', 'mano_de_obra', 'otro'
    ) then o.category
    else 'otro'
  end as category,
  -- Texto 'YYYY-MM' y no una fecha con el día puesto a 1: una fecha se leería
  -- como el día 1, y aquí no hay ningún día que leer.
  to_char(o.delivered_on, 'YYYY-MM') as delivered_month,
  -- El nombre solo con autorización expresa. Y no si dentro hay un teléfono o un
  -- correo: pasa —"Marta, 3167778899"— y publicarlo tal cual sería publicar el
  -- contacto que esa persona no autorizó. Un nombre no lleva siete dígitos
  -- seguidos ni una arroba; ante la duda, no se publica.
  case
    when o.publish_name
      and o.offerer_name !~ '[0-9]{7}'
      and o.offerer_name not like '%@%'
    then o.offerer_name
  end as offerer_name,
  c.name as city_name,
  c.slug as city_slug,
  -- El título de una necesidad DE ZONA sí: lo escribe el equipo, describe al
  -- municipio y no a nadie —«tejas de zinc para 40 viviendas»— y es lo que queda
  -- para decir para qué era la entrega ahora que el texto de quien la mandó no
  -- sale. Las de un caso siguen fuera, por el join de abajo.
  n.title as need_title
from public.offers o
  left join public.cities c
    on c.id = o.city_id
   and c.published
  -- Solo las necesidades de municipio. El título de una necesidad de un caso
  -- —"bloque y cemento para rehacer la pared del fondo"— está escrito tal cual en
  -- la ficha de esa familia: publicarlo aquí es nombrarla dando un rodeo. Y el
  -- identificador tampoco sale, que por él se llega al caso con una consulta.
  left join public.needs n
    on n.id = o.need_id
   and n.case_id is null
   and exists (select 1 from public.cities nc where nc.id = n.city_id and nc.published)
-- Una entrega en un municipio sin publicar no aparece, igual que no aparecen sus
-- fotos ni sus casos. El municipio nulo sí: es la ayuda que no iba a un sitio
-- concreto —un camión, un cupo de carga— y no cuenta nada de nadie.
where o.delivered_on is not null
  and (
    o.city_id is null
    or exists (select 1 from public.cities pc where pc.id = o.city_id and pc.published)
  );

grant select on public.aid_log to anon, authenticated;
