# Chocó-up

Portal para documentar la situación en municipios del Chocó tras el terremoto, y para
que cualquier persona pueda ofrecer un recurso concreto.

- **Público:** mapa del Chocó, ficha de cada municipio con fotos, su fundación madre —una
  por municipio—, necesidades de la zona y casos de personas. Botón para ofrecer recursos
  sin crear cuenta, y dos formas de enviar dinero: la **llave de transferencia** del portal,
  escrita para copiarla, y el canal oficial de la fundación de ese municipio. En
  `/donaciones`, la llave arriba y las dos formas de dar dinero en dos pestañas: la fundación
  de cada municipio y las familias documentadas. En `/ayudas`, el registro público de lo que
  ya llegó: de qué tipo era, en qué mes y a qué municipio, anónimo salvo autorización expresa.
- **Equipo:** panel en `/admin` para crear municipios, subir fotos, registrar necesidades,
  publicar casos, gestionar la bandeja de ofertas, cambiar la llave de transferencia y
  repartir permisos por municipio.

Stack: Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage).
El mapa es un esquema del Chocó en SVG, sin librería de mapas ni servicio de tiles.

---

## Datos de muestra

Mientras no haya claves de Supabase en `.env.local`, el portal arranca lleno de contenido
inventado: cuatro municipios publicados, dos en borrador, siete casos, veinte necesidades
abiertas y una bandeja de ofertas con casos pendientes, aceptados y rechazados. Sirve para
valorar el diseño y recorrer el flujo completo, incluido el panel.

```bash
npm install && npm run dev
```

Una franja lo advierte arriba de todas las pantallas. Las escrituras no persisten: al
guardar cualquier cosa el panel avisa de que falta conectar la base de datos.

Todo esto vive en `lib/demo-data.ts` y desaparece por completo en cuanto existan las
claves. No hay que desactivar nada.

### Las fotos de muestra

Son ocho paisajes del Chocó en `public/demo` —el río, un pueblo de ribera, palafitos, la
costa, canoas, un camino, la selva y una construcción de bloque— y ocho retratos de
archivo para las tarjetas de personas.

**Ningún paisaje muestra daños. Los retratos son caras inventadas, no las familias de los
textos.** Todas llevan el sello "muestra" incrustado en el propio píxel. El portal
documenta un terremoto real y se comparte por WhatsApp: una imagen inventada de escombros
en Quibdó sería indistinguible de una prueba. Los pies de foto describen lo que de verdad
se ve.

Si hay que rehacerlas o cambiar el sello, los PNG de origen van en una carpeta aparte y el
script normaliza tamaños y estampa la marca:

```bash
python3 scripts/build-demo-photos.py <carpeta-con-los-png>
```

De cada una salen dos versiones, igual que con las fotos reales: 1600 px para la vista
ampliada y 400 px para cuadrículas y tarjetas.

El sello está colocado abajo, centrado y a un 9 % del borde, dentro de la zona que
sobrevive a todos los recortes del portal: el 3:2 de las cuadrículas, el cuadrado de las
filas y —el más agresivo— el círculo del retrato de una persona, donde el círculo toca el
borde inferior justo por donde pasa el sello. **Lo que el círculo no salva es el tamaño**:
el retrato se dibuja a 80 px, así que el sello queda ahí como una pastilla oscura de unos
20 px y la palabra deja de leerse. No desaparece y no engaña —el aviso de la franja
superior y las fotos del carrusel de la misma tarjeta lo dicen a las claras—, pero si algún
día el retrato tiene que aguantar solo, lo que hay que hacer es estampar una segunda marca
pensada para él (una inicial, o un aro en el canto) y no agrandar el retrato: al tamaño que
haría legible esa palabra la tarjeta deja de ser una tarjeta.

---

## Puesta en marcha

### 1. Crear el proyecto de Supabase

