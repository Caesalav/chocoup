-- Chocó-up: la carga de prueba que hay hoy en la base de producción.
--
-- Generado desde lib/demo-data.ts. NO es una migración y no cambia el esquema.
-- Se retira entero con supabase/borrar-datos-de-prueba.sql, que borra por los
-- marcadores y no por fecha ni por identificador.
--
-- Todas las filas que inserta este archivo llevan un identificador que empieza
-- por 00000000-0000-4000-8000-, así que también se pueden encontrar por ahí:
--
--   select count(*) from public.cases
--   where id::text like '00000000-0000-4000-8000-%';
--
-- Tres cosas que este archivo hace y lib/demo-data.ts no:
--
--   * Quibdó queda fuera por completo. El primer caso de muestra es una copia
--     literal del caso real —mismo nombre, misma historia—, así que insertarlo
--     pondría una segunda Daniela, con caras de archivo, en el municipio de la
--     de verdad.
--   * Los marcadores: ' (prueba)' en el nombre del municipio y de quien ofrece, y
--     'CASO DE PRUEBA' al principio de cada historia.
--   * Los canales de muestra van a `example.org`, que la IANA tiene reservado
--     justo para esto. Los de lib/demo-data.ts apuntaban a vaki.co, o sea a
--     campañas vivas de terceros, y ese es el botón que mueve dinero: un enlace de
--     muestra que existe manda dinero a alguien que no lo pidió.
--
-- Aquí había además dos fundaciones de prueba. Se fueron con
-- 0015_canal_general.sql, que borró la tabla: una fundación entra ahora como un
-- caso más, y desde 0016 con `case_kind = 'fundacion'` para que su ficha no
-- dibuje iniciales donde tendría que ir un logotipo. Por eso el cuarto caso de
-- prueba es un colegio: es el mismo asunto y aquí no había ninguno.
-- **Y este archivo no toca el canal general del portal**, que es real y
-- no de muestra: cargarlo o vaciarlo desde aquí cambiaría a dónde va el dinero de
-- todas las causas sin canal propio, incluida la de Quibdó.
--
-- Y tres frases de dos notas internas están recortadas respecto a
-- lib/demo-data.ts: nombraban a Quibdó o a una oferta que no se insertó, y una
-- nota que remite a algo que no existe se lee como un dato perdido. Están
-- señaladas en el bloque de ofertas.

begin;

-- ---------------------------------------------------------------------------
-- Municipios: se marcan, se les pone el resumen de muestra y se publican.
-- No se crean: son los del Chocó de verdad, los de supabase/seed.sql.
-- Quibdó no aparece aquí a propósito.
-- ---------------------------------------------------------------------------

update public.cities set
  name = 'Istmina (prueba)',
  summary = 'Unas treinta viviendas del casco urbano quedaron con grietas estructurales y la escuela del barrio San Agustín está cerrada por riesgo de desplome.

La comunidad organizó una olla común en la casa de la cultura. Lo más urgente es material para apuntalar y agua potable.',
  published = true
where id = '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid and name not like '%(prueba)%';

update public.cities set
  name = 'Bahía Solano (prueba)',
  summary = 'En la costa el daño mayor fue en los muelles de pescadores y en las viviendas de palafito de El Valle. Diez lanchas quedaron inservibles, que es de lo que vive la mitad del pueblo.

Llegar solo es posible por avioneta o por mar, así que todo lo que se mande hay que coordinarlo con antelación.',
  published = true
where id = 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid and name not like '%(prueba)%';

-- ---------------------------------------------------------------------------
-- Casos (4). El retrato se pone más abajo: el disparador
-- cases_portrait_belongs_to_case exige que la foto ya sea de este caso.
--
-- Cuatro y no tres desde 0016, y el cuarto es un colegio. Está para poder
-- comprobar sobre la base de verdad lo único que el tipo de causa cambia en la
-- pantalla: la reserva del retrato. Va sin retrato a propósito —un colegio no
-- tiene cara—, así que su hueco tiene que decir «Colegio» y no dos iniciales
-- inventadas del nombre.
--
-- El resumen también entra aquí, y no en todos: dos casos lo llevan escrito y dos
-- no. Es la proporción que va a haber en terreno una buena temporada, y las dos
-- mitades hay que poder verlas —con resumen sale la frase escrita a mano, sin
-- resumen sigue saliendo el recorte de la historia—.
-- ---------------------------------------------------------------------------

