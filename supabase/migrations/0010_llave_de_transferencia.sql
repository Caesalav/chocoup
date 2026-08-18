-- ===========================================================================
-- SUPERADA POR 0011. Esta migración crea una llave de transferencia global y
-- 0011 la retira, porque el modelo estaba mal entendido: `@soschoco` no es un
-- canal general del portal, es el canal del caso de Quibdó y de nadie más. Cada
-- municipio tiene el suyo y cada caso el suyo.
--
-- El archivo se queda porque está aplicada en la base real y porque el histórico
-- tiene que poder reconstruirse pegando las migraciones en orden. **Nunca se
-- pega suelta**: sin 0011 detrás, devuelve al portal una llave global que vuelve
-- a decir que el dinero de todo el Chocó va al mismo sitio. Lo que sigue leído
-- de aquí abajo describe una decisión que ya no está en pie.
-- ===========================================================================

-- Chocó-up: la llave de transferencia del portal, en un solo sitio.
--
-- Va detrás de 0009 y no toca nada de lo que ya hay: ni una política, ni un
-- permiso, ni una columna de otra tabla. Se puede ejecutar más de una vez sin
-- errores, y volver a pegarla NO reescribe la llave que esté puesta. Ese detalle
-- está explicado abajo porque es el único de este archivo que, hecho al revés,
-- manda dinero a una cuenta vieja.
--
-- Por qué existe:
--
-- El destino de donación que tenemos es `@soschoco`, y no es una dirección web:
-- es una llave de transferencia. Una llave no se pulsa, se copia y se pega en la
-- app del banco. Metida en `foundations.donation_url` se convierte en
-- `https://@soschoco` —eso hace `externalUrl()` con lo que no trae esquema— o
-- sea, un enlace roto en el botón más importante del portal. Necesita su propio
-- campo y su propia forma de presentarse: escrita entera, grande y seleccionable,
-- que es lo que se puede copiar a mano y sin JavaScript.
--
-- Y hace falta hoy. En la base real hay un caso publicado, con consentimiento,
-- retrato, doce fotos y dos necesidades, al que no se le puede dar nada: no hay
-- ninguna fundación registrada y el caso no trae destino propio, así que su ficha
-- ni siquiera pinta la sección de enviar dinero. Se lee su situación y no hay a
-- dónde mandar un peso. El portal existe para encauzar ayuda y ahora mismo no
-- encauza nada.

-- ---------------------------------------------------------------------------
-- Por qué una fila global y no una columna más de la fundación
--
-- El modelo tiene una fundación por municipio con su propio enlace (0004), y ese
-- reparto es correcto para lo que describe: cada fundación recauda para su pueblo
-- y rinde cuentas allí. `@soschoco` no es eso. Es UNA llave para todo el portal,
-- y colgarla de la fundación la obligaría a repetirse municipio a municipio:
-- treinta filas con el mismo dato, cambiarla serían treinta ediciones, y bastaría
-- equivocarse en una para que un pueblo quedara enviando el dinero a otro sitio
-- sin que nada en la pantalla lo delatara. La llave va a cambiar —eso ya lo
-- sabemos—, así que «un solo sitio» no es orden: es la única forma de que
-- cambiarla no pueda salir a medias.
--
-- Y no desbloquearía nada. No hay ninguna fundación en la base y no tenemos sus
-- datos de contacto, así que una llave que solo aparece cuando exista la
-- fundación deja el caso real igual de mudo que hoy.
--
-- Lo de la fundación no se va ni se sustituye: son dos cosas distintas y
-- conviven. El enlace de una fundación es de esa fundación, para ese municipio;
-- la llave es del portal y no pertenece a ningún municipio. Por eso vive en su
-- propia tabla y no tiene `city_id`.
--
-- ---------------------------------------------------------------------------
-- Por qué en la base de datos y no en una constante del proyecto
--
-- Una constante en `lib/constants.ts` también viviría en un solo sitio, y sería
-- más simple y más barata: nada que consultar, nada que proteger. Pierde en lo
-- único que aquí decide, que es cómo se cambia. Editar una constante es tocar el
-- repositorio, hacer commit y esperar un despliegue; y la llave va a cambiar
-- pronto, con el equipo de viaje, documentando desde el móvil con la señal del
-- Chocó y sin nadie delante de un portátil que pueda desplegar. Una fila se
-- cambia desde /admin/donaciones en un minuto y desde un teléfono.
--
-- El precio de traerla aquí es que pasa a ser un dato escribible, o sea una
-- superficie nueva por la que se puede desviar dinero. Por eso entra con el
-- cerrojo puesto y no como una fila cualquiera: ver el bloque de acceso al final.
-- El precio de dejarla fuera sería que el día que la llave cambie el portal siga
-- enseñando la vieja hasta que alguien pueda desplegar, y que hasta entonces la
-- gente esté transfiriendo a una cuenta que ya no es.
-- ---------------------------------------------------------------------------

