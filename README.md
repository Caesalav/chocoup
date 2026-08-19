# Chocó-up

Portal para documentar la situación en municipios del Chocó tras el terremoto, y para
que cualquier persona pueda ofrecer un recurso concreto.

- **Público:** mapa del Chocó, ficha de cada municipio con fotos y las necesidades de la
  zona, y las **causas** documentadas —una causa puede ser una persona, un colegio, un
  animal o una fundación—. Botón para ofrecer recursos sin crear cuenta, y el **canal de
  donación** de quien recibe: un **canal general del portal** y, si alguien le abrió uno, el
  canal propio de una causa, en forma de llave de transferencia escrita para copiarla, de
  enlace de recaudación o de número al que llamar. **Una causa sin canal propio recibe por el
  general, y su ficha lo dice con esas palabras.** En `/donaciones`, el canal general arriba y
  debajo las causas. En `/ofrecido`, lo que se ha prometido y todavía no ha llegado; en
  `/ayudas`, el registro público de lo que ya llegó: de qué tipo era, en qué mes y a qué
  municipio, anónimo salvo autorización expresa.
- **Equipo:** panel en `/admin`, con una puerta y tres secciones —Ciudades, Casos, y
  verificación, aceptación o negación de los recursos ofrecidos—. Desde ahí se crean
  municipios, se suben fotos, se registran necesidades, se publican causas con su diario de
  avances, se registra a dónde va el dinero y desde cuándo nadie lo ha comprobado, y se
  reparten permisos por municipio.

Stack: Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage).
El mapa es un esquema del Chocó en SVG, sin librería de mapas ni servicio de tiles.

---

## Datos de muestra

Mientras no haya claves de Supabase en `.env.local`, el portal arranca lleno de contenido
inventado: tres municipios publicados, dos en borrador, ocho causas —una de ellas un colegio,
para poder ver lo que el tipo de causa cambia en el retrato—, necesidades abiertas en cada
pueblo, un canal general de muestra y una bandeja de ofertas con casos pendientes, aceptados,
negados y retirados. Sirve para valorar el diseño y recorrer el flujo completo, incluido el
panel.

Las fechas de la muestra son de agosto de 2026 y **envejecen solas**: leída dentro de un año,
la comprobación del canal general dirá que lleva un año sin mirarse. Es lo correcto para lo
que es —una demostración de un momento— y es justo lo que `supabase/datos-de-prueba.sql` no
puede permitirse, porque ese se pega sobre la base de verdad meses después.

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
4. `supabase/migrations/0004_una_fundacion_por_municipio.sql` — **superada por `0015`**. Una
   sola fundación por municipio, garantizada por la base de datos, y fuera la marca de «es la
   madre». Se pega por completitud del histórico y **nunca suelta**.
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
10. `supabase/migrations/0010_llave_de_transferencia.sql` — **superada por `0011`**. Crea una
    llave de transferencia global; la siguiente la retira. Se pega solo por completitud del
    histórico y **nunca suelta**.
11. `supabase/migrations/0011_canal_de_donacion.sql` — el canal de donación de cada municipio
    y de cada caso, en llave o en enlace, solo escribible por coordinación; y fuera la llave
    global. El canal de municipio se lo lleva `0015`; el del caso sigue en pie.
12. `supabase/migrations/0012_registro_de_lo_ofrecido.sql` — el registro público de lo
    prometido (`/ofrecido`), y un cuarto estado, «retirada», para poder quitar del muro sin
    escribir una conversación que no ocurrió.
13. `supabase/migrations/0013_canal_de_telefono.sql` — el teléfono como tercer formato del
    canal, porque en terreno la mayoría de las fichas no tiene llave ni enlace y sí un número.
14. `supabase/migrations/0014_sugerencias.sql` — el buzón de errores e ideas del portal.
15. `supabase/migrations/0015_canal_general.sql` — un solo canal general del portal; fuera las
    fundaciones y fuera los canales de municipio; el correo de avisos y el contador de aportes.
    **Es la única que no se puede pegar antes de desplegar**; ver más abajo.
16. `supabase/migrations/0016_ficha_de_causa.sql` — qué es la causa (persona, colegio, animal,
    fundación), la frase corta que viaja por WhatsApp, y desde cuándo nadie ha comprobado su
    canal. Va detrás de `0015` y falla en seco si no está.
17. `supabase/migrations/0017_donaciones_preparadas.sql` — la tabla donde caerán los importes
    el día que haya pasarela. **No trae pasarela**: lo único que entra hoy es la forma del
    dato y la barrera que impide escribir un importe desde un navegador.
18. `supabase/migrations/0018_tablero.sql` — el foco del momento («ahora, aquí») y el recuento
    de aportes en camino hacia un pueblo.
19. `supabase/seed.sql` — los 10 municipios del Chocó con sus coordenadas, sin publicar.

**Son dieciocho migraciones.** Tres no son opcionales aunque lo parezcan:

- `0009`: `lib/data.ts` pide `focus_x`, `focus_y` y `zoom` por su nombre en la ficha del
  municipio y en las listas de casos, así que una base con `0001`–`0008` deja esas pantallas
  sin casos y sin ningún error a la vista.
- `0011`, si se espera que una causa pueda tener canal propio.
- `0015` y `0016`, si se espera que el portal funcione con el código de hoy. El código nuevo
  pide `donation_channel`, `case_kind`, `summary` y `donation_verified_on` por su nombre, y
  la capa de datos se come los errores de la API, así que sin ellas las pantallas no fallan:
  contestan que no hay canal general y que ninguna causa tiene a dónde recibir. Las dos
  frases son correctas como texto y falsas como hecho.

