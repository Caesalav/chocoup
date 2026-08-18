-- Semilla de municipios del Chocó con sus coordenadas.
--
-- Se cargan sin publicar: aparecen en el panel del equipo listos para
-- documentar, y solo salen al portal público cuando alguien los publica.
-- Así nadie tiene que buscar coordenadas en el mapa con mala señal.
--
-- Ejecuta este archivo después de las migraciones de supabase/migrations, en
-- orden: la fila del equipo lleva rol, y la columna la crea 0002.

insert into public.cities (name, slug, lat, lng, summary, published) values
  ('Quibdó',                'quibdo',                5.6947, -76.6611, '', false),
  ('Istmina',               'istmina',               5.1594, -76.6853, '', false),
  ('Condoto',               'condoto',               5.0906, -76.6469, '', false),
  ('Tadó',                  'tado',                  5.2656, -76.5619, '', false),
  ('Bahía Solano',          'bahia-solano',          6.2225, -77.4028, '', false),
  ('Nuquí',                 'nuqui',                 5.7089, -77.2708, '', false),
  ('Bojayá',                'bojaya',                6.5581, -76.8869, '', false),
  ('Riosucio',              'riosucio',              7.4386, -77.1181, '', false),
  ('Acandí',                'acandi',                8.5122, -77.2789, '', false),
  ('El Carmen de Atrato',   'el-carmen-de-atrato',   5.8967, -76.1442, '', false)
on conflict (slug) do nothing;

-- Allowlist del equipo. Sin una fila aquí, un usuario puede entrar pero no
-- escribir nada. Cambia el correo por el real antes del viaje.
--
-- Esta primera fila va en coordinación porque es la que reparte todo lo demás:
-- desde /admin/equipo se invita al resto y se le asignan municipios. Sin al menos
-- una persona de coordinación, nadie puede dar permisos a nadie.
insert into private.team_members (email, nombre, role) values
  ('chocoup26@gmail.com', 'Charlie', 'coordinacion')
on conflict (email) do update set role = excluded.role;
