-- Chocó-up: la tabla donde caerán las donaciones en pesos el día que haya
-- pasarela, escrita hoy para que ese día sea añadir y no reescribir.
--
-- Va detrás de 0016 y se puede ejecutar más de una vez sin errores.
--
-- ===========================================================================
-- AQUÍ NO HAY PASARELA, Y ESTE ARCHIVO NO LA TRAE
--
-- No hay proveedor elegido, no hay webhook escrito y no hay ninguna pantalla que
-- lea esta tabla ni que escriba en ella. Lo único que entra hoy en el proyecto es
-- la forma del dato, y entra ahora por un motivo concreto: la decisión de dónde se
-- puede escribir un importe es imposible de añadir después sin tocar todo lo que
-- ya escriba importes. Si la primera versión del webhook llega con la tabla sin
-- hacer, lo natural será darle a la aplicación web permiso de escritura —es la que
-- ya tiene sesión y credenciales—, y ese permiso no se retira nunca, porque
-- retirarlo rompe lo que se acaba de construir.
--
-- LA CONDICIÓN QUE ESTE ARCHIVO EXISTE PARA HACER IMPOSIBLE: un importe no puede
-- entrar desde el navegador. Ni desde el de quien dona, ni desde el de quien
-- coordina. Solo desde el webhook del proveedor, que corre en el servidor y firma
-- con una credencial que nunca baja al cliente.
--
-- Está puesta en tres barreras que no dependen la una de la otra, y esa
-- independencia es el punto: cualquiera de las tres se puede desarmar por
-- descuido en una migración futura —conceder un permiso «para depurar», añadir
-- una política «temporal»— y las otras dos siguen diciendo que no.
--
--   1. EL PERMISO DE TABLA. `anon` y `authenticated` no tienen `insert` ni
--      `update`. Postgres pregunta esto antes de mirar una sola política, así que
--      una llamada desde la web no recibe cero filas: recibe un error de permisos.
--
--   2. LA POLÍTICA. No hay ninguna de escritura. Con RLS puesta y sin política de
--      `insert`, la operación está negada aunque alguien conceda el permiso.
--
--   3. EL DISPARADOR, que es el que aguanta cuando las dos primeras fallan.
--      Rechaza cualquier escritura hecha por los dos roles con los que la Data API
--      atiende a la web. No mira quién es la persona ni qué rol tiene en el
--      equipo: mira desde qué credencial llega la conexión, que es lo único que
--      separa «el navegador» del «servidor».
--
-- Por qué la línea se traza en el rol de conexión y no en el rol del equipo:
-- coordinación tampoco puede escribir un importe, y no es desconfianza. Un importe
-- no es un dato que alguien decida, es un hecho que el banco confirma; teclearlo a
-- mano en el panel produciría una barra de recaudado que no cuadra con ninguna
-- cuenta y que nadie podría auditar después. Lo que coordinación sí puede es
-- leerlo, que es lo que hace falta para conciliar.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Una donación
--
-- Cuatro cosas y las cuatro hacen falta desde el primer día: cuánto, en qué
-- estado, con qué identificador del pago, y para quién. Lo que no está aquí es
-- tan deliberado como lo que está, y va explicado abajo.
-- ---------------------------------------------------------------------------

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),

  -- Para quién. Es obligatorio y no admite nulo: una donación sin causa sería
  -- dinero que entró al portal sin que se pueda decir de quién es, y eso es
  -- exactamente lo que 0011 y 0015 llevan dos migraciones evitando.
  --
  -- `restrict` y no `cascade`, al contrario que en el resto del portal. Borrar una
  -- causa que ha recibido dinero no puede ser un botón: la fila que se llevaría
  -- por delante es el rastro de lo que alguien mandó para esa familia, y hace
  -- falta para conciliar con el banco aunque la ficha ya no esté publicada.
  -- CUANDO HAYA PASARELA, ESTO HARÁ FALLAR «Borrar caso» en el panel, y hay que
  -- darle un mensaje que lo explique en vez de dejar salir el error de Postgres.
  -- Hoy no puede pasar, porque no hay ninguna fila.
  case_id uuid not null references public.cases (id) on delete restrict,

  -- Cuánto, en pesos enteros. `bigint` porque el peso colombiano no tiene
  -- decimales en la práctica y porque un `integer` se queda corto en 2.147
  -- millones, que es una cifra que una campaña puede alcanzar; y nunca coma
  -- flotante, que es cómo se pierden pesos al sumar.
  amount_cop bigint not null,

  -- En qué estado lo dejó el proveedor. Es texto con restricción y no un `enum`
  -- por lo mismo que `offers.status` (0012) y `cases.case_kind` (0016): cada
  -- pasarela nombra sus estados a su manera y ampliar la lista tiene que ser dos
  -- líneas que se puedan volver a pegar.
  status text not null default 'pendiente',

  -- Quién cobró y con qué referencia. Los dos juntos son la identidad del pago
  -- ahí fuera, y por eso son la clave única de más abajo: sin ellos no hay forma
  -- de saber si un aviso repetido del webhook es un pago nuevo o el mismo otra
  -- vez, y un reintento contado dos veces infla la barra de recaudado.
  provider text not null default '',
  payment_ref text not null default '',

  -- El nombre de quien dona, y si autorizó que aparezca.
  --
  -- Falso por omisión, igual que en `offers.publish_name` (0002) y por la misma
  -- razón escrita allí: la privacidad no se pide, se conserva. El historial por
  -- causa que se quiere después sale de estas dos columnas —con nombre o
  -- anónimo—, y lo que decide cuál es esta casilla y no una preferencia de la
  -- pantalla que lo pinte.
  donor_name text not null default '',
  publish_name boolean not null default false,

  created_at timestamptz not null default now(),

  -- Cuándo lo confirmó el proveedor, que no es cuándo entró la fila: entre el
  -- intento y la confirmación pueden pasar días con una transferencia. Nulo
  -- mientras siga pendiente.
  settled_at timestamptz,

  constraint donations_amount_positive check (amount_cop > 0),

  constraint donations_status_valid
    check (status in ('pendiente', 'confirmada', 'fallida', 'reembolsada')),

  constraint donations_name_len check (char_length(donor_name) <= 120)
);

