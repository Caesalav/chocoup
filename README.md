# Chuc-up

Portal para documentar la situación en municipios del Chocó tras el terremoto, y para
que cualquier persona pueda ofrecer un recurso concreto.

- **Público:** mapa del Chocó, ficha de cada municipio con fotos, fundación madre,
  necesidades de la zona y casos de personas. Botón para ofrecer recursos sin crear cuenta,
  y para donar dinero por el canal oficial de la fundación.
- **Equipo:** panel en `/admin` para crear municipios, subir fotos, registrar necesidades,
  publicar casos y gestionar la bandeja de ofertas.

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

Un banner ámbar lo advierte en todas las pantallas. Las escrituras no persisten: al guardar
cualquier cosa el panel avisa de que falta conectar la base de datos.

Todo esto vive en `lib/demo-data.ts` y desaparece por completo en cuanto existan las
claves. No hay que desactivar nada.

### Las fotos de muestra

Son ocho imágenes generadas con IA en `public/demo`, de paisaje y arquitectura del Chocó:
el río, un pueblo de ribera, palafitos, la costa, canoas, un camino, la selva y una
construcción de bloque con techo de zinc.

**Ninguna muestra daños ni personas, y todas llevan el sello "muestra" incrustado en el
propio píxel.** Es deliberado. El portal documenta un terremoto real y se comparte por
WhatsApp: una imagen inventada de escombros en Quibdó sería indistinguible de una prueba, y
si circula fuera de contexto, el daño a la credibilidad de la operación es peor que el
beneficio de que la demostración luzca bien. Por el mismo motivo los pies de foto describen
lo que de verdad se ve y no los destrozos que cuentan los textos.

Si hay que rehacerlas o cambiar el sello, los PNG de origen van en una carpeta aparte y el
script normaliza tamaños y estampa la marca:

```bash
python3 scripts/build-demo-photos.py <carpeta-con-los-png>
```

De cada una salen dos versiones, igual que con las fotos reales: 1600 px para la vista
ampliada y 400 px para cuadrículas y tarjetas.

---

## Puesta en marcha

### 1. Crear el proyecto de Supabase

