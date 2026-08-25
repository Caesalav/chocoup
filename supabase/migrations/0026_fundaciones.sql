-- Chocó-up: las fundaciones que se ofrecen a ayudar.
--
-- Va detrás de 0025_bitacora_de_avisos.sql y se puede ejecutar más de una vez
-- sin errores.
--
-- ===========================================================================
-- ESTO NO DESHACE 0015, Y CONVIENE DEJARLO CLARO DE ENTRADA
--
-- 0015 borró las fundaciones del portal, y el motivo sigue en pie: una
-- fundación no puede ser un DESTINO de dinero aquí. Aquella tabla existía para
-- colgarle un enlace de donación, y eso convertía al portal en un directorio
-- que reparte plata hacia entidades que no puede auditar. Nada de eso vuelve:
-- esta tabla no tiene canal de donación, ni enlace de recaudación, ni forma de
-- que una fila de aquí aparezca en una ficha pidiendo dinero.
--
-- Lo que entra es lo contrario. Una fundación que trabaja en el Chocó y se
-- ofrece a AYUDAR: gente, bodega, transporte, un equipo médico, presencia en un
-- municipio al que el portal todavía no llega. Es la misma clase de cosa que un
-- voluntario o un recurso, con la diferencia de que quien la ofrece es una
-- organización.
-- ===========================================================================
-- POR QUÉ ES UNA TABLA APARTE Y NO UN CUARTO `kind` DE support_offers
--
-- Se parecen en cómo entran —el mismo formulario, la misma pantalla— y se
-- diferencian en lo que pasa después, que es lo que decide dónde vive un dato.
--
-- `support_offers` es una BANDEJA. Lo dice su propia pantalla del panel: «no se
-- acepta ni se niega: se busca y se llama». Llega una oferta, alguien la lee,
-- llama, y la fila se queda ahí como registro de que esa persona escribió. No
-- se edita, porque no hay nada que mantener: lo que dijo esa persona el martes
-- es lo que dijo el martes.
--
-- Una fundación es una FICHA. Tiene NIT, representante, municipios donde opera
-- y un estado de revisión, y todo eso cambia con el tiempo y hay que poder
-- corregirlo: el equipo verifica que existe, apunta lo que averiguó y actualiza
-- el municipio cuando abren sede en otro. Meterla como cuarto `kind` habría
-- traído dos cosas malas: diez columnas más a una tabla que ya tiene una por
-- cada tipo, y una ficha viviendo en una bandeja de solo lectura.
-- ===========================================================================

