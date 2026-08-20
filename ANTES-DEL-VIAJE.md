# Antes del viaje, y en campo

Lo que hay que dejar hecho antes de salir y lo que hay que tener a mano allí. El
README explica por qué el portal es como es; esto es qué hacer, en qué orden y qué
falla si se hace a medias. Se lee con prisa y con mala señal.

Todo lo que sigue se comprobó contra la base de datos real el **18 de agosto de
2026** (proyecto `chocoup`, `cpkmxvvrqvunwxobxknc`, `us-east-1`, Postgres 17.6).
Lo que no pude comprobar está dicho como tal al final. **Si lees esto semanas
después, vuelve a preguntarle a la base**: al final hay consultas para eso.

---

## El despliegue va acoplado: código y migraciones `0015`–`0018`, en el mismo rato

Esto va primero porque es lo único de aquí que no se puede arreglar después.

**El código que hay hoy en el árbol no se puede desplegar sin pegar `0015`, `0016`,
`0017` y `0018` en el mismo rato.** No es una recomendación de orden: es que entre
una cosa y la otra el portal está roto para quien llegue desde un WhatsApp, y de
ahí llega casi todo el mundo.

La base real va por `0014`. Lo comprobado hoy, que es lo que mide el hueco:

| En la base real | Estado |
| --- | --- |
| `public.donation_channel` (el canal general) | no existe |
| `public.newsletter_signups` (los correos de avisos) | no existe |
| `public.offer_tally`, `public.city_offer_activity` | no existen |
| `cases.case_kind`, `cases.summary`, `cases.donation_verified_on` | no existen |
| `public.foundations` | **existe**, con dos filas de prueba |
| Las cinco columnas del canal en `public.cities` | **existen** |

### Los dos lados fallan, y de dos maneras distintas

Hay que conocer las dos, porque la peor no avisa.

**Si se pegan las migraciones y el despliegue se queda para luego**, se cae el
portal que hay ahora mismo publicado. `donationChannel(city)` hace
`row.donation_key.trim()` sobre columnas del municipio que `0015` borra, o sea
`undefined.trim()`: la ficha de cualquier municipio y `/donaciones` contestan **500,
no un degradado**. Y `getCityDonationEntries()` pide `foundations(*)` en la misma
consulta que los municipios, así que sin la tabla `/donaciones` se queda sin un solo
pueblo y en silencio. Está escrito en la cabecera de `0015`, que es la primera
migración del proyecto que no se puede adelantar.

**Si se despliega el código nuevo y las migraciones se quedan para luego**, no hay
500 en ninguna parte, y eso es lo peor de los dos casos. La capa de datos se come
los errores de la API —`data ?? []`, `?? null`, `?? EMPTY_TALLY`—, así que cada
pantalla contesta con lo que sabe, que es nada, y lo contesta con una frase bien
escrita:

- `/donaciones` dice que **no hay canal general registrado**, y cada causa sin canal
  propio dice que todavía no hay a dónde enviarle dinero. Las dos frases son
  correctas como texto y falsas como hecho: el canal existe, lo que no existe es la
  tabla donde vive.
- El contador de aportes de `/ofrecer` marca cero.
- El mapa pierde el «en camino» de cada municipio.
- Guardar el canal general, o la fecha de comprobación de cualquier canal, falla al
  enviar el formulario.
- La ficha de un colegio o de un animal vuelve a dibujar dos iniciales en el
  círculo del retrato. `CaseKindChip` sí cubre esa ventana a mano —sin la columna se
  calla en vez de escribir «Persona o familia» encima de una familia de verdad—,
  pero el hueco del retrato no puede.

O sea que el primer caso avisa a gritos y se arregla desplegando; el segundo se
puede quedar días puesto sin que nadie lo note, mientras el portal le dice a quien
quiere donar que no hay a dónde.

### Y no es solo la aplicación

Dos archivos más del árbol dan por puestas esas migraciones, y conviene saberlo
antes de pegarlos con prisa:

- **`supabase/datos-de-prueba.sql`** nombra `case_kind`, `cases.summary` y
  `donation_verified_on`. Contra la base de hoy no corre. La carga de prueba que
  está puesta ahora es de una versión anterior de ese archivo: por eso hay dos
  fundaciones «(prueba)» que el archivo actual ya no inserta.