**`0015` es la primera migración del proyecto que no se puede adelantar al despliegue**, y
merece leerse antes de abrir el editor de SQL: borra columnas y una tabla que el código
publicado sigue leyendo. Pegada sin desplegar, `donationChannel(city)` hace
`undefined.trim()` y la ficha de cualquier municipio contesta 500. **El orden es: desplegar
el código primero y pegar `0015`–`0018` inmediatamente después**, nunca al revés —al revés
tumba la ficha de Quibdó, que es por donde entra casi todo el mundo—. La maniobra entera,
con los comandos, está en [ANTES-DEL-VIAJE.md](ANTES-DEL-VIAJE.md), que es donde hay que
mirarla el día que toque.

Las dieciocho se pueden volver a ejecutar sin romper nada. El orden importa cinco veces:

- `0002` estrecha las políticas que crea `0001`, así que si algún día vuelves a pegar
  `0001`, **pega `0002` detrás** o el equipo se queda otra vez con permiso para todo.
- `0005` reemplaza la vista `aid_log` que crea `0002`, así que si vuelves a pegar `0002`,
  **pega `0005` detrás** o el registro público vuelve a publicar el texto libre de las
  ofertas.
- `0008` recorta los permisos de esa misma vista, que se crea entera cada vez, así que si
  vuelves a pegar `0005`, **pega `0008` detrás**. Las tablas no tienen ese problema: se
  crean con `if not exists` y volver a pegarlas no las recrea. Las vistas de `0012` y `0015`
  tampoco: cada una se recorta los permisos en su propio archivo.
- `0001`, `0002`, `0004` y `0008` crean y reforman la tabla de fundaciones que `0015` borra,
  así que si vuelves a pegar cualquiera de las cuatro, **pega `0015` detrás** o el portal
  recupera un `donation_url` de lectura pública que ninguna pantalla enseña, que es la peor
  de las dos formas de tener un destino de dinero.
- `0010` crea la llave global que `0011` retira, así que si vuelves a pegar `0010`,
  **pega `0011` detrás**. Sola, `0010` devuelve al portal un destino de dinero común a todo
  el Chocó, que es justo el modelo que se corrigió entonces.

Esas dos últimas filas son la misma trampa dos veces: `0004` y `0010` siguen en la carpeta y
sus nombres suenan a lo que uno busca. **Las dos están superadas** y se quedan solo para que
el histórico se pueda reconstruir en orden; sus propios archivos lo dicen en la cabecera.

El histórico completo sí se reconstruye sin sorpresas, y está pensado así: `0010` crea
`donation_key`, `0011` la borra y `0015` crea `donation_channel`, que es **otra tabla con otro
nombre**. Pegadas en orden no hay colisión y no quedan dos canales generales, porque solo uno
de los dos sobrevive a su migración siguiente. Que se llamen distinto no es cosmético: es lo
que mantiene sano el histórico.

`0004` era la única que podía negarse a aplicarse, y lo hacía a propósito: si un municipio
tenía dos fundaciones cargadas a mano, paraba y las nombraba en vez de elegir por ti, porque
cada fundación llevaba dentro su propio enlace de donación. Ese cuidado ya no tiene sujeto
—`0015` se llevó la tabla— y se conserva escrito porque el criterio sigue vigente en todo el
resto del proyecto: ante dos destinos posibles, parar es mejor que elegir uno en silencio.

Antes de tocar una migración, y después, conviene correr:

```bash
npm run verify:sql
```

Ejecuta el esquema contra un Postgres real en memoria (sin Docker) y comprueba las reglas de
acceso: que un caso sin consentimiento no se pueda publicar, que quien documenta no pueda
escribir en un municipio que no tiene asignado, que los contactos de las ofertas no sean
legibles por el público —ni por política ni por permiso de tabla, y cada barrera se prueba sin
la otra—, que el formulario de `/ofrecer` siga entregando con el permiso recortado al mínimo,
que nadie que atienda a la web pueda vaciar una tabla, que nadie aparezca nombrado en el
registro de ayudas sin haberlo autorizado, que de una entrega no salgan por la vía pública ni
el día exacto, ni el caso al que fue, ni la descripción que escribió quien la ofreció —y que el
equipo sí lo conserve todo—, que lo que se publique de qué llegó pertenezca siempre al
vocabulario cerrado de nueve categorías, que el texto de una oferta dirigida a una familia no
salga en el muro de lo prometido mientras la fila sí sale, que retirar una oferta la saque del
muro al momento sin borrar nada, que el retrato de una persona no pueda ser la foto de otra,
que el encuadre de una foto solo lo pueda mover quien documenta ese municipio, que **el canal
de donación de una causa y el general del portal solo los ponga coordinación** —comprobado
también desde la sesión de quien documenta ese mismo municipio, que es la única que llega
hasta ahí, y comprobando además que esa persona sigue pudiendo guardar el resto de la ficha—,
que un canal sea una llave, un enlace o un número y nunca dos, que haya un solo canal general,
que el municipio ya no tenga canal ni columna donde volver a tenerlo, que la tabla de
fundaciones no exista —y no solo que esté vacía—, que la llave global de `0010` no vuelva al
pegar el histórico en orden, que un importe de donación no se pueda escribir desde el navegador
ni con la sesión de coordinación, que el contador de aportes entregados dé exactamente lo mismo
que el largo del registro público de ayudas, y que despublicar un municipio esconda todo su
contenido, canales incluidos.

Comprueba además una cosa que no es del esquema: que su propia lista de migraciones no se
haya quedado corta. Un archivo nuevo en `supabase/migrations` que nadie haya añadido a
`MIGRATIONS` detiene las pruebas ahí mismo y lo dice con su nombre. Es el descuido que dejó
`0009` fuera del arnés mientras el informe seguía en verde, y así no puede repetirse.