create table if not exists public.foundations (
  id uuid primary key default gen_random_uuid(),

  -- El nombre legal y el de la calle, y hacen falta los dos. Una fundación se
  -- registra como «Corporación para el Desarrollo del Atrato» y todo el mundo
  -- la llama «Atrato Vive»: con solo el legal no se la reconoce, y con solo el
  -- corto no se la puede comprobar en el registro de cámara de comercio.
  legal_name text not null,
  display_name text not null default '',

  -- El NIT, si lo tiene. Vacío es un estado normal y frecuente: media ayuda del
  -- Chocó la mueven colectivos sin formalizar, y exigirlo dejaría fuera justo a
  -- quien está en el pueblo. Lo que sí hace es cambiar qué se puede verificar,
  -- y por eso se pregunta.
  nit text not null default '',

  -- Quién responde. Es una persona con nombre y no un buzón general: cuando el
  -- equipo llame tiene que preguntar por alguien.
  contact_name text not null,
  email text not null,
  phone text not null default '',
  website text not null default '',

  -- Dónde está la sede y dónde trabaja, que casi nunca son lo mismo. La
  -- cobertura es texto libre y no una lista de municipios enlazada: una
  -- fundación dice «el medio Atrato» y esa frase vale más que obligarla a
  -- marcar seis casillas de una lista que quizá no incluye su vereda.
  city_name text not null default '',
  coverage text not null default '',

  -- A qué se dedica, y en qué categoría cae. La categoría es la misma lista que
  -- las necesidades y los recursos (0012, 0020), para que el panel pueda cruzar
  -- «quién puede ayudar con techo» sin traducir vocabularios.
  focus text not null,
  category text not null default 'otro',

  -- Qué puede poner encima de la mesa. Es lo que convierte esta ficha en algo
  -- accionable: sin esto, el panel tiene una lista de organizaciones simpáticas
  -- y ninguna forma de saber a cuál llamar cuando falta una bodega en Istmina.
  offering text not null default '',
  team_size text not null default '',
  founded_year text not null default '',

  message text not null default '',

  -- ---------------------------------------------------------------------------
  -- El estado de revisión, y por qué la fila nace en 'pendiente'
  --
  -- Este formulario lo rellena cualquiera desde internet. Una fila recién
  -- llegada afirma que existe una fundación con un NIT y un representante, y el
  -- portal no ha comprobado nada de eso. 'pendiente' es lo que dice esa
  -- ignorancia en voz alta, y es el valor por omisión para que olvidarse de
  -- ponerlo no ascienda a nadie a verificado.
  --
  -- La política de inserción de más abajo obliga a que entre así: alguien que
  -- mande 'verificada' desde el navegador recibe un error, no una fundación
  -- verificada. Es la misma idea que 0017 con los importes, en pequeño.
  -- ---------------------------------------------------------------------------
  status text not null default 'pendiente',

  -- Lo que el equipo averiguó al llamar. NO LO ESCRIBE QUIEN SE APUNTA, y por
  -- eso la política de inserción exige que llegue vacío: es la libreta del
  -- equipo sobre esa organización, y una libreta que el visitado puede escribir
  -- no sirve para decidir nada.
  notes text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint foundations_legal_name_len
    check (char_length(legal_name) between 2 and 200),
  constraint foundations_display_name_len check (char_length(display_name) <= 200),
  constraint foundations_nit_len check (char_length(nit) <= 40),
  constraint foundations_contact_name_len
    check (char_length(contact_name) between 2 and 120),
  constraint foundations_email_len check (char_length(email) between 5 and 200),
  constraint foundations_phone_len check (char_length(phone) <= 200),
  constraint foundations_website_len check (char_length(website) <= 300),
  constraint foundations_city_len check (char_length(city_name) <= 120),
  constraint foundations_coverage_len check (char_length(coverage) <= 400),
  constraint foundations_focus_len check (char_length(focus) between 4 and 800),
  constraint foundations_offering_len check (char_length(offering) <= 800),
  constraint foundations_team_size_len check (char_length(team_size) <= 80),
  constraint foundations_founded_year_len check (char_length(founded_year) <= 20),
  constraint foundations_message_len check (char_length(message) <= 2000),
  constraint foundations_notes_len check (char_length(notes) <= 2000),

  constraint foundations_status_valid
    check (status in ('pendiente', 'verificada', 'descartada')),

  constraint foundations_category_valid
    check (
      category in (
        'agua', 'alimentos', 'medicamentos', 'techo', 'ropa',
        'transporte', 'dinero', 'mano_de_obra', 'otro'
      )
    )
);

create index if not exists foundations_status_idx
  on public.foundations (status, created_at desc);

comment on table public.foundations is
  'Fundaciones y colectivos que se ofrecen a ayudar. No son destinos de dinero: 0015 sigue en pie. Solo lo lee el equipo.';

-- ---------------------------------------------------------------------------
-- Quién escribe y quién lee
--
-- Entra cualquiera y no lo lee nadie de fuera, igual que `support_offers`
-- (0020). Es un formulario de contacto de una organización: lleva el correo y
-- el teléfono de una persona, y publicarlo sería publicar su agenda.
--
-- La diferencia con las ofertas es el `update`: aquí coordinación sí edita,
-- porque esta tabla es una ficha que se mantiene y no una bandeja que se lee.
-- ---------------------------------------------------------------------------

alter table public.foundations enable row level security;

revoke all on public.foundations from anon, authenticated;
grant insert on public.foundations to anon, authenticated;
grant select on public.foundations to authenticated;
grant update, delete on public.foundations to authenticated;

-- La inserción pública, con las dos casillas que el navegador no puede tocar.
-- `status` y `notes` no son campos del formulario: son del equipo. Sin este
-- `with check`, cualquiera podría mandar una fundación ya verificada con notas
-- puestas, que es la forma barata de colarse en una lista de confianza.
drop policy if exists foundations_anyone_insert on public.foundations;
create policy foundations_anyone_insert on public.foundations
  for insert to anon, authenticated
  with check (status = 'pendiente' and notes = '');

drop policy if exists foundations_team_read on public.foundations;
create policy foundations_team_read on public.foundations
  for select to authenticated
  using (private.is_team());

drop policy if exists foundations_coordination_update on public.foundations;
create policy foundations_coordination_update on public.foundations
  for update to authenticated
  using (private.is_coordination())
  with check (private.is_coordination());

drop policy if exists foundations_coordination_delete on public.foundations;
create policy foundations_coordination_delete on public.foundations
  for delete to authenticated
  using (private.is_coordination());

-- `updated_at` a mano y no con un disparador, por lo mismo que el resto del
-- portal: la única pantalla que escribe aquí es la del panel, y verlo en el
-- `update` dice más que un disparador que hay que recordar que existe.