- **`supabase/verify.mjs`** pasa `0015`–`0018` en su lista. Su verde y su rojo
  hablan del árbol, nunca de la base real. Ver
  [`npm run verify:sql` no dice nada de la base real](#npm-run-verifysql-no-dice-nada-de-la-base-real).

### Cómo se hace

**El código primero, y las migraciones inmediatamente después.** El orden importa y va
al contrario de lo que parece: pegar SQL antes de desplegar suena a lo prudente, y aquí
es lo que rompe. Los dos huecos de arriba no son igual de graves, y hay que elegir cuál
se queda abierto los minutos que dure la maniobra:

- **Código desplegado y `0015`–`0018` sin pegar:** el portal sigue en pie, ninguna
  pantalla contesta 500, y —esto es lo que decide— **las cinco causas de Quibdó siguen
  publicando su canal**, porque a `0014` cada una lleva el suyo en su propia fila.
  Quien llegue desde un WhatsApp ve la causa y puede mandar dinero. Lo que se pierde es
  el canal general, el contador, el «en camino» y el chip de tipo de causa.
- **`0015` pegada y el código sin desplegar:** `/ciudades/quibdo` y `/donaciones`
  contestan **500**. Es la puerta por la que entra casi todo el mundo.

O sea que el hueco de arriba degrada y el de abajo tumba. Se deja abierto el de arriba.

Antes de empezar, con los cuatro en verde:

```bash
npm run lint && npx tsc --noEmit && npm run build && npm run verify:sql
```

1. Abre el editor de SQL de Supabase **con los cuatro archivos ya pegados y sin
   ejecutar**, en cuatro pestañas y en orden. Es lo que hace que el paso 3 sean cuatro
   clics y no cuatro copias.
2. **Despliega el código.**

   ```bash
   npx vercel --prod
   ```

   Sin `--prod` sale un despliegue de vista previa y producción se queda como está.
   **`git push` no despliega**: lo que hay publicado hoy no vino de una subida a GitHub
   —`origin/main` va cuatro commits por detrás de lo que sirve producción—, así que el
   push es control de versiones y el despliegue es este comando.
3. **Pega `0015`, `0016`, `0017` y `0018`, en ese orden**, sin esperar a comprobar nada
   entre medias. `0016` falla en seco si `0015` no está, que es la forma correcta de
   fallar.
4. Comprueba. Estas tres tienen que contestar `200`, y la ficha de Quibdó es la que
   estaría caída si el orden se hubiera invertido:

   ```bash
   for p in / /mapa /donaciones /municipios /ciudades/quibdo; do \
     printf "%s  %s\n" "$(curl -s -o /dev/null -w "%{http_code}" "https://chocoup.vercel.app$p")" "$p"; done
   ```

   Y en el editor de SQL, que el canal general esté puesto y que a Daniela se le haya
   vaciado el propio —mismo destino, otra frase en la ficha—:

   ```sql
   select (select count(*) from public.donation_channel) as canal_general,
          (select count(*) from public.cases where donation_key = '@soschoco') as fichas_con_la_llave_propia;
   ```

   `1` y `0`. Si sale `1` y `1`, la reconciliación de `0015` no corrió.

5. Abre la ficha de Quibdó, una causa y `/donaciones`, y mira que el canal general sale
   escrito con esas palabras. Si esas tres se ven, el resto se ve.

No lo hagas desde el Chocó y no lo hagas el mismo día del viaje.

---

## Lo que falta hoy

Comprobado, no supuesto:

- [ ] **Las migraciones `0015`–`0018`, con su despliegue.** Ver
      [el despliegue acoplado](#el-despliegue-va-acoplado-código-y-migraciones-00150018-en-el-mismo-rato).
      Mientras no estén, en la base real no hay canal general, ni lista de correos
      de avisos, ni contador, ni fecha de comprobación de ningún canal.
- [x] **`npm run verify:sql` está en verde**, 284 de 284, con `0014_sugerencias.sql` ya
      registrada en la lista del arnés. Estuvo en rojo a propósito mientras
      `/sugerencias` era trabajo a medias. Sigue sin decir nada de la base real. Ver
      [`npm run verify:sql`](#npm-run-verifysql-no-dice-nada-de-la-base-real).
- [ ] **La carga de prueba sigue en producción**, y es la mitad de lo que hay:
      dos de los tres municipios publicados se llaman «Istmina (prueba)» y «Bahía
      Solano (prueba)», tres de las ocho causas empiezan por «CASO DE PRUEBA» y
      **las siete ofertas son de prueba**. Se retira entera con
      `supabase/borrar-datos-de-prueba.sql`, que borra por la marca y nunca por
      fecha, así que se puede ejecutar con los casos reales al lado. **Hazlo antes
      de compartir el enlace**, no después. Cuenta con que al terminar `/ayudas` y
      `/ofrecido` se queden vacíos: hoy no tienen ni una fila real.

      Del lado del código esto ya no espera a nadie: `lib/demo-data.ts`, el
      interruptor `isDemoMode()`, la franja de aviso y las fotos de `public/demo`
      se borraron, y el portal solo lee Supabase. Por eso el borrado de la base
      ahora también se lleva las portadas `demo/ciudad-*` que antes se salvaban:
      sus JPG ya no existen y una fila superviviente pinta un hueco roto.
- [ ] **El circuito de una oferta nunca se ha recorrido con datos de verdad.** Las
      siete que hay las insertó la carga de prueba, no el formulario. Ofrecer,
      verificar, aceptar, anotar la entrega y verla salir sin nombre no se ha hecho
      aquí de punta a punta.
- [ ] **Ni app ni titular en ningún canal.** Los cinco casos reales de Quibdó
      publican un canal —cuatro el mismo número de contacto y Daniela la llave
      `@soschoco`— y ninguno lleva el nombre que la app enseña al confirmar, que es
      la única defensa de quien dona. Se rellena en la ficha de cada causa. Ver
      [Los canales de donación](#los-canales-de-donación).
- [ ] **`@soschoco` sigue escrita como canal propio de Daniela**, y `0015` la
      reconcilia sola: la vacía de su ficha y la deja como canal general del portal.
      El destino no cambia —misma llave, misma cuenta— y lo que cambia es lo que su
      ficha afirma. Hasta que se pegue, la ficha dice que ese canal es de ella.
- [ ] **Una sola cuenta del equipo**, `chocoup26@gmail.com`, de coordinación. Nadie
      ha entrado nunca con el rol de documentación contra esta base de datos. Ver
      [Cuentas del equipo](#cuentas-del-equipo).
- [ ] **De los diez municipios de la semilla solo hay tres cargados.** Los otros
      siete vuelven pasando otra vez `supabase/seed.sql`, que los reinserta con sus
      coordenadas y sin publicar.
- [ ] **Quibdó sin resumen, sin foto propia y sin necesidades de zona.** Las seis
      necesidades de zona que hay son de los dos municipios de prueba, así que la
      ficha de Quibdó se presenta con «0 necesidades abiertas» —y ese mismo texto es
      el que viaja al compartir el enlace por WhatsApp—. Sus 36 fotos son todas de
      sus causas, así que la portada del municipio sale con el hueco.
- [ ] **Ninguna de las 49 fotos tiene encuadre guardado**, así que todas usan el
      recorte por omisión de cada caja. Ver [Fotos](#fotos).

Lo que sí está: catorce migraciones aplicadas, tres municipios publicados, ocho
causas publicadas y con consentimiento, 49 fotos con sus miniaturas en Storage,
siete avances, diecinueve necesidades, siete ofertas —tres sin revisar y tres ya
entregadas, o sea `/ayudas` y `/ofrecido` con tres filas cada uno— y el buzón de
sugerencias vacío.

Buena parte de eso es carga de prueba. **Lo real es Quibdó, sus cinco causas con 36
fotos, diez necesidades y cinco avances, y `@soschoco`.** Las 36 fotos son todas de
las causas: Quibdó no tiene ni una foto propia del municipio, así que su ficha se
presenta con el hueco en el sitio de la portada.

---

## El panel: una puerta y tres secciones

El panel tenía cinco entradas en la barra y la lista de municipios metida dentro de
la primera, que además se llamaba «Panel», igual que el panel entero. Ahora se entra
por **`/admin`** y hay tres secciones. El reparto y su razonamiento están escritos
una vez en `lib/admin-sections.ts`, que es lo que hay que leer si algo no aparece
donde se esperaba.

| Sección | Dónde | Qué se hace |
| --- | --- | --- |
| **Ciudades** | `/admin/ciudades` | Llegar a un pueblo y contar qué pasó: su resumen, sus fotos, las necesidades de la zona. Se hace una vez por municipio y luego se corrige. |
| **Casos** | `/admin/casos` | Documentar una causa y seguirla: historia, retrato, necesidades, diario de avances y a dónde va su dinero. Se vuelve cada semana. |
| **Recursos ofrecidos** | `/admin/recursos` | Verificar, aceptar o negar lo que ofrece el público, y anotar cuándo llegó. No lo decide el equipo: llega cuando llega y se resuelve el mismo día. |

La puerta no es un menú: cada tarjeta lleva su número —cuántos municipios sin
publicar, cuántas causas sin avance, cuántas ofertas sin revisar—, que es lo que se
viene a preguntar. Y avisa aparte, solo a coordinación, cuando hay un destino de
dinero con la comprobación vieja.

Dos pantallas no son ninguna de las tres y van juntas al lado de la cuenta:
**`/admin/equipo`** (quién puede entrar, solo coordinación) y **`/admin/sugerencias`**
(el buzón de lo que el público dice sobre el portal). Y dentro de las secciones
cuelgan dos pantallas que conviene saberse de memoria:

- **`/admin/casos/dinero`** — el repaso de todos los destinos de dinero y el único
  sitio donde se edita el canal general. Solo coordinación.
- **`/admin/recursos/avisos`** — los correos de quien pidió novedades. Solo
  coordinación.

### Las direcciones viejas siguen llevando a algún sitio

Están escritas en marcadores y en mensajes de WhatsApp que no se pueden editar
desde el repositorio, así que hay un desvío:

| Si tienes guardado | Aterrizas en |
| --- | --- |
| `/admin/ofertas` | `/admin/recursos` |
| `/admin/donaciones` | `/admin/casos/dinero` |

La lista de correos de avisos **no** está al otro lado de ese segundo desvío: estaba
debajo de aquella pantalla y ahora vive en `/admin/recursos/avisos`. Quien la busque
por la dirección vieja va a aterrizar en el repaso del dinero y no la va a
encontrar.

La ficha de una causa **no se ha movido**: sigue en
`/admin/ciudades/<slug>/casos/<id>`, que es la dirección que ya tenía. La barra la
marca como Casos, que es a donde pertenece.

---

## Los canales de donación

**Hay un canal general del portal y, si alguien le abre uno, el canal propio de cada
causa. No hay canales de municipio y no hay fundaciones.** Una causa sin canal
propio **recibe por el general, y su ficha lo dice con esas palabras**: no lo
presenta como si fuera suyo. Un canal puede ser una **llave de transferencia**
(`@soschoco`, que se copia y se pega en la app del banco), un **enlace de
recaudación** (una Vaki, que se pulsa) o un **número de contacto** (al que se llama
o se escribe para coordinar el aporte), nunca dos a la vez.

Aquí hubo primero una llave global del portal (`0010`) y **se retiró** (`0011`),
porque un destino que nadie eligió para una familia, presentado en su ficha como el
suyo, manda el dinero a otro sitio sin que se note mirando la pantalla. `0015` vuelve
a poner un canal general y **la preocupación no ha cambiado**: lo que cambia es cómo
se cumple. Antes callando —una causa sin canal se quedaba sin poder recibir nada, que
también es fallarle—; ahora diciéndolo. Esa frase es la condición con la que entró el
general, y vive en un solo sitio del código (`GeneralChannelNote`) para que ninguna
pantalla la diga más corta que las otras.

Una causa puede ser **una persona, un colegio, un animal o una fundación**. Una
fundación que trabaje en el Chocó ya no es una entidad aparte con su propio
formulario: entra como una causa más, con su historia, sus necesidades y su canal si
lo tiene.

### Dónde está cada uno

| Canal | Dónde se edita | Dónde sale |
| --- | --- | --- |
| **El general del portal** | `/admin/casos/dinero` | Arriba de `/donaciones`, y en la ficha de cada causa que no tenga el suyo |
| **El de una causa** | `/admin/ciudades/<slug>/casos/<id>` | Solo en su ficha y en su tarjeta de `/donaciones` |

El general es la única excepción a la regla de que cada destino se cambia en la
ficha de quien lo recibe, y es por lo mismo que la regla existe: **no recibe nadie en
particular**, así que no tiene ficha donde vivir, y ponerlo en la de un municipio o
de una causa haría creer que es suyo.

Para verlos todos juntos, **`/admin/casos/dinero`**. Es el repaso de todos los
destinos que el portal publica ahora mismo, con la fecha de la última comprobación
de cada uno y un enlace a la ficha donde se cambia. Lista aparte los que aún no
salen —municipio sin publicar, causa en borrador o sin consentimiento—, que se
revisan cuando todavía no hay dinero de por medio. Es la pantalla que hay que abrir
el día que el dinero aparezca donde no debe.

Ahí no hay ninguna cifra de lo recaudado, y no es un hueco: el dinero no pasa por el
portal y no hay nada que sumar.

### Cómo se cambia uno

**Entra donde se edita, escribe el canal y guárdalo. Eso es todo.**

No hay que editar ningún archivo, ni hacer commit, ni desplegar, ni volver al SQL
Editor. Se cambia desde el móvil y el cambio sale en la siguiente carga. Está
pensado así justo porque estos destinos van a cambiar con el equipo de viaje:
**no están en el código a propósito**, porque una constante habría exigido un
despliegue y en el Chocó no va a haber quien lo haga.

El formulario está aparte del resto de la ficha y tiene su propio botón, y eso es
deliberado: cambiar a dónde va el dinero de alguien no puede ser un efecto de
guardar su historia. Son los mismos seis campos para una causa y para el general:

| Campo | Qué hace si está | Qué pasa si falta |
| --- | --- | --- |
| **La llave** | Sale escrita entera y en grande, para copiarla | Si no hay ninguno de los tres, la ficha dice que todavía no hay a dónde enviar —o que recibe por el general, si es una causa— |
| **…o el enlace** | Sale como botón «Donar dinero», con el destino escrito debajo | Lo mismo |
| **…o el número** | Sale en «Enviar dinero» como el número al que llamar o escribir | Lo mismo |
| **En qué app se usa la llave** | «Bre-B», «Nequi»… al lado de la llave y en los pasos | El portal dice «tu app de banco o billetera»: es cierto, pero hace dudar |
| **A nombre de quién aparece** | El portal pide comprobar ese nombre antes de confirmar | Se le pide mirarlo igual, sin decirle cuál es la respuesta correcta |
| **Qué día lo comprobaste** | La ficha pública lo dice, y a los 60 días deja de presentarlo como reciente | La ficha no dice nada, que es lo correcto: callar no es lo mismo que dar por comprobado |

Los tres primeros son excluyentes. **Rellena uno**: con dos escritos el formulario se
niega a guardar, y con razón, porque no habría forma de saber cuál recibe. La base de
datos lo rechaza igual.

Ese quinto campo es la única defensa de quien dona: `@soschoco` no dice nada por sí
mismo, y el nombre que le sale en la app antes de confirmar sí. **Escríbelo
exactamente como lo muestra la app**, y si no lo sabes con seguridad, déjalo vacío
antes que poner uno aproximado —un nombre que no coincide enseña a ignorar la
comprobación—.

### La fecha de comprobación

Es lo único que el portal puede afirmar con honestidad sobre a dónde va el dinero,
porque el dinero no pasa por aquí y no hay nada que el portal pueda proteger. De ahí
que no haya ninguna insignia de «donación protegida» y sí una fecha.

**Comprobar es llamar al número, o mandar mil pesos a la llave y mirar qué nombre
sale.** Escribe el día en que lo hiciste, no el día en que escribiste el canal:
«editado» no es «comprobado». Tres cosas que hace la base de datos y no hay que
recordar:

- Rechaza una fecha futura.
- **Si cambias el destino, borra la fecha sola**, a menos que escribas una nueva en
  el mismo guardado. Es lo que impide que quede «Comprobado el 3 de agosto» debajo
  de una llave que se cambió el 12 de septiembre.
- Deja la fecha en el mismo cerrojo que el canal: quien pudiera escribir que un
  destino está comprobado sin haberlo comprobado estaría escribiendo la frase que el
  portal pone para que alguien se fíe.

A los **60 días** el portal deja de presentar la comprobación como reciente. El
número tiene que ser uno que se alcance: a los treinta, medio portal estaría marcado
como viejo en su estado normal y la marca se leería como avería; a los ciento
ochenta, la ficha afirmaría media campaña que esto está vigilado. Si el equipo acaba
comprobando los canales cada mes, ese número sobra y hay que subirlo.

La puerta del panel avisa sola cuando hay algo que mirar, y solo a coordinación:
cuántos destinos publicados llevan más de 60 días sin comprobarse y cuántos no se
han comprobado nunca.

### Si un canal se compromete

**Vacía los tres campos de destino y guarda.** En la misma petición esa ficha deja de
ofrecerlo. Si es el de una causa, pasa a recibir por el general; si es el general,
todas las causas sin canal propio dicen que todavía no hay a dónde enviarles. No hace
falta tener a mano el siguiente ni esperar a nadie: eso es lo primero, y se hace en
veinte segundos.

Vaciar el general es la decisión más grande de esa pantalla y por eso está dicho ahí
mismo: es el destino con más alcance del portal, y la propia lista dice cuántas
causas publicadas reciben por él sin haberlo elegido.

### Quién puede tocarlos

Solo coordinación, comprobado en tres capas independientes: la ficha no ofrece el
campo, la Server Action lo rechaza, y el disparador `guard_donation_channel` para el
cambio aunque la llamada llegue desde fuera de la web con una sesión de
documentación.

**La tercera capa es la que hubo que pensar.** Quien documenta un municipio *sí*
puede editar sus casos —es su trabajo, y lo hace desde el móvil delante de la
familia—, así que las políticas de fila dejan pasar la escritura entera y sin el
disparador cambiar el canal sería una edición más de la ficha. El disparador mira el
cambio y no el valor, de modo que esa misma persona sigue guardando la ficha completa
con el canal ya puesto sin tropezar con él.

El canal general no necesita ese disparador y le basta su política: esa tabla no
tiene ninguna otra escritura legítima.

```sql
-- Todos los destinos de dinero que publica el portal ahora mismo.
-- Es lo mismo que enseña /admin/casos/dinero. Necesita 0015 y 0016.
select 'general' as nivel, 'Canal general del portal' as quien,
       donation_key, donation_url, donation_phone,
       donation_app, donation_holder, donation_verified_on
from public.donation_channel
union all
select 'caso', display_name, donation_key, donation_url, donation_phone,
       donation_app, donation_holder, donation_verified_on
from public.cases
where donation_key <> '' or donation_url <> '' or donation_phone <> '';
```

### Lo que un canal no hace

**Nada se hereda de nadie con nombre.** Una causa sin canal propio no usa el de otra
causa ni el de su municipio —que ya no existe—: usa el general, y su ficha lo dice.
Y al revés, el canal de una causa no lo toma nadie más: es de ella y sale solo en su
ficha y en su tarjeta.

Esa distinción es todo lo que queda de la regla vieja y es la que sostiene el modelo.
Heredar en silencio mandaría el dinero a un sitio que nadie eligió para esa persona,
porque quien lee su historia y transfiere cree estar dándole a ella. El general no
hace eso: no se presenta como suyo y dice lo que se hace con lo que entra —lo
verifica coordinación en primera instancia y se reparte entre las causas publicadas
en la plataforma—.

---

## Migraciones

Se pegan en el **SQL Editor** de Supabase, en este orden, y **son dieciocho**:

```
0001_init                        tablas, RLS y el bucket fotos
0002_roles_y_ayudas              roles del equipo y el registro público
0003_retrato_del_caso            qué foto de la persona es su retrato
0004_una_fundacion_por_municipio SUPERADA por 0015: una sola fundación por municipio
0005_registro_sin_texto_libre    el registro publica la categoría, no el texto
0006_seguimiento_del_caso        el diario fechado y el enlace de donación del caso
0007_foto_del_avance             cada avance lleva una foto del propio caso
0008_permiso_de_tabla_del_publico recorta el permiso de tabla de anon
0009_encuadre_de_fotos           encuadre y zoom por foto
0010_llave_de_transferencia      SUPERADA: la llave global, que 0011 retira
0011_canal_de_donacion           el canal de cada municipio y de cada caso
0012_registro_de_lo_ofrecido     el muro de lo prometido, y el estado «retirada»
0013_canal_de_telefono           el teléfono como tercer formato del canal
0014_sugerencias                 el buzón de errores e ideas del portal
0015_canal_general               un solo canal general; fuera fundaciones y canales
                                 de municipio; correo de avisos y contador de aportes
0016_ficha_de_causa              qué es la causa, su frase corta, y desde cuándo
                                 nadie ha comprobado su canal
0017_donaciones_preparadas       la tabla donde caerán los importes el día que haya
                                 pasarela. No trae pasarela
0018_tablero                     el foco del momento y el «en camino» de un pueblo
seed.sql                         los 10 municipios, sin publicar
```

`0015` es la que cambia el modelo, y **no se puede adelantar al despliegue**: ver
[el despliegue acoplado](#el-despliegue-va-acoplado-código-y-migraciones-00150018-en-el-mismo-rato).
Es la única del proyecto con esa condición, porque es la única que borra columnas y
una tabla que el código publicado sigue leyendo.

`0016` va detrás de `0015` y falla en seco si no está: toca `public.donation_channel`,
que `0015` crea. Fallar así es correcto —para antes de tocar nada—.

`0009` llegó después que las demás y **no es opcional**: `lib/data.ts` pide `focus_x`,
`focus_y` y `zoom` por su nombre, así que una base con `0001`–`0008` deja la ficha del
municipio y las listas de casos sin casos y sin que se vea nada. El error viaja aparte
y esas funciones solo leen los datos.

`0011` falla de otra manera, más callada: sin ella las columnas del canal no existen y
las fichas dicen que nadie tiene canal, sin error en ningún sitio. **Si ninguna ficha
ofrece a dónde enviar dinero, lo primero que hay que mirar es si las migraciones del
canal están aplicadas** —`0011` para el de una causa, `0015` para el general—.

Todas se pueden volver a pegar sin romper nada. Lo que importa es el orden, y solo en
cinco sitios. Están escritos en la cabecera de los propios archivos:

| Si vuelves a pegar | Pega detrás | Porque si no |
| --- | --- | --- |
| `0001` | `0002` | El equipo se queda otra vez con permiso para todo |
| `0002` | `0005` **y luego** `0008` | El registro público vuelve a publicar el texto libre de quien ofreció la ayuda |
| `0005` | `0008` | La vista `aid_log` nace de nuevo con el juego completo de permisos concedido al público |
| `0001` **o** `0002` **o** `0004` **o** `0008` | `0015` | Vuelve al portal la tabla de fundaciones, con su enlace de donación y su lectura pública, y ninguna pantalla la enseña |
| `0010` | `0011` | Vuelve al portal una llave global que dice que el dinero de todo el Chocó va al mismo sitio |

Las dos últimas filas son la misma trampa dos veces, y es fácil de pisar porque
`0004` y `0010` siguen en la carpeta y sus nombres suenan a lo que uno busca. **Las
dos están superadas**: se quedan para que el histórico se pueda reconstruir en orden,
y sus propios archivos lo dicen en la cabecera. Pegadas sueltas, deshacen la
corrección de la siguiente.

El histórico completo sí se puede reconstruir sin miedo, y eso está pensado: `0010`
crea `donation_key`, `0011` la borra y `0015` crea `donation_channel`, que es otra
tabla con otro nombre. Pegadas en orden no hay colisión y no quedan dos canales
generales, porque solo uno de los dos sobrevive a su migración siguiente.

La segunda fila es una cadena de tres archivos y es la que se hace a medias: `0002`
crea `aid_log` con el texto dentro, `0005` la rehace sin él, y ese `create view` le
devuelve a la vista los permisos de nacimiento, que es lo que `0008` vuelve a
recortar. Pegar `0002` y `0005` sin `0008` deja la mitad del arreglo puesta. Las
vistas de `0012` y `0015` no tienen ese problema: cada una se recorta los permisos en
su propio archivo, así que no hay que pegar nada detrás.

Las tablas tampoco: se crean con `if not exists`, así que volver a pegarlas no las
recrea ni les toca los permisos. Y la fila del canal general entra con `on conflict do
nothing` por un motivo que conviene conocer: un `do update` ahí devolvería el canal a
`@soschoco` el día que ya fuera otro, o sea un mantenimiento rutinario mandando las
donaciones a una cuenta vieja, sin ningún error a la vista.

### Lo que hay aplicado de verdad

El registro de `supabase_migrations.schema_migrations` de la base real, en el orden en
que entraron:

```
0001_init · 0002_roles_y_ayudas · 0003_retrato_del_caso
0002b_revoke_anon_team_functions
0005_registro_sin_texto_libre · 0004_una_fundacion_por_municipio
0006_seguimiento_del_caso · 0007_foto_del_avance
0008_permiso_de_tabla_del_publico · encuadre_de_fotos
0010_llave_de_transferencia · 0011_canal_de_donacion
0012_registro_de_lo_ofrecido · canal_de_telefono · sugerencias
```

Catorce. **Faltan `0015`, `0016`, `0017` y `0018`**, y eso es lo primero de este
documento.

Cuatro rarezas, y ninguna de las cuatro hay que arreglar:

- **`0004` entró detrás de `0005`.** No importa: `0004` solo toca la tabla de
  fundaciones y no roza la vista ni los permisos. Comprobado que el recorte de `0005`
  sigue en pie. Y `0015` se lleva esa tabla entera, así que el asunto se cierra solo.
- **`0002b_revoke_anon_team_functions` no existe como archivo.** Fue un parche suelto
  —retirar `execute` de las cuatro funciones `team_*` a `public` y a `anon`— que hoy
  está dentro de `0002`. No hay nada que volver a pegar.
- **`0010` figura como aplicada y su tabla ya no existe.** Es correcto: `0011` entró
  detrás y la borró. El registro cuenta lo que pasó, no lo que hay.
- **`0009`, `0013` y `0014` figuran sin su número** (`encuadre_de_fotos`,
  `canal_de_telefono`, `sugerencias`). Es el nombre con el que se pegaron y no
  significa nada; lo que cuenta es que sus columnas y sus tablas están.

Y cinco comprobaciones de que lo delicado está donde debe:

- La vista real publica `category` y no el texto de quien ofreció la ayuda: `0005`
  está puesto.
- `anon` tiene `select` en las tablas públicas y, fuera de `select`, solo `insert` en
  `offers` y en `feedback`: `0008` y `0014` están puestos.
- `photos` tiene `focus_x`, `focus_y` y `zoom`: `0009` está puesto.
- `cases` tiene las cinco columnas del canal, con su disparador, y
  `public.donation_key` no existe: `0011` y `0013` están puestos.
- `public.offer_log` existe y `anon` la lee: `0012` está puesto.

---

## Cuentas del equipo

El portal entra con correo y contraseña (`signInWithPassword`) y **no tiene registro,
ni recuperación, ni pantalla para cambiar la contraseña**. No es un hueco por
rellenar: es la decisión de que las cuentas se creen a mano antes de salir.

Cada persona necesita **dos cosas, y son dos pasos independientes en dos sitios
distintos**. Es el error fácil de este proyecto porque cada paso, por separado,
parece haber funcionado.

**1. La cuenta.** Supabase → **Authentication → Users → Add user**, con
***Auto Confirm User* marcado**. Ahí se le pone la contraseña y ese es el único sitio
donde se pone. Sin este paso no puede entrar.

**2. El permiso.** En el portal, **`/admin/equipo`**: su correo, su rol y sus
municipios. Sin este paso entra y no ve el panel.

Con solo el paso 1, la persona entra y no puede hacer nada. Con solo el paso 2, tiene
permisos y ninguna puerta. El correo de los dos pasos tiene que ser el mismo.

`/admin/equipo` reparte permisos sobre un correo y nunca crea cuentas, y por eso se
puede invitar a alguien antes de que exista su cuenta: la primera vez que entre
encontrará sus municipios esperando.

Un enlace de invitación mandado desde el panel de Supabase no sirve para dar de alta
a nadie: deja una sesión abierta pero no una contraseña, y el portal no tiene dónde
ponerla.

Y no quites a la última persona de coordinación: es quien reparte los permisos, y
desde el panel no hay forma de arreglarlo. La pantalla no ofrece quitarse a uno
mismo, y las Server Actions y la base de datos lo rechazan igual.

### Probarlo con dos cuentas reales antes de salir

Hoy hay **una sola cuenta** en la base real —`chocoup26@gmail.com`, coordinación,
confirmada y con sesión ya iniciada—, así que el rol de documentación no se ha
ejercido nunca aquí. Las comprobaciones del arnés lo prueban a fondo, pero contra una
base en memoria: lo que no se ha visto es una persona con su teléfono, su contraseña y
esta base de datos.

Da de alta **dos cuentas de verdad, una de cada rol**, y con la de documentación
comprueba las seis cosas que la separan de coordinación:

- Escribe en el municipio que le asignaste.
- Ve **«Solo lectura»** en un municipio que no es suyo.
- No puede publicar un municipio ni crear uno.
- **En la ficha de una causa suya ve el canal de donación pero no el formulario**, y
  guardar el resto de la ficha —nombre, historia, consentimiento, avances— sigue
  funcionando con el canal puesto. Esa última parte es la que hay que mirar de verdad:
  es lo que se va a hacer cuarenta veces en el viaje.
- En `/admin/casos/dinero` le dice que esa pantalla es de coordinación, y en
  `/admin/recursos/avisos` que esa lista también.
- En `/admin/equipo` no le sale ni la entrada en la barra.

Que cada persona entre una vez desde su propio teléfono, con datos y no con WiFi.
Descubrir en Quibdó que una contraseña no se copió bien es una tarde perdida.

---

## Que el portal se vea

Para que una causa se vea entera y se le pueda enviar dinero hacen falta cuatro cosas,
en este orden:

1. **El municipio publicado.** Solo coordinación; lo impone el disparador
   `cities_guard_publication`. Hasta entonces nada de ese municipio existe para el
   público: ni fotos, ni necesidades, ni casos, aunque estén publicados uno a uno.
2. **La causa con su consentimiento**, y publicada. La casilla se marca **solo si la
   persona lo autorizó**: sin ella el caso se guarda y no se puede publicar, y no es
   cosa del formulario sino de la restricción `cases_publish_requires_consent`.
3. **Un canal donde recibir.** El propio de esa causa, si alguien le abrió uno, o el
   general del portal. Los dos son de coordinación. Solo si no hay ninguno de los dos
   dice la ficha que todavía no hay a dónde enviarle.
4. **La comprobación del canal**, escrita con la fecha del día en que se hizo. No
   hace falta para que se vea, y sí para que lo que se ve diga la verdad entera.

Lo que hoy produce el estado de la base, comprobado:

- **Las cinco causas reales de Quibdó publican un canal propio**: cuatro el mismo
  número de contacto y Daniela la llave `@soschoco`. Ninguna lleva titular ni fecha de
  comprobación, porque las dos cosas no constan y no se han inventado.
- La ficha de Quibdó ya **no tiene canal ni tarjeta de fundación**, y no es una
  carencia: un municipio no recibe dinero en este modelo. Lo que ofrece es entrar a
  sus causas y ofrecer un recurso.
- `/donaciones` es **una sola lista**, no tres pestañas. Arriba el canal general
  —vacío hasta que se pegue `0015`— y debajo las causas, primero las que tienen canal
  propio.
- Las causas de prueba que tienen canal llevan valores de muestra —un enlace a
  `example.org` y una llave `@caso-de-prueba` cuyo titular está escrito «Caso de
  prueba (no es real)»—. Es lo correcto en una carga de muestra: `example.org` está
  reservado justo para esto, y los canales de muestra no pueden apuntar a una Vaki
  viva de un tercero, porque ese es el botón que mueve dinero.

Falta también el resumen de Quibdó y sus necesidades **de zona**. La lista de
necesidades sí muestra las de sus casos, con el nombre de la familia al lado, pero el
titular de la ficha cuenta solo las de zona, así que hoy Quibdó se presenta con
**«0 necesidades abiertas»** —y ese mismo texto es el que viaja al compartir el enlace
por WhatsApp—.

---

## Fotos

```bash
python3 scripts/build-case-photos.py <carpeta-de-origen> \
    --retrato IMG_1450.PNG --ciudad <city_id> --caso <case_id>
```

De cada foto salen dos JPEG con el mismo nombre —el grande de 1600 px y su `-mini` de
400—, que es la pareja que espera el portal, más un `manifiesto.json` con las rutas de
Storage listas para pegar. La salida va a `<origen>/procesadas` y no al repositorio:
son personas identificables y ninguna regla de `.gitignore` las tapa.

El script hace tres cosas que el navegador no sabe hacer:

- **Quita las franjas negras** de los cuatro lados, midiendo el tramo con contenido y
  no el primer píxel que no es negro, para no comerse el cielo de una foto a
  contraluz ni dejar pegada la barra gris del iPhone.
- **Borra los metadatos** reconstruyendo la imagen desde sus píxeles, así que no queda
  nada de dónde colgarse, y **vuelve a abrir el archivo escrito para comprobarlo**: si
  sobrevive un EXIF, un XMP, un perfil ICC o cualquier `APPn`, para en vez de
  entregarlo.
- **Deja las dos versiones** con el submuestreo y el JPEG progresivo que hacen que una
  foto se vea entera y borrosa antes de verse nítida, en vez de aparecer por franjas.

Pon bien `--ciudad` y `--caso`. La carpeta de Storage es lo que ataca la política que
decide quién puede subir ahí, así que una carpeta inventada no es un nombre feo: es la
foto de una persona colgada del municipio equivocado. Sin esas dos, el manifiesto deja
las rutas en nulo a propósito, para que nadie las invente después.

### El GPS

Una foto de móvil escribe dentro del archivo dónde se tomó, con qué aparato y a qué
hora. El bucket `fotos` es público —comprobado—, así que la URL de una foto es también
la descarga del archivo entero. Publicar las coordenadas de la vivienda de una persona
a la que además se nombra, en un territorio con actores armados, es el daño más grande
que puede hacer este portal.

**Las capturas de pantalla no llevan GPS. Los archivos originales sí.** Es la trampa:
si alguien manda las fotos «en calidad original» en vez de una captura, el GPS viaja
con ellas y llega intacto. No se distingue mirando la imagen. Pásalas todas por el
script y no decidas por foto.

**Los originales sin procesar no se suben nunca por el panel.** El navegador comprime
antes de subir, pero no sabe quitar las bandas negras, y una banda no es un defecto
estético: cambia el recorte de todas las cajas del portal —el círculo del retrato, el
3:2 del carrusel, el cuadrado del diario—.

Si una foto sale mal encuadrada ya subida, no hay que volver a subirla: desde `0009`
cada foto guarda su propio encuadre y su zoom, y el archivo de Storage sigue entero.
Hoy ninguna de las 49 fotos de la base real tiene encuadre guardado, así que todas
usan el recorte por omisión de cada caja.

---

## `npm run verify:sql` no dice nada de la base real

Esto costó descubrirlo, así que va aparte.

`npm run verify:sql` levanta un Postgres en memoria, le pasa los archivos de migración
y comprueba las reglas de acceso. **Es una prueba buena y no prueba lo que parece.**

**Su verde dice que los archivos son coherentes entre sí. No dice nada de lo que tiene
puesto la base de datos de verdad.** Hubo un día en que estaba en verde mientras a la
base real le faltaban `0005` y `0008`: el registro público estaba publicando el texto
libre que escribió quien ofreció la ayuda, y `anon` conservaba `select` sobre la tabla
de ofertas. Las pruebas no podían verlo porque no la miran. Hoy pasa lo mismo con
`0015`–`0018`, al revés: el arnés los pasa y la base real no los tiene.

### Estuvo en rojo a propósito, y ya está cerrado

Durante un tiempo se detenía en la primera comprobación:

```
FALLA  El arnés pasa todos los archivos de migración que hay en la carpeta
       fuera de la lista: 0014_sugerencias.sql
```

`0014_sugerencias.sql` estaba en la carpeta y no en la lista `MIGRATIONS` de
`supabase/verify.mjs`, y el hueco era una decisión: `/sugerencias` se estaba escribiendo
y quien lo escribía decidía cuándo registrarla. Cerrado `/sugerencias`, se añadió la
línea y **el informe se puso verde de una vez, sin ningún otro ajuste** —284 de 284—,
que es exactamente lo que tenía que pasar: los permisos de `feedback` y la cuenta de
políticas ya estaban escritos contando con ella.

Que se detuviera en seco y no siguiera era lo correcto: con una migración de la carpeta
sin pasar, todo lo que viniera después estaría comprobando un esquema que no es el del
proyecto.

Hubo otro hueco de la misma familia, y este sí está cerrado: la lista `MIGRATIONS` se
quedó en `0008` y el informe daba verde sin haber mirado nunca el encuadre. De ahí
viene esa primera comprobación: el arnés se mira la carpeta él solo y un archivo que
no esté en la lista lo para y sale nombrado. Editar dos sitios y acordarse de los dos
ya no es la garantía.

Lo que el arnés comprueba de los canales, para saber qué queda cubierto sin mirarlo:
que solo coordinación los escriba —probado también desde la sesión de quien documenta
ese mismo municipio, y comprobando que esa persona sigue pudiendo guardar el resto de
la ficha—; que un canal sea una llave, un enlace o un número y nunca dos; que haya un
solo canal general; que la llave global de `0010` no vuelva al pegar el histórico en
orden; que el municipio ya no tenga canal ni columna donde volver a tenerlo; que la
tabla de fundaciones no exista, y no solo que esté vacía; que un importe de donación no
se pueda escribir desde el navegador ni con la sesión de coordinación; y que el
contador de aportes entregados dé exactamente lo mismo que el largo del registro
público de ayudas.

### Para saber qué tiene la base real hay que preguntárselo

Estas tres, en el SQL Editor, contestan lo que importa:

```sql
-- ¿Qué migraciones han dejado su marca? Las cuatro últimas tienen que aparecer
-- el día del despliegue, y hasta entonces no.
select version, name from supabase_migrations.schema_migrations order by version;

-- ¿Está cada pieza donde debe? Todas tienen que dar VERDADERO menos las dos
-- últimas, que tienen que dar FALSO.
select
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='aid_log' and column_name='category')
    as recorte_0005,
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='photos' and column_name='focus_x')
    as encuadre_0009,
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='cases' and column_name='donation_key')
    as canal_del_caso_0011,
  exists (select 1 from information_schema.views
          where table_schema='public' and table_name='offer_log') as muro_0012,
  exists (select 1 from information_schema.tables
          where table_schema='public' and table_name='donation_channel')
    as canal_general_0015,
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='cases' and column_name='donation_verified_on')
    as comprobacion_0016,
  -- Tiene que dar FALSO. Verdadero significa que alguien volvió a pegar 0010 sin
  -- 0011 detrás y el portal tiene otra vez una llave global.
  exists (select 1 from information_schema.tables
          where table_schema='public' and table_name='donation_key') as llave_global_de_vuelta,
  -- Tiene que dar FALSO en cuanto 0015 esté puesta. Verdadero antes de eso es lo
  -- normal; verdadero después significa que alguien volvió a pegar 0001 o 0004 sin
  -- 0015 detrás, y el portal tiene otra vez un enlace de donación de lectura
  -- pública que ninguna pantalla enseña.
  exists (select 1 from information_schema.tables
          where table_schema='public' and table_name='foundations') as fundaciones_de_vuelta;

-- ¿Está el permiso recortado de 0008? Tienen que salir dos filas y solo dos:
-- `offers` con INSERT y `feedback` con INSERT. Ninguna otra con nada que no sea
-- SELECT. Cuando 0015 esté puesta, `newsletter_signups` con INSERT es la tercera.
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

Tiene que contestar `401` y `permission denied for table offers`. Si contesta `200` y
`[]`, falta `0008`: la política aguanta sola, pero el día que alguien añada una lectura
para depurar algo salen los teléfonos de quienes ofrecieron ayuda. Comprobado hoy:
contesta el error. Lo mismo vale para `feedback` y, cuando exista,
`newsletter_signups`: el público las escribe y no las lee, ni para contarlas.

---

## Avisos de Supabase que se dejan en paz

El *Security Advisor* saca hoy nueve avisos. Ocho no hay que atender, y conviene saber
por qué antes de que alguien los «arregle» con prisa.

**`aid_log` y `offer_log` marcadas como vistas `security definer` (ERROR).** Es
exactamente lo que tienen que ser. Corren con los derechos de su propietario porque es
lo único que sabe enmascarar columnas —el nombre de quien ofreció la ayuda, su
contacto, su mensaje—, y porque el público no tiene ni política ni permiso sobre
`public.offers`: pasarlas a `security_invoker` deja `/ayudas` y `/ofrecido` vacíos para
todo el mundo, o obliga a abrir `offers`, que es justo lo que cerraron dos migraciones.
Si algún día se toca una de las dos, hay que revisar las condiciones de la cascada de
publicación que llevan escritas a mano en el filtro y en los `join`. Cuando `0015` esté
puesta, `offer_tally` y `city_offer_activity` saldrán en esta misma lista y por el
mismo motivo.

**`private.team_members` y `private.team_city_assignments`, con RLS y sin políticas
(INFO).** También a propósito, y es la configuración más cerrada que existe: RLS activa
y ninguna política significa que nadie llega a esas filas por la API. El esquema
`private` no está expuesto y la única entrada son las funciones `private.*`, que
comprueban el rol dentro. Añadir una política ahí sería abrir lo que está cerrado.

**Las cuatro funciones `team_*` ejecutables por `authenticated` (WARN).**
`team_session()`, `team_directory()`, `team_save_member()` y `team_remove_member()`. Es
deliberado: `0002` les retira `execute` a `public` y a `anon` y se lo concede solo a
quien tiene sesión, y cada función vuelve a comprobar el rol por dentro. Nada que
hacer.

**Y la regla que no es un aviso: en este proyecto no se usa la `service_role`.** Ni en
`.env.local`, ni en Vercel, ni en un script de una tarde. Ese rol tiene `bypassrls`,
así que con esa clave en la mano no queda en pie nada de lo de arriba: ni las
políticas, ni el permiso de tabla, ni el consentimiento. Todo el acceso pasa por RLS
con la clave publicable. Comprobado que hoy el código no la lee en ningún sitio.

La única excepción vive en el futuro y está escrita en `0017`: el día que haya
pasarela, el webhook del proveedor será lo único que pueda escribir un importe, y su
credencial no baja nunca al navegador. Por eso la barrera de esa tabla se traza en el
rol de conexión y no en el rol del equipo: coordinación tampoco puede teclear un
importe a mano, porque un importe no es un dato que alguien decida, es un hecho que el
banco confirma.

**El noveno aviso no es de los de dejar en paz, y no lo he tocado.** *Leaked password
protection* está desactivado: es un interruptor en Authentication que compara la
contraseña contra HaveIBeenPwned al crearla. Aquí la contraseña es la única puerta y no
hay recuperación, así que merece pensarlo, pero cambia lo que pasa al dar de alta una
cuenta y eso es una decisión, no un arreglo.

---

## Lo que no he podido comprobar

- **El despliegue acoplado, hecho.** Lo que está comprobado es el hueco: qué falta en
  la base real y qué lee el código de cada lado. Lo que no se ha visto es la maniobra
  ocurriendo, y es la única de este documento que se hace una sola vez y con el portal
  publicado delante.
- **Si las fotos que están hoy en el escritorio llevan GPS.** No las he abierto. Lo
  verificado es lo que el script hace con lo que se le dé, y que se niega a entregar un
  archivo con metadatos dentro.
- **El rol de documentación contra esta base de datos.** No existe ninguna cuenta con
  ese rol. Que no pueda tocar un canal está probado a fondo, pero contra un Postgres en
  memoria: con una cuenta real y su teléfono no se ha visto.
- **El despliegue.** Si Vercel tiene las dos variables de entorno y si la URL de
  retorno definitiva está en Supabase queda fuera del repositorio. Hay una carpeta
  `.vercel`, así que un proyecto sí está vinculado.
- **Que `@soschoco` funcione de verdad.** No he hecho ninguna transferencia. Lo que está
  comprobado es que el portal la publica tal cual, sin tocarla; que la llave sea la
  buena y que la cuenta exista solo lo puede decir alguien enviando un peso desde otro
  teléfono. Lo mismo con el número de contacto que publican las otras cuatro causas de
  Quibdó: nadie ha llamado.
- **En qué app se usa `@soschoco` y a nombre de quién sale.** Los dos campos van vacíos
  porque no me consta, y no los he adivinado: en el portal eso se ve como «tu app de
  banco o billetera» y como un paso que pide mirar el nombre sin decir cuál.
  **Rellenarlos es tarea de coordinación antes de compartir el enlace**, y el segundo es
  la única defensa de quien dona.
- **A quién pertenece de verdad `@soschoco`.** El portal la publica hoy como el canal de
  Daniela porque así se indicó, y `0015` la pasa a canal general del portal. Las dos
  cosas no pueden ser ciertas a la vez, y cuál lo es solo lo puede confirmar quien la
  consiguió. Si esa llave fuera de una organización que recauda para varias personas, la
  ficha de Daniela está diciendo hoy algo más concreto de lo que es.
- **`/sugerencias` no está terminada.** El buzón recibe y `0014` está aplicada, pero la
  pantalla se está escribiendo y no la he recorrido como si estuviera cerrada. Su
  migración no está registrada en el arnés por esa misma razón.