Esa comprobación tuvo al arnés en rojo un tiempo, y era una decisión:
`0014_sugerencias.sql` estaba en la carpeta y no en la lista mientras `/sugerencias` se
escribía. Cerrado eso, se añadió la línea y **el informe se puso verde de una vez, sin ningún
otro ajuste** —284 de 284—, porque todo lo demás del archivo ya contaba con ella.

Y una advertencia que costó descubrir: **el verde del arnés dice que los archivos son
coherentes entre sí y no dice nada de lo que tiene puesto la base de datos de verdad.** Hubo un
día en que estaba en verde mientras a la base real le faltaban `0005` y `0008`, o sea con el
registro público publicando el texto libre de quien ofreció la ayuda. Para saber qué tiene la
base real hay que preguntárselo; las consultas están en
[ANTES-DEL-VIAJE.md](ANTES-DEL-VIAJE.md).

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
| Fotos, causas, necesidades y avances | Todos los municipios | Solo los asignados |
| Publicar un municipio | Sí | No |
| Crear o borrar municipios | Sí | No |
| El canal de donación de una causa | Sí | No |
| El canal general del portal, y el repaso de todos los destinos | Sí | No |
| La fecha de comprobación de un canal | Sí | No |
| Los correos de la lista de avisos | Sí | No |
| El foco del momento en la portada | Sí | No |
| Ofertas y su contacto | Todas | Solo las de sus municipios |
| El buzón de sugerencias | Leer y borrar | Leer |
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

El panel se entra por **`/admin`** y tiene tres secciones. No están repartidas por tabla sino
por **cuándo** se hace cada cosa, que es lo que decide dónde va a buscarla alguien con prisa:
**Ciudades** es llegar a un pueblo y contar qué pasó, una vez por municipio; **Casos** es
documentar una causa y volver cada semana a su diario; **Verificación, aceptación o negación de
los recursos ofrecidos** es contestar a lo que llega de fuera, que no lo decide el equipo y hay
que resolverlo el mismo día. El reparto entero, con dónde cayó cada cosa y por qué, está
escrito una vez en `lib/admin-sections.ts`.

1. **Llegar a un municipio.** En `/admin/ciudades` está ya creado (del seed) o se crea con
   *Nuevo municipio*, tocando el mapa o con *Usar mi ubicación*.
2. **Documentar.** Escribir qué pasó, subir fotos (se comprimen en el teléfono antes de
   subir) y registrar las necesidades de la zona.
3. **Las causas.** Una por quien recibe. Puede ser una persona o familia, un colegio, un
   animal o una fundación, y decirlo importa: es lo que decide qué se dibuja cuando no hay
   retrato. Marcar la casilla de consentimiento **solo si la persona lo autorizó**: sin ella
   el caso se guarda pero no se puede publicar.
4. **El retrato.** Dentro de la causa, después de subir sus fotos, marcar cuál de ellas es su
   retrato. Es la que sale recortada en redondo en la tarjeta, así que elige una en la que se
   le vea a ella y no la de la casa. Se puede dejar sin retrato: si es una persona la tarjeta
   pone sus iniciales, y si es un colegio o un animal escribe la palabra, porque dos iniciales
   inventadas en el círculo de una escuela se leen como un dato mal guardado.
5. **El diario.** Cada semana, un avance fechado con su foto. Es lo que distingue una causa
   documentada de una lista de nombres, y la sección Casos ordena por eso: la que lleva más
   tiempo sin un avance es la que hay que ir a ver.
6. **A dónde va el dinero.** Coordinación registra el canal propio de una causa en su ficha, y
   el canal general del portal en `/admin/casos/dinero`: una llave de transferencia, un enlace
   de recaudación o un número de contacto, nunca dos. Quien documenta no ve ese campo y no
   puede tocarlo; pasa el dato por el grupo. **Sin canal propio, la causa recibe por el
   general y su ficha lo dice con esas palabras**, sin presentarlo como suyo.
7. **Comprobar el canal**, y anotar el día. Comprobar es llamar al número, o mandar mil pesos
   a la llave y mirar qué nombre sale. A los 60 días el portal deja de presentar esa
   comprobación como reciente, y la puerta del panel avisa.
8. **Publicar** el municipio cuando esté listo. Hasta entonces nada de ese municipio es
   visible para el público, aunque sus causas estén publicadas una a una.
9. **Los recursos ofrecidos.** Cuando alguien ofrece algo desde el portal, aparece en
   `/admin/recursos` con su contacto —y ya está publicado en `/ofrecido` sin él—. Se comprueba
   que es legítimo, se acepta o se niega, se vincula a la necesidad que cubre y se pone en
   contacto con la familia. Negar y retirar no son lo mismo: retirar quita del muro algo que
   nadie ha valorado, sin escribir una conversación que no ocurrió.
10. **Cuando la ayuda llegue**, anotar el día en esa misma oferta. La fecha es lo que la
    publica en `/ayudas`, y allí sale con el mes y el municipio: nunca el día ni el caso al
    que fue, sin contacto y sin nombre salvo que la persona lo autorizara.

Las direcciones viejas del panel siguen llevando a algún sitio, porque están escritas en
marcadores y en mensajes que no se pueden editar desde aquí: `/admin/ofertas` desvía a
`/admin/recursos` y `/admin/donaciones` a `/admin/casos/dinero`. La lista de correos de avisos
no está al otro lado de ese segundo desvío: se fue a `/admin/recursos/avisos`.

### Antes de salir

El repaso completo, con el estado real de la base de datos, la maniobra del despliegue acoplado
y las trampas de orden de las migraciones, está en
[ANTES-DEL-VIAJE.md](ANTES-DEL-VIAJE.md). Lo de aquí es el resumen.

- [ ] Las migraciones aplicadas, en orden, **y `0015`–`0018` pegadas inmediatamente después
      de desplegar el código, nunca antes**. Es lo único de esta lista que no se puede
      arreglar después.
