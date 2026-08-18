-- Chocó-up: encuadre por foto.
--
-- Las fotos llegan del móvil, verticales y con el motivo donde cayó. El portal
-- las mete en cajas distintas —el círculo del retrato, el 3:2 del carrusel, el
-- cuadrado del diario— y un solo recorte fijo (el 62 % de las situaciones, el
-- 22 % de las caras) no puede acertarlas todas. Sin un encuadre por foto, la
-- cara se sale o el plano queda cortado, y no hay forma de corregirlo sin
-- volver a subir el archivo.
--
-- Se guardan tres números nulos o los tres juntos: dónde mira el recorte
-- (`focus_x`, `focus_y`, de 0 a 100) y cuánto se acerca (`zoom`, de 1 a 3).
-- Nulos significa «usa el recorte por omisión de esa caja», para que las fotos
-- que nadie ha tocado no se muevan. El archivo en Storage no se recorta: el
-- original sigue entero, que es la documentación. Lo que cambia es qué ventana
-- se enseña.
--
-- Se puede ejecutar más de una vez sin errores.

alter table public.photos
  add column if not exists focus_x real,
  add column if not exists focus_y real,
  add column if not exists zoom real;

alter table public.photos drop constraint if exists photos_focus_x_range;
alter table public.photos add constraint photos_focus_x_range
  check (focus_x is null or (focus_x >= 0 and focus_x <= 100));

alter table public.photos drop constraint if exists photos_focus_y_range;
alter table public.photos add constraint photos_focus_y_range
  check (focus_y is null or (focus_y >= 0 and focus_y <= 100));

alter table public.photos drop constraint if exists photos_zoom_range;
alter table public.photos add constraint photos_zoom_range
  check (zoom is null or (zoom >= 1 and zoom <= 3));

alter table public.photos drop constraint if exists photos_encuadre_completo;
alter table public.photos add constraint photos_encuadre_completo
  check (
    (focus_x is null and focus_y is null and zoom is null)
    or
    (focus_x is not null and focus_y is not null and zoom is not null)
  );
