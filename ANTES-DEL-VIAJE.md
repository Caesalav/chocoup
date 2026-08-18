# Antes del viaje, y en campo

Lo que hay que dejar hecho antes de salir y lo que hay que tener a mano allí. El
README explica por qué el portal es como es; esto es qué hacer, en qué orden y qué
falla si se hace a medias. Se lee con prisa y con mala señal.

Todo lo que sigue se comprobó contra la base de datos real el **17 de agosto de
2026** (proyecto `chocoup`, `cpkmxvvrqvunwxobxknc`, `us-east-1`, Postgres 17.6).
Lo que no pude comprobar está dicho como tal al final. **Si lees esto semanas
después, vuelve a preguntarle a la base**: al final hay dos consultas para eso.

---

## Lo que falta hoy

Comprobado, no supuesto:

- [ ] **Pegar `0010`**, que es lo que publica la llave `@soschoco` y lo único que
      hoy permite enviar dinero a algo. Ver
      [La llave de transferencia](#la-llave-de-transferencia).
- [ ] **Poner la app y el titular de la llave** en `/admin/donaciones`. La llave
      sola funciona; sin esos dos campos, quien dona no sabe en qué app pegarla ni
      qué nombre tiene que ver antes de confirmar.
- [ ] **Ninguna fundación en ninguna parte.** Ya no es lo único que impide que el
      dinero tenga a dónde ir —la llave no depende de ella—, pero sigue faltando
      para que cada municipio tenga su propio canal.
      Ver [Que el portal se vea](#que-el-portal-se-vea).
- [ ] **Una sola cuenta del equipo**, la de coordinación. Nadie ha entrado nunca con
      el rol de documentación contra esta base de datos. Ver
      [Cuentas del equipo](#cuentas-del-equipo).
- [ ] **Tres municipios de cuatro sin publicar**, y de los diez de la semilla solo
      hay cargados cuatro. Los otros seis vuelven pasando otra vez
      `supabase/seed.sql`.
- [ ] **Quibdó sin resumen** y sin necesidades de zona: las dos que tiene son del
      caso, así que su ficha se presenta con «0 necesidades abiertas».
- [ ] **El circuito de ofertas nunca se ha recorrido aquí**: cero ofertas, cero
      entregas, `/ayudas` vacío.

Lo que sí está: las nueve migraciones aplicadas, un municipio publicado (Quibdó) y
un caso real publicado y con consentimiento, con retrato, doce fotos con sus
miniaturas en Storage, cinco avances con foto y dos necesidades.

---

## La llave de transferencia

`@soschoco`. Es a dónde transfiere quien quiere dar dinero, y es **una para todo el
portal**: la misma en `/donaciones`, en la ficha de cada municipio y en la de cada
caso.

### Cómo se cambia

**Entra en `/admin/donaciones` y guárdala. Eso es todo.**

No hay que editar ningún archivo, ni hacer commit, ni desplegar, ni volver al SQL
Editor. Se cambia desde el móvil y el cambio sale en la siguiente carga de las tres
pantallas. Está pensado así justo porque la llave va a cambiar con el equipo de
viaje: **no está en el código a propósito**, porque una constante habría exigido un
despliegue y en el Chocó no va a haber quien lo haga.

La pantalla es de coordinación y tiene tres campos:

| Campo | Qué hace si está | Qué pasa si falta |
| --- | --- | --- |
| **La llave** | Sale escrita entera y en grande | Sin ella el portal no ofrece la sección en ninguna pantalla |
| **En qué app se usa** | «Bre-B», «Nequi»… al lado de la llave y en los pasos | El portal dice «tu app de banco o billetera»: es cierto, pero hace dudar |
| **A nombre de quién aparece** | El portal pide comprobar ese nombre antes de confirmar | Se le pide mirarlo igual, sin decirle cuál es la respuesta correcta |

Ese tercer campo es la única defensa de quien dona: `@soschoco` no dice nada por sí
mismo, y el nombre que le sale en la app antes de confirmar sí. **Escríbelo
exactamente como lo muestra la app**, y si no lo sabes con seguridad, déjalo vacío
antes que poner uno aproximado —un nombre que no coincide enseña a ignorar la
comprobación—.

### Si la llave se compromete

**Vacía el campo de la llave y guarda.** En la misma petición las tres pantallas
dejan de ofrecerla. No hace falta tener a mano la siguiente ni esperar a nadie: eso
es lo primero, y se hace en veinte segundos.

### Quién puede tocarla, y qué queda escrito

Solo coordinación, comprobado en tres capas independientes: la pantalla, la Server
Action y la política `donation_key_coordination`, que rechaza el cambio aunque la
llamada llegue desde fuera de la web con una sesión de documentación. **Nadie
—tampoco coordinación— puede crear una segunda llave ni borrar la fila**: no hay
política que lo permita ni permiso de tabla que lo conceda.

Y la fila guarda **desde qué sesión se cambió**, con la fecha. Lo escribe un
disparador desde el correo del token, así que no se puede firmar con el correo de
otra persona ni dejar en blanco desde el formulario. Se lee al pie de
`/admin/donaciones`, y es lo único que va a haber el día que el dinero aparezca en
una cuenta que no es.

```sql
-- Qué llave está publicada ahora mismo, y quién la puso.
select key_value, app_label, holder, updated_at, updated_by
from public.donation_key;
```

### Lo que la llave no hace

Una transferencia a la llave **no va marcada a ninguna familia**. La ficha de un
caso lo dice con esas palabras cuando la llave es lo único que hay, y no promete lo
contrario: prometer que un aporte llega a una persona concreta sería lo único de
esa pantalla que no podríamos sostener. Para que el dinero entre señalando a una
familia hace falta la fundación de su municipio, o un destino propio del caso.

---

## Migraciones

Se pegan en el **SQL Editor** de Supabase, en este orden, y **son diez**:

```
0001_init                        tablas, RLS y el bucket fotos
0002_roles_y_ayudas              roles del equipo y el registro público
0003_retrato_del_caso            qué foto de la persona es su retrato
0004_una_fundacion_por_municipio una sola fundación por municipio
0005_registro_sin_texto_libre    el registro publica la categoría, no el texto
0006_seguimiento_del_caso        el diario fechado y el destino de donación del caso
0007_foto_del_avance             cada avance lleva una foto del propio caso
0008_permiso_de_tabla_del_publico recorta el permiso de tabla de anon
0009_encuadre_de_fotos           encuadre y zoom por foto
0010_llave_de_transferencia      la llave del portal, con @soschoco dentro
seed.sql                         los 10 municipios, sin publicar
```

`0010` es la que hace que hoy se pueda donar. Trae `@soschoco` escrita dentro, así
que en cuanto se pegue la llave sale publicada en las tres pantallas sin tener que
tocar nada más. **Volver a pegarla no devuelve la llave vieja**: el insert inicial
lleva `on conflict do nothing` a propósito, porque un mantenimiento rutinario que
reescribiera la llave mandaría las donaciones a una cuenta que ya no es y no daría
ningún error. Ver [La llave de transferencia](#la-llave-de-transferencia).

`0009` llegó después que las demás y **no es opcional**: `lib/data.ts` pide
`focus_x`, `focus_y` y `zoom` por su nombre en los `select` de la ficha del
municipio y de las listas de casos, así que una base con `0001`–`0008` deja esas
pantallas sin casos y sin que se vea nada: el error viaja aparte y esas funciones
solo leen los datos. Por eso está en la lista del arnés y tiene sus propias
comprobaciones, y por eso el README la nombra con las otras ocho.

`0010` falla de otra manera, más callada: sin ella la tabla no existe, la consulta
devuelve nulo y las tres pantallas simplemente no pintan la sección de la llave.
No hay error en ningún sitio. **Si la llave no aparece en ninguna pantalla, lo
primero que hay que mirar es si `0010` está aplicada**; y en `/admin/donaciones` se
ve de una vez, porque en ese caso la pantalla dice qué archivo falta en vez de
ofrecer un formulario.

Todas se pueden volver a pegar sin romper nada. Lo que importa es el orden, y solo
en tres sitios. Están escritos en la cabecera de los propios archivos:

| Si vuelves a pegar | Pega detrás | Porque si no |
| --- | --- | --- |
| `0001` | `0002` | El equipo se queda otra vez con permiso para todo |
| `0002` | `0005` **y luego** `0008` | El registro público vuelve a publicar el texto libre de quien ofreció la ayuda |
| `0005` | `0008` | La vista `aid_log` nace de nuevo con el juego completo de permisos concedido al público |

La segunda fila es una cadena de tres archivos y es la que se hace a medias:
`0002` crea `aid_log` con el texto dentro, `0005` la rehace sin él, y ese
`create view` le devuelve a la vista los permisos de nacimiento, que es lo que
`0008` vuelve a recortar. Pegar `0002` y `0005` sin `0008` deja la mitad del
arreglo puesta.

Las tablas no tienen ese problema: se crean con `if not exists`, así que volver a
pegarlas no las recrea ni les toca los permisos.

`0004` es la única que puede negarse a aplicarse, y lo hace a propósito: si algún
municipio tiene ya dos fundaciones cargadas a mano, para y las nombra. Cada
fundación lleva dentro su propio enlace de donación, así que no elige por ti. Abre
las dos, decide con coordinación cuál es la del municipio, borra la otra desde el
panel y vuelve a pegarla.

### Lo que hay aplicado de verdad

El registro de `supabase_migrations.schema_migrations` de la base real, en el
orden en que entraron:

```
0001_init · 0002_roles_y_ayudas · 0003_retrato_del_caso
0002b_revoke_anon_team_functions
0005_registro_sin_texto_libre · 0004_una_fundacion_por_municipio
0006_seguimiento_del_caso · 0007_foto_del_avance
0008_permiso_de_tabla_del_publico · encuadre_de_fotos
```

Dos rarezas, ninguna de las dos hay que arreglar:

- **`0004` entró detrás de `0005`.** No importa: `0004` solo toca la tabla de
  fundaciones —una restricción y una columna que se va— y no roza la vista ni los
  permisos. Comprobado que el recorte de `0005` sigue en pie.
- **`0002b_revoke_anon_team_functions` no existe como archivo.** Fue un parche
  suelto —retirar `execute` de las cuatro funciones `team_*` a `public` y a
  `anon`— que hoy está dentro de `0002`. No hay nada que volver a pegar.

Y tres comprobaciones de que lo delicado está donde debe:

- La vista real publica `category` y no el texto de quien ofreció la ayuda:
  `0005` está puesto.
- `anon` tiene `select` en las seis tablas y en `aid_log`, e `insert` y nada más en
  `offers`: `0008` está puesto.
- `photos` tiene `focus_x`, `focus_y` y `zoom`: `0009` está puesto.

---

## Cuentas del equipo

El portal entra con correo y contraseña (`signInWithPassword`) y **no tiene
registro, ni recuperación, ni pantalla para cambiar la contraseña**. No es un
hueco por rellenar: es la decisión de que las cuentas se creen a mano antes de
salir.

Cada persona necesita **dos cosas, y son dos pasos independientes en dos sitios
distintos**. Es el error fácil de este proyecto porque cada paso, por separado,
parece haber funcionado.

**1. La cuenta.** Supabase → **Authentication → Users → Add user**, con
***Auto Confirm User* marcado**. Ahí se le pone la contraseña y ese es el único
sitio donde se pone. Sin este paso no puede entrar.

**2. El permiso.** En el portal, **`/admin/equipo`**: su correo, su rol y sus
municipios. Sin este paso entra y no ve el panel.

Con solo el paso 1, la persona entra y no puede hacer nada. Con solo el paso 2,
tiene permisos y ninguna puerta. El correo de los dos pasos tiene que ser el
mismo.

`/admin/equipo` reparte permisos sobre un correo y nunca crea cuentas, y por eso
se puede invitar a alguien antes de que exista su cuenta: la primera vez que entre
encontrará sus municipios esperando.

Un enlace de invitación mandado desde el panel de Supabase no sirve para dar de
alta a nadie: deja una sesión abierta pero no una contraseña, y el portal no tiene
dónde ponerla.

Y no quites a la última persona de coordinación: es quien reparte los permisos, y
desde el panel no hay forma de arreglarlo. La pantalla no ofrece quitarse a uno
mismo, y las Server Actions y la base de datos lo rechazan igual.

### Probarlo con dos cuentas reales antes de salir

Hoy hay **una sola cuenta** en la base real —`chocoup26@gmail.com`, coordinación,
confirmada y con sesión ya iniciada—, así que el rol de documentación no se ha
ejercido nunca aquí. Las 183 comprobaciones locales lo prueban a fondo, pero
contra una base en memoria: lo que no se ha visto es una persona con su teléfono,
su contraseña y esta base de datos.

Da de alta **dos cuentas de verdad, una de cada rol**, y con la de documentación
comprueba las cuatro cosas que la separan de coordinación:

- Escribe en el municipio que le asignaste.
- Ve **«Solo lectura»** en un municipio que no es suyo.
- No puede publicar un municipio.
- En `/admin/equipo` le dice que esa pantalla es de coordinación.

Que cada persona entre una vez desde su propio teléfono, con datos y no con WiFi.
Descubrir en Quibdó que una contraseña no se copió bien es una tarde perdida.

---

## Que el portal se vea

Hasta que se pegue `0010`, el público ve un municipio con un caso y **no tiene a
dónde enviar dinero**. Hay dos caminos para arreglarlo y no son alternativos: la
llave es de todo el portal y la fundación es de su municipio.

**El camino corto, y el que hay hoy: pegar `0010`.** La llave sale publicada al
momento, sin depender de ninguna fundación, y las tres pantallas pasan a ofrecer a
dónde transferir. Ver [La llave de transferencia](#la-llave-de-transferencia).

**El camino largo, el del canal propio de cada municipio**, en este orden:

1. **El municipio publicado.** Solo coordinación; lo impone el disparador
   `cities_guard_publication`. Hasta entonces nada de ese municipio existe para el
   público: ni fotos, ni necesidades, ni casos, aunque estén publicados uno a uno.
2. **La fundación del municipio, con su enlace de donación.** Solo coordinación.
   Una por municipio, garantizada por `foundations_one_per_city`. Es lo que hace
   falta para que un aporte pueda entrar señalando a una familia concreta, que es
   lo que la llave sola no puede hacer.
3. **El caso con su consentimiento**, y publicado. La casilla se marca **solo si la
   persona lo autorizó**: sin ella el caso se guarda y no se puede publicar, y no
   es cosa del formulario sino de la restricción `cases_publish_requires_consent`.

Quibdó tiene el 1 y el 3 y le falta el 2. Lo que eso produce, comprobado:

- `/donaciones`, pestaña de fundaciones: «Todavía no hay fundaciones publicadas».
- `/donaciones`, pestaña de familias: sale la familia de Quibdó.
- En la ficha del caso **la sección «Enviar dinero» aparece solo con la llave**, sin
  botón de donar y sin WhatsApp con quien coordinar, y diciendo que la
  transferencia no va marcada a esa familia. Sin `0010` la sección no aparece: se
  puede leer el caso y no se le puede dar nada.
- La ficha del municipio enseña la llave en el sitio de la fundación, con la línea
  de que Quibdó todavía no tiene ninguna registrada.

Un caso puede llevar su propio destino de donación —una Vaki o una cuenta de la
familia— y entonces manda sobre el de la fundación. Vacío significa «usa el de la
fundación»; y si no hay ninguna de las dos cosas, lo que queda es la llave del
portal.

Falta también el resumen de Quibdó y sus necesidades **de zona**: las dos que hay
son del caso. La lista de necesidades sí las muestra, con el nombre de la familia
al lado, pero el titular de la ficha cuenta solo las de zona, así que hoy Quibdó se
presenta con **«0 necesidades abiertas»** —y ese mismo texto es el que viaja al
compartir el enlace por WhatsApp—.

---

## Fotos

```bash
python3 scripts/build-case-photos.py <carpeta-de-origen> \
    --retrato IMG_1450.PNG --ciudad <city_id> --caso <case_id>
```

De cada foto salen dos JPEG con el mismo nombre —el grande de 1600 px y su
`-mini` de 400—, que es la pareja que espera el portal, más un `manifiesto.json`
con las rutas de Storage listas para pegar. La salida va a
`<origen>/procesadas` y no al repositorio: son personas identificables y ninguna
regla de `.gitignore` las tapa.

El script hace tres cosas que el navegador no sabe hacer:

- **Quita las franjas negras** de los cuatro lados, midiendo el tramo con
  contenido y no el primer píxel que no es negro, para no comerse el cielo de una
  foto a contraluz ni dejar pegada la barra gris del iPhone.
- **Borra los metadatos** reconstruyendo la imagen desde sus píxeles, así que no
  queda nada de dónde colgarse, y **vuelve a abrir el archivo escrito para
  comprobarlo**: si sobrevive un EXIF, un XMP, un perfil ICC o cualquier `APPn`,
  para en vez de entregarlo.
- **Deja las dos versiones** con el submuestreo y el JPEG progresivo que hacen que
  una foto se vea entera y borrosa antes de verse nítida, en vez de aparecer por
  franjas.

Pon bien `--ciudad` y `--caso`. La carpeta de Storage es lo que ataca la política
que decide quién puede subir ahí, así que una carpeta inventada no es un nombre
feo: es la foto de una persona colgada del municipio equivocado.

### El GPS

Una foto de móvil escribe dentro del archivo dónde se tomó, con qué aparato y a
qué hora. El bucket `fotos` es público —comprobado—, así que la URL de una foto es
también la descarga del archivo entero. Publicar las coordenadas de la vivienda de
una persona a la que además se nombra, en un territorio con actores armados, es el
daño más grande que puede hacer este portal.

**Las capturas de pantalla no llevan GPS. Los archivos originales sí.** Es la
trampa: si alguien manda las fotos «en calidad original» en vez de una captura, el
GPS viaja con ellas y llega intacto. No se distingue mirando la imagen. Pásalas
todas por el script y no decidas por foto.

**Los originales sin procesar no se suben nunca por el panel.** El navegador
comprime antes de subir, pero no sabe quitar las bandas negras, y una banda no es
un defecto estético: cambia el recorte de todas las cajas del portal —el círculo
del retrato, el 3:2 del carrusel, el cuadrado del diario—.

Si una foto sale mal encuadrada ya subida, no hay que volver a subirla: desde
`0009` cada foto guarda su propio encuadre y su zoom, y el archivo de Storage
sigue entero. Hoy ninguna de las doce fotos tiene encuadre guardado, así que todas
usan el recorte por omisión de cada caja.

---

## `npm run verify:sql` no dice nada de la base real

Esto costó descubrirlo, así que va aparte.

`npm run verify:sql` levanta un Postgres en memoria, le pasa los archivos de
migración y comprueba 183 reglas de acceso. Hoy da **183/183**. Es una prueba
buena y no prueba lo que parece.

**Su verde dice que los archivos son coherentes entre sí. No dice nada de lo que
tiene puesto la base de datos de verdad.** Hoy mismo estaba en verde mientras a la
base real le faltaban `0005` y `0008`: el registro público estaba publicando el
texto libre que escribió quien ofreció la ayuda, y `anon` conservaba `select`
sobre la tabla de ofertas. Las pruebas no podían verlo porque no la miran.

Hubo un segundo hueco de la misma familia, y este sí está cerrado: la lista
`MIGRATIONS` de `supabase/verify.mjs` se quedó en `0008`, así que el informe daba
verde sin haber mirado nunca el encuadre. Ahora la lista llega a `0010`, el
encuadre tiene sus propias comprobaciones —las columnas, sus rangos, que los tres
números vayan juntos, y que solo pueda moverlos quien documenta ese municipio—, la
llave de transferencia tiene diecinueve —que sea una sola, que solo la cambie
coordinación, que nadie pueda crear otra ni borrar la única, que el rastro no se
pueda firmar con el correo de otra persona y que volver a pegar la migración no
devuelva la llave vieja— y el arnés se mira la carpeta de migraciones él solo: un
archivo que no esté en la lista detiene las pruebas y sale nombrado. Editar dos
sitios y acordarse de los dos ya no es la garantía.

Para saber qué tiene la base real hay que preguntárselo. Estas dos, en el SQL
Editor, contestan lo que importa:

```sql
-- ¿Está el recorte de 0005, y el diario, y el encuadre?
select
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='aid_log' and column_name='category')
    as recorte_0005,
  exists (select 1 from information_schema.tables
          where table_schema='public' and table_name='case_updates') as diario_0006,
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='case_updates' and column_name='photo_id')
    as foto_del_avance_0007,
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='photos' and column_name='focus_x')
    as encuadre_0009,
  exists (select 1 from information_schema.tables
          where table_schema='public' and table_name='donation_key') as llave_0010;

-- ¿Y qué llave está publicada ahora mismo? Vacía significa que el portal no
-- ofrece a dónde transferir en ninguna pantalla.
select key_value, app_label, holder, updated_at, updated_by
from public.donation_key;

-- ¿Está el permiso recortado de 0008? Tiene que salir una sola fila,
-- `offers` con INSERT, y ninguna otra con nada que no sea SELECT.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public' and privilege_type <> 'SELECT'
order by table_name;
```

La comprobación honesta de la segunda barrera se hace desde fuera, con la clave
publicable, porque una lista vacía y un error de permisos se parecen mucho:

```bash
curl -s "$SUPABASE_URL/rest/v1/offers?select=*&limit=1" -H "apikey: $PUBLISHABLE_KEY"
```

Tiene que contestar `401` y `permission denied for table offers`. Si contesta
`200` y `[]`, falta `0008`: la política aguanta sola, pero el día que alguien
añada una lectura para depurar algo salen los teléfonos de quienes ofrecieron
ayuda. Comprobado hoy: contesta el error.

---

## Avisos de Supabase que se dejan en paz

El *Security Advisor* saca ocho avisos. Siete de ellos no hay que atender, y
conviene saber por qué antes de que alguien los «arregle» con prisa.

**`aid_log` marcada como vista `security definer` (ERROR).** Es exactamente lo que
tiene que ser. La vista corre con los derechos de su propietario porque es lo
único que sabe enmascarar el nombre de quien ofreció la ayuda, y porque el público
no tiene ni política ni permiso sobre `public.offers`: pasarla a
`security_invoker` deja `/ayudas` vacío para todo el mundo, o obliga a abrir
`offers`, que es justo lo que cerraron dos migraciones. Si algún día se toca la
vista, hay que revisar las tres condiciones de la cascada de publicación que lleva
escritas a mano en el filtro y en los dos `join`.

**`private.team_members` y `private.team_city_assignments`, con RLS y sin
políticas (INFO).** También a propósito, y es la configuración más cerrada que
existe: RLS activa y ninguna política significa que nadie llega a esas filas por
la API. El esquema `private` no está expuesto y la única entrada son las funciones
`private.*`, que comprueban el rol dentro. Añadir una política ahí sería abrir lo
que está cerrado.

**Las cuatro funciones `team_*` ejecutables por `authenticated` (WARN).**
`team_session()`, `team_directory()`, `team_save_member()` y
`team_remove_member()`. Es deliberado: `0002` les retira `execute` a `public` y a
`anon` y se lo concede solo a quien tiene sesión, y cada función vuelve a
comprobar el rol por dentro. Nada que hacer.

**Y la regla que no es un aviso: en este proyecto no se usa la `service_role`.**
Ni en `.env.local`, ni en Vercel, ni en un script de una tarde. Ese rol tiene
`bypassrls`, así que con esa clave en la mano no queda en pie nada de lo de
arriba: ni las políticas, ni el permiso de tabla, ni el consentimiento. Todo el
acceso pasa por RLS con la clave publicable. Comprobado que hoy el código no la
lee en ningún sitio.

**El octavo aviso no es de los de dejar en paz, y no lo he tocado.** *Leaked
password protection* está desactivado: es un interruptor en Authentication que
compara la contraseña contra HaveIBeenPwned al crearla. Aquí la contraseña es la
única puerta y no hay recuperación, así que merece pensarlo, pero cambia lo que
pasa al dar de alta una cuenta y eso es una decisión, no un arreglo.

---

## Lo que no he podido comprobar

- **Si las fotos que están hoy en el escritorio llevan GPS.** No las he abierto.
  Lo verificado es lo que el script hace con lo que se le dé, y que se niega a
  entregar un archivo con metadatos dentro.
- **El rol de documentación contra esta base de datos.** No existe ninguna cuenta
  con ese rol. Lo que está probado son las 183 comprobaciones locales.
- **El despliegue.** Si Vercel tiene las dos variables de entorno y si la URL de
  retorno definitiva está en Supabase queda fuera del repositorio. Hay una carpeta
  `.vercel`, así que un proyecto sí está vinculado.
- **El circuito de una oferta hasta `/ayudas`.** Cero ofertas en la base real, así
  que el recorrido de ofrecer, aceptar, marcar la entrega y verla salir sin nombre
  no se ha hecho aquí. `/ayudas` contesta con una lista vacía, no con un error.
- **`0010` contra la base real.** La migración está escrita y probada contra un
  Postgres en memoria, y **no la he aplicado**: la aplica quien despliega. Hasta
  entonces la llave no existe y ninguna pantalla la enseña.
- **Que `@soschoco` funcione de verdad.** No he hecho ninguna transferencia. Lo que
  está comprobado es que el portal la publica tal cual, sin tocarla; que la llave
  sea la buena y que la cuenta exista solo lo puede decir alguien enviando un peso
  desde otro teléfono.
- **En qué app se usa y a nombre de quién sale.** Los dos campos van vacíos porque
  no me consta, y no los he adivinado: en el portal eso se ve como «tu app de banco
  o billetera» y como un paso que pide mirar el nombre sin decir cuál. **Rellenarlos
  en `/admin/donaciones` es tarea de coordinación antes de compartir el enlace**, y
  el segundo es la única defensa de quien dona.