- [ ] `npm run verify:sql` en verde —que dice que los archivos son coherentes entre sí y nada
      de la base real—, o sabiendo por qué está en rojo.
- [ ] La carga de prueba retirada con `supabase/borrar-datos-de-prueba.sql`, para que nadie
      abra el portal y encuentre un municipio llamado «(prueba)».
- [ ] Al menos una persona de coordinación en `private.team_members`, creada a mano.
- [ ] El resto del equipo invitado desde `/admin/equipo`, con sus municipios asignados, y
      cada persona ya entró una vez desde su propio teléfono.
- [ ] Comprobado que quien documenta ve "Solo lectura" en un municipio que no es suyo, y que
      en una causa suya ve el canal pero no el formulario.
- [ ] Al menos un municipio publicado con fotos y una causa real, para que el portal no
      esté vacío cuando se comparta el enlace.
- [ ] El canal general escrito, y los destinos repasados en `/admin/casos/dinero`: los de
      tipo llave con su app y el nombre del titular puestos, y todos con su fecha de
      comprobación.
- [ ] Una transferencia de prueba hecha de verdad, desde otro teléfono, a cada canal que se
      vaya a publicar. Y una llamada al número, si el canal es un número.
- [ ] Una oferta de prueba enviada desde `/ofrecer`, vista en `/ofrecido` sin el contacto, y
      revisada en `/admin/recursos`.
- [ ] Esa oferta marcada como entregada, y comprobado que sale en `/ayudas` sin nombre y que
      desaparece de `/ofrecido`.
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

**La tabla de ofertas no es pública, y lo ofrecido sí.** Cualquiera puede insertar una oferta,
pero no existe política de lectura sobre `public.offers` para el público: los datos de contacto
de terceros solo los ve el equipo, y dentro del equipo solo quien atiende ese municipio. Y el
público tampoco tiene permiso de tabla (`0008`), así que pedirla por la API no devuelve una
lista vacía: devuelve un error de permisos. La diferencia entre las dos respuestas es la segunda
barrera.

Lo que sí se publica es **la oferta sin su contacto**, por una vista (`offer_log`, `0012`), y
eso llegó después que el resto. El portal contaba la historia en dos tiempos —«Necesidades», lo
que falta, y «Ayudas que llegaron», lo que llegó— y le faltaba el de en medio: lo prometido. El
hueco tenía una forma concreta y estaba en los propios datos de prueba: una ferretería ofrece
600 tejas y dice que no cubre el transporte, y una empresa de logística ofrece un camión que
sube vacío. Las dos esperando en la tabla, y nadie podía cruzarlas salvo que una persona del
equipo se acordara de las dos a la vez. Publicarlas es lo que permite que las cruce cualquiera,
y el emparejamiento pasa por el portal y no por el teléfono de nadie: quien quiera completar una
oferta manda la suya, y las dos llegan juntas a la bandeja del equipo.

Ahí hay una decisión que parece una vuelta atrás y no lo es: **en `/ofrecido` el texto de la
oferta sí se publica, y en `/ayudas` `0005` lo quitó.** Son dos textos que cuentan cosas
distintas. En el registro de ayudas el texto describe lo que *recibió* una familia, y
«tratamiento para la tensión, tres meses» junto a la ficha de una señora con hipertensión la
señala sin nombrarla; quitarlo costaba precisión y no rompía nada. En el muro de lo prometido el
texto *es* la función —«Techo» y «transporte» no cruzan nada—, y lo que describe es el inventario
de quien ofrece. En cuanto la oferta apunta a una familia cambian las dos cosas a la vez, y por
eso la vista le quita el texto a esas filas y las deja: la fila sin texto sigue diciendo que hay
una oferta de Techo en Quibdó sin confirmar, que es lo que alguien necesita para completarla.
Del texto que sí sale se tapan las arrobas y los números de siete cifras o más, porque la gente
escribe «600 tejas, llámame al 316…» precisamente porque el formulario no publica su contacto.

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

**«Retirada» es un cuarto estado y no un uso de «rechazada»** (`0012`). Un muro que se publica
sin revisión previa necesita salida rápida, y las tres palabras que había no servían: «rechazada»
dice que el equipo habló con esa persona y dijo que no, así que usarla para quitar del muro algo
que nadie ha valorado escribiría una conversación que no ocurrió, en el único campo con el que
después se le responde a quien lo mandó. En el panel esa palabra se lee «Negada», porque negar
es el verbo de esa sección; el valor guardado sigue siendo `rechazada` y nadie lo lee.

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

Tres destinos van fuera de esas listas y viven en el pie: **lo que se ha ofrecido**
(`/ofrecido`), **las ayudas que llegaron** (`/ayudas`) y **sugerencias** (`/sugerencias`). Los
dos primeros van seguidos y en ese orden, que es el orden en que pasan las cosas, y no entran
en las secciones porque las secciones son las cuatro maneras de entrar al material y estos son
la constancia de lo prometido y de lo cumplido —la respuesta a «¿y de verdad llega algo?»—.
Meterlos ahí los pondría de quinto y sexto icono en una fila de cuatro. `/ofrecido` se llama
«Lo que se ha ofrecido» y no «Ofrecido» porque a una letra está «Ofrecer», que es la acción de
la barra de abajo: dos entradas casi iguales sin nada en las palabras que diga cuál es cuál.

Todo son rutas de verdad: se renderizan en el servidor, funcionan sin JavaScript y
cualquiera se puede pegar en un WhatsApp. Las barras son cliente solo para saber dónde
estás, y Next las pinta también en el servidor, así que el HTML ya llega con la sección
marcada.

La pantalla de un caso esconde esa barra y monta la suya —WhatsApp, compartir, ofrecer—: dos
barras fijas apiladas se comen un tercio de un móvil.

