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
--     de verdad. Y una fundación de muestra en Quibdó colgaría un botón «Donar
--     dinero» inventado de la ficha del caso real.
--   * Los marcadores: ' (prueba)' en el nombre del municipio, de la fundación y
--     de quien ofrece, y 'CASO DE PRUEBA' al principio de cada historia.
--   * donation_url vacío en fundaciones y casos. Los enlaces de muestra apuntan
--     a vaki.co y a un dominio que no existe, y ese es el botón que mueve dinero.
--     Si coordinación quiere ver el botón «Donar dinero» en el portal publicado,
--     basta con poner un enlace propio en /admin/ciudades/<slug>; no hace falta
--     tocar este archivo.
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

update public.cities set
  name = 'Bojayá (prueba)',
  summary = 'En Bellavista se agrietaron el centro de salud y catorce viviendas del sector alto. No hubo heridos graves.

El comité local ya tiene censo de familias afectadas y está pidiendo materiales antes de que empiece la temporada de lluvias fuertes.',
  published = true
where id = '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid and name not like '%(prueba)%';

-- ---------------------------------------------------------------------------
-- Fundaciones (3), sin enlace de donación
-- ---------------------------------------------------------------------------

insert into public.foundations
  (id, city_id, name, description, contact_name, phone, whatsapp, email, website, donation_url, address, created_at)
