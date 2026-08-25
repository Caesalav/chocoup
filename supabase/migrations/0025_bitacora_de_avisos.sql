-- Chocó-up: la bitácora de los avisos de pago, y de dónde salió cada donación.
--
-- Va detrás de 0024_avisos_de_donacion.sql y se puede ejecutar más de una vez
-- sin errores.
--
-- ===========================================================================
-- POR QUÉ ESTE ARCHIVO EXISTE: EL 23 DE AGOSTO ENTRÓ DINERO Y NO QUEDÓ NADA
--
-- Dos personas donaron, el cobro salió en Mercado Pago, y `public.donations` se
-- quedó vacía. Al mirarlo no había forma de saber cuál de estas cosas pasó:
--
--   * Mercado Pago nunca llamó al webhook.
--   * Llamó y la ruta contestó 401 porque el aviso no venía firmado.
--   * Llamó, se leyó el pago y el estado no estaba en la tabla de traducción.
--   * Llamó y la escritura falló.
--
-- Las cuatro dejan el mismo rastro —ninguno—, porque lo único que escribían era
-- una línea en el registro de Vercel, que se borra. El camino por el que entra
-- todo el dinero del portal era el único sin memoria.
--
-- Esta tabla es esa memoria. Una fila por aviso recibido, con lo que se decidió
-- y por qué. No sustituye a nada: es lo que permite responder «¿llegó el aviso
-- de este pago?» sin depender de que alguien estuviera mirando los registros en
-- ese minuto.
--
-- LO QUE NO GUARDA, y es a propósito: ni el nombre de quien donó, ni su correo,
-- ni el cuerpo del aviso. El correo no se guarda en ningún sitio del portal
-- (0024 lo dejó escrito) y esta tabla no abre esa puerta. Aquí hay
-- identificadores de pago, horas y resultados: lo justo para reconstruir qué
-- hizo el servidor.
-- ===========================================================================

create table if not exists public.payment_notices (
  id uuid primary key default gen_random_uuid(),

  received_at timestamptz not null default now(),

  provider text not null default 'mercadopago',

  -- El identificador del pago tal como venía en el aviso. Vacío cuando el aviso
  -- no traía ninguno, que es un caso real y que también hay que poder contar.
  payment_ref text not null default '',

  -- `type` o `topic` del aviso: 'payment', 'merchant_order', y lo que Mercado
  -- Pago añada. Se guarda sin traducir para poder ver qué manda de verdad.
  kind text not null default '',

  -- El `x-request-id` del aviso. Es lo que pide el soporte de Mercado Pago para
  -- buscar un envío concreto de su lado, así que sin él una reclamación no se
  -- puede sostener.
  request_id text not null default '',

  -- En qué estado llegó la firma. Las tres son estados normales y hay que poder
  -- distinguirlas: 'ausente' es lo que manda el aviso antiguo por
  -- `notification_url`, 'invalida' es un secreto que no corresponde —o alguien
  -- probando la URL— y 'valida' es el webhook configurado en el panel.
  signature text not null default 'ausente',

  -- Qué hizo la ruta. Es la columna que se lee cuando algo no cuadra.
  outcome text not null,

  -- El detalle en una línea, para lo que el resultado no cuenta solo: el estado
  -- que Mercado Pago mandó, el mensaje de un error de escritura.
  detail text not null default '',

  -- La donación que salió de este aviso, si salió alguna. `set null` y no
  -- `cascade`: si un día se borra una fila de donaciones, el rastro de que el
  -- aviso llegó no se va con ella.
  donation_id uuid references public.donations (id) on delete set null,

  constraint payment_notices_signature_valid
    check (signature in ('valida', 'invalida', 'ausente')),

  constraint payment_notices_detail_len check (char_length(detail) <= 500)
);

-- Lo que se pregunta siempre: los últimos avisos, y todos los de un pago.
create index if not exists payment_notices_recent
  on public.payment_notices (received_at desc);

create index if not exists payment_notices_by_payment
  on public.payment_notices (provider, payment_ref)
  where payment_ref <> '';

comment on table public.payment_notices is
  'Un aviso de pago recibido, con lo que la ruta decidió. Sin nombres ni correos: solo identificadores, horas y resultados.';

-- ---------------------------------------------------------------------------
-- De dónde salió cada donación
--
-- Hasta hoy había una sola puerta y por tanto no hacía falta decirlo. Con la
-- conciliación hay dos, y las dos escriben desde el servidor con la misma
-- autoridad —le preguntan a Mercado Pago por el pago y creen a la respuesta—,
-- así que la diferencia no es de confianza: es de cómo se enteró el portal.
--
--   * 'webhook': Mercado Pago avisó y la ruta lo escribió en el momento.
--   * 'conciliacion': nadie avisó, o el aviso se perdió, y coordinación le
--     preguntó a Mercado Pago qué pagos tenía. La fila entra igual porque el
--     importe lo sigue diciendo Mercado Pago y no una persona.
--
-- NO HAY UN TERCER VALOR, y su ausencia es la regla de 0017 intacta: no existe
-- 'a mano'. Un importe no se teclea, ni siquiera desde coordinación. Lo que la
-- conciliación añade es otra forma de PREGUNTAR, no otra forma de AFIRMAR.
-- ---------------------------------------------------------------------------

alter table public.donations
  add column if not exists source text not null default 'webhook';

alter table public.donations drop constraint if exists donations_source_valid;
alter table public.donations add constraint donations_source_valid
  check (source in ('webhook', 'conciliacion'));

comment on column public.donations.source is
  'Cómo se enteró el portal de este pago: webhook (avisó Mercado Pago) o conciliacion (se le preguntó). Nunca a mano.';

-- ---------------------------------------------------------------------------
-- Las mismas tres barreras que 0017, por el mismo motivo
--
-- Esta tabla no lleva importes, así que falsificarla no mueve una barra de
-- recaudado. Lleva algo distinto y también vale cerrarlo: es la prueba de qué
-- pasó con el dinero. Una bitácora que el navegador puede escribir no sirve
-- para reclamarle nada a nadie, y una que puede borrar es peor que no tenerla,
-- porque se la cree igual.
--
-- Se concede `insert` a `service_role` y nada más. Ni `update` ni `delete`, y
-- eso es más estricto que en `donations`: un aviso ya recibido no se corrige.
-- Si algo quedó mal apuntado, lo que hay es otra fila.
-- ---------------------------------------------------------------------------

alter table public.payment_notices enable row level security;

revoke all on public.payment_notices from anon, authenticated;
grant select on public.payment_notices to authenticated;
grant select, insert on public.payment_notices to service_role;

drop policy if exists payment_notices_coordination_read on public.payment_notices;
create policy payment_notices_coordination_read on public.payment_notices
  for select to authenticated
  using (private.is_coordination());

-- El mismo disparador que `donations`, y por lo mismo: mira el rol de la
-- CONEXIÓN, no el de la persona. `security invoker` a propósito, porque lo que
-- tiene que ver es quién llama.
create or replace function private.notices_are_server_only()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'La bitácora de avisos la escribe el servidor, nunca el navegador'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.notices_are_server_only() from anon, authenticated;

drop trigger if exists payment_notices_server_only on public.payment_notices;
create trigger payment_notices_server_only
  before insert or update or delete on public.payment_notices
  for each row execute function private.notices_are_server_only();
