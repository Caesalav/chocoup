-- Semilla del municipio donde ya hay casos.
--
-- El mapa del portal dibuja los treinta del DANE igual. Esta tabla solo guarda
-- los pueblos que el equipo documenta: aparecen en el panel y, cuando hay al
-- menos un caso publicado, en el portal. El resto se añade desde
-- /admin/ciudades/nueva cuando llegue el viaje a ese pueblo.
--
-- Ejecuta este archivo después de las migraciones de supabase/migrations, en
-- orden: la fila del equipo lleva rol, y la columna la crea 0002.

insert into public.cities (name, slug, lat, lng, summary, published) values
  ('Quibdó',                'quibdo',                5.6947, -76.6611, '', false)
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