values
  ('00000000-0000-4000-8000-000200000001'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Corporación Istmina Unida (prueba)', 'Junta de acción comunal ampliada. Tienen el censo de viviendas afectadas.', 'Alberto Perea', '604 670 8811', '3103334455', 'istminaunida@correo.com', '', '', 'Calle 8 # 3-40, frente a la casa de la cultura', '2026-08-06T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000200000002'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, 'Fundación Mar y Selva (prueba)', 'Trabajan con las asociaciones de pescadores de El Valle y Huina. Reciben donaciones en Medellín y las embarcan en Buenaventura.', 'Erika Klinger', '', '3148889900', 'marysleva.choco@correo.com', '', '', 'Calle principal, al lado de la Capitanía', '2026-08-06T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000200000003'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, 'Comité de Víctimas de Bojayá (prueba)', 'Organización histórica del municipio. Llevan el censo y la priorización de casos.', 'Leonel Cuesta', '', '3159992211', 'comitebojaya@correo.com', '', '', 'Bellavista, casa comunal', '2026-08-06T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Casos (5). El retrato se pone más abajo: el disparador
-- cases_portrait_belongs_to_case exige que la foto ya sea de este caso.
-- ---------------------------------------------------------------------------

insert into public.cases
  (id, city_id, display_name, household, story, consent_to_publish, published, donation_url, created_at, updated_at)
values
  ('00000000-0000-4000-8000-000300000005'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Familia Perea Córdoba', '7 personas, 4 menores de edad', 'CASO DE PRUEBA. La vivienda tiene una grieta que atraviesa dos muros de carga. La marcaron con cinta y les recomendaron desalojar.

Están en la casa de la cultura con otras cuatro familias. Piden tejas y madera para reforzar, y un lugar donde guardar lo que alcanzaron a sacar.', true, true, '', '2026-08-07T14:30:00.000Z'::timestamptz, '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000006'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, 'Yeison Córdoba y su hermana', '2 personas, 16 y 11 años, a cargo de una tía', 'CASO DE PRUEBA. El cuarto donde dormían quedó inhabitable. La tía los recibió pero no alcanza el espacio ni la comida para todos.

Yeison está en décimo y perdió los cuadernos y el uniforme. La escuela retoma clases la próxima semana en la sede alterna.', true, true, '', '2026-08-08T14:30:00.000Z'::timestamptz, '2026-08-14T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, 'Familia Klinger Valencia', '5 personas, 2 niños', 'CASO DE PRUEBA. La casa de palafito en El Valle perdió tres pilotes y el piso quedó ladeado. La lancha con la que Wilmar pescaba se partió contra el muelle.

Sin la lancha no hay ingreso. Piden madera para los pilotes y ayuda para reparar el motor, que se puede recuperar según el mecánico del pueblo.', true, true, '', '2026-08-09T14:30:00.000Z'::timestamptz, '2026-08-15T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000008'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, 'Familia Cuesta Bautista', '6 personas, 3 niños y una señora con movilidad reducida', 'CASO DE PRUEBA. La casa está en el sector alto de Bellavista y se agrietó el muro que da a la ladera. Con lluvia fuerte les preocupa que ceda.

Doña Emérita se mueve en silla y la rampa de la entrada quedó partida. El comité los tiene priorizados en el censo.', true, true, '', '2026-08-10T14:30:00.000Z'::timestamptz, '2026-08-12T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000300000009'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, 'Don Aristides Mena', 'Vive con su hija y dos nietos', 'CASO DE PRUEBA. La cocina y el baño quedaron separados de la casa por una grieta que atraviesa el piso. Siguen durmiendo dentro porque el resto de la vivienda aguantó.

Lo que pide es que alguien mire la grieta antes de que empiecen las lluvias fuertes.', true, true, '', '2026-08-11T14:30:00.000Z'::timestamptz, '2026-08-13T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Fotos (23). No van a Storage: las rutas que empiezan por demo/
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
  ('00000000-0000-4000-8000-000500000010'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, null, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'Bellavista vista desde el río.', 10, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000011'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, null, 'demo/choco-selva', 'demo/choco-selva-mini', 'La selva que rodea el casco urbano.', 11, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000029'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-costa', 'demo/choco-costa-mini', 'La playa de El Valle, el día que se documentó el palafito.', 29, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000030'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-canoas', 'demo/choco-canoas-mini', 'Las lanchas del pueblo, cuando el mecánico revisó el motor.', 30, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000031'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000009'::uuid, 'demo/choco-camino', 'demo/choco-camino-mini', 'La subida a la casa, el día que se midió la grieta.', 31, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000038'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'El barrio de la familia.', 38, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000039'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/choco-edificio', 'demo/choco-edificio-mini', 'La casa de la cultura, donde guardan sus cosas.', 39, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000040'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'demo/persona-perea', 'demo/persona-perea-mini', 'Retrato de archivo, para la demostración.', 40, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000041'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'La calle de la casa.', 41, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000042'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'demo/persona-tia', 'demo/persona-tia-mini', 'Retrato de archivo, para la demostración.', 42, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000043'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-palafitos', 'demo/choco-palafitos-mini', 'Su palafito, sobre el estero.', 43, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000044'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/choco-canoas', 'demo/choco-canoas-mini', 'La lancha con la que pescan.', 44, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000045'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'demo/persona-wilmar', 'demo/persona-wilmar-mini', 'Retrato de archivo, para la demostración.', 45, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000046'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000008'::uuid, 'demo/choco-pueblo', 'demo/choco-pueblo-mini', 'Bellavista, donde viven.', 46, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000047'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000008'::uuid, 'demo/choco-camino', 'demo/choco-camino-mini', 'La subida hasta la casa.', 47, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000048'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000008'::uuid, 'demo/persona-cuesta', 'demo/persona-cuesta-mini', 'Retrato de archivo, para la demostración.', 48, '2026-08-09T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000500000049'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000009'::uuid, 'demo/persona-aristides', 'demo/persona-aristides-mini', 'Retrato de archivo, para la demostración.', 49, '2026-08-09T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- El retrato de cada persona (5 de 5).
--
-- Va dentro de un DO con el disparador de updated_at apagado, y no por capricho:
-- cases_touch_updated_at pondría now() en cada fila, y /casos ordena por
-- updated_at, así que los cinco casos de prueba saltarían por encima del caso
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
  update public.cases set portrait_photo_id = '00000000-0000-4000-8000-000500000048'::uuid, updated_at = '2026-08-12T14:30:00.000Z'::timestamptz where id = '00000000-0000-4000-8000-000300000008'::uuid;
  update public.cases set portrait_photo_id = '00000000-0000-4000-8000-000500000049'::uuid, updated_at = '2026-08-13T14:30:00.000Z'::timestamptz where id = '00000000-0000-4000-8000-000300000009'::uuid;

  alter table public.cases enable trigger cases_touch_updated_at;
end
$do$;

-- ---------------------------------------------------------------------------
-- Necesidades (13: 8 de zona y 5 de un caso)
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
  ('00000000-0000-4000-8000-000400000011'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, null, 'techo', 'Cemento y varilla para muros de contención', '', '80 bultos y 40 varillas', 'abierta', true, '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000012'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, null, 'ropa', 'Ropa de niño empacada por tallas', 'Solo si viene clasificada y empacada. No hay quien la organice aquí.', '', 'cubierta', false, '2026-08-08T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000020'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000005'::uuid, 'techo', 'Tejas y madera para reforzar los dos muros de carga', '', '40 tejas', 'abierta', false, '2026-08-10T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000021'::uuid, '1a92f9db-ff70-4dfc-9c96-751ab16e640f'::uuid, '00000000-0000-4000-8000-000300000006'::uuid, 'otro', 'Útiles escolares y dos uniformes', 'Yeison está en décimo, la hermana en quinto. Clases desde la próxima semana.', '', 'parcial', false, '2026-08-11T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000022'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'otro', 'Madera para tres pilotes y reparación del motor de la lancha', '', '', 'abierta', true, '2026-08-12T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000023'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000008'::uuid, 'techo', 'Rampa de acceso y refuerzo del muro de la ladera', 'Doña Emérita se desplaza en silla de ruedas.', '', 'abierta', true, '2026-08-13T14:30:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000400000024'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '00000000-0000-4000-8000-000300000009'::uuid, 'techo', 'Revisión técnica de la grieta que atraviesa el piso', 'Antes de que empiecen las lluvias fuertes. Un maestro de obra del pueblo sirve.', '', 'abierta', false, '2026-08-08T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Diario de seguimiento (3 avances)
-- ---------------------------------------------------------------------------

insert into public.case_updates
  (id, case_id, city_id, happened_on, title, body, photo_id, created_at)
values
  ('00000000-0000-4000-8000-000700000011'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '2026-08-09'::date, 'Se documentó el palafito', 'Perdió tres pilotes. La lancha se partió contra el muelle.', '00000000-0000-4000-8000-000500000029'::uuid, '2026-08-09T18:00:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000700000012'::uuid, '00000000-0000-4000-8000-000300000007'::uuid, 'eb179d19-6172-4ee0-a32e-c7aa92208b3f'::uuid, '2026-08-14'::date, 'El motor se puede recuperar', 'Lo revisó el mecánico del pueblo. Piden madera para los pilotes y el arreglo.', '00000000-0000-4000-8000-000500000030'::uuid, '2026-08-14T18:00:00.000Z'::timestamptz),
  ('00000000-0000-4000-8000-000700000013'::uuid, '00000000-0000-4000-8000-000300000009'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, '2026-08-11'::date, 'Se midió la grieta', 'Atraviesa cocina y baño. Se espera un maestro de obra antes de las lluvias fuertes.', '00000000-0000-4000-8000-000500000031'::uuid, '2026-08-11T18:00:00.000Z'::timestamptz)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Ofertas (7). Las de lib/demo-data.ts que apuntaban a Quibdó:
--   * «Ferretería El Progreso» reapuntada — ofrecía tejas contra la necesidad de tejas de Quibdó; la equivalente en un municipio incluido es la de la Familia Perea Córdoba.
--   * «Rotary Club Medellín» reapuntada — entrega de agua contra una necesidad de agua parcial; la de Quibdó no existe aquí.
--   * «Donante anónimo» reapuntada — la nota del equipo remite a ropa de niño empacada por tallas, que es la necesidad de Bojayá.
--   * «Logística Aburrá» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
--   * «Droguería La Salud» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
--   * «Ferretería El Trapiche» fuera: su propio texto nombra Quibdó o una familia de Quibdó.
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
  ('00000000-0000-4000-8000-000600000009'::uuid, '019e3dcb-3fb2-426a-ab4a-9e3a13e24a22'::uuid, null, null, 'Donante anónimo (prueba)', '3159998877', 'Ropa usada sin clasificar, varios bultos', 'ropa', 'Tengo como diez bultos de ropa de la familia y de vecinos.', 'rechazada', null, false, 'No hay bodega ni gente para clasificar. Se le explicó y quedó en mandar solo ropa de niño empacada por tallas.', '2026-08-14T14:30:00.000Z'::timestamptz)
on conflict (id) do nothing;

commit;