## Cómo llega el dinero

El portal **no cobra ni procesa pagos**. Hay dos sitios donde puede vivir un destino:

**El canal general del portal** (`public.donation_channel`, migración `0015`). Una fila y solo
una, garantizada por el tipo. No es de ningún municipio ni de ninguna causa: lo verifica
coordinación en primera instancia y desde ahí se reparte entre las causas publicadas. Sale
arriba de `/donaciones` y en la ficha de cada causa que no tenga el suyo.

**El canal propio de una causa** (`cases.donation_key` / `donation_url` / `donation_phone`,
`0011` y `0013`). Es de esa causa, sale solo en su ficha y en su tarjeta, y nadie más lo toma.

**Una causa sin canal propio recibe por el general, y su ficha lo dice con esas palabras.** Esa
frase no es un detalle de redacción: es la condición con la que el general entró, y vive en un
solo componente (`GeneralChannelNote`) para que ninguna pantalla la diga más corta que las
otras. La versión larga explica además qué se hace con lo que entra, porque sin eso «canal
general» se lee como una cuenta común sin dueño.

### La decisión que se tomó, se revirtió y volvió con otra forma

Merece contarse entera porque es el hilo del que cuelga todo lo demás, y porque las tres
etapas siguen enseñando algo.

**`0010` puso una llave global del portal**, `@soschoco` para todo el Chocó. La forma era buena
—una fila única, con el cerrojo puesto, editable desde el panel sin desplegar— y el fondo no.

**`0011` la retiró** y escribió que no habría ningún canal común. El motivo era y sigue siendo
cierto: un destino que nadie eligió para una familia, presentado en su ficha como si fuera el
suyo, manda el dinero a otro sitio sin que se note mirando la pantalla, y quien lee la historia
de una persona y transfiere cree estar dándole a ella. Aquello dejó el reparto en un canal por
municipio y uno por caso, y la regla en «sin canal propio, no hay canal»: una ficha sin destino
se quedaba muda antes que enseñar el de otro.

**`0015` invierte la regla y conserva la preocupación.** El modelo se quedó con una sola cosa
—causas— y con un canal general que da destino a las que no tienen el suyo, porque una causa sin
canal no podía recibir nada, y eso también es una forma de fallarle. Lo que cambia es cómo se
cumple la misma preocupación: antes callando, ahora diciéndolo. De ahí que `caseDonation()`
(`lib/donation-channel.ts`) **no devuelva un canal a secas sino el canal y su procedencia**: con
una firma que solo devolviera el canal, olvidarse de decir de quién es compilaría.

Y de ahí también que el general viva en **su propia tabla** y no en una columna más: mientras
esté en una fila aparte, ninguna consulta puede confundirlo con el de una familia por descuido.
La tabla nueva se llama `donation_channel` y no reutiliza el nombre de la de `0010`, que
`0011` borró; son dos nombres distintos justo para que reconstruir el histórico en orden no
deje dos canales generales.

El estado `ninguno` sigue existiendo y no es teórico: es lo que se ve mientras la fila del
general esté vacía —coordinación puede vaciarla en un minuto si el destino se compromete— y es
lo que hay que poder decir sin inventar nada.

### Lo que se fue con `0015`, y las razones que se conservan

**Las fundaciones dejaron de ser una entidad del portal.** Una fundación que trabaje en el
Chocó entra ahora como una causa más, con su historia, sus necesidades y su canal si lo tiene.
Y **los canales de municipio se fueron con ellas**, porque la pregunta que contestaban —«¿a
dónde va el dinero de este pueblo?»— dejó de tener respuesta en el modelo: el dinero va a una
causa. Las columnas se borraron y no se dejaron vacías, porque una columna que nadie escribe
pero que sigue ahí es un destino que puede volver a llenarse desde la API sin que ninguna
pantalla lo enseñe, que es la peor de las dos formas de tener un destino de dinero.

Tres decisiones de aquel modelo se quedan escritas aquí porque el criterio sigue rigiendo:

- **Una fundación por municipio, garantizada por la base de datos** (`foundations_one_per_city`,
  `0004`). No era una simplificación: con varias y una marcada como madre, cuál recibía el
  dinero lo decidía un orden —la marcada, y si no la primera—, así que dos marcadas o ninguna
  dejaban el botón «Donar» apuntando a un enlace que nadie eligió, y sin que se notara mirando
  la pantalla. Ante dos, la ficha se quedaba sin botón antes que elegir al azar. **Ese reflejo
  es el que sigue vivo** en toda la capa de datos: ante la ambigüedad sobre a dónde va el
  dinero, callar.
- **Por qué el canal de un pueblo vivía en el pueblo y no en su fundación.** Porque Quibdó no
  tenía fundación y era el único municipio real publicado, así que colgarlo de ella dejaba sin
  canal posible justo al pueblo con una persona documentada esperando; porque inventar una
  fundación para colgarle una llave habría sido publicar el nombre de una organización que no
  existe, en la tarjeta más delicada del portal y con un botón de dinero dentro; y porque eran
  dos cosas distintas y las dos legítimas. **La segunda razón es la que hay que recordar**: la
  tentación de crear una entidad de mentira para tener dónde colgar un dato aparece cada vez que
  falta un sitio.
- **Dos destinos pueden convivir en la misma pantalla mientras cada uno diga a quién
  pertenece.** Lo que no puede es que la página elija uno por su cuenta. Es la regla que sigue
  gobernando `/donaciones`, donde el general y los propios se leen seguidos y rotulados.

### Un canal es una llave, un enlace o un número, nunca dos