create table if not exists public.donation_key (
  -- Una sola fila para todo el portal, y lo garantiza el tipo: `true` es el único
  -- valor que pasa la comprobación, y la clave primaria impide que haya un
  -- segundo `true`. Sin esto «la llave» sería «la primera llave que devuelva la
  -- consulta», que es exactamente el fallo que 0004 tuvo que arreglar en las
  -- fundaciones: el destino del dinero decidido por un orden.
  singleton  boolean primary key default true,

  -- La llave tal y como se teclea en la app: `@soschoco`. Se guarda literal,
  -- sin normalizar ni añadirle nada, porque cualquier arreglo automático sobre
  -- un destino de dinero es un destino distinto del que alguien escribió.
  --
  -- Vacía significa «no hay llave», y entonces el portal no enseña la sección:
  -- ante la duda calla, en vez de ofrecer un destino a medias.
  key_value  text not null default '',

  -- En qué app se pega: «Bre-B», «Nequi», «Daviplata». Quien lee tiene que saber
  -- a dónde va la llave antes de copiar nada, y eso no puede estar escrito en el
  -- código porque depende de la llave, y la llave cambia. Vacío es un estado
  -- válido: el portal dice entonces la versión general —la app del banco o la
  -- billetera—, que es cierta igual y no inventa una marca.
  app_label  text not null default '',

  -- A nombre de quién tiene que aparecer en la app al confirmar la
  -- transferencia. Es la única comprobación que puede hacer quien dona:
  -- `@soschoco` no dice nada por sí mismo, y el nombre que le sale en pantalla
  -- antes de confirmar sí. Vacío: no se promete ningún nombre, que es mejor que
  -- prometer uno equivocado.
  holder     text not null default '',

  updated_at timestamptz not null default now(),

  -- Quién la tocó la última vez, tomado del token y nunca del formulario. Este es
  -- el campo más peligroso del portal: si un día el dinero aparece en otra
  -- cuenta, esta columna es lo único que dice desde qué sesión se cambió.
  updated_by text not null default '',

  constraint donation_key_one_row check (singleton)
);

-- Las dos columnas del rastro las escribe la base de datos y no quien llama.
-- `private.touch_updated_at()` de 0001 no sirve aquí porque solo pone la fecha, y
-- una fecha sin nombre no responde a la pregunta que se va a hacer.
--
-- El correo sale de `auth.jwt()`, así que un cliente no puede firmarlo con el de
-- otra persona ni dejarlo en blanco. Sin correo en el token —el SQL Editor de
-- Supabase, o esta misma migración— queda vacío, que es la verdad: no hubo sesión.
create or replace function private.stamp_donation_key()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce(auth.jwt() ->> 'email', '');
  return new;
end;
$$;

drop trigger if exists donation_key_stamp on public.donation_key;
create trigger donation_key_stamp
  before insert or update on public.donation_key
  for each row execute function private.stamp_donation_key();

-- ---------------------------------------------------------------------------
-- El valor inicial, y por qué se escribe una sola vez
--
-- `on conflict do nothing` es lo que hace que este archivo se pueda volver a
-- pegar. Todas las migraciones del proyecto se vuelven a pegar cuando hay que
-- reconstruir algo —está escrito en el README y en ANTES-DEL-VIAJE—, y un
-- `do update` aquí devolvería la llave a `@soschoco` el día que ya fuera otra:
-- un mantenimiento rutinario, sin ningún error a la vista, mandando las
-- donaciones a una cuenta vieja.
--
-- Después de esta línea el único sitio donde vive la llave es esta fila, y el
-- único sitio donde se cambia es el panel.
-- ---------------------------------------------------------------------------

insert into public.donation_key (singleton, key_value)
values (true, '@soschoco')
on conflict (singleton) do nothing;

-- ---------------------------------------------------------------------------
-- Quién puede leerla y quién puede cambiarla
--
-- Leerla es de todo el mundo: para eso está. No hay cascada de publicación que
-- aplicar —la llave no pertenece a ningún municipio, así que no hay nada que
-- despublicar con él— y por eso la condición es `true`, escrita a mano para que
-- no se lea como un olvido.
--
-- Cambiarla es de coordinación, por lo mismo que las fundaciones en 0002 y con la
-- misma función: quien pueda editar esto desvía las donaciones de todo el portal
-- a la vez, y no las de un municipio. El equipo en terreno pasa la llave a
-- coordinación y coordinación la registra.
--
-- `for update` y no `for all`, que es lo que sí hacen las fundaciones. Allí hace
-- falta crear y borrar filas; aquí no hay nada que crear —la fila la escribe esta
-- migración— ni nada que borrar, y vaciarla sería quitarle al portal el único
-- destino que tiene. Dejándolo así, insertar y borrar quedan cerrados por dos
-- lados que no dependen el uno del otro: ninguna política los permite y ningún
-- permiso de tabla los concede.
--
-- Y el permiso de tabla es la capa de debajo, la que no se ve leyendo las
-- políticas. Esta tabla nace en `public`, así que Supabase acaba de concederle el
-- juego completo a `anon` y a `authenticated` por los privilegios por defecto del
-- esquema: hay que retirarlo a mano, igual que hizo 0008 con las otras siete.
-- Conceder lo justo no retira lo que sobra. `verify:sql` compara el mapa entero
-- de privilegios de `public` contra su lista, así que esta tabla no puede
-- quedarse sin pasar por aquí sin que las pruebas lo digan.
-- ---------------------------------------------------------------------------

alter table public.donation_key enable row level security;

revoke all on public.donation_key from anon, authenticated;
grant select on public.donation_key to anon;
grant select, update on public.donation_key to authenticated;

drop policy if exists donation_key_public_read on public.donation_key;
create policy donation_key_public_read on public.donation_key
  for select to anon, authenticated
  using (true);

drop policy if exists donation_key_coordination on public.donation_key;
create policy donation_key_coordination on public.donation_key
  for update to authenticated
  using (private.is_coordination())
  with check (private.is_coordination());
