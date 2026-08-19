-- Chocó-up: el registro público de quién donó, a qué causa y cuánto.
--
-- Va detrás de 0017_donaciones_preparadas.sql (la tabla) y de
-- 0020_presupuesto.sql (la suma por causa). Se puede ejecutar más de una vez
-- sin errores.
--
-- CUIDADO CON EL ORDEN: un `create view` hace una vista nueva, y una vista nueva
-- de `public` nace con el juego de permisos completo concedido al público. El
-- `revoke all` de abajo es lo que lo cierra. Si alguna vez se vuelve a pegar
-- 0017, esta vista no se cae —no la toca—, pero si se vuelve a pegar ESTE
-- archivo hay que comprobar que el `grant select` sigue siendo lo único que
-- queda. `npm run verify:sql` pasa las migraciones dos veces seguidas.
--
-- ===========================================================================
-- POR QUÉ AHORA Y NO EN 0017
--
-- 0017 dejó escrito, a propósito, que no había vista pública. El molde ya
-- existía —`aid_log` (0005), `offer_log` (0012): `security_invoker = false`
-- para poder contar una tabla que el público no lee, `security_barrier` puesto,
-- y la cascada de publicación reescrita a mano— y aun así no se escribió:
-- una vista sobre una tabla vacía es una superficie que nadie puede
-- comprobar, y la regla que de verdad importa es cuáles nombres salen.
--
-- Esa regla ya se puede mirar. Hay una pantalla que pide el registro —en el
-- inicio, en cada municipio y en cada causa— y hay datos de muestra con los
-- que ver quién aparece y quién no. La tabla sigue cerrada: `anon` no lee
-- `public.donations`, no ahora ni después. Lo que sale es esta vista, y lo
-- que no está en ella no se publica.
--
-- Lo que esta vista NO es: no es un atajo para que el navegador escriba un
-- importe. Las tres barreras de 0017 siguen en pie y esta lectura no las
-- toca. Un `select` no concede un `insert`.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Qué sale, y qué no
--
-- Sale el importe, la causa, el municipio, cuándo se confirmó, y el nombre
-- SOLO si quien donó lo autorizó. No sale la referencia del pago, ni el
-- proveedor, ni el estado interno, ni una donación pendiente o fallida, ni
-- una causa sin publicar, ni una sin consentimiento, ni un municipio
-- despublicado.
--
-- El recorte vive aquí y no en la plantilla porque la vista ES la API:
-- cualquiera puede pedirle las columnas que quiera, así que la única forma
-- de que un dato no se publique es que no exista en ella. Es el mismo
-- criterio con el que no está `payment_ref`: no se esconde, no está.
--
-- `security_invoker = false` porque el público no lee `public.donations` y
-- igual tiene que ver las filas confirmadas. `security_barrier` para que el
-- filtro se aplique antes de que un `where` de quien pregunta pueda
-- empujar una condición hacia las tablas del fondo. La cascada de
-- publicación está reescrita a mano en el `where` y en los dos joins: las
-- RLS de esas tablas no protegen esta vista, porque no se invocan.
-- ---------------------------------------------------------------------------

drop view if exists public.donation_log;

create view public.donation_log
with (security_invoker = false, security_barrier = true)
as
select
  d.id,
  d.amount_cop,
  -- Cuándo se confirmó el pago, que no es cuándo entró la fila: entre el
  -- intento y la confirmación pueden pasar días. Si por algún descuido una
  -- fila confirmada llegara sin `settled_at`, se cae a `created_at` para que
  -- el registro no se quede mudo. La hora sale: este registro no es un
  -- calendario de reparto —eso es lo que 0002 no publica de una entrega—,
  -- es el rastro de un pago que ya ocurrió.
  coalesce(d.settled_at, d.created_at) as donated_at,
  -- El nombre, con tres condiciones y no con una.
  --
  -- `publish_name` es la autorización, y no basta. Un nombre no lleva siete
  -- dígitos seguidos ni una arroba, así que «Marta, 3167778899» no es un
  -- nombre, es un contacto escrito en el campo del nombre. Es el mismo
  -- guardián de 0002, literal. Ante la duda no se publica: el registro se
  -- sostiene sin él, diciendo que la donación es anónima.
  --
  -- El `else` no está escrito: sin `then` el `case` devuelve nulo, y nulo
  -- es «anónima» en la plantilla. No se publica una cadena vacía fingiendo
  -- un nombre.
  case
    when d.publish_name
      and d.donor_name <> ''
      and d.donor_name !~ '[0-9]{7}'
      and d.donor_name not like '%@%'
    then d.donor_name
  end as donor_name,
  d.publish_name,
  -- La causa y el municipio, que es a quién fue el dinero. El identificador
  -- del caso sí sale: es el mismo que ya está en la dirección de su ficha
  -- (`/ciudades/…/casos/<id>`), y hace falta para filtrar el registro de
  -- esa ficha sin volver a leer la tabla cerrada.
  c.id as case_id,
  c.display_name as case_name,
  t.id as city_id,
  t.name as city_name,
  t.slug as city_slug
from public.donations d
  join public.cases c
    on c.id = d.case_id
   and c.published
   and c.consent_to_publish
  join public.cities t
    on t.id = c.city_id
   and t.published
where d.status = 'confirmada';

comment on view public.donation_log is
  'Donaciones confirmadas a causas publicadas: importe, causa, municipio, fecha y el nombre solo si se autorizó. Sin referencia de pago.';

-- ---------------------------------------------------------------------------
-- Quién puede leerla, y nada más
--
-- Se revoca todo y se vuelve a conceder la lista corta, en lugar de nombrar
-- los privilegios que sobran: es lo que hace 0008 y por su misma razón.
-- `select` para los dos roles y nada más: es una vista de consulta, no hay
-- nada que escribir en ella, y sobre la tabla del fondo `anon` no lee.
-- ---------------------------------------------------------------------------

revoke all on public.donation_log from anon, authenticated;
grant select on public.donation_log to anon, authenticated;

-- El registro se pide por causa y por tiempo. Sin este índice, cada visita a
-- una ficha recorrería todas las donaciones confirmadas. Parcial: las
-- pendientes y las fallidas no salen del registro y no tienen por qué estar
-- en el índice.
create index if not exists donations_log_by_case
  on public.donations (case_id, settled_at desc)
  where status = 'confirmada';