En [supabase.com/dashboard](https://supabase.com/dashboard) crea un proyecto nuevo.
Elige la región más cercana a Colombia (`us-east-1` o `sa-east-1`).

### 2. Crear las tablas

En el panel de Supabase, **SQL Editor**, pega y ejecuta **en este orden**:

1. `supabase/migrations/0001_init.sql` — tablas, RLS, y el bucket `fotos`.
2. `supabase/migrations/0002_roles_y_ayudas.sql` — roles del equipo, municipios asignados
   y el registro público de ayudas.
3. `supabase/migrations/0003_retrato_del_caso.sql` — qué foto de cada persona es su
   retrato, y la garantía de que no puede ser la foto de otra.
4. `supabase/migrations/0004_una_fundacion_por_municipio.sql` — una sola fundación por
   municipio, garantizada por la base de datos, y fuera la marca de «es la madre».
5. `supabase/migrations/0005_registro_sin_texto_libre.sql` — el registro público de ayudas
   publica la categoría y no la descripción que escribió quien ofreció la ayuda.
6. `supabase/migrations/0006_seguimiento_del_caso.sql` — el diario fechado de cada caso y
   su destino de donación propio.
7. `supabase/migrations/0007_foto_del_avance.sql` — cada avance del diario lleva una foto
   del propio caso, y la garantía de que no puede ser la de otra familia.
8. `supabase/migrations/0008_permiso_de_tabla_del_publico.sql` — retira de `anon` y de
   `authenticated` los privilegios de tabla que Supabase concede por defecto y que nadie
   usa.
9. `supabase/migrations/0009_encuadre_de_fotos.sql` — el encuadre y el zoom de cada foto,
   para poder recolocar una imagen ya subida sin volver a subirla.
10. `supabase/migrations/0010_llave_de_transferencia.sql` — la llave de transferencia del
    portal, una para todo, con su valor inicial dentro y solo editable por coordinación.
11. `supabase/seed.sql` — los 10 municipios del Chocó con sus coordenadas, sin publicar.

**Son diez migraciones**, y `0009` no es opcional: `lib/data.ts` pide `focus_x`, `focus_y`
y `zoom` por su nombre en la ficha del municipio y en las listas de casos, así que una base
con `0001`–`0008` deja esas pantallas sin casos y sin ningún error a la vista. `0010` tampoco
lo es si se espera poder donar: sin ella no hay llave, y un caso sin canal propio y sin
fundación en su municipio se puede leer y no se le puede enviar nada.

Las diez se pueden volver a ejecutar sin romper nada. El orden importa tres veces:

- `0002` estrecha las políticas que crea `0001`, así que si algún día vuelves a pegar
  `0001`, **pega `0002` detrás** o el equipo se queda otra vez con permiso para todo.
- `0005` reemplaza la vista `aid_log` que crea `0002`, así que si vuelves a pegar `0002`,
  **pega `0005` detrás** o el registro público vuelve a publicar el texto libre de las
  ofertas.
- `0008` recorta los permisos de esa misma vista, que se crea entera cada vez, así que si
  vuelves a pegar `0005`, **pega `0008` detrás**. Las tablas no tienen ese problema: se
  crean con `if not exists` y volver a pegarlas no las recrea.

`0004` es la única que puede negarse a aplicarse, y lo hace a propósito: si algún
municipio tiene ya dos fundaciones cargadas a mano, para y dice cuál es. Cada fundación
lleva su propio enlace de donación, así que la migración no elige por ti. Abre las dos,
decide con coordinación cuál es la del municipio, quita la otra desde el panel y vuelve a
pegarla.

Antes de tocar una migración, y después, conviene correr:

```bash
npm run verify:sql
```

Ejecuta el esquema contra un Postgres real en memoria (sin Docker) y comprueba las 183
reglas de acceso: que un caso sin consentimiento no se pueda publicar, que quien documenta
no pueda escribir en un municipio que no tiene asignado, que los contactos de las ofertas
no sean legibles por el público —ni por política ni por permiso de tabla, y cada barrera se
prueba sin la otra—, que el formulario de `/ofrecer` siga entregando con el permiso
recortado al mínimo, que nadie que atienda a la web pueda vaciar una tabla, que nadie
aparezca nombrado en el registro de ayudas sin haberlo autorizado, que de una entrega no
salgan por la vía pública ni el día exacto, ni el caso al que fue, ni la descripción que
escribió quien la ofreció —y que el equipo sí lo conserve todo—, que lo que se publique de
qué llegó pertenezca siempre al vocabulario cerrado de nueve categorías, que un municipio no
pueda tener dos fundaciones con dos enlaces de donación y que la migración que impone esa
regla se niegue a aplicarse en vez de borrar una de las dos, que el retrato de una persona
no pueda ser la foto de otra, que el encuadre de una foto solo lo pueda mover quien
documenta ese municipio, que la llave de transferencia sea una sola y solo la pueda cambiar
coordinación —ni quien documenta ni el público, y nadie en absoluto crear una segunda ni
borrar la única—, que el rastro de quién la cambió lo escriba la base de datos y no quien
llama, que volver a pegar su migración no devuelva la llave vieja, y que despublicar un
municipio esconda todo su contenido.

Comprueba además una cosa que no es del esquema: que su propia lista de migraciones no se
haya quedado corta. Un archivo nuevo en `supabase/migrations` que nadie haya añadido a
`MIGRATIONS` detiene las pruebas ahí mismo y lo dice con su nombre. Es el descuido que dejó
`0009` fuera del arnés mientras el informe seguía en verde, y así no puede repetirse.

> Si las sentencias `create policy ... on storage.objects` fallan por permisos, crea esas
> cuatro políticas desde **Storage → fotos → Policies** con las mismas condiciones: lectura
> para todos, y escritura/borrado solo si
> `private.can_write_city(private.city_of_path(name))`.

### 3. Autorizar al equipo

La escritura no depende de "estar registrado", sino de estar en una lista con un rol.

**El primer usuario de coordinación hay que crearlo a mano**: es quien luego reparte todo lo
demás desde el panel. En el **SQL Editor**:

```sql
insert into private.team_members (email, nombre, role) values
  ('charlie@ejemplo.com', 'Charlie', 'coordinacion')
on conflict (email) do update set role = 'coordinacion';

delete from private.team_members where email = 'cambiame@ejemplo.com';
```

A partir de ahí, todo lo demás se hace desde **`/admin/equipo`**: invitar por correo, dar
rol y asignar municipios. No hace falta volver al SQL Editor.

Los dos roles:

| | Coordinación | Documentación |
| --- | --- | --- |
| Fotos, casos y necesidades | Todos los municipios | Solo los asignados |
| Publicar un municipio | Sí | No |
| Crear o borrar municipios | Sí | No |
| Fundación y enlace de donación | Sí | No |
| La llave de transferencia del portal | Sí | No |
| Ofertas y su contacto | Todas | Solo las de sus municipios |
| Invitar y asignar | Sí | No |

Quien entre con un correo que no esté en la lista podrá iniciar sesión pero no verá el panel
ni podrá escribir nada. Por eso no hace falta desactivar los registros públicos.

> Si aplicas `0002` sobre una base de datos que ya tenía equipo, **todas las personas que ya
> estaban suben a coordinación**: ya podían hacer todo eso, y recortárselo a mitad de viaje
> sería una avería y no una mejora. Repártelo desde `/admin/equipo` cuando puedas. Las
> invitaciones nuevas entran en documentación.

### 4. Conectar la app

```bash
cp .env.example .env.local
```

Pega en `.env.local` la URL del proyecto y la **publishable key** (Supabase Dashboard →
Project Settings → API). No uses nunca la `service_role` en este proyecto: todo el acceso
pasa por RLS.

### 5. Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para entrar al panel: `/entrar`, correo del equipo y **contraseña**.

### 6. Las cuentas se crean en Supabase

El portal entra con contraseña (`signInWithPassword`) y **no tiene registro, ni recuperación, ni
pantalla para cambiarla**. Eso quiere decir que cada persona del equipo necesita dos cosas, y son
independientes:

1. **Una cuenta con contraseña**, en Supabase → *Authentication → Users → Add user*, con
   *Auto Confirm User* marcado. Sin esto no puede entrar.
2. **Estar en la lista del equipo**, desde `/admin/equipo`, con su rol y sus municipios. Sin esto
   entra pero no ve el panel.

`/admin/equipo` hace lo segundo y no lo primero: reparte permisos sobre un correo. Si invitas a
alguien que no tiene cuenta en Supabase, se queda con permisos y sin puerta.

### 7. URLs de retorno

En Supabase → **Authentication → URL Configuration**, añade a *Redirect URLs*:

```
http://localhost:3000/auth/callback
https://TU-DOMINIO.vercel.app/auth/callback
```

No hace falta para entrar con contraseña. Lo necesita `/auth/callback`, que es lo que recoge un
enlace de invitación o de recuperación mandado desde el panel de Supabase; sin estas URLs ese
enlace no vuelve a la app. Ojo: ese enlace deja una sesión abierta pero no una contraseña, y el
portal no tiene dónde ponerla, así que sirve para un apuro y no para dar de alta a alguien.

---

## Publicar en Vercel

```bash
npx vercel
```

En el proyecto de Vercel añade las dos variables de entorno de `.env.local`
(`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) y vuelve a
desplegar. Después añade la URL definitiva a *Redirect URLs* en Supabase.

---

## Cómo se usa en el viaje

1. **Llegar a un municipio.** En `/admin` está ya creado (del seed) o se crea con
   *Nuevo municipio*, tocando el mapa o con *Usar mi ubicación*.
2. **Documentar.** Escribir qué pasó, subir fotos (se comprimen en el teléfono antes de
   subir), registrar las necesidades de la zona y los datos de la fundación madre.
3. **Casos.** Un caso por familia. Marcar la casilla de consentimiento **solo si la
   persona lo autorizó**: sin ella el caso se guarda pero no se puede publicar.
4. **El retrato.** Dentro del caso, después de subir sus fotos, marcar cuál de ellas es su
   retrato. Es la que sale recortada en redondo en la tarjeta del municipio, así que elige
   una en la que se le vea a ella y no la de la casa. Se puede dejar sin retrato: la
   tarjeta pone sus iniciales y se lee igual de bien.
5. **Publicar** el municipio cuando esté listo. Hasta entonces nada de ese municipio es
   visible para el público.
6. **Ofertas.** Cuando alguien ofrece un recurso desde el portal, aparece en
   `/admin/ofertas` con su contacto. Se acepta, se vincula a la necesidad que cubre y se
   pone en contacto con la fundación o la familia.
7. **Cuando la ayuda llegue**, anotar el día en esa misma oferta. La fecha es lo que la
   publica en `/ayudas`, y allí sale con el mes y el municipio: nunca el día ni el caso al
   que fue, sin contacto y sin nombre salvo que la persona lo autorizara.

### Antes de salir

El repaso completo, con el estado real de la base de datos y las trampas de orden
de las migraciones, está en [ANTES-DEL-VIAJE.md](ANTES-DEL-VIAJE.md). Lo de aquí
es el resumen.

- [ ] Las migraciones aplicadas, en orden, y `npm run verify:sql` en verde —que
      dice que los archivos son coherentes entre sí y nada de la base real—.
- [ ] Al menos una persona de coordinación en `private.team_members`, creada a mano.
- [ ] El resto del equipo invitado desde `/admin/equipo`, con sus municipios asignados, y
      cada persona ya entró una vez desde su propio teléfono.
- [ ] Comprobado que quien documenta ve "Solo lectura" en un municipio que no es suyo.
- [ ] Al menos un municipio publicado con fotos y fundación real, para que el portal no
      esté vacío cuando se comparta el enlace.
- [ ] La llave de transferencia comprobada en `/admin/donaciones`, con la app y el nombre del
      titular puestos, y una transferencia de prueba hecha de verdad desde otro teléfono.
- [ ] Una oferta de prueba enviada desde `/ofrecer` y revisada en `/admin/ofertas`.
- [ ] Esa oferta marcada como entregada, y comprobado que sale en `/ayudas` sin nombre.
- [ ] Probado desde el móvil con datos, no solo con WiFi.
- [ ] El enlace del portal compartido con quien coordine donaciones desde la ciudad.

---

## Decisiones que conviene conocer

**Las fotos se comprimen en el navegador** (`lib/photos.ts`) antes de subirlas. Una foto de
móvil pasa de ~4 MB a ~300 KB. Con la señal del Chocó esa es la diferencia entre que suba y
que no.

De cada foto se guardan **dos versiones**: la grande de 1600 px para la vista ampliada y una
miniatura de 400 px para cuadrículas y tarjetas, que es donde se ven a 80–380 px. Sin la
miniatura, la portada de un municipio descargaba cientos de kilobytes por cada imagen que
mostraba diminuta, y el egress de Supabase se agota rápido. Si la miniatura no llega a
subirse, la foto se registra igual y se usa la grande: `thumbUrl()` hace ese respaldo.

**El consentimiento es una restricción de la base de datos**, no solo del formulario:
`cases_publish_requires_consent` impide publicar un caso sin autorización.

**Los permisos viven en las políticas, no en la interfaz.** Esconder un botón no protege
nada: cualquiera con sesión puede hablar con la Data API por su cuenta. El rol y los
municipios asignados se preguntan a Postgres en cada llamada (`private.team_role()`,
`private.can_write_city()`), las Server Actions los comprueban en el servidor y nunca se
fían de un campo del formulario —el municipio de una necesidad que se edita se lee de la
fila, no de un campo oculto—, y las RLS rechazan la escritura si algo se olvidó. Lo que no
cabe en una política de fila va en un disparador: publicar un municipio compara la fila
nueva con la vieja, así que lo guarda `cities_guard_publication`.

Debajo de las políticas hay otra capa que no se ve leyéndolas, y conviene mirarla aparte:
**el permiso de tabla**. Antes de preguntar qué filas devuelve una política, Postgres
pregunta si el rol puede pedir esa operación. Supabase concede el juego completo a `anon` y
a `authenticated` sobre toda tabla nueva de `public`, así que hay que retirarlo a mano
—`0008`—, y `verify:sql` comprueba la lista entera: una tabla nueva que no pase por ahí
hace fallar las pruebas.

**Las ofertas no son públicas.** Cualquiera puede insertar una, pero no existe política de
lectura para el público: los datos de contacto de terceros solo los ve el equipo, y dentro
del equipo solo quien atiende ese municipio. Y el público tampoco tiene permiso de tabla
sobre `offers` (`0008`), así que pedirla por la API no devuelve una lista vacía: devuelve un
error de permisos. La diferencia entre las dos respuestas es la segunda barrera.

**El registro de ayudas es público y anónimo.** `/ayudas` se sirve de la vista
`public.aid_log`, que es la única puerta del público a la tabla de ofertas: no tiene columna
de contacto ni de mensaje, solo muestra lo que tiene fecha de entrega y enmascara el nombre
salvo que la persona lo autorizara (`publish_name`, que empieza en falso). El público no
tiene ni política ni permiso de tabla sobre `offers` —la primera la pone `0002` y el segundo
lo quita `0008`—, así que son dos barreras independientes y cada una aguanta sin la otra.
Conviene no dar eso por hecho al leerlo: durante un tiempo solo estuvo la política, y como
una lista vacía se parece mucho a un error de permisos, no se notó. La comprobación honesta
es pedir `offers` con la clave publicable y ver qué contesta. La vista corre con los
derechos de su propietario —es lo único que sabe
enmascarar una columna—, y por eso repite la cascada de publicación en su filtro y en sus
`join`: si se toca, hay que revisarla.

**Lo que el registro publica es de trazo grueso, y eso está en la vista.** De cada entrega
salen el recurso, el **mes** (`delivered_month`, texto `YYYY-MM`) y el **municipio**. No sale
el día exacto, ni el caso al que fue —ni su nombre, ni su identificador, ni el título de una
necesidad suya, que está escrito en la ficha de la familia—. No son columnas escondidas: no
existen en la vista, igual que no existe el contacto, así que la API no las puede servir por
mucho que cambie la página. La razón es doble: una lista pública de qué llegó, a qué pueblo y
qué día es un calendario de reparto, y quien aparece en un caso consintió que se contara su
situación y se publicaran sus fotos, no que se publicara lo que recibe. El equipo conserva el
dato completo en `public.offers`, que es donde trabaja.

**"Llegó" es una fecha y no un estado.** Los estados cuentan la conversación con quien
ofrece (pendiente, aceptada, rechazada); que la ayuda llegara es otra cosa y necesita día.
Es un `date` y no un `timestamptz`: en terreno se sabe el día, y una entrega a las 20:00 en
Colombia se guardaría con la fecha del día siguiente en UTC. El día se anota en el panel y
se queda ahí: fuera solo sale el mes.

**Publicar en cascada.** Si un municipio no está publicado, sus fotos, necesidades y casos
tampoco son visibles, aunque estén marcados como publicados individualmente. Está resuelto
en las políticas RLS, no en las consultas.

**Sin modo offline.** Fue una decisión explícita: documentar requiere conexión. Si en
terreno no hay señal, se toman notas y fotos en el teléfono y se cargan al llegar a un
punto con datos.

**El mapa no es un basemap.** Son las 30 formas de los municipios del Chocó (Marco
Geoestadístico Nacional del DANE, en `lib/choco-texture.ts`) dibujadas en SVG desde el
servidor como un mosaico plano, coloreadas una a una según sus necesidades abiertas. No usa
librería de mapas ni descarga tiles, así que no necesita JavaScript, no depende de ningún
servicio externo y no consume datos por visita. Está quieto: elegir un municipio cambia
colores y contornos, nunca el encuadre. La proyección de `lib/choco-map.ts` sirve para situar
las ciudades y para leer coordenadas cuando el equipo toca el esquema en el panel.

Vive en `/mapa` y no en el inicio: de un mapa del Chocó no sale una decisión —veintiséis de los
treinta municipios están sin documentar y salen en gris—, pero sí sitúa, y para eso hay que ir
a buscarlo. La apertura Colombia → Chocó (`components/map/MapIntro.tsx`) se mudó allí con él.
El departamento es dos veces y media más alto que ancho, así que **el dibujo lo limita siempre
la altura del hueco**: cada línea de texto encima o debajo del mapa se la quita al mapa.

## Sistema visual

Papel claro y cartográfico: fondo hueso cálido, tarjetas casi blancas de borde finísimo y
tinta casi negra. Se documenta a pleno sol del mediodía y con el teléfono en la mano, así que
la legibilidad manda sobre el carácter. Los tokens están en `app/globals.css`.

| Papel | Token | Valor |
| --- | --- | --- |
| Fondo de página | `paper` | `#F6F3EE` |
| Tierra del mapa | `canvas` / `land` | `#EFECE5` / `#E7E2D9` |
| Tarjetas | `panel` / `panel-high` | `#FDFBF7` / `#FFFFFF` |
| Titulares y texto | `ink` / `body` / `muted` | `#191411` / `#3A332D` / `#5C534B` |
| Acento de marca | `accent` | `#1B7A4C` — selva de la bandera del Chocó |

Ninguna ficha de color puede llamarse como una utilidad de Tailwind. El papel se llamó `base`
un tiempo, y con ese nombre `text-base` dejaba de ser un tamaño de letra para ser un color:
los cuatro sitios que lo escribían pidiendo 16 px se quedaron sin tamaño, y cualquiera que lo
escribiera esperando tamaño se llevaba letra color papel sobre papel.

### Dos familias, y no se mezclan

**Verde (`accent`) es la marca y por tanto lo que se hace:** botones, enlaces, la
navegación, y la pastilla de una necesidad ya cubierta, que es la única forma de "hecho"
que existe aquí.

**La escala cálida (`need-blank` … `need-high`, de `#E8E4DD` a `#A92A1A`) es cuánto
falta.** Pinta los municipios del mapa y, con los mismos tonos, las pastillas de estado de
una necesidad: el chip «Urgente» de Quibdó y la forma de Quibdó en el mapa dicen lo mismo
con el mismo color.

| Estado | Relleno | Tinta | Contraste |
| --- | --- | --- | --- |
| Urgente | `need-high` macizo | `paper` | 6,3:1 |
| Abierta | `need-mid-soft` | `need-mid-strong` | 5,9:1 |
| Parcial | filete, sin relleno | `need-mid-strong` | 7,4:1 |
| Cubierta | `accent-soft` + visto | `accent-strong` | 6,7:1 |

La regla existe porque se rompió: con la urgencia pintada de verde de marca, «Abierta»,
«Urgente» y «Cubierta» eran tres verdes medios seguidos y la urgencia dejaba de leerse.
Y en el otro sentido, más verde nunca puede significar más necesidad: se leería como
"mejor" y aquí significa lo contrario.

Los dos lavados —el naranja de «Abierta» y el verde de «Cubierta»— quedan a la misma
luminancia (1,04:1 entre ellos), así que el tono no basta para quien no separa rojo de
verde. Por eso «Cubierta» lleva el visto: es la única pastilla con dibujo y la diferencia
sobrevive en escala de grises.

Sufijos: `-soft` es el relleno pálido de una pastilla y `-strong` la versión de más peso,
que sobre papel quiere decir **más oscura** —el hover no puede ir hacia la luz cuando el
fondo ya es lo más claro que hay—.

### Superficies y estados

Papel, panel y panel alto se llevan nueve y dos niveles de 255: entre esos tres tonos no cabe
señalar que una tarjeta está bajo el dedo o pulsada, y este diseño es todo tarjetas. La escala
de superficies crece por tanto **hacia el hueco** —`land` y `canvas` son más oscuras que el
papel y sirven para lo que se hunde: el marco de una foto que aún no existe, el canal de una
barra de progreso—, y **el estado se muda fuera del relleno**: sombra (`--shadow-card` →
`--shadow-lift` → `--shadow-press`), el borde que se oscurece, y movimiento —cuatro píxeles
arriba al pasar por encima, un 3 % de encogimiento al pulsar—. Las recetas viven en
`components/ui/styles.ts` (`card`, `cardLink`, `iconOnPhoto`, `pillOnPhoto`) y no deberían
escribirse a mano en una página.

### Fotografía

Las fotos las hace el equipo con el móvil, en campo y con la luz que haya. El sistema no puede
suponer que sean oscuras ni que el motivo esté centrado:

- **Velos** (`.veil-b`, `.veil-head`, `.veil-t` en `globals.css`) bajo todo texto que caiga
  sobre imagen. Los números están calculados contra un cielo quemado —blanco puro—, no contra
  las fotos de muestra. La consecuencia de diseño es que el texto sobre foto vive en el tercio
  bajo del velo; por encima del 55 % el degradado ya no garantiza nada.
- **Encuadre de una situación** (`.photo-crop`) desde el 62 % de la altura: en campo el motivo
  cae en la mitad baja y el sello «muestra» de las imágenes de archivo va incrustado abajo en
  el centro.
- **Encuadre de una persona** (`.photo-portrait`) desde el 22 %, porque en un retrato la cara
  está arriba. Son dos clases y no una: con la de las situaciones, la primera foto real del
  portal —una señora de pie— salía sin cabeza. La usan la tarjeta pública del caso y el
  selector de retrato del panel, que tienen que enseñar el mismo recorte o se elige a ciegas.
- **Y el encuadre de una foto concreta**, cuando ninguno de esos dos porcentajes la acierta:
  cada fila de `photos` puede guardar el suyo (`focus_x`, `focus_y`, `zoom`; `0009`), que
  manda sobre el de la caja. El archivo de Storage no se recorta —el original es la
  documentación—, así que recolocar una foto ya subida no obliga a volver a subirla. Los tres
  van juntos o los tres van nulos, y nulos significa «usa el recorte por omisión», de modo
  que una foto que nadie ha tocado no se mueve.
- **Hueco digno** (`components/ui/Photo.tsx`) cuando no hay foto: superficie hundida con la
  marca en contorno. Va a aparecer a menudo —se documenta un municipio y las fotos llegan días
  después— y las tarjetas cambian a tinta sobre claro en vez de fingir una imagen.

### Navegación

El portal público es una pila de pantallas con la navegación en un borde, y nunca en los
dos a la vez: en el móvil una **barra fija abajo**, donde llega el pulgar; a partir de `lg`
esa barra se retira y el mismo mapa de destinos se muda a la **cabecera**, porque una barra
flotando sobre el filo inferior de una pantalla de 1080 px queda lejos de la mano y de la
vista.

Son cuatro acciones —Inicio, Mapa, Buscar, Ofrecer— y cuatro secciones —Municipios,
Necesidades, Casos, Donaciones—, que en el inicio son además los cuatro accesos con icono.
Las dos listas y la regla de qué está activo viven en `components/nav/destinations.ts`; las
barras solo las pintan, para que una sección nueva no pueda aparecer en una y no en la otra.

Todo son rutas de verdad: se renderizan en el servidor, funcionan sin JavaScript y
cualquiera se puede pegar en un WhatsApp. Las barras son cliente solo para saber dónde
estás, y Next las pinta también en el servidor, así que el HTML ya llega con la sección
marcada.

La pantalla de un caso esconde esa barra y monta la suya —WhatsApp, compartir, ofrecer—: dos
barras fijas apiladas se comen un tercio de un móvil.

## Cómo llega el dinero

El portal **no cobra ni procesa pagos**. Hay dos destinos y son cosas distintas:

**La llave de transferencia del portal.** Una sola, la misma en todas las pantallas
(`public.donation_key`, migración `0010`). Sale escrita entera y en grande en `/donaciones`,
en la ficha de cada municipio y en la de cada caso, con los pasos para pegarla en la app y con
el nombre que la app tiene que mostrar antes de confirmar. **Se cambia en un solo sitio:
`/admin/donaciones`**, y solo coordinación.

**El enlace de donación de una fundación.** Es de esa fundación y solo afecta a su municipio
(`foundations.donation_url`, un botón «Donar dinero» en su tarjeta). El dinero para una
persona concreta no expone su Nequi ni su número: se envía a través de la fundación del
municipio con el nombre de la familia como referencia (por WhatsApp o su enlace), que es quien
ya rinde cuentas en terreno. Así se evita la suplantación y la persona no queda con su
teléfono publicado.

### Por qué la llave no es una columna más de la fundación

Es la pregunta obvia, porque el modelo ya tiene un sitio para el destino del dinero. Tres
razones, y la tercera es la que decide:

- **Una llave no es un enlace.** Un enlace se pulsa; una llave se copia y se pega en otra
  aplicación. `@soschoco` metido en un campo de URL sale como `https://@soschoco` —eso hace
  `externalUrl()` con lo que no trae esquema—, o sea un enlace roto en el botón más importante
  del portal. Así que necesita su propio campo y su propia forma de presentarse.
- **Es una para todo, y la fundación es una por municipio.** Colgarla de la fundación la
  obligaría a repetirse pueblo a pueblo: cambiarla serían treinta ediciones y bastaría
  equivocarse en una para que un municipio quedara enviando el dinero a otro sitio, sin que
  nada en la pantalla lo delatara. La llave va a cambiar, así que «un solo sitio» no es orden:
  es la única forma de que cambiarla no pueda salir a medias.
- **Tiene que funcionar sin fundación.** Hoy no hay ninguna registrada en la base real, y sin
  los datos de contacto de una no la va a haber pronto. Una llave que solo aparece cuando
  exista la fundación deja el único caso publicado exactamente como estaba: legible y sin nada
  que darle.

### Por qué en la base de datos y no en una constante del proyecto

Una constante en `lib/constants.ts` también viviría en un solo sitio, y sería más simple y más
barata: nada que consultar y nada que proteger. Pierde en lo único que aquí decide, que es
cómo se cambia. Editar una constante es tocar el repositorio, hacer commit y esperar un
despliegue; y la llave va a cambiar pronto, con el equipo de viaje y sin nadie delante de un
portátil. Una fila se cambia desde el panel en un minuto y desde un teléfono.

El precio de traerla a la base es que pasa a ser un dato escribible, o sea una superficie
nueva por la que se puede desviar dinero, así que entra con el cerrojo puesto: **solo
coordinación**, comprobado en la pantalla, en la Server Action y en la política
`donation_key_coordination`; **nadie puede crear una segunda ni borrar la única** —no hay
política que lo permita ni permiso de tabla que lo conceda—; solo puede existir una fila
(`donation_key_one_row`); y la propia fila guarda **desde qué sesión se cambió**, escrito por
un disparador desde el correo del token y no por quien llama. Las 183 comprobaciones de
`verify:sql` incluyen todo eso.

### Se ve sin JavaScript

La llave va escrita en el HTML, en cuerpo grande, monoespaciada y con `select-all`, así que un
toque la selecciona entera y se puede copiar a mano o teclear. El botón «Copiar la llave»
**no se renderiza en el servidor**: aparece solo si el navegador trae portapapeles, porque
copiar no existe sin JavaScript y un botón muerto sería peor que ninguno. Monoespaciada
porque la llave va a cambiar y la siguiente puede llevar un `1` junto a una `l`; quien la
teclee a mano no tiene que adivinar.

### Una fundación por municipio

Hay **una fundación por municipio y lo garantiza la base de datos**
(`foundations_one_per_city`). No es una simplificación del modelo: con varias y una marcada
como madre, cuál recibía el dinero lo decidía un orden —la marcada, y si no la primera—, así
que dos marcadas o ninguna dejaban el botón «Donar» apuntando a un enlace que nadie eligió, y
sin que se notara mirando la pantalla. Si la capa de datos se encontrara dos, la ficha se
queda sin botón de donar antes que elegir una al azar.

## Qué queda fuera a propósito

Pasarelas de pago propias (el dinero va por el canal externo de la fundación, no por aquí),
cuentas para el público, moderación de contenido enviado por terceros, app nativa,
notificaciones por correo de cada oferta nueva (la bandeja del panel cumple esa función).

---

## Estructura

```
app/(public)/          portal público: mapa, municipios, casos, ayudas, ofrecer, entrar
app/admin/             panel del equipo (protegido) y Server Actions
app/admin/donaciones/  la llave de transferencia del portal (solo coordinación)
app/admin/equipo/      invitar, dar rol y asignar municipios (solo coordinación)
app/auth/              callback del enlace de acceso y cierre de sesión
components/            UI compartida, mapas y componentes del panel
lib/                   clientes de Supabase, consultas, tipos, compresión de fotos
lib/team.ts            rol y municipios de la sesión, y quién puede escribir dónde
lib/demo-data.ts       contenido de muestra para cuando no hay base de datos
supabase/              migraciones, semilla de municipios y verify.mjs (pruebas de RLS)
proxy.ts               refresco de la sesión en cada petición
```