Unos destinos son llaves de transferencia —`@soschoco`, que se copia y se pega en la app del
banco—, otros son enlaces de recaudación —una Vaki, que se pulsa— y otros son un número al que
se llama o se escribe para coordinar el aporte. El tercero lo añadió `0013` por una razón de
terreno: la mayoría de las fichas de campo no tiene llave ni enlace, y sin ese formato la
sección «Enviar dinero» decía que no había a dónde enviar, que era mentira —había un número y no
se enseñaba—.

No caben en un solo campo. Una llave metida en un campo de URL sale como `https://@soschoco`
—eso hace `externalUrl()` con lo que no trae esquema—, o sea un enlace válido que no lleva a
ninguna parte, en el botón más importante de la pantalla.

Lo impide una restricción de la base de datos (`cases_donation_one_channel`,
`donation_channel_one_kind`) y lo vuelve a impedir la capa de datos, que ante dos puestos
devuelve «sin canal» en vez de elegir. Con dos llenos, «el canal» volvería a ser «el que la
página mire primero», que es el destino del dinero decidido por un orden. En terreno el fallo
real es cambiar de destino con prisa y olvidar borrar el anterior.

Con una llave van además **en qué app se pega** y **a nombre de quién aparece**. El segundo es
la única defensa de quien dona: la llave no dice nada por sí misma y el nombre que la app
muestra antes de confirmar sí. Vacío es un estado válido y es la verdad cuando no consta; el
portal pide mirarlo igual, sin decir cuál es la respuesta correcta. Inventarlo enseñaría a
ignorar esa comprobación.

### Una fecha de comprobación, y no una insignia

Cada canal guarda **desde cuándo nadie ha comprobado a dónde va** (`donation_verified_on`,
`0016`), y la ficha pública lo dice. Es lo único que el portal puede afirmar con honestidad
sobre el dinero, precisamente porque el dinero no pasa por aquí: no hay nada que proteger, así
que una pastilla de «donación protegida» sería mentira. Lo que sí se puede decir es cuándo fue
la última vez que alguien llamó a ese número o mandó mil pesos a esa llave y miró qué nombre
salía.

Tres decisiones dentro de esa fecha:

- **A los 60 días deja de presentarse como reciente**, y el umbral tiene que ser uno que se
  alcance. Un umbral que nadie alcanza convierte la frase en un adorno permanente; a los treinta
  días medio portal estaría marcado como viejo en su estado normal y la marca se leería como
  avería; a los ciento ochenta, la ficha afirmaría media campaña que esto está vigilado.
- **Vacío no dice nada, y eso es correcto.** Lo que no se puede hacer es dar por comprobado lo
  que no lo está, ni escribir «Sin comprobar» debajo del canal de una familia, que se leería
  como una advertencia sobre ella y no sobre nuestro trabajo.
- **Si el destino cambia, la fecha se borra sola** (`guard_channel_verification`), a menos que
  se escriba una nueva en el mismo guardado. Es lo que impide que quede «Comprobado el 3 de
  agosto» debajo de una llave que se cambió el 12 de septiembre. Y va en el mismo cerrojo que el
  canal, porque quien pudiera escribir que un destino está comprobado sin haberlo comprobado
  estaría escribiendo la frase que el portal pone para que alguien se fíe.

### Quién puede cambiarlo

**Solo coordinación**, y en tres capas que no dependen entre sí: la ficha no ofrece el campo,
la Server Action lo rechaza, y el disparador `guard_donation_channel` (`0011`, ampliado en
`0013` y `0016`) para el cambio aunque la llamada llegue desde fuera de la web.

La tercera no es redundante y es la que hacía falta pensar. Con las fundaciones bastaba una
política de tabla, porque nadie de documentación escribía ahí. Con las causas no: **quien
documenta un municipio sí puede editar sus casos**, es su trabajo y lo hace desde el móvil
delante de la familia, así que las políticas de fila dejan pasar la escritura entera y el canal
necesita su propia comprobación dentro de ella. El disparador mira el cambio y no el valor, de
modo que esa misma persona sigue guardando la ficha completa con el canal ya puesto sin
tropezar con él.

El canal general no necesita ese disparador y le basta su política: esa tabla no tiene ninguna
otra escritura legítima, así que una política de `update` para coordinación lo dice todo.

Por lo mismo que el disparador existe, el canal **no viaja en el formulario grande de la ficha**:
va en el suyo y con su propio botón. Cambiar a dónde va el dinero de alguien no puede ser un
efecto de guardar su historia, y con los campos juntos un guardado de documentación mandaría el
canal vacío y la base de datos rechazaría la ficha entera.

### Por qué en la base de datos y no en una constante del proyecto

Una constante en `lib/constants.ts` sería más simple y más barata: nada que consultar y nada
que proteger. Pierde en lo único que aquí decide, que es cómo se cambia. Editar una constante
es tocar el repositorio, hacer commit y esperar un despliegue; y estos destinos van a cambiar
pronto, con el equipo de viaje y sin nadie delante de un portátil. Una fila se cambia desde el
panel en un minuto y desde un teléfono.

El precio es que pasa a ser un dato escribible, o sea una superficie por la que se puede
desviar dinero. Las comprobaciones de `verify:sql` cubren todo eso, incluida la que importa de
verdad: que la sesión de quien documenta ese mismo municipio no pueda tocarlo.

Hay una excepción escrita para el futuro y es de dirección contraria. `0017` deja preparada la
tabla donde caerán los importes el día que haya pasarela, y ahí la línea no se traza en el rol
del equipo sino en el **rol de conexión**: un importe no puede entrar desde un navegador, ni
desde el de quien dona ni desde el de quien coordina. No es desconfianza: un importe no es un
dato que alguien decida, es un hecho que el banco confirma, y teclearlo a mano produciría una
barra de recaudado que no cuadra con ninguna cuenta y que nadie podría auditar. Esa decisión
entra hoy, con la tabla vacía, porque es imposible de añadir después sin tocar todo lo que ya
escriba importes.

