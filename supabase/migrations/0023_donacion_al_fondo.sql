-- Chocó-up: la donación que no va a una familia, sino al fondo general.
--
-- Va detrás de 0021 y se puede ejecutar más de una vez sin errores.
--
-- ===========================================================================
-- POR QUÉ HACE FALTA, Y POR QUÉ NO ES SOLO QUITAR UN «NOT NULL»
--
-- El portal ya ofrece las dos cosas: `GeneralFundHero` en /donaciones pide un
-- importe sin elegir a quién, y la ficha de una familia pide uno para ella. Las
-- dos abren Mercado Pago y las dos cobran. Pero solo una de las dos cabe en
-- `public.donations`: 0017 escribió `case_id not null` con este argumento —«una
-- donación sin causa sería dinero que entró al portal sin que se pueda decir de
-- quién es»— y ese argumento sigue siendo bueno. Lo que estaba mal es la
-- conclusión, porque de las dos formas de no saber de quién es el dinero solo
-- una es un fallo:
--
--   * UN DESCUIDO: una donación a la familia Rentería que entra sin su causa
--     porque el aviso del proveedor venía incompleto o porque alguien se dejó un
--     campo. Eso es dinero perdido de vista y no puede pasar.
--
--   * UNA DECISIÓN: alguien dona al portal entero, a propósito, sin elegir
--     familia. El destino no falta: es el fondo, y el equipo lo reparte.
--
-- Con `case_id not null` las dos son imposibles. Quitando el `not null` a secas,
-- las dos son posibles y además indistinguibles: una fila con la causa vacía no
-- diría si es una decisión o un descuido, y la que fuera un descuido se leería
-- como fondo general para siempre. Sería dinero moviéndose de una familia al
-- fondo común sin que nadie lo decidiera, en silencio y sin forma de auditarlo.
--
-- Así que el destino se escribe, y se escribe aparte del hueco. `destination`
-- dice a dónde va el dinero con una palabra, y la restricción de más abajo ata
-- la palabra al dato: 'causa' EXIGE una causa, 'fondo' exige que no haya
-- ninguna. Las dos formas de equivocarse quedan fuera de la tabla:
--
--   * Un pago a una causa que llega sin ella no entra: 'causa' sin `case_id` es
--     un error, y un webhook que se deje la causa falla en voz alta en vez de
--     mandar el dinero al fondo.
--   * Un pago al fondo con una causa pegada tampoco: si el aviso trae las dos
--     cosas, alguien está confundiendo dos flujos y hay que mirarlo.
--
-- La columna no es información que el dato ya tenga por otro lado. Es la
-- declaración de una intención, hecha en el momento en que se crea el cobro y
-- comprobable después contra la fila. Es lo mismo que hace `publish_name` con
-- el nombre: el dato de al lado no basta, hace falta la autorización.
--
-- Lo que esta migración NO cambia: quién escribe aquí. Las tres barreras de
-- 0017 siguen enteras —permiso, política y disparador— y un importe sigue
-- entrando solo por el webhook. Añadir un destino no añade una puerta.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- A dónde va el dinero
--
-- 'causa' por omisión y no 'fondo', porque el valor por omisión es el que se
-- aplica cuando alguien escribe una fila sin pensar en esta columna, y de los
-- dos es el único que no puede desviar dinero: con 'causa' por omisión, una
-- escritura descuidada que no traiga causa FALLA. Con 'fondo' por omisión, esa
-- misma escritura se guardaría tan campante y el dinero de una familia
-- aparecería en el fondo común.
-- ---------------------------------------------------------------------------

alter table public.donations
  add column if not exists destination text not null default 'causa';

comment on column public.donations.destination is
  'A dónde va: ''causa'' (una familia, y entonces case_id es obligatorio) o ''fondo'' (el fondo general, y entonces case_id va vacío).';

-- La causa deja de ser obligatoria en la columna para volver a serlo, solo
-- cuando toca, en la restricción de abajo. El `on delete restrict` de 0017 no se
-- toca: una causa que ha recibido dinero sigue sin poder borrarse.
alter table public.donations
  alter column case_id drop not null;

alter table public.donations
  drop constraint if exists donations_destination_valid;