insert into public.cases
  (id, city_id, display_name, case_kind, household, summary, story, consent_to_publish, published, donation_url, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000300000005'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Familia Perea Córdoba', 'persona', '7 personas, 4 menores de edad', 'CASO DE PRUEBA. Una grieta atraviesa dos muros de carga y les recomendaron desalojar.', 'CASO DE PRUEBA. La vivienda tiene una grieta que atraviesa dos muros de carga. La marcaron con cinta y les recomendaron desalojar.

Están en la casa de la cultura con otras cuatro familias. Piden tejas y madera para reforzar, y un lugar donde guardar lo que alcanzaron a sacar.', true, true, '', '2026-08-07T14:30:00.000Z'::timestamptz, '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000006'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Yeison Córdoba y su hermana', 'persona', '2 personas, 16 y 11 años, a cargo de una tía', '', 'CASO DE PRUEBA. El cuarto donde dormían quedó inhabitable. La tía los recibió pero no alcanza el espacio ni la comida para todos.

Yeison está en décimo y perdió los cuadernos y el uniforme. La escuela retoma clases la próxima semana en la sede alterna.', true, true, '', '2026-08-08T14:30:00.000Z'::timestamptz, '2026-08-14T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, 'Familia Klinger Valencia', 'persona', '5 personas, 2 niños', '', 'CASO DE PRUEBA. La casa de palafito en El Valle perdió tres pilotes y el piso quedó ladeado. La lancha con la que Wilmar pescaba se partió contra el muelle.

Sin la lancha no hay ingreso. Piden madera para los pilotes y ayuda para reparar el motor, que se puede recuperar según el mecánico del pueblo.', true, true, '', '2026-08-09T14:30:00.000Z'::timestamptz, '2026-08-15T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000008'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Escuela del barrio Niño Jesús (prueba)', 'colegio', '128 estudiantes, 6 docentes', 'CASO DE PRUEBA. Dos salones sin techo: piden teja, madera y pupitres.', 'CASO DE PRUEBA. El techo de dos salones se vino abajo la noche del temblor y el muro del patio quedó agrietado. No hubo nadie dentro.

Las clases se reparten entre la casa de la cultura y la sede alterna, en turnos de media jornada. Piden teja y madera para rearmar la cubierta antes de las lluvias fuertes, y pupitres.', true, true, '', '2026-08-09T14:30:00.000Z'::timestamptz, '2026-08-12T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Fotos (16). No van a Storage: las rutas que empiezan por demo/
-- las sirve photoUrl() desde public/demo, y llevan el sello «muestra»
-- incrustado en el píxel.
-- ---------------------------------------------------------------------------

insert into public.photos
  (id, city_id, case_id, storage_path, thumb_path, caption, sort_order, created_at)
values
  ('00000000-0000-4000-8000-000500000004'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'demo/choco-edificio', 'demo/choco-edificio-mini', 'Escuela del barrio San Agustín.', 4, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000005'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'demo/choco-camino', 'demo/choco-camino-mini', 'La vía de entrada al casco urbano.', 5, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000006'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'demo/choco-rio', 'demo/choco-rio-mini', 'El San Juan aguas arriba del pueblo.', 6, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'demo/choco-costa', 'demo/choco-costa-mini', 'La playa de El Valle.', 7, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000008'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'demo/choco-palafitos', 'demo/choco-palafitos-mini', 'Palafitos sobre el estero.', 8, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000009'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'demo/choco-canoas', 'demo/choco-canoas-mini', 'Las lanchas de los pescadores.', 9, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000029'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-costa', 'demo/choco-costa-mini', 'La playa de El Valle, el día que se documentó el palafito.', 29, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000030'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-canoas', 'demo/choco-canoas-mini', 'Las lanchas del pueblo, cuando el mecánico revisó el motor.', 30, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000038'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'El barrio de la familia.', 38, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000039'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/choco-edificio', 'demo/choco-edificio-mini', 'La casa de la cultura, donde guardan sus cosas.', 39, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000040'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/persona-perea', 'demo/persona-perea-mini', 'Retrato de archivo, para la demostración.', 40, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000041'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'La calle de la casa.', 41, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000042'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'demo/persona-tia', 'demo/persona-tia-mini', 'Retrato de archivo, para la demostración.', 42, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000043'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-palafitos', 'demo/choco-palafitos-mini', 'Su palafito, sobre el estero.', 43, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000044'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-canoas', 'demo/choco-canoas-mini', 'La lancha con la que pescan.', 44, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000045'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/persona-wilmar', 'demo/persona-wilmar-mini', 'Retrato de archivo, para la demostración.', 45, '2026-08-09T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- El retrato de cada persona (3 de 3).
--
-- Va dentro de un DO con el disparador de updated_at apagado, y no por capricho:
-- cases_touch_updated_at pondría now() en cada fila, y /casos ordena por
-- updated_at, así que los casos de prueba saltarían por encima del caso
-- real. Con las fechas de lib/demo-data.ts (12–15 de agosto) el caso real, que
-- es del 17, sigue siendo el primero. El DO es una sola sentencia: si algo falla,
-- el disparador vuelve solo.
-- ---------------------------------------------------------------------------

do $do$
begin
  alter table public.cases disable trigger cases_touch_updated_at;

  update public.cases set portrait_photo_id = '00000000-0000-4000-8000-000500000040'::uuid, updated_at = '2026-08-13T14:30:00.000Z'::timestamptz where id = '00000000-0000-4000-8000-000300000005'::uuid;
  update public.cases set portrait_photo_id = '00000000-0000-4000-8000-000500000042'::uuid, updated_at = '2026-08-14T14:30:00.000Z'::timestamptz where id = '00000000-0000-4000-8000-000300000006'::uuid;
  update public.cases set portrait_photo_id = '00000000-0000-4000-8000-000500000045'::uuid, updated_at = '2026-08-15T14:30:00.000Z'::timestamptz where id = '00000000-0000-4000-8000-000300000007'::uuid;

  alter table public.cases enable trigger cases_touch_updated_at;
end
$do$;

-- ---------------------------------------------------------------------------
-- Canales de donación de muestra: los dos formatos que hay que poder revisar
--
-- Un caso con llave y otro con enlace. Con esto se ven en el portal publicado las
-- dos formas, y además queda a la vista lo que más importa comprobar: Yeison
-- Córdoba no tiene canal propio, así que su ficha enseña el canal general y lo
-- dice con esas palabras. Los dos estados de la ficha, uno al lado del otro.
--
-- Aquí había además dos canales de municipio. Se fueron con 0015: no hay canales
-- por ciudad, y las columnas ya no existen.
--
-- **Ninguno es un destino real de dinero.** `example.org` está reservado por la
-- IANA para ejemplos y las llaves llevan «prueba» dentro. Un enlace de muestra
-- que apunte a una campaña que existe manda dinero de verdad a alguien que no lo
-- pidió, y eso ya pasó una vez aquí con vaki.co.
--
-- El canal es de coordinación (disparador `guard_donation_channel`, 0011). Desde
-- el SQL Editor no hay correo en el token, así que el disparador se aparta y
-- estas líneas pasan; desde el panel haría falta una sesión de coordinación.
-- ---------------------------------------------------------------------------

-- Con el disparador de updated_at apagado, por lo mismo que el retrato de más
-- arriba: /casos ordena por esa columna y si no los casos de prueba saltarían por
-- encima del caso real.
do $do$
begin
  alter table public.cases disable trigger cases_touch_updated_at;

  update public.cases set
    donation_key = '@caso-de-prueba', donation_url = '',
    donation_app = 'Nequi', donation_holder = 'Caso de prueba (no es real)',
    donation_verified_on = current_date
  where id = '00000000-0000-4000-8000-000300000005'::uuid;

  update public.cases set
    donation_key = '', donation_url = 'https://example.org/caso-de-prueba',
    donation_app = '', donation_holder = '',
    donation_verified_on = current_date - 78
  where id = '00000000-0000-4000-8000-000300000007'::uuid;

  alter table public.cases enable trigger cases_touch_updated_at;
end
$do$;

-- ---------------------------------------------------------------------------
-- Las dos fechas de comprobación de arriba, y por qué son relativas a hoy
--
-- 0016 añadió «Comprobado el …» y lo que hay que poder revisar no es la frase,
-- son sus dos edades: recién comprobado se lee de una manera y comprobado hace
-- once semanas tiene que leerse de otra, porque a los 60 días la ficha lo dice
-- con palabras. Perea lleva la de hoy y Klinger la de hace 78 días, así que las
-- dos salen a la vez en el portal publicado, una al lado de la otra.
--
-- Van con `current_date` y no con fechas escritas a mano por un motivo que se ve
-- solo con el tiempo: una fecha fija de agosto es reciente esta semana y en
-- octubre ya es vieja, así que en octubre las dos filas dirían lo mismo y el
-- estado reciente dejaría de poder revisarse justo cuando nadie está mirando.
-- Con la resta, los dos estados siguen siendo los dos estados el día que se
-- pegue esto. Y ninguna es futura, que el disparador
-- `guard_channel_verification` rechaza.
--
-- Yeison sigue sin canal y por lo tanto sin fecha: es el tercer estado —el
-- normal, el de casi todos— y es el que enseña el canal general en su ficha.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Necesidades (9: 6 de zona y 3 de un caso)
-- ---------------------------------------------------------------------------

insert into public.needs
  (id, city_id, case_id, category, title, details, quantity, status, urgent, created_at)
values
  ('00000000-0000-4000-8000-000400000005'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'techo', 'Madera y puntales para apuntalar viviendas', 'Un maestro de obra del pueblo dirige el apuntalamiento si llega el material.', 'Para 30 casas', 'abierta', true, '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000006'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'agua', 'Agua potable para la olla común', '', 'Bidones de 20 litros', 'parcial', false, '2026-08-08T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000007'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, 'otro', 'Carpa o bodega temporal', 'Para guardar lo que las familias sacaron de las casas marcadas.', '', 'abierta', false, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000008'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'mano_de_obra', 'Carpintero con experiencia en palafitos', 'Dos semanas de trabajo. La comunidad pone alojamiento y comida.', '', 'abierta', false, '2026-08-10T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000009'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'transporte', 'Cupo de carga en avioneta o lancha', 'No entra carga por tierra. Coordinar con la fundación antes de despachar cualquier cosa.', '', 'abierta', true, '2026-08-11T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000010'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, 'otro', 'Reparación de motores fuera de borda', '', '6 motores', 'parcial', false, '2026-08-12T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000020'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'techo', 'Tejas y madera para reforzar los dos muros de carga', '', '40 tejas', 'abierta', false, '2026-08-10T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000021'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'otro', 'Útiles escolares y dos uniformes', 'Yeison está en décimo, la hermana en quinto. Clases desde la próxima semana.', '', 'parcial', false, '2026-08-11T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000022'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'otro', 'Madera para tres pilotes y reparación del motor de la lancha', '', '', 'abierta', true, '2026-08-12T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Diario de seguimiento (2 avances)
-- ---------------------------------------------------------------------------

insert into public.case_updates
  (id, case_id, city_id, happened_on, title, body, photo_id, created_at)
values
  ('00000000-0000-4000-8000-000700000011'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '2026-08-09'::date, 'Se documentó el palafito', 'Perdió tres pilotes. La lancha se partió contra el muelle.', '00000000-0000-4000-8000-000500000029'::uuid, '2026-08-09T18:00:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000700000012'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '2026-08-14'::date, 'El motor se puede recuperar', 'Lo revisó el mecánico del pueblo. Piden madera para los pilotes y el arreglo.', '00000000-0000-4000-8000-000500000030'::uuid, '2026-08-14T18:00:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ofertas (8). Las de lib/demo-data.ts que apuntaban a Quibdó:
--   * «Ferretería El Progreso» reapuntada — ofrecía tejas contra la necesidad de tejas de Quibdó; la equivalente en un municipio incluido es la de la Familia Perea Córdoba.
--   * «Rotary Club Medellín» reapuntada — entrega de agua contra una necesidad de agua parcial; la de Quibdó no existe aquí.
--   * «Logística Aburrá» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
--   * «Droguería La Salud» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
--   * «Ferretería El Trapiche» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
--
-- Y dos añadidas que lib/demo-data.ts no tenía, para completar los cuatro estados
-- de `offers_status_valid` (0012). Faltaban justo los dos que no se pueden
-- revisar de otra manera: una negada y una retirada. La bandeja del panel es lo
-- que decide qué se publica, así que hay que poder ver que una negada NO sale en
-- /ayudas y que no se cuenta como recurso conseguido; y `retirada` no es lo mismo
-- que `rechazada` —una la escribe quien ofrecía y la otra el equipo— así que
-- tienen que poder distinguirse en pantalla sin abrir la fila.
-- ---------------------------------------------------------------------------

insert into public.offers
  (id, city_id, case_id, need_id, offerer_name, offerer_contact, resource, category, message, status, delivered_on, publish_name, team_notes, created_at)
values
  ('00000000-0000-4000-8000-000600000000'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, '00000000-0000-4000-8000-000400000020'::uuid, 'Ferretería El Progreso (prueba)', '3009998877', '600 tejas de zinc de 2,44 m', 'techo', 'Somos una ferretería en Itagüí. Podemos donar el lote completo si alguien pone el transporte. Tenemos factura para el descargo.', 'pendiente', null, false, '', '2026-08-10T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000002'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, null, 'Parroquia San Judas (prueba)', '3124445566', '200 mercados armados', 'alimentos', 'La colecta de la parroquia. Los mercados ya están armados y empacados.', 'pendiente', null, false, '', '2026-08-12T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000003'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, null, 'Marta Villegas (prueba)', '3167778899', 'Contacto de un carpintero de Buenaventura', 'mano_de_obra', 'No soy yo quien ayuda: es mi cuñado, lleva años haciendo palafitos y está dispuesto a ir. Les paso su número si les interesa.', 'pendiente', null, false, '', '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000004'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, '00000000-0000-4000-8000-000400000006'::uuid, 'Rotary Club Medellín (prueba)', '3131112233', '12 tanques de 500 litros y pastillas potabilizadoras', 'agua', 'Aprobado por la junta. Podemos despachar en cuanto haya transporte confirmado.', 'aceptada', '2026-08-13'::date, true, 'Hasta aquí llegaron 12 tanques; los otros 13 quedan para el siguiente viaje.', '2026-08-14T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000007'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, null, 'Colegio San José (prueba)', 'rectoria@sanjose.edu.co', '300 cuadernos, lápices y dos uniformes', 'otro', 'Colecta de los cursos de bachillerato. Ya están empacados por tallas y por curso.', 'aceptada', '2026-08-14'::date, true, 'Llegaron con el camión del jueves. Los recibió Alberto en la casa de la cultura.', '2026-08-12T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000008'::uuid, null, null, null, 'Marina Restrepo (prueba)', '3182223344', 'Flete de 8 toneladas desde Medellín', 'transporte', 'Tengo un camión que sube vacío. No quiero que aparezca mi nombre en ninguna parte.', 'aceptada', '2026-08-13'::date, false, 'Subió el jueves con los tanques y los mercados. Confirmado al descargar.', '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000009'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, null, null, 'Distribuidora Andina (prueba)', 'ventas@andina-prueba.co', '400 cajas de leche en polvo', 'alimentos', 'Tenemos existencias de una promoción que no se vendió. Podemos donarlas contra una factura de descargo.', 'rechazada', null, false, 'La fecha de vencimiento es de hace dos meses. Se les explicó por teléfono y lo entendieron bien.', '2026-08-11T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000600000010'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, null, '00000000-0000-4000-8000-000400000009'::uuid, 'Aerocarga del Pacífico (prueba)', '3157776655', 'Dos cupos de avioneta a Bahía Solano', 'transporte', 'Podemos reservar dos cupos de carga en el vuelo del sábado.', 'retirada', null, false, 'Llamaron ellos: se les cayó el vuelo del sábado y no hay otro esta semana.', '2026-08-12T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

commit;