### El repaso de todos los destinos vive en `/admin/casos/dinero`

Antes estaba en `/admin/donaciones`, que es donde vivió el formulario de la llave global de
`0010`; la dirección vieja sigue desviando. Es **el repaso de todos los destinos que el portal
publica**, con la antigüedad de cada comprobación al lado.

La pantalla existe porque repartir los canales tuvo un precio: con un solo campo bastaba
mirarlo para saber a dónde iba el dinero, y con uno general y uno por causa hay que poder
recorrerlos de un vistazo. Es así como se detecta el que no debería estar ahí, y es la pantalla
que se abre el día que el dinero aparezca donde no debe. Lista también los escritos que aún no
salen —municipio sin publicar, causa en borrador o sin consentimiento—, aparte y marcados: se
revisan cuando todavía no hay dinero de por medio. La fecha de comprobación va en la misma fila
y no en una columna suelta, porque una llave sin fecha y una llave comprobada anteayer se leen
igual si la fecha viaja por su cuenta.

**El canal general sí se edita ahí, y es la única excepción a la regla de que cada destino se
cambia en la ficha de quien lo recibe.** El motivo es que no recibe nadie en particular: no
tiene ficha donde vivir, y ponerlo en la de un municipio o de una causa haría creer que es
suyo. Los canales propios se siguen editando en su ficha y aquí solo se enlazan, porque el
destino del dinero se cambia con el nombre y la historia de quien lo recibe delante, no en una
lista de llaves donde todas se parecen.

Lo que esa pantalla **no** es: el dinero recaudado. No hay ninguna cifra de lo que ha entrado,
porque el dinero no pasa por el portal y no hay nada que sumar.

### Se ve sin JavaScript

La llave va escrita en el HTML, en cuerpo grande, monoespaciada y con `select-all`, así que un
toque la selecciona entera y se puede copiar a mano o teclear. El botón «Copiar la llave»
**no se renderiza en el servidor**: aparece solo si el navegador trae portapapeles, porque
copiar no existe sin JavaScript y un botón muerto sería peor que ninguno. Monoespaciada
porque un canal va a cambiar y el siguiente puede llevar un `1` junto a una `l`; quien la
teclee a mano no tiene que adivinar.

El enlace es un `<a>` de toda la vida, y debajo del botón va el destino escrito, monoespaciado
y partible: un botón no dice a dónde lleva hasta que se pulsa, y aquí lo que hay al otro lado
es dinero.

## El panel: una puerta y tres secciones

El panel tenía cinco entradas en la barra —Panel, Ofertas, Sugerencias, Dinero, Equipo— y la
lista de municipios metida dentro de la primera, que además se llamaba igual que el panel
entero. Eso obligaba a saberse de memoria dónde vive cada cosa: el canal de una causa en
«Panel», el general en «Dinero», las ofertas de esa misma causa en dos sitios a la vez.

Ahora hay **una puerta —`/admin`— y tres secciones**. Las dos mitades de eso parecen
contradecirse hasta que se leen juntas: se entra por un solo sitio, y ese sitio no es una
pantalla donde esté todo amontonado, es un reparto en tres.

**Son estas tres porque se distinguen por cuándo se hacen, no por qué tabla tocan.** Ciudades
es llegar a un pueblo y contar qué pasó: una vez por municipio y después se corrige. Casos es
documentar a alguien y seguir su avance: muchas veces por municipio y se vuelve cada semana.
Verificación, aceptación o negación de los recursos ofrecidos es contestar a lo que llega de
fuera: no lo decide el equipo, llega cuando llega, y hay que resolverlo el mismo día.

**Lo que hace de la puerta una puerta y no un menú son los números.** Un índice de tres enlaces
con su frase debajo no ahorra nada: quien abre esto en terreno no tiene la duda de cómo se
llaman las secciones, tiene la de por dónde empezar hoy, y eso solo lo contesta saber que hay
tres ofertas sin revisar y dos causas sin publicar. Un menú obligaría a entrar en las tres para
averiguarlo, con la señal del Chocó y una recarga por sección.

El reparto de dónde cayó cada cosa —y por qué nada de ello es una cuarta sección— está escrito
una vez en `lib/admin-sections.ts`. Lo que conviene saber de memoria:

- **El canal de una causa** se queda en su ficha, o sea en Casos. **El general y el repaso de
  todos los destinos** caen también en Casos, en `/admin/casos/dinero`: el general no es de
  ningún municipio, así que en Ciudades no cabe, y lo que hace es dar destino a las causas sin
  canal propio.
- **La lista de correos de avisos** cae en Recursos ofrecidos (`/admin/recursos/avisos`), y fue
  la única mudanza que hubo que pensar. No es de un municipio ni de una causa. Lo que la coloca
  es de dónde viene: la escribe la misma gente y en el mismo gesto que las ofertas —quien deja
  su correo en «Quiero ayudar» está diciendo lo mismo que quien ofrece unas tejas, con menos
  concreción—. Estaba debajo del repaso del dinero por una razón que no era una razón: «la
  pantalla ya existe y su condición de entrada es la misma», que es cómo se llena de cosas la
  única pantalla con cerrojo.
- **Equipo y Sugerencias no son ninguna de las tres** y van juntas al lado de la cuenta. Equipo
  es el panel hablando de sí mismo. Sugerencias es el buzón de lo que el público dice sobre el
  portal, no sobre una familia ni sobre un recurso: se parece a Recursos en que llega de fuera y
  ahí acaba el parecido, porque no hay nada que verificar, aceptar ni negar, y meterlo dentro
  convertiría la bandeja de trabajo en un cajón de correo entrante.

**La ficha de una causa no se movió**: sigue en `/admin/ciudades/[slug]/casos/[id]`, que es la
dirección que ya tenía y que hay escrita en enlaces guardados. `activeAdminSection()` la asigna
a Casos, así que la barra señala Casos mientras se edita una; sin esa excepción, editar una
causa dejaría la barra diciendo que se está en otra sección.