alter table public.donations
  add constraint donations_destination_valid
  check (destination in ('causa', 'fondo'));

alter table public.donations
  drop constraint if exists donations_destination_consistent;
alter table public.donations
  add constraint donations_destination_consistent
  check (
    (destination = 'causa' and case_id is not null)
    or (destination = 'fondo' and case_id is null)
  );

-- ---------------------------------------------------------------------------
-- El registro público, ahora con las dos clases de donación
--
-- Se reescribe entera porque una vista no se puede ampliar: se sustituye. Lo
-- que dice 0021 sobre ella sigue valiendo palabra por palabra —qué sale, qué no
-- sale, y por qué el recorte vive aquí y no en la plantilla—. Lo único que
-- cambia es que una fila puede venir sin causa, y eso obliga a rehacer los dos
-- joins con cuidado.
--
-- LOS JOINS PASAN DE OBLIGATORIOS A OPCIONALES, Y ESO ABRE UN AGUJERO que hay
-- que cerrar en el mismo sitio. Con `join`, una donación a una causa sin
-- publicar desaparecía del registro: la cascada de publicación la sostenía el
-- propio join. Con `left join`, esa misma donación sobreviviría con las
-- columnas de la causa vacías, o sea, DISFRAZADA DE DONACIÓN AL FONDO. Sería
-- publicar dinero de una familia que no ha consentido aparecer, que es la única
-- cosa que este portal no puede hacer.
--
-- Por eso el `where` de abajo no es una comodidad: es la cascada de publicación
-- reescrita para las dos clases de fila. Una donación al fondo sale siempre
-- —no depende de nada publicado—. Una donación a una causa sale solo si el join
-- encontró la causa Y el municipio, o sea, solo si la causa está publicada, con
-- consentimiento, y en un municipio publicado. Si falta cualquiera de las tres,
-- la fila no sale como fondo: no sale.
-- ---------------------------------------------------------------------------

drop view if exists public.donation_log;

create view public.donation_log
with (security_invoker = false, security_barrier = true)
as
select
  d.id,
  d.amount_cop,
  coalesce(d.settled_at, d.created_at) as donated_at,
  -- El nombre, con las mismas tres condiciones de 0021: la autorización no
  -- basta, porque «Marta, 3167778899» no es un nombre sino un contacto escrito
  -- en el campo del nombre. Sin `else`, el `case` devuelve nulo, y nulo es
  -- «anónima» en la plantilla.
  case
    when d.publish_name
      and d.donor_name <> ''
      and d.donor_name !~ '[0-9]{7}'
      and d.donor_name not like '%@%'
    then d.donor_name
  end as donor_name,
  d.publish_name,
  -- El destino sale, y sale como palabra. La plantilla podría deducirlo de que
  -- `case_id` viene vacío, pero deducir un significado de un hueco es cómo se
  -- escriben las pantallas que un día dicen «Para » y se quedan a medias. Aquí
  -- la vista ES la API: lo que la plantilla necesita saber lo dice una columna.
  d.destination,
  c.id as case_id,
  c.display_name as case_name,
  t.id as city_id,
  t.name as city_name,
  t.slug as city_slug
from public.donations d
  left join public.cases c
    on c.id = d.case_id
   and c.published
   and c.consent_to_publish
  left join public.cities t
    on t.id = c.city_id
   and t.published
where d.status = 'confirmada'
  and (
    -- Al fondo: sale, no cuelga de ninguna publicación.
    d.destination = 'fondo'
    -- A una causa: sale solo si la cascada entera la deja salir.
    or (c.id is not null and t.id is not null)
  );

comment on view public.donation_log is
  'Donaciones confirmadas: importe, fecha, destino —una causa publicada o el fondo general— y el nombre solo si se autorizó. Sin referencia de pago.';

revoke all on public.donation_log from anon, authenticated;
grant select on public.donation_log to anon, authenticated;

-- El registro general se pide por fecha y las del fondo no tienen causa por la
-- que filtrar, así que el índice por causa de 0021 no las alcanza. Parcial por
-- lo mismo que aquel: lo pendiente y lo fallido no salen del registro.
create index if not exists donations_log_recent
  on public.donations (coalesce(settled_at, created_at) desc)
  where status = 'confirmada';