-- Un pago, una fila. Es lo que hace que el webhook pueda ser tonto y reintentar:
-- el mismo aviso llegando tres veces choca contra el índice en vez de sumar tres
-- veces. Sin esto, la primera caída de red del proveedor se convierte en una cifra
-- de recaudado que no cuadra con el extracto y que ya no se puede deshacer.
--
-- Se salta las filas sin referencia, que hoy son todas las que podría haber: con
-- `provider` y `payment_ref` vacíos por omisión, un índice único a secas dejaría
-- meter una sola donación sin identificar en todo el portal.
create unique index if not exists donations_payment_unique
  on public.donations (provider, payment_ref)
  where provider <> '' and payment_ref <> '';

-- ---------------------------------------------------------------------------
-- Lo que esta tabla NO tiene, y por qué
--
-- LA META EN PESOS NO ESTÁ AQUÍ Y TAMPOCO EN `public.cases`. Es lo siguiente que
-- se va a pedir —«meta en pesos, barra de recaudado»— y aun así no se añade hoy,
-- por lo que 0015 dejó escrito al borrar los canales de municipio: una columna que
-- nadie escribe pero que sigue ahí se puede llenar desde la Data API sin que
-- ninguna pantalla lo enseñe. Con una meta eso es una cifra que aparece en la
-- ficha de una familia sin que nadie del equipo la haya decidido. Es una columna y
-- dos líneas el día que exista la pantalla donde se escribe.
--
-- Y NO HAY VISTA PÚBLICA. Ni el total recaudado por causa, ni el historial con los
-- nombres autorizados. Las dos van a hacer falta y las dos son fáciles —el molde
-- está en `aid_log` (0005) y en `offer_log` (0012): `security_invoker = false`
-- para poder contar una tabla que el público no lee, `security_barrier` puesto, y
-- la cascada de publicación reescrita a mano—. No se escriben hoy porque una vista
-- pública sobre una tabla vacía es una superficie que nadie puede comprobar: la
-- regla que de verdad importa es cuáles nombres salen, y eso se escribe con datos
-- reales delante y una pantalla donde mirarlo, no a ciegas dos meses antes.
--
-- Mientras no las haya, las secciones de dinero recaudado no se pintan. Es la
-- misma regla que ya sigue la barra de avance de un caso sin necesidades: sin dato
-- no hay pantalla, en vez de una pantalla que enseña un cero.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Barrera 1: el permiso de tabla
--
-- `revoke all` primero y sin excepción, porque toda tabla nueva de `public` nace
-- con el juego completo concedido a los dos roles de la web —es lo que Supabase
-- deja armado en los privilegios por omisión, y es el descuido de fondo que
-- explica 0008—. Volver a pegar este archivo la reabre y esta línea la vuelve a
-- cerrar, así que no hay que pegar nada detrás.
--
-- De vuelta se concede una sola cosa: `select` con sesión, para que coordinación
-- pueda conciliar. Ni `insert`, ni `update`, ni `delete`, ni para `anon` ni para
-- `authenticated`.
--
-- Y se concede a `service_role` lo que el webhook necesita, escrito a mano aunque
-- en Supabase ya lo tenga por omisión. Es redundante y se queda: esta línea es lo
-- que dice, leyendo el archivo, quién es el único que escribe aquí.
-- ---------------------------------------------------------------------------