En [supabase.com/dashboard](https://supabase.com/dashboard) crea un proyecto nuevo.
Elige la región más cercana a Colombia (`us-east-1` o `sa-east-1`).

### 2. Crear las tablas

En el panel de Supabase, **SQL Editor**, pega y ejecuta en este orden:

1. `supabase/migrations/0001_init.sql` — tablas, RLS, y el bucket `fotos`.
2. `supabase/seed.sql` — los 10 municipios del Chocó con sus coordenadas, sin publicar.

El script se puede volver a ejecutar sin romper nada.

Antes de tocar la migración, y después, conviene correr:

```bash
npm run verify:sql
```

Ejecuta el esquema contra un Postgres real en memoria (sin Docker) y comprueba las 28
reglas de acceso: que un caso sin consentimiento no se pueda publicar, que los contactos de
las ofertas no sean legibles por el público, que despublicar un municipio esconda todo su
contenido y que un usuario fuera de la lista del equipo no pueda escribir nada.

> Si las últimas cuatro sentencias (`create policy ... on storage.objects`) fallan por
> permisos, crea esas cuatro políticas desde **Storage → fotos → Policies** con las mismas
> condiciones: lectura para todos, y escritura/borrado solo si `private.is_team()`.

### 3. Autorizar al equipo

La escritura no depende de "estar registrado", sino de estar en una lista. En el
**SQL Editor**:

```sql
insert into private.team_members (email, nombre) values
  ('charlie@ejemplo.com', 'Charlie'),
  ('otra@persona.com',    'Otra persona')
on conflict (email) do nothing;

delete from private.team_members where email = 'cambiame@ejemplo.com';
```

Quien entre con un correo que no esté en esa tabla podrá iniciar sesión pero no verá el
panel ni podrá escribir nada. Por eso no hace falta desactivar los registros públicos.

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

Abre http://localhost:3000. Para entrar al panel: `/entrar`, escribe tu correo del equipo
y abre el enlace que llega **en el mismo navegador** desde el que lo pediste.

### 6. URLs de retorno del enlace de acceso

En Supabase → **Authentication → URL Configuration**, añade a *Redirect URLs*:

```
http://localhost:3000/auth/callback
https://TU-DOMINIO.vercel.app/auth/callback
```

Sin esto, el enlace del correo no vuelve a la app.

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
4. **Publicar** el municipio cuando esté listo. Hasta entonces nada de ese municipio es
   visible para el público.
5. **Ofertas.** Cuando alguien ofrece un recurso desde el portal, aparece en
   `/admin/ofertas` con su contacto. Se acepta, se vincula a la necesidad que cubre y se
   pone en contacto con la fundación o la familia.

### Antes de salir

- [ ] Correos del equipo en `private.team_members`, y cada persona ya entró una vez.
- [ ] Al menos un municipio publicado con fotos y fundación real, para que el portal no
      esté vacío cuando se comparta el enlace.
- [ ] Una oferta de prueba enviada desde `/ofrecer` y revisada en `/admin/ofertas`.
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

**Las ofertas no son públicas.** Cualquiera puede insertar una, pero no existe política de
lectura para el público: los datos de contacto de terceros solo los ve el equipo.

**Publicar en cascada.** Si un municipio no está publicado, sus fotos, necesidades y casos
tampoco son visibles, aunque estén marcados como publicados individualmente. Está resuelto
en las políticas RLS, no en las consultas.

**Sin modo offline.** Fue una decisión explícita: documentar requiere conexión. Si en
terreno no hay señal, se toman notas y fotos en el teléfono y se cargan al llegar a un
punto con datos.

**El mapa no es un basemap.** Es la silueta real del Chocó (contorno del DANE simplificado
a 170 puntos, unos 2 KB) dibujada en SVG desde el servidor, en `lib/choco-map.ts`. No usa
librería de mapas ni descarga tiles, así que no necesita JavaScript, no depende de ningún
servicio externo y no consume datos por visita. La misma proyección sirve para situar las
ciudades y para leer coordenadas cuando el equipo toca el esquema en el panel.

## Sistema visual

Oscuro y cartográfico, con los paneles apoyados sobre el lienzo con transparencia y
desenfoque en lugar de cajas opacas. Los tokens están en `app/globals.css`.

| Papel | Token | Valor |
| --- | --- | --- |
| Fondo de página | `base` | `#16130F` |
| Lienzo del mapa | `canvas` / `land` | `#221D19` / `#3B332B` |
| Paneles flotantes | `panel` / `panel-high` | `#1A1917` / `#292929` |
| Titulares y texto | `ink` / `body` / `muted` | `#FFFDFA` / `#D8D5D1` / `#8F8B88` |
| Acento principal | `amber` | `#F27A1E` |
| Acento secundario | `teal` | `#0E7F66` |

Dos recursos tipográficos cargan casi toda la personalidad: **versalitas** (clase
`.smallcaps`, serif con la inicial a caja alta) en navegación, enlaces y etiquetas; y el
**titular como menú**, donde la categoría activa se convierte en el título de la página con
su cuenta en volado, y las demás quedan pequeñas y apagadas alrededor.

Los filtros del lienzo (`?ambito=` y `?necesidad=`) viven en la URL, no en estado de
cliente: la portada sigue renderizándose en el servidor, funciona sin JavaScript y una vista
concreta se puede compartir por WhatsApp.

**Nota sobre el uso en campo:** el tema oscuro luce mucho mejor con fotografía y le da
carácter al portal, pero a pleno sol del mediodía cuesta más leerlo que un tema claro. Si en
terreno resulta incómodo para documentar, lo razonable es dejar el portal público en oscuro
y darle al panel `/admin` una variante clara.

## Cómo llega el dinero

El portal **no cobra ni procesa pagos**: solo enlaza el canal oficial de cada fundación madre
(`donation_url`), un botón «Donar dinero» en su tarjeta. El dinero para una persona concreta
tampoco expone su Nequi ni su número: se envía a través de la fundación del municipio con el
nombre de la familia como referencia (por WhatsApp o su enlace), que es quien ya rinde cuentas
en terreno. Así se evita la suplantación y la persona no queda con su teléfono publicado.

## Qué queda fuera a propósito

Pasarelas de pago propias (el dinero va por el canal externo de la fundación, no por aquí),
cuentas para el público, moderación de contenido enviado por terceros, app nativa,
notificaciones por correo de cada oferta nueva (la bandeja del panel cumple esa función).

---

## Estructura

```
app/(public)/          portal público: mapa, municipios, casos, ofrecer recurso, entrar
app/admin/             panel del equipo (protegido) y Server Actions
app/auth/              callback del enlace de acceso y cierre de sesión
components/            UI compartida, mapas y componentes del panel
lib/                   clientes de Supabase, consultas, tipos, compresión de fotos
lib/demo-data.ts       contenido de muestra para cuando no hay base de datos
supabase/              migración, semilla de municipios y verify.mjs (pruebas de RLS)
proxy.ts               refresco de la sesión en cada petición
```