Las dos direcciones que se mudaron desvían con una página y no con una regla en
`next.config`: la configuración de este proyecto está vacía —una regla suelta allí es una regla
que nadie encuentra— y aquí el desvío vive en la carpeta de la ruta que desvía, así que el día
que se borre esa carpeta se borra con ella. Responden 307 y no 308, o sea sin afirmar que la
mudanza sea para siempre y sin quedarse cacheadas en el navegador de nadie.

## Contar sin exponer a nadie

Tres números del portal salen de `public.offers`, que el público no puede leer ni por política
ni por permiso de tabla. Los tres se calculan en una vista y se recogen en un solo sitio del
código, y eso es deliberado: **el fallo que ya estuvo publicado fue tres pantallas contando
conjuntos distintos bajo el mismo rótulo** (está explicado largo en `lib/needs.ts`, y decía «0
necesidades abiertas» donde faltaban diez).

- **El contador de aportes** de `/ofrecer` (`offer_tally`, `0015`; rótulos en
  `lib/contributions.ts`). Cuenta los aportes que entraron por el formulario y siguen en pie, y
  de esos cuántos ya llegaron. No suma lo rechazado ni lo retirado, porque un contador que suma
  el spam afirma una participación que no existe. Es acumulado y no caduca: lo que ha pasado no
  expira. Y la frase que lo acompaña dice qué **no** es —no es dinero, no son kilos, no son
  familias atendidas—, porque «cuarenta aportes» se lee como cuarenta ayudas entregadas.
- **El «en camino» de un pueblo** (`city_offer_activity`, `0018`; `lib/city-activity.ts`).
  Ofertas en pie de un municipio publicado, sin fecha de entrega. Dice que hay gente yendo, no
  que ya se cubrió.
- **El registro de lo prometido**, `/ofrecido` (`offer_log`, `0012`), que es el hermano de
  `/ayudas`: las dos mitades del mismo registro, lo prometido y lo entregado, y son disjuntas
  por construcción —`delivered_on is null` aquí y `is not null` allí—, así que en cuanto una
  ayuda llega sale de una lista y aparece en la otra sin que nadie tenga que moverla.

Los tres aplican la cascada de publicación **reescrita a mano** en la propia vista, porque una
vista que corre con los derechos de su propietario no hereda las RLS. Sin eso, el contador diría
que hay más aportes de los que se pueden ver, y quien contara lo publicado encontraría otra
cosa. El arnés comprueba además que el número de aportes entregados dé exactamente lo mismo que
el largo de `/ayudas`: si alguien cambia una de las dos definiciones, falla ahí antes que en la
pantalla.

La regla `no-restricted-syntax` de `eslint.config.mjs` prohíbe leer esas vistas fuera de la capa
de datos, para que un número no pueda entrar al portal por una segunda consulta con otro filtro.

**Y una lista que no es un contador:** los correos de quien pidió novedades
(`newsletter_signups`, `0015`). Son dos consentimientos distintos y por eso son dos tablas: usar
el contacto de una oferta para mandar novedades sería escribirle a alguien que no lo pidió. El
público inserta y nadie lee salvo coordinación, ni la lista ni el recuento —un `count` por la
API es una lectura, así que sin `select` tampoco hay número—. Y apuntarse dos veces contesta lo
mismo que apuntarse una: con el índice único a secas, el error habría convertido el formulario en
una forma de preguntar «¿está esta persona en la lista?», que es justo lo que la tabla no
publica.

## Qué queda fuera a propósito

Pasarelas de pago (el dinero va por el canal externo de quien recibe, no por aquí; `0017` deja
la tabla preparada y **no trae proveedor, ni webhook, ni pantalla**), cuentas para el público,
moderación previa de lo que envían terceros —el muro de lo prometido se publica sin revisar y
se retira de un clic, que es la decisión contraria y está razonada en `0012`—, app nativa, y
notificaciones por correo de cada oferta nueva (la bandeja del panel cumple esa función).

---

## Estructura

```
app/(public)/            portal público: mapa, municipios, casos, donaciones, ofrecer,
                         ofrecido, ayudas, buscar, sugerencias, entrar
app/admin/               la puerta del panel (protegida) y las Server Actions
app/admin/ciudades/      sección Ciudades, y dentro la ficha de cada causa
app/admin/casos/         sección Casos
app/admin/casos/dinero/  el repaso de todos los destinos de dinero y el canal general
                         (solo coordinación)
app/admin/recursos/      sección de verificación, aceptación o negación de lo ofrecido
app/admin/recursos/avisos/  los correos de la lista de avisos (solo coordinación)
app/admin/sugerencias/   el buzón de lo que el público dice sobre el portal
app/admin/equipo/        invitar, dar rol y asignar municipios (solo coordinación)
app/admin/donaciones/    desvío a casos/dinero, para los enlaces guardados
app/admin/ofertas/       desvío a recursos, por lo mismo
app/auth/                callback del enlace de acceso y cierre de sesión
components/              UI compartida, mapas y componentes del panel
lib/                     clientes de Supabase, consultas, tipos, compresión de fotos
lib/admin-sections.ts    el mapa del panel: una puerta, tres secciones y por qué
lib/donation-channel.ts  qué canal enseña una causa y de quién es
lib/contributions.ts     qué cuenta el contador de aportes y con qué palabras
lib/team.ts              rol y municipios de la sesión, y quién puede escribir dónde
lib/demo-data.ts         contenido de muestra para cuando no hay base de datos
supabase/                migraciones, semilla, carga de prueba y verify.mjs (pruebas de RLS)
proxy.ts                 refresco de la sesión en cada petición
```