alter table public.donations enable row level security;

revoke all on public.donations from anon, authenticated;
grant select on public.donations to authenticated;
grant select, insert, update on public.donations to service_role;

-- ---------------------------------------------------------------------------
-- Barrera 2: las políticas, que son una sola y es de lectura
--
-- Coordinación lee y nadie más. No es el equipo entero: quien documenta un
-- municipio no tiene por qué ver los importes que entraron para las familias que
-- retrata, por lo mismo que no ve la lista de correos de avisos (0015). Lo que
-- necesita de esa ficha es qué falta y qué ha pasado, y eso ya lo tiene.
--
-- No hay política de `insert`, de `update` ni de `delete`, y su ausencia es la
-- barrera: con RLS puesta, lo que ninguna política permite está negado. El
-- webhook no la necesita porque `service_role` se salta las RLS, que es
-- precisamente por lo que su credencial no puede bajar al navegador.
-- ---------------------------------------------------------------------------

drop policy if exists donations_coordination_read on public.donations;
create policy donations_coordination_read on public.donations
  for select to authenticated
  using (private.is_coordination());

-- ---------------------------------------------------------------------------
-- Barrera 3: el disparador, que es el que queda cuando las otras dos se caen
--
-- Las dos de arriba se desarman con una línea cada una, y las líneas que las
-- desarman parecen razonables cuando se escriben: un `grant` para probar algo, una
-- política de `insert` para que la aplicación pueda registrar una intención de
-- pago. Esto es lo que sigue en pie después de las dos.
--
-- Mira el rol de la CONEXIÓN y no el de la persona. `anon` y `authenticated` son
-- los dos roles con los que PostgREST atiende una petición que salió de un
-- navegador —el primero sin sesión, el segundo con ella— y son los dos únicos
-- alcanzables con la clave publicable, que es la que viaja en el HTML. El webhook
-- llega como `service_role`, con una clave que solo existe en el servidor, y pasa.
--
-- Es la razón por la que la comprobación no puede ser `private.is_coordination()`:
-- eso diría que un importe lo puede escribir una persona con la sesión adecuada, y
-- una sesión adecuada es lo que se consigue robando una cuenta. Un importe no lo
-- escribe una persona.
--
-- `security invoker` a propósito, al contrario que las funciones que tienen que
-- leer tablas cerradas: esta no lee nada y tiene que ver el rol de quien llama.
-- Cubre las tres escrituras, incluido el borrado: en un `before delete` no hay
-- `new`, y devolver `old` es lo que deja seguir a la sentencia cuando el rol sí
-- tiene derecho.
-- ---------------------------------------------------------------------------

create or replace function private.donations_are_webhook_only()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception 'Un importe solo entra por el webhook de pagos verificado, nunca desde el navegador'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.donations_are_webhook_only() from anon, authenticated;

drop trigger if exists donations_webhook_only on public.donations;
create trigger donations_webhook_only
  before insert or update or delete on public.donations
  for each row execute function private.donations_are_webhook_only();
