/**
 * Comprueba el esquema y las reglas de acceso contra un Postgres real (PGlite,
 * sin Docker), con stubs de lo único que aporta Supabase: los roles `anon` y
 * `authenticated`, `auth.jwt()` y el esquema `storage`.
 *
 *     npm run verify:sql
 *
 * Ejecútalo después de tocar cualquier migración. Aquí se protege lo que de
 * verdad importa: que un caso sin consentimiento no se pueda publicar, que quien
 * documenta no pueda escribir en un municipio que no es suyo, que el contacto de
 * quien ofrece ayuda no sea legible por el público —ni por la política ni por el
 * permiso de tabla, y cada barrera se comprueba sin la otra—, que el formulario
 * de /ofrecer siga entregando con el permiso recortado al mínimo, que nadie que
 * atienda a la web pueda vaciar una tabla, que nadie aparezca nombrado
 * en el registro de ayudas sin haberlo autorizado, que de una entrega no salgan
 * por la vía pública ni el día exacto, ni el caso al que fue, ni la descripción
 * que escribió quien la ofreció —y que el equipo sí lo conserve todo—, que lo que
 * se publique de qué llegó pertenezca siempre al vocabulario cerrado de nueve
 * categorías, que la tabla de fundaciones ya no exista con su enlace de donación
 * dentro, que el retrato de una persona no pueda ser la foto de
 * otra, que la foto de un avance no pueda ser la de otra familia, que el encuadre
 * de una foto solo lo pueda mover quien documenta ese municipio, que el canal de
 * donación de un caso solo lo ponga coordinación —comprobado
 * también desde la sesión de quien documenta ese mismo municipio, que es la que
 * llega hasta ahí—, que un canal sea una llave, un enlace o un número y nunca dos, que un
 * caso sin canal propio lea vacío y el canal general viva en otra tabla para que
 * ninguna consulta pueda confundirlos, que el canal general sea uno y solo uno y
 * que ni el público ni quien documenta lo toquen ni lo borren, que un caso cuyo
 * canal propio era la llave general se quede sin canal propio sin que se mueva el
 * destino, que el público los lea y no los
 * toque, que la llave global de 0010 ya no exista ni vuelva al volver a pegar
 * las migraciones, que el contador de aportes cuente lo que sigue en pie y no lo
 * rechazado ni lo de un municipio sin publicar, y diga exactamente lo mismo que
 * el largo del registro de ayudas, que el correo de los avisos lo pueda dejar
 * cualquiera y no lo lea nadie salvo coordinación —ni la lista, ni el recuento, y
 * cada barrera comprobada sin la otra—, que apuntarse dos veces responda lo mismo
 * que apuntarse una para que el formulario no diga quién está dentro, que la
 * fecha en que se comprobó un canal esté en el mismo círculo pequeño que el
 * canal y que NO sobreviva a un cambio de destino —ni en un caso ni en el
 * general—, que una comprobación no se pueda fechar en el futuro, que el tipo de
 * causa y el resumen sí los escriba quien documenta y que ni un tipo inventado ni
 * un resumen más largo que una vista previa de WhatsApp entren, que un importe de
 * donación NO lo pueda escribir nadie desde el navegador —ni el público ni
 * coordinación— y solo entre por el webhook, comprobado en sus tres barreras y la
 * tercera con las dos primeras desarmadas a mano, que un aviso repetido del
 * proveedor no cuente dos veces y que una causa que recibió dinero no se borre,
 * que del registro de lo que se ha prometido no salgan ni el
 * contacto ni el mensaje ni el caso, que una oferta dirigida a una familia no
 * publique la frase que la describiría —ni llegando por su caso ni llegando por
 * su necesidad— y que las de zona sí la publiquen, que un teléfono o un correo
 * escritos dentro del texto de una oferta salgan tapados sin que se lleven por
 * delante las cantidades, que el nombre de quien ofrece no se publique mientras nadie del
 * equipo haya hablado con esa persona, que lo prometido y lo entregado sean dos
 * listas sin ninguna fila en común, que una promesa caduque sola a las ocho
 * semanas, que desde ese registro se pueda llegar al municipio y a la necesidad
 * de una oferta —para que quien la complete llegue emparejado a la bandeja— sin
 * pasar por la tabla donde está su contacto, que retirar una oferta la saque del
 * muro al momento sin borrar nada y solo la pueda retirar quien atiende ese
 * municipio, y que despublicar un municipio esconda todo su contenido, canales
 * incluidos.
 *
 * Y una comprobación que no es sobre el esquema sino sobre este archivo: que la
 * lista `MIGRATIONS` no se haya quedado corta. Es el descuido que dejó a `0009`
 * fuera del arnés mientras el informe seguía en verde.
 *
 * Lo que este archivo NO puede demostrar, y hay que probar en el proyecto de
 * Supabase de verdad:
 *
 *   * Que el enlace mágico entrega en el JWT el correo que estas pruebas
 *     inyectan a mano con `request.jwt.claims`. Aquí `auth.jwt()` es un stub.
 *   * Que PostgREST respeta los permisos de columna y de vista al servir la Data
 *     API. Aquí se comprueba Postgres, no la capa HTTP que hay delante.
 *   * Las políticas de Storage se prueban contra una tabla `storage.objects`
 *     imitada, con las tres columnas que usan las políticas. El servicio real
 *     añade sus propias comprobaciones sobre esa misma tabla.
 */
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const db = new PGlite();

const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
}

async function sql(text) {
  return db.exec(text);
}

async function one(text) {
  const res = await db.query(text);
  return res.rows[0];
}

async function expectError(name, text, fragment = "") {
  try {
    await db.exec(text);
    check(name, false, "no lanzó error");
  } catch (error) {
    const message = String(error.message ?? error);
    check(name, fragment ? message.includes(fragment) : true, message.slice(0, 90));
  }
}

async function asPostgres() {
  await sql("reset role; select set_config('request.jwt.claims', '', false);");
}

async function asAnon() {
  await sql("reset role; select set_config('request.jwt.claims', '', false); set role anon;");
}

async function asUser(email) {
  await sql(
    `reset role; select set_config('request.jwt.claims', '{"email":"${email}"}', false); set role authenticated;`,
  );
}

/**
 * El webhook de pagos, que es el único que puede escribir un importe
 * (0017_donaciones_preparadas.sql).
 *
 * No lleva correo en el token a propósito: no hay ninguna persona detrás de esta
 * conexión. Es lo que separa «el navegador» del «servidor» y lo que hace que la
 * barrera de las donaciones no se pueda pasar robando una cuenta del equipo.
 */
async function asService() {
  await sql("reset role; select set_config('request.jwt.claims', '', false); set role service_role;");
}

// --- Stubs de lo que Supabase ya trae: roles, auth.jwt() y storage ----------
//
// Los privilegios por defecto del esquema `public` son parte del stub y no un
// adorno: Supabase los deja armados, así que en el proyecto de verdad TODA tabla
// que se cree ahí nace con el juego completo concedido a `anon` y a
// `authenticated`. Sin esta línea, aquí los roles nacían limpios y las pruebas
// daban por buena una barrera que en la base de datos no existía —el permiso de
// tabla sobre `public.offers`—, que es exactamente cómo se coló. Lo que se
// comprueba más abajo sobre permisos solo significa algo con esto puesto.
await sql(`
create role anon;
create role authenticated;

-- El tercer rol de Supabase, y el único que puede escribir un importe
-- (0017_donaciones_preparadas.sql). Es el del webhook de pagos y su clave no baja
-- nunca al navegador, así que aquí sirve para lo contrario de los otros dos: para
-- comprobar que la barrera que rechaza a la web SÍ deja pasar al servidor. Sin
-- este rol, «nadie puede escribir un importe» pasaría por el motivo equivocado.
--
-- Entra en los privilegios por omisión de abajo junto con los otros dos, porque es
-- donde Supabase lo pone: en el proyecto de verdad service_role nace con el juego
-- completo sobre toda tabla nueva del esquema public, y es lo que hace que el
-- revoke de anon y authenticated que escriben 0008 y 0017 recorte la web sin tocar
-- al servidor. Sin esta línea el webhook fallaría aquí por no poder leer la tabla
-- de casos, que no es la barrera que se está comprobando.
--
-- Y con bypassrls, que es lo que Supabase le pone y sin lo cual esto no probaría
-- nada: si el webhook tuviera que pasar por las RLS, haría falta escribirle una
-- política de escritura sobre las donaciones, y esa política es exactamente la que
-- 0017 no tiene que existir. Saltarse las RLS es la razón por la que su clave no
-- puede bajar nunca al navegador.
create role service_role bypassrls;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema auth;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.jwt() to anon, authenticated;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean not null default false
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
`);

// --- Las migraciones de verdad ----------------------------------------------
const MIGRATIONS = [
  "migrations/0001_init.sql",
  "migrations/0002_roles_y_ayudas.sql",
  "migrations/0003_retrato_del_caso.sql",
  "migrations/0004_una_fundacion_por_municipio.sql",
  "migrations/0005_registro_sin_texto_libre.sql",
  "migrations/0006_seguimiento_del_caso.sql",
  "migrations/0007_foto_del_avance.sql",
  "migrations/0008_permiso_de_tabla_del_publico.sql",
  "migrations/0009_encuadre_de_fotos.sql",
  "migrations/0010_llave_de_transferencia.sql",
  "migrations/0011_canal_de_donacion.sql",
  "migrations/0012_registro_de_lo_ofrecido.sql",
  "migrations/0013_canal_de_telefono.sql",
  "migrations/0014_sugerencias.sql",
  "migrations/0015_canal_general.sql",
  "migrations/0016_ficha_de_causa.sql",
  "migrations/0017_donaciones_preparadas.sql",
  "migrations/0018_tablero.sql",
  "migrations/0019_muro_de_ofertas.sql",
  "migrations/0020_presupuesto.sql",
  "migrations/0021_registro_de_donaciones.sql",
  "migrations/0022_donacion_al_fondo.sql",
];
const migration = (file) => readFileSync(join(HERE, file), "utf8");

// La lista se escribe a mano porque el orden importa y ningún orden de carpeta lo
// garantiza. Pero una lista a mano se queda corta sin avisar: `0009` llegó, nadie
// la añadió, y durante un rato estas comprobaciones no decían absolutamente nada
// de las tres columnas del encuadre —que `lib/data.ts` pide por su nombre—
// mientras seguían dando verde. Así que el arnés se mira la carpeta él solo. Un
// archivo nuevo tiene que fallar aquí, con su nombre, antes que en la ficha de un
// municipio; y para ahí mismo, porque con una migración sin pasar todo lo de abajo
// comprobaría un esquema que no es el del proyecto.
const onDisk = readdirSync(join(HERE, "migrations"))
  .filter((name) => name.endsWith(".sql"))
  .sort();
const unlisted = onDisk.filter((name) => !MIGRATIONS.includes(`migrations/${name}`));
check(
  "El arnés pasa todos los archivos de migración que hay en la carpeta",
  unlisted.length === 0,
  unlisted.length ? `fuera de la lista: ${unlisted.join(", ")}` : `${onDisk.length} archivos`,
);

if (unlisted.length > 0) {
  for (const result of results) {
    console.log(`${result.ok ? "PASA" : "FALLA"}  ${result.name}  ${result.extra}`);
  }
  console.log(
    `\nAñade a MIGRATIONS, en el orden en que se pega: ${unlisted
      .map((name) => `migrations/${name}`)
      .join(", ")}`,
  );
  process.exit(1);
}

for (const file of MIGRATIONS) {
  try {
    await sql(migration(file));
    check(`${file} se ejecuta sin errores`, true);
  } catch (error) {
    check(`${file} se ejecuta sin errores`, false, String(error.message));
    for (const result of results) {
      console.log(`${result.ok ? "PASA" : "FALLA"}  ${result.name}  ${result.extra}`);
    }
    process.exit(1);
  }
}

// Quien ya estaba en la lista del equipo antes de existir los roles se queda con
// la autoridad que tenía: la migración reparte permisos, no los recorta a mitad
// de viaje. Aquí no había nadie, así que se comprueba sobre una fila nueva.
await sql("insert into private.team_members (email) values ('recien@test.com')");
const defaultRole = await one("select role from private.team_members where email = 'recien@test.com'");
check(
  "Una invitación nueva entra con el rol pequeño",
  defaultRole.role === "documentacion",
  defaultRole.role,
);

// Idempotencia: el equipo puede pegar las diez, en orden, tantas veces como haga
// falta. Y el rol de quien ya estaba no se reescribe al volver a pasarlas.
//
// El segundo pase es además lo que comprueba el orden entre archivos, que aquí
// importa dos veces: 0002 crea `public.aid_log` en su versión con el texto libre
// dentro y 0005 la reemplaza, así que pegarlas en orden tiene que dejar en pie la
// de 0005; y ese mismo `create view` de 0005 devuelve a la vista los permisos de
// nacimiento, que 0008 vuelve a recortar por ir detrás. Todo lo que se compruebe
// más abajo sobre el registro público y sobre los permisos se comprueba contra lo
// que quedó después de pasarlas dos veces.
try {
  for (const file of MIGRATIONS) await sql(migration(file));
  check("Las migraciones se pueden ejecutar dos veces", true);
} catch (error) {
  check("Las migraciones se pueden ejecutar dos veces", false, String(error.message));
}

const roleAfterRerun = await one("select role from private.team_members where email = 'recien@test.com'");
check(
  "Volver a pasar las migraciones no cambia el rol de nadie",
  roleAfterRerun.role === "documentacion",
  roleAfterRerun.role,
);
await sql("delete from private.team_members where email = 'recien@test.com'");

try {
  await sql(readFileSync(join(HERE, "seed.sql"), "utf8"));
  check("El seed.sql se ejecuta sin errores", true);
} catch (error) {
  check("El seed.sql se ejecuta sin errores", false, String(error.message));
}

const seeded = await one("select count(*)::int as n from public.cities");
check("El seed carga los 10 municipios", seeded.n === 10, `n=${seeded.n}`);

const bucket = await one("select public from storage.buckets where id = 'fotos'");
check("El bucket fotos existe y es público", bucket?.public === true);

// 0014 trae tres: insertar una nota, leerla el equipo, borrarla coordinación.
// 0015 se lleva las tres de `public.foundations` y trae cuatro: las dos del
// canal general y las dos del correo de avisos —insertar y leer— más la de
// borrarlo, que son tres. Treinta y seis menos tres, más cinco, más las tres
// del buzón.
//
// 0017 trae UNA sola, y que sea una es la mitad de lo que se comprueba de esa
// tabla: `public.donations` tiene política de lectura para coordinación y ninguna
// de escritura.
//
// 0018 trae dos: leer el foco y cambiarlo coordinación. Si esta cuenta sube a 45
// sin que nadie lo explique, lo primero que hay que mirar es si alguien le
// añadió al foco una política de `insert`.
const policyCount = await one(
  "select count(*)::int as n from pg_policies where schemaname in ('public','storage')",
);
check("Se crean las 52 políticas RLS", policyCount.n === 52, `n=${policyCount.n}`);

// ===========================================================================
// El permiso de tabla: la otra mitad de cada regla de acceso
//
// Antes de mirar qué filas devuelve una política, Postgres pregunta si el rol
// puede siquiera pedir esa operación. Es una barrera distinta de la política y
// no se ve leyendo las políticas, que es como se coló: Supabase deja armados los
// privilegios por defecto de `public` —el stub de arriba los reproduce— y toda
// tabla nueva nace concediéndoselo todo a los dos roles de la web, así que hay
// que retirarlo a mano. Eso es 0008.
//
// Se comprueba el mapa entero y no solo las ofertas, a propósito: lo que se
// escapó no fue una tabla mal pensada, fue una tabla que nadie volvió a mirar.
// Con la lista escrita aquí, una tabla nueva que no pase por 0008 no puede pasar
// de largo.
// ===========================================================================

const PUBLIC_TABLE_PRIVS = {
  aid_log:            { anon: "SELECT", authenticated: "SELECT" },
  case_updates:       { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  cases:              { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  cities:             { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  // El canal general se lee y solo se cambia con sesión: no se crea ni se borra,
  // porque vaciarlo dejaría sin destino a todos los casos que no tienen el suyo.
  donation_channel:   { anon: "SELECT", authenticated: "SELECT,UPDATE" },
  // El recado del momento: misma forma que el canal general. Vaciar la tabla
  // dejaría al portal sin fila, y el aviso del inicio no tiene de dónde leer.
  campaign_focus:     { anon: "SELECT", authenticated: "SELECT,UPDATE" },
  // Movimiento hacia un pueblo: agregado de ofertas, se lee y no se escribe.
  city_offer_activity:{ anon: "SELECT", authenticated: "SELECT" },
  // Las donaciones no aparecen para `anon` en absoluto, y con sesión solo se leen.
  // Es la primera de las tres barreras de 0017: sin `INSERT` aquí, un importe
  // mandado desde la web no recibe cero filas, recibe un error de permisos. Que en
  // esta línea no haya ninguna letra más es la condición que no se negocia.
  donations:          { authenticated: "SELECT" },
  // El registro público: importe, causa, municipio, fecha y el nombre solo si
  // se autorizó. Es una vista, no la tabla: `anon` sigue sin poder leer
  // `donations`. Sin `SELECT` aquí, las tres pantallas del registro no tendrían
  // de dónde leer.
  donation_log:       { anon: "SELECT", authenticated: "SELECT" },
  budget_items:       { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  case_budget:        { anon: "SELECT", authenticated: "SELECT" },
  support_offers:     { anon: "INSERT", authenticated: "DELETE,INSERT,SELECT" },
  // El buzón: el público inserta y NO lee. Documentación lee y no borra;
  // coordinación borra. `anon` sin SELECT es lo que impide pedir la bandeja.
  feedback:           { anon: "INSERT", authenticated: "DELETE,INSERT,SELECT" },
  needs:              { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  // El correo de avisos: el público inserta y NO lee. Esta línea es media
  // garantía de esa promesa —la otra media es la política, y las dos se
  // comprueban por separado más abajo—. `anon` sin `SELECT` es también lo que
  // impide pedir el recuento por la API, que es una lectura como cualquier otra.
  newsletter_signups: { anon: "INSERT", authenticated: "DELETE,INSERT,SELECT" },
  offer_log:          { anon: "SELECT", authenticated: "SELECT" },
  // El contador es un agregado de dos enteros: se lee y no hay nada que escribir.
  offer_tally:        { anon: "SELECT", authenticated: "SELECT" },
  offers:             { anon: "INSERT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  photos:             { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
};

// Se leen de `relacl` y no de `information_schema.role_table_grants` porque allí
// no asoma `maintain`, el privilegio que añadió Postgres 17 y que también estaba
// concedido: una comprobación que mirase la vista estándar daría por limpia una
// tabla que no lo está.
async function publicTablePrivileges() {
  const rows = await db.query(`
    select c.relname as tabla, a.rol, string_agg(a.privilegio, ',' order by a.privilegio) as privilegios
    from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join lateral (
        select pg_get_userbyid(x.grantee) as rol, x.privilege_type as privilegio
        from aclexplode(c.relacl) x
      ) a
    where n.nspname = 'public'
      and c.relkind in ('r', 'v')
      and a.rol in ('anon', 'authenticated')
    group by c.relname, a.rol`);

  const map = {};
  for (const row of rows.rows) (map[row.tabla] ??= {})[row.rol] = row.privilegios;
  return map;
}

const printPrivileges = (map) =>
  Object.keys(map)
    .sort()
    .map((table) =>
      `${table}: ${Object.keys(map[table])
        .sort()
        .map((role) => `${role}=${map[table][role]}`)
        .join(" ")}`,
    )
    .join(" | ");

// Que el banco de pruebas esté armado como Supabase no se supone: se comprueba
// con una tabla de usar y tirar. Si esta comprobación falla, todas las de abajo
// dejan de significar nada aunque sigan pasando.
await sql("create table public.tabla_de_paso (id int)");
const newBornPrivileges = (await publicTablePrivileges()).tabla_de_paso?.anon ?? "";
check(
  "Una tabla nueva de public nace con todo concedido al público, que es el descuido de fondo",
  newBornPrivileges.includes("SELECT") &&
    newBornPrivileges.includes("TRUNCATE") &&
    newBornPrivileges.includes("DELETE"),
  newBornPrivileges,
);
await sql("drop table public.tabla_de_paso");

const tablePrivileges = await publicTablePrivileges();
check(
  "El público solo puede insertar en las ofertas: ni leerlas, ni cambiarlas, ni vaciarlas",
  tablePrivileges.offers?.anon === "INSERT",
  String(tablePrivileges.offers?.anon),
);

// `truncate` no lo sabe pedir PostgREST, así que no era alcanzable desde la API.
// Se comprueba igual porque es el único privilegio de los ocho que se salta la
// RLS entera: si algún día llega a ser alcanzable, no puede estar concedido.
check(
  "Nadie que atienda a la web puede vaciar una tabla, que es lo único que se salta la RLS",
  !Object.values(tablePrivileges).some((roles) =>
    Object.values(roles).some((privileges) => privileges.includes("TRUNCATE")),
  ),
  printPrivileges(tablePrivileges),
);

check(
  "Ninguna tabla del portal concede al público ni al equipo más de lo que usan",
  printPrivileges(tablePrivileges) === printPrivileges(PUBLIC_TABLE_PRIVS),
  printPrivileges(tablePrivileges),
);

// --- Allowlist del equipo --------------------------------------------------
await asPostgres();
await sql(
  "delete from private.team_members; insert into private.team_members (email, role) values ('charlie@test.com', 'coordinacion');",
);

await asAnon();
const anonTeam = await one("select public.is_team() as t");
check("is_team() es falso para el público", anonTeam.t === false);

await asUser("charlie@test.com");
const teamTeam = await one("select public.is_team() as t");
check("is_team() es verdadero para el equipo", teamTeam.t === true);

await asUser("intrusa@test.com");
const otherTeam = await one("select public.is_team() as t");
check("is_team() es falso para un usuario fuera de la lista", otherTeam.t === false);

await asAnon();
await expectError(
  "El público no puede leer la lista del equipo",
  "select * from private.team_members",
  "permission denied",
);

// --- Nada publicado: el público no ve nada ---------------------------------
await asAnon();
const hidden = await one("select count(*)::int as n from public.cities");
check("Sin publicar, el público no ve municipios", hidden.n === 0, `n=${hidden.n}`);

await asUser("charlie@test.com");
const teamSees = await one("select count(*)::int as n from public.cities");
check("El equipo ve los municipios sin publicar", teamSees.n === 10, `n=${teamSees.n}`);

// --- El equipo documenta Quibdó -------------------------------------------
await asUser("charlie@test.com");
await sql(`
update public.cities set published = true, summary = 'Daños en el barrio Niño Jesús.'
  where slug = 'quibdo';
insert into public.cases (city_id, display_name, story, consent_to_publish, published)
  select id, 'Familia Mosquera', 'Perdieron el techo.', true, true
  from public.cities where slug = 'quibdo';
insert into public.needs (city_id, category, title)
  select id, 'techo', 'Tejas de zinc' from public.cities where slug = 'quibdo';
insert into public.needs (city_id, case_id, category, title)
  select c.city_id, c.id, 'agua', 'Agua potable' from public.cases c;
insert into public.photos (city_id, storage_path) select id, 'quibdo/1.jpg' from public.cities where slug = 'quibdo';
insert into public.photos (city_id, case_id, storage_path)
  select c.city_id, c.id, 'quibdo/casos/1.jpg' from public.cases c;
`);
check("El equipo puede escribir municipio, caso, necesidades y fotos", true);

const updatedAt = await one(
  "select (updated_at > created_at) as touched from public.cities where slug = 'quibdo'",
);
check("El trigger actualiza updated_at al editar", updatedAt.touched === true);

// --- El público ve solo lo publicado --------------------------------------
await asAnon();
const pub = await one(`select
  (select count(*) from public.cities) as cities,
  (select count(*) from public.cases)  as cases,
  (select count(*) from public.needs)  as needs,
  (select count(*) from public.photos) as photos`);
check(
  "El público ve el municipio publicado con su contenido",
  Number(pub.cities) === 1 &&
    Number(pub.cases) === 1 &&
    Number(pub.needs) === 2 &&
    Number(pub.photos) === 2,
  JSON.stringify(pub),
);

// Las fundaciones ya no son una entidad del portal: una fundación que trabaje en
// el Chocó entra como un caso más. Se comprueba que la tabla no está, y no solo
// que esté vacía: mientras existiera, seguiría siendo un `donation_url` de
// lectura pública que ninguna pantalla enseña, que es la peor forma de tener un
// destino de dinero. Ver 0015_canal_general.sql.
await asPostgres();
const foundationsGone = await one(`select count(*)::int as n from information_schema.tables
  where table_schema = 'public' and table_name = 'foundations'`);
check(
  "La tabla de fundaciones ya no existe, ni con su enlace de donación dentro",
  foundationsGone.n === 0,
  `n=${foundationsGone.n}`,
);
await asAnon();

// ===========================================================================
// Qué cuenta como necesidad abierta de un municipio
//
// De aquí salió un fallo que estuvo publicado: la ficha de Quibdó decía «0
// necesidades abiertas» mientras /municipios y el mapa decían diez del mismo
// municipio, porque cada pantalla contaba un conjunto distinto sin decirlo. La
// definición vive ahora en lib/needs.ts, y esto comprueba las dos cosas de la
// base de datos de las que depende esa definición para ser cierta.
//
// Lo que este arnés NO puede demostrar es que las tres pantallas la usen: eso es
// TypeScript y lo sostiene la regla `no-restricted-syntax` de eslint.config.mjs,
// que prohíbe volver a escribir la comparación a mano fuera de lib/needs.ts.
// Aquí se protege el suelo sobre el que se apoya.
// ===========================================================================

// Uno: el vocabulario es de tres palabras y está cerrado.
//
// «Abierta» significa `abierta` o `parcial` porque son las dos únicas que no son
// `cubierta`. Si algún día entrara una cuarta —`cancelada`, `duplicada`— esa
// equivalencia dejaría de ser cierta en silencio y el portal empezaría a
// contarla como algo que falta. `OPEN_STATUSES` está escrito en positivo para
// que no se cuele, y esto es lo que avisa de que hay una decisión que tomar.
await asPostgres();
const needStatusVocabulary = await one(`select pg_get_constraintdef(oid) as def
  from pg_constraint where conname = 'needs_status_valid'`);
check(
  "Los estados de una necesidad son tres y están cerrados, que es lo que hace 'no cubierta' = 'abierta o parcial'",
  ["abierta", "parcial", "cubierta"].every((state) =>
    needStatusVocabulary.def.includes(`'${state}'`),
  ) && (needStatusVocabulary.def.match(/'/g) ?? []).length === 6,
  needStatusVocabulary.def,
);

// Dos: al público le llegan las necesidades de un caso, no solo las de la zona.
//
// El municipio del escenario es el que reproduce Quibdó: sin ninguna necesidad
// de zona y con todo lo que falta dentro de casos. Contando solo la zona da
// cero, y ese cero era el que salía en la cabecera. Se comprueban los dos
// números juntos y se exige que sean distintos: si algún día coincidieran, este
// escenario habría dejado de vigilar lo que vino a vigilar.
await asUser("charlie@test.com");
await sql(`
insert into public.cities (name, slug, lat, lng, published)
  values ('Conteo', 'conteo', 5.7, -76.6, true);
insert into public.cases (city_id, display_name, consent_to_publish, published)
  select id, 'Familia publicada', true, true from public.cities where slug = 'conteo';
insert into public.cases (city_id, display_name, consent_to_publish, published)
  select id, 'Familia sin consentimiento', false, false from public.cities where slug = 'conteo';
insert into public.needs (city_id, case_id, category, title, status)
  select c.city_id, c.id, 'techo', 'Tejas', 'abierta'
  from public.cases c join public.cities t on t.id = c.city_id
  where t.slug = 'conteo';
insert into public.needs (city_id, case_id, category, title, status)
  select c.city_id, c.id, 'agua', 'Bidones', 'parcial'
  from public.cases c join public.cities t on t.id = c.city_id
  where t.slug = 'conteo' and c.display_name = 'Familia publicada';
insert into public.needs (city_id, case_id, category, title, status)
  select c.city_id, c.id, 'ropa', 'Cobijas', 'cubierta'
  from public.cases c join public.cities t on t.id = c.city_id
  where t.slug = 'conteo' and c.display_name = 'Familia publicada';
`);

await asAnon();
const counts = await one(`select
  count(*) filter (where n.case_id is null)                        as zona,
  count(*) filter (where n.status <> 'cubierta')                   as municipio_abiertas,
  count(*) filter (where n.status in ('abierta', 'parcial'))       as en_positivo,
  count(*)                                                        as listadas
  from public.needs n join public.cities c on c.id = n.city_id
  where c.slug = 'conteo'`);
check(
  "Un municipio sin necesidades de zona no tiene cero abiertas: las de sus casos publicados cuentan",
  Number(counts.zona) === 0 && Number(counts.municipio_abiertas) === 2,
  JSON.stringify(counts),
);

check(
  "Contar en positivo —abierta o parcial— da lo mismo que contar lo no cubierto mientras el vocabulario sea de tres",
  Number(counts.en_positivo) === Number(counts.municipio_abiertas),
  JSON.stringify(counts),
);

// La pestaña cuenta filas y la cabecera cuenta abiertas, así que el escenario
// tiene que separarlas: con una cubierta dentro, las dos cifras no pueden
// coincidir por casualidad, que es justo lo que pasaba en Quibdó y lo que hizo
// que el descuadre solo se viera en un sitio de los tres.
check(
  "Lo que se lista y lo que está abierto son dos números distintos, y la ficha tiene que poder decir los dos",
  Number(counts.listadas) === 3 && Number(counts.municipio_abiertas) === 2,
  JSON.stringify(counts),
);

// Y lo de la familia sin consentimiento no entra en ninguno de los dos: el
// conteo del portal cuenta lo que las RLS le dejan ver, no lo que hay.
check(
  "La necesidad de un caso sin consentimiento no se cuenta porque el público no la ve",
  Number(counts.listadas) === 3,
  JSON.stringify(counts),
);

await asPostgres();
const teamCounts = await one(`select count(*) as n from public.needs n
  join public.cities c on c.id = n.city_id where c.slug = 'conteo'`);
check(
  "El equipo sí ve la del caso sin consentimiento, así que el panel puede contar más que el portal",
  Number(teamCounts.n) === 4,
  `n=${teamCounts.n}`,
);

// El escenario se retira: lo de abajo cuenta municipios y necesidades.
await asUser("charlie@test.com");
await sql("delete from public.cities where slug = 'conteo'");

// --- Ofertas: entran pero no se leen -------------------------------------
await asAnon();
await sql(`insert into public.offers (offerer_name, offerer_contact, resource, category)
  values ('Vecina de Medellín', '3009998888', '200 tejas de zinc', 'techo')`);
check("El público puede enviar una oferta sin cuenta", true);

// Ni siquiera hay permiso de tabla: falla antes de llegar a las políticas.
await expectError(
  "El público no puede leer las ofertas",
  "select count(*) from public.offers",
  "permission denied",
);

await expectError(
  "El público no puede marcar una oferta como aceptada al crearla",
  `insert into public.offers (offerer_name, offerer_contact, resource, status)
     values ('Bot', '3001112222', 'algo', 'aceptada')`,
  "row-level security",
);

await asUser("charlie@test.com");
const teamOffers = await one("select count(*)::int as n from public.offers");
check("El equipo lee las ofertas", teamOffers.n === 1, `n=${teamOffers.n}`);

// --- Consentimiento como restricción de base de datos --------------------
await asUser("charlie@test.com");
await expectError(
  "No se puede publicar un caso sin consentimiento",
  `insert into public.cases (city_id, display_name, consent_to_publish, published)
     select id, 'Sin permiso', false, true from public.cities where slug = 'quibdo'`,
  "cases_publish_requires_consent",
);

// --- Un usuario autenticado fuera de la lista no escribe ----------------
await asUser("intrusa@test.com");
const intruderReads = await one("select count(*)::int as n from public.cities");
check("Un usuario fuera de la lista solo ve lo publicado", intruderReads.n === 1, `n=${intruderReads.n}`);

await expectError(
  "Un usuario fuera de la lista no puede crear municipios",
  "insert into public.cities (name, slug, lat, lng) values ('Falso', 'falso', 5, -76)",
  "row-level security",
);

// Un UPDATE sin política aplicable no lanza error: no afecta a ninguna fila.
const intruderUpdate = await db.exec(
  "update public.cities set summary = 'hackeado' where slug = 'quibdo'",
);
check(
  "Un usuario fuera de la lista no modifica ningún municipio",
  intruderUpdate[0].affectedRows === 0,
  `filas=${intruderUpdate[0].affectedRows}`,
);

const stillClean = await (async () => {
  await asAnon();
  return one("select summary from public.cities where slug = 'quibdo'");
})();
check(
  "El resumen del municipio sigue intacto",
  stillClean.summary === "Daños en el barrio Niño Jesús.",
  stillClean.summary,
);

// --- Storage: solo el equipo sube ---------------------------------------
await asUser("charlie@test.com");
await sql("insert into storage.objects (bucket_id, name) values ('fotos', 'quibdo/2.jpg')");
check("El equipo puede subir fotos al bucket", true);

await asUser("intrusa@test.com");
await expectError(
  "Un usuario fuera de la lista no puede subir fotos",
  "insert into storage.objects (bucket_id, name) values ('fotos', 'intruso.jpg')",
  "row-level security",
);

await asAnon();
const readableObjects = await one("select count(*)::int as n from storage.objects");
check("Las fotos del bucket son legibles públicamente", readableObjects.n === 1, `n=${readableObjects.n}`);

// ===========================================================================
// Roles: quien documenta escribe solo en sus municipios
//
// Dos personas de documentación, cada una con un municipio, y nada más. Es el
// reparto que va a haber en el viaje.
// ===========================================================================

await asPostgres();
await sql(`
insert into private.team_members (email, nombre, role) values
  ('documenta@test.com', 'Documenta Quibdó', 'documentacion'),
  ('otra@test.com',      'Documenta Istmina', 'documentacion')
on conflict (email) do update set role = excluded.role;

insert into private.team_city_assignments (email, city_id)
  select 'documenta@test.com', id from public.cities where slug = 'quibdo'
on conflict do nothing;
insert into private.team_city_assignments (email, city_id)
  select 'otra@test.com', id from public.cities where slug = 'istmina'
on conflict do nothing;

-- Contenido en el municipio ajeno, para intentar modificarlo desde fuera.
insert into public.needs (city_id, category, title)
  select id, 'agua', 'Bidones de Istmina' from public.cities where slug = 'istmina';
`);

await asUser("documenta@test.com");
const myRole = await one("select private.team_role() as role");
check("El rol se lee de la base de datos y no del token", myRole.role === "documentacion", myRole.role);

const cityAccess = await one(`select
  private.can_write_city((select id from public.cities where slug = 'quibdo'))  as mine,
  private.can_write_city((select id from public.cities where slug = 'istmina')) as theirs,
  private.can_write_city(null)                                                 as nowhere`);
check(
  "Quien documenta puede escribir en su municipio y en ninguno más",
  cityAccess.mine === true && cityAccess.theirs === false && cityAccess.nowhere === false,
  JSON.stringify(cityAccess),
);

// --- En su municipio, documenta ------------------------------------------
await sql(`
insert into public.cases (city_id, display_name, story)
  select id, 'Familia Rentería', 'Grietas en el muro de carga.' from public.cities where slug = 'quibdo';
insert into public.needs (city_id, category, title)
  select id, 'alimentos', 'Mercados para el albergue' from public.cities where slug = 'quibdo';
insert into public.photos (city_id, storage_path)
  select id, 'quibdo/documentada.jpg' from public.cities where slug = 'quibdo';
`);
check("Quien documenta crea casos, necesidades y fotos en su municipio", true);

await sql(
  "update public.cities set summary = 'Actualizado desde el móvil.' where slug = 'quibdo'",
);
check("Quien documenta puede escribir qué pasó en su municipio", true);

// --- Fuera de su municipio, nada ----------------------------------------
await expectError(
  "Quien documenta no puede crear un caso en un municipio ajeno",
  `insert into public.cases (city_id, display_name)
     select id, 'Caso ajeno' from public.cities where slug = 'istmina'`,
  "row-level security",
);

await expectError(
  "Quien documenta no puede crear una necesidad en un municipio ajeno",
  `insert into public.needs (city_id, category, title)
     select id, 'agua', 'Necesidad ajena' from public.cities where slug = 'istmina'`,
  "row-level security",
);

await expectError(
  "Quien documenta no puede registrar una foto en un municipio ajeno",
  `insert into public.photos (city_id, storage_path)
     select id, 'istmina/colada.jpg' from public.cities where slug = 'istmina'`,
  "row-level security",
);

// Un UPDATE o un DELETE sin política aplicable no lanzan error: no encuentran
// ninguna fila. Se comprueba que no toquen nada, que es la garantía real.
const foreignEdit = await db.exec(
  "update public.needs set title = 'secuestrada' where title = 'Bidones de Istmina'",
);
check(
  "Quien documenta no modifica ninguna necesidad de un municipio ajeno",
  foreignEdit[0].affectedRows === 0,
  `filas=${foreignEdit[0].affectedRows}`,
);

const foreignDelete = await db.exec(
  "delete from public.needs where title = 'Bidones de Istmina'",
);
check(
  "Quien documenta no borra ninguna necesidad de un municipio ajeno",
  foreignDelete[0].affectedRows === 0,
  `filas=${foreignDelete[0].affectedRows}`,
);

const foreignCity = await db.exec(
  "update public.cities set summary = 'secuestrado' where slug = 'istmina'",
);
check(
  "Quien documenta no modifica un municipio que no tiene asignado",
  foreignCity[0].affectedRows === 0,
  `filas=${foreignCity[0].affectedRows}`,
);

await expectError(
  "Quien documenta no puede crear municipios",
  "insert into public.cities (name, slug, lat, lng) values ('Inventado', 'inventado', 5, -76)",
  "row-level security",
);

// Las políticas solo miran city_id: con el municipio propio en una columna y un
// caso ajeno en la otra, la fila colaba. Ahora no.
await asPostgres();
await sql(`insert into public.cases (city_id, display_name, consent_to_publish, published)
  select id, 'Familia de Istmina', true, true from public.cities where slug = 'istmina'`);

await asUser("documenta@test.com");
await expectError(
  "Quien documenta no puede colgar una foto del caso de otro municipio",
  `insert into public.photos (city_id, case_id, storage_path)
     select (select id from public.cities where slug = 'quibdo'),
            id, 'quibdo/robada.jpg'
     from public.cases where display_name = 'Familia de Istmina'`,
  "no pertenece a ese municipio",
);

// --- Publicar y el dinero se quedan en coordinación ---------------------
await expectError(
  "Quien documenta no puede publicar ni despublicar su municipio",
  "update public.cities set published = false where slug = 'quibdo'",
  "coordinación",
);

// ===========================================================================
// El canal general del portal
//
// Aquí estaba el bloque de las fundaciones, que eran el otro sitio donde vivía
// un destino de dinero. Ya no existen (0015): una fundación entra ahora como un
// caso más. Lo que ocupa su sitio es el canal general, que es el destino con más
// alcance de todo el portal —lo usan todos los casos que no tienen el suyo— y
// que por eso tiene que estar más cerrado que ninguno.
//
// Cuatro cosas, y la segunda es la que más importa: que solo haya UNO. Esto ya
// se intentó en 0010 y 0011 lo retiró; vuelve porque el modelo cambió, pero la
// preocupación de 0011 sigue en pie y su mitad de esquema es esta.
// ===========================================================================

const singleGeneral = await one(`select
  (select count(*)::int from public.donation_channel)                  as filas,
  (select donation_key from public.donation_channel where singleton)   as llave`);
check(
  "Hay un canal general y solo uno, con la llave del portal dentro",
  singleGeneral.filas === 1 && singleGeneral.llave === "@soschoco",
  JSON.stringify(singleGeneral),
);

// «Uno» no es una costumbre del panel: lo garantiza el tipo. Sin esto, «el canal
// general» sería «el primero que devuelva la consulta», que es el destino del
// dinero decidido por un orden —lo mismo que hubo que arreglar en 0004—.
await asPostgres();
await expectError(
  "No cabe un segundo canal general: la fila es única por construcción",
  "insert into public.donation_channel (singleton, donation_key) values (false, '@paralelo')",
  "donation_channel_one_row",
);

await expectError(
  "Ni repitiendo la única fila que cabe",
  "insert into public.donation_channel (singleton, donation_key) values (true, '@paralelo')",
  "duplicate key",
);

// Y sigue siendo una llave, un enlace o un número: con dos puestos, cuál recibe
// volvería a decidirlo el orden en que los mire la página.
await expectError(
  "El canal general tampoco puede ser una llave y un enlace a la vez",
  `update public.donation_channel
     set donation_key = '@soschoco', donation_url = 'https://ejemplo.org/donar'`,
  "donation_channel_one_kind",
);

// --- Quien documenta no lo toca ------------------------------------------
//
// Es la sesión que va a existir en los teléfonos del equipo. Sobre el canal
// general basta la política —esta tabla no tiene ninguna otra escritura
// legítima—, al contrario que en `public.cases`, donde hace falta además un
// disparador porque el canal viaja dentro de la ficha entera.
await asUser("documenta@test.com");
const generalEdit = await db.exec(
  "update public.donation_channel set donation_key = '@ladron'",
);
check(
  "Quien documenta no cambia el canal general, que es el destino de más alcance del portal",
  generalEdit[0].affectedRows === 0,
  `filas=${generalEdit[0].affectedRows}`,
);

await expectError(
  "Quien documenta tampoco puede crear otro canal general por su cuenta",
  "insert into public.donation_channel (singleton, donation_key) values (false, '@ladron')",
  "permission denied",
);

// --- El público lo lee y no lo toca --------------------------------------
//
// Leerlo es para lo que está: sin lectura pública, un caso sin canal propio se
// quedaría sin nada que enseñar. Escribirlo no llega ni a las políticas, porque
// `anon` no tiene el permiso de tabla.
await asAnon();
const publicGeneral = await one("select donation_key from public.donation_channel");
check(
  "El público lee el canal general entero, que es justo para lo que está",
  publicGeneral.donation_key === "@soschoco",
  JSON.stringify(publicGeneral),
);

await expectError(
  "El público no puede cambiar el canal general",
  "update public.donation_channel set donation_key = '@ladron'",
  "permission denied",
);

await expectError(
  "Ni borrarlo, que dejaría sin destino a todos los casos sin canal propio",
  "delete from public.donation_channel",
  "permission denied",
);

// Borrarlo tampoco es del equipo: no hay política de delete y tampoco permiso de
// tabla, que son dos cierres que no dependen el uno del otro.
await asUser("charlie@test.com");
await expectError(
  "Ni coordinación puede borrarlo: se cambia, no se vacía",
  "delete from public.donation_channel",
  "permission denied",
);

// --- Y coordinación sí, con su rastro ------------------------------------
await sql("update public.donation_channel set donation_key = '@soschoco-nuevo'");
const stamped = await one(
  "select donation_key, updated_by from public.donation_channel",
);
check(
  "Coordinación cambia el canal general y queda escrito desde qué sesión",
  stamped.donation_key === "@soschoco-nuevo" && stamped.updated_by === "charlie@test.com",
  JSON.stringify(stamped),
);

// El rastro sale del token y no de lo que mande quien llama: es la columna que se
// lee el día que el dinero aparezca en otra cuenta, así que no puede ser un campo
// más del formulario.
await sql(
  "update public.donation_channel set donation_key = '@soschoco', updated_by = 'otra@persona.com'",
);
const stampWins = await one("select updated_by from public.donation_channel");
check(
  "El rastro lo escribe la base de datos: mandarlo desde fuera no lo cambia",
  stampWins.updated_by === "charlie@test.com",
  JSON.stringify(stampWins),
);

await asUser("documenta@test.com");

// --- Storage: la carpeta del municipio es la frontera -------------------
await sql(
  `insert into storage.objects (bucket_id, name)
     select 'fotos', id || '/foto.jpg' from public.cities where slug = 'quibdo'`,
);
check("Quien documenta sube fotos a la carpeta de su municipio", true);

await expectError(
  "Quien documenta no puede subir fotos a la carpeta de otro municipio",
  `insert into storage.objects (bucket_id, name)
     select 'fotos', id || '/colada.jpg' from public.cities where slug = 'istmina'`,
  "row-level security",
);

await expectError(
  "Quien documenta no puede subir fotos fuera de la carpeta de un municipio",
  "insert into storage.objects (bucket_id, name) values ('fotos', 'suelta.jpg')",
  "row-level security",
);

// --- Ofertas: el contacto se ve donde se trabaja ------------------------
await asPostgres();
await sql(`
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category)
  select id, 'Ferretería El Progreso', '3009998877', '600 tejas de zinc', 'techo'
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category)
  select id, 'Parroquia San Judas', 'parroquia@correo.com', '200 mercados', 'alimentos'
  from public.cities where slug = 'istmina';
`);

await asUser("documenta@test.com");
const scopedOffers = await one("select count(*)::int as n from public.offers");
check(
  "Quien documenta solo ve las ofertas de su municipio",
  scopedOffers.n === 1,
  `n=${scopedOffers.n}`,
);

// Tener sesión no es estar en el equipo. Cualquiera puede registrarse en el
// proyecto de Supabase y hablar con la API por su cuenta: aquí hay permiso de
// tabla —lo concede 0001 a `authenticated`— y lo único que lo detiene es que no
// haya política que le devuelva filas.
await asUser("intrusa@test.com");
const intruderOffers = await one("select count(*)::int as n from public.offers");
check(
  "Un usuario con sesión pero fuera del equipo no ve ninguna oferta",
  intruderOffers.n === 0,
  `n=${intruderOffers.n}`,
);

await asUser("charlie@test.com");
const allOffers = await one("select count(*)::int as n from public.offers");
check(
  "Coordinación ve todas las ofertas, incluidas las que no apuntan a un municipio",
  allOffers.n === 3,
  `n=${allOffers.n}`,
);

// ===========================================================================
// El retrato de una persona
//
// Es una de SUS fotos, marcada a mano desde el panel. Lo que hay que demostrar
// aquí es lo que la interfaz no puede prometer: que ese campo no pueda acabar
// señalando la foto de otra —de otra familia, de otro municipio o del pueblo sin
// dueño—, porque eso no sería un error de forma sino la cara de alguien en la
// tarjeta de alguien más. Y que marcarlo respete el reparto de municipios de
// 0002: quien documenta, en los suyos y en ninguno más.
// ===========================================================================

await asPostgres();
const noPortraits = await one(
  "select count(*)::int as n from public.cases where portrait_photo_id is not null",
);
check("Una persona documentada empieza sin retrato", noPortraits.n === 0, `n=${noPortraits.n}`);

// Una foto propia del caso de Istmina, para intentar colarla en el de Quibdó.
await sql(`
insert into public.photos (city_id, case_id, storage_path)
  select k.city_id, k.id, 'istmina/casos/1.jpg'
  from public.cases k where k.display_name = 'Familia de Istmina';
`);

await asUser("documenta@test.com");
await sql(`
update public.cases k set portrait_photo_id = p.id
  from public.photos p
  where k.display_name = 'Familia Mosquera'
    and p.case_id = k.id
    and p.storage_path = 'quibdo/casos/1.jpg';
`);

await asPostgres();
const chosen = await one(`select p.storage_path
  from public.cases k join public.photos p on p.id = k.portrait_photo_id
  where k.display_name = 'Familia Mosquera'`);
check(
  "Quien documenta elige el retrato de una persona de su municipio",
  chosen?.storage_path === "quibdo/casos/1.jpg",
  JSON.stringify(chosen),
);

// --- El retrato solo puede ser una foto de esa persona ------------------
await asUser("documenta@test.com");
await expectError(
  "El retrato no puede ser la foto de una persona de otro municipio",
  `update public.cases k set portrait_photo_id = p.id
     from public.photos p
     where k.display_name = 'Familia Mosquera' and p.storage_path = 'istmina/casos/1.jpg'`,
  "tiene que ser una foto de esa persona",
);

// La foto general del pueblo pasaría todas las políticas —mismo municipio, mismo
// equipo— y es justo la que no puede ser la cara de nadie.
await expectError(
  "El retrato no puede ser una foto del municipio, que no es de nadie",
  `update public.cases k set portrait_photo_id = p.id
     from public.photos p
     where k.display_name = 'Familia Mosquera' and p.storage_path = 'quibdo/1.jpg'`,
  "tiene que ser una foto de esa persona",
);

// Y el caso más fácil de cometer: dos familias del mismo municipio, la misma
// persona documentando, un identificador copiado de la fila de al lado.
await expectError(
  "El retrato no puede ser la foto de otra familia del mismo municipio",
  `update public.cases k set portrait_photo_id = p.id
     from public.photos p
     where k.display_name = 'Familia Rentería' and p.storage_path = 'quibdo/casos/1.jpg'`,
  "tiene que ser una foto de esa persona",
);

// --- Fuera de su municipio, tampoco el retrato -------------------------
// Un UPDATE sin política aplicable no lanza error: no encuentra ninguna fila.
const foreignPortrait = await db.exec(
  `update public.cases set portrait_photo_id =
     (select id from public.photos where storage_path = 'istmina/casos/1.jpg')
   where display_name = 'Familia de Istmina'`,
);
check(
  "Quien documenta no marca el retrato de una persona de un municipio ajeno",
  foreignPortrait[0].affectedRows === 0,
  `filas=${foreignPortrait[0].affectedRows}`,
);

await asUser("otra@test.com");
await sql(`
update public.cases k set portrait_photo_id = p.id
  from public.photos p
  where k.display_name = 'Familia de Istmina'
    and p.case_id = k.id
    and p.storage_path = 'istmina/casos/1.jpg';
`);

await asPostgres();
const istminaPortrait = await one(
  "select portrait_photo_id is not null as marked from public.cases where display_name = 'Familia de Istmina'",
);
check(
  "Quien documenta Istmina sí marca el retrato de la gente de Istmina",
  istminaPortrait.marked === true,
  JSON.stringify(istminaPortrait),
);

// --- El retrato sigue la misma cascada de publicación que su caso -------
await asAnon();
const publicPortrait = await one(`select
  (select count(*)::int from public.cases
     where display_name = 'Familia Mosquera' and portrait_photo_id is not null) as publicada,
  (select count(*)::int from public.cases
     where display_name = 'Familia de Istmina')                                as sin_publicar`);
check(
  "El público ve el retrato del caso publicado y no ve el del municipio sin publicar",
  publicPortrait.publicada === 1 && publicPortrait.sin_publicar === 0,
  JSON.stringify(publicPortrait),
);

// El identificador no sirve de nada si la foto no se puede leer: el retrato tiene
// que ser alcanzable por el público exactamente cuando lo es el caso.
const portraitReadable = await one(`select count(*)::int as n from public.photos p
  where p.id = (select portrait_photo_id from public.cases where display_name = 'Familia Mosquera')`);
check(
  "La foto del retrato es legible por el público, igual que el caso al que pertenece",
  portraitReadable.n === 1,
  `n=${portraitReadable.n}`,
);

// --- Volver a pegar la migración no descoloca un retrato ya elegido -----
await asPostgres();
await sql(migration("migrations/0003_retrato_del_caso.sql"));
const portraitAfterRerun = await one(`select p.storage_path
  from public.cases k join public.photos p on p.id = k.portrait_photo_id
  where k.display_name = 'Familia Mosquera'`);
check(
  "Volver a pasar la migración no cambia el retrato de nadie",
  portraitAfterRerun?.storage_path === "quibdo/casos/1.jpg",
  JSON.stringify(portraitAfterRerun),
);

// --- Borrar la foto del retrato no rompe el caso -----------------------
// Retirar la foto de una persona identificable tiene que poder hacerse en el
// momento y desde el municipio. Si eso dejara el caso inconsistente —o peor, se
// lo llevara por delante— nadie se atrevería a hacerlo con la familia delante.
await asUser("documenta@test.com");
await sql("delete from public.photos where storage_path = 'quibdo/casos/1.jpg'");

await asPostgres();
const afterPhotoDelete = await one(
  "select portrait_photo_id, display_name from public.cases where display_name = 'Familia Mosquera'",
);
check(
  "Borrar la foto del retrato deja a la persona sin retrato, no el caso roto",
  afterPhotoDelete.portrait_photo_id === null && afterPhotoDelete.display_name === "Familia Mosquera",
  JSON.stringify(afterPhotoDelete),
);

// ===========================================================================
// Gestión del equipo
//
// La allowlist no está expuesta en la API: se toca por tres funciones que
// comprueban el rol por su cuenta. Que la pantalla exista solo para coordinación
// no protege nada; esto sí.
// ===========================================================================

await asUser("documenta@test.com");
await expectError(
  "Quien documenta no puede leer la lista del equipo",
  "select public.team_directory()",
  "Solo coordinación",
);

await expectError(
  "Quien documenta no puede invitar a nadie",
  "select public.team_save_member('cuela@test.com', 'coordinacion')",
  "Solo coordinación",
);

await expectError(
  "Quien documenta no puede subirse el rol a sí misma",
  "select public.team_save_member('documenta@test.com', 'coordinacion')",
  "Solo coordinación",
);

await expectError(
  "Quien documenta no puede asignarse un municipio escribiendo en la tabla",
  `insert into private.team_city_assignments (email, city_id)
     select 'documenta@test.com', id from public.cities where slug = 'istmina'`,
  "permission denied",
);

// Quien tiene sesión pero no está en la lista no tiene rol, y "no tener rol" no
// puede confundirse con "tener permiso": es el caso que se cuela si la
// comprobación se hace con un nulo.
await asUser("intrusa@test.com");
await expectError(
  "Un usuario con sesión pero fuera del equipo no puede leer la lista del equipo",
  "select public.team_directory()",
  "Solo coordinación",
);

await expectError(
  "Un usuario con sesión pero fuera del equipo no puede invitar a nadie",
  "select public.team_save_member('intrusa@test.com', 'coordinacion')",
  "Solo coordinación",
);

await asAnon();
await expectError(
  "El público no puede ni invocar la gestión del equipo",
  "select public.team_directory()",
  "permission denied",
);

await asUser("charlie@test.com");
const directory = await one("select jsonb_array_length(public.team_directory()) as n");
check("Coordinación lee la lista del equipo", Number(directory.n) === 3, `n=${directory.n}`);

await sql(
  `select public.team_save_member('nueva@test.com', 'documentacion',
     array(select id from public.cities where slug = 'istmina'))`,
);

// La comprobación se hace como postgres porque la allowlist no es legible desde
// la API ni para coordinación: se lee por team_directory() y nada más.
await asPostgres();
const invited = await one(`select tm.role,
  (select count(*)::int from private.team_city_assignments a where a.email = tm.email) as cities
  from private.team_members tm where tm.email = 'nueva@test.com'`);
check(
  "Coordinación invita con rol y municipio en un solo gesto",
  invited?.role === "documentacion" && invited?.cities === 1,
  JSON.stringify(invited),
);

await asUser("charlie@test.com");
// Un correo con mayúsculas es la misma persona: la comprobación de rol no
// distingue mayúsculas y la clave de la tabla sí, así que dos filas de la misma
// persona darían un permiso que depende de cuál se lea antes.
await asPostgres();
await sql(
  "insert into private.team_members (email, role) values ('Mayus@Test.com', 'coordinacion')",
);

await asUser("charlie@test.com");
await sql("select public.team_save_member('mayus@test.com', 'documentacion')");

await asPostgres();
const normalized = await one(
  "select count(*)::int as n, min(role) as role from private.team_members where lower(email) = 'mayus@test.com'",
);
check(
  "Guardar a alguien con el correo en mayúsculas no deja dos filas suyas",
  normalized.n === 1 && normalized.role === "documentacion",
  JSON.stringify(normalized),
);
await sql("delete from private.team_members where lower(email) = 'mayus@test.com'");

await asUser("charlie@test.com");
await expectError(
  "Nadie se quita a sí misma la coordinación",
  "select public.team_save_member('charlie@test.com', 'documentacion')",
  "No puedes quitarte",
);

await expectError(
  "Nadie se saca a sí misma de la lista del equipo",
  "select public.team_remove_member('charlie@test.com')",
  "No puedes sacarte",
);

await sql("select public.team_remove_member('nueva@test.com')");
await asPostgres();
const removed = await one(`select
  (select count(*)::int from private.team_members where email = 'nueva@test.com') as members,
  (select count(*)::int from private.team_city_assignments where email = 'nueva@test.com') as cities`);
check(
  "Sacar a alguien del equipo se lleva sus asignaciones",
  removed.members === 0 && removed.cities === 0,
  JSON.stringify(removed),
);

// ===========================================================================
// Registro público de ayudas: público, y anónimo por defecto
// ===========================================================================

await asUser("charlie@test.com");
await expectError(
  "Una oferta rechazada no puede figurar como entregada",
  `update public.offers set status = 'rechazada', delivered_on = current_date
     where offerer_name = 'Ferretería El Progreso'`,
  "offers_delivery_requires_acceptance",
);

await sql(
  `update public.offers set status = 'aceptada', delivered_on = current_date - 2
     where offerer_name = 'Ferretería El Progreso'`,
);
check("Coordinación registra que una ayuda llegó", true);

const viewColumns = await db.query(
  "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'aid_log'",
);
const columnNames = viewColumns.rows.map((row) => row.column_name);
check(
  "El registro público no tiene ni columna de contacto ni el mensaje privado",
  !columnNames.includes("offerer_contact") &&
    !columnNames.includes("message") &&
    !columnNames.includes("team_notes"),
  columnNames.join(", "),
);

// La descripción de la ayuda la escribe quien la ofrece, con sus palabras y sin
// que nadie las revise: «tratamiento para la tensión, tres meses» al lado de la
// ficha de un caso que menciona a una señora con hipertensión la señala sin
// nombrarla. Lo que se comprueba es que la columna NO EXISTE, igual que con el día
// y el caso: si mañana alguien la devuelve, da igual lo que pinte la página.
check(
  "El registro público no tiene la descripción que escribió quien ofrece la ayuda",
  !columnNames.includes("resource"),
  columnNames.join(", "),
);

// El recorte del día y del caso vive en la vista, no en la plantilla: lo que se
// comprueba es que esas columnas NO EXISTEN. Si alguien las devuelve mañana, da
// igual lo que pinte la página: la API las serviría.
check(
  "El registro público no tiene columna con la fecha completa",
  !columnNames.includes("delivered_on") && columnNames.includes("delivered_month"),
  columnNames.join(", "),
);

check(
  "El registro público no tiene ninguna columna del caso",
  !columnNames.some((name) => name.startsWith("case")),
  columnNames.join(", "),
);

await asAnon();
await expectError(
  "El público no puede leer las ofertas ni pidiendo solo el contacto",
  "select offerer_contact from public.offers",
  "permission denied",
);

const aid = await one(
  "select count(*)::int as n, count(offerer_name)::int as named from public.aid_log",
);
check(
  "El público ve la ayuda entregada y no ve quién la dio",
  aid.n === 1 && aid.named === 0,
  JSON.stringify(aid),
);

const aidRow = await one(
  "select category, city_name, need_title, delivered_month from public.aid_log",
);
check(
  "El registro dice de qué tipo era, en qué mes llegó y a qué municipio",
  aidRow.category === "techo" &&
    aidRow.city_name === "Quibdó" &&
    /^\d{4}-\d{2}$/.test(aidRow.delivered_month),
  JSON.stringify(aidRow),
);

// ===========================================================================
// La categoría publicada, contra el vocabulario cerrado
//
// Aquí está el punto fino de todo el recorte. `public.offers.category` es texto
// libre: no tiene el `check` que sí tienen las necesidades, porque la oferta la
// escribe cualquiera desde /ofrecer y rechazar una fila es perder una ayuda que
// alguien quería dar. De modo que quitar la descripción y publicar la categoría
// tal cual no habría cerrado nada: bastaría escribir la frase entera en el campo de
// la categoría para que saliera por la puerta que se acaba de cerrar.
//
// Lo que hay que demostrar es que lo que sale de la vista pertenece siempre a las
// nueve palabras, venga lo que venga en la tabla.
// ===========================================================================

const setCategory = async (value) => {
  await asUser("charlie@test.com");
  await sql(
    `update public.offers set category = '${value}' where offerer_name = 'Ferretería El Progreso'`,
  );
  await asAnon();
  return (await one("select category from public.aid_log")).category;
};

// El caso que hace falta cerrar, con el texto del ejemplo de 0002 metido en el
// campo de la categoría.
const forged = await setCategory("Tratamiento para la tensión, tres meses");
check(
  "Una frase escrita en el campo de la categoría no se publica: sale «otro»",
  forged === "otro",
  String(forged),
);

// El vocabulario no se copia aquí a mano: se lee de la restricción de las
// necesidades, que es la lista de la que habla el producto. Así esta prueba falla
// el día en que la vista y esa restricción dejen de decir lo mismo, que es la
// forma en que esto se va a romper de verdad.
await asPostgres();
const categoryConstraint = await one(
  "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'needs_category_valid'",
);
const vocabulary = [...categoryConstraint.def.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
check(
  "Las nueve categorías del vocabulario se leen de la restricción de las necesidades",
  vocabulary.length === 9 && vocabulary.includes("mano_de_obra"),
  vocabulary.join(", "),
);

const published = [];
for (const value of vocabulary) published.push(await setCategory(value));
check(
  "Cada categoría del vocabulario se publica tal cual, las nueve",
  JSON.stringify(published) === JSON.stringify(vocabulary),
  published.join(", "),
);

// Las variantes que se cuelan de verdad: un espacio delante, mayúsculas, la
// palabra buena con una frase pegada detrás, el campo vacío. Ninguna es un ataque;
// todas son alguien escribiendo deprisa o una integración futura mandando el campo
// a su manera.
const forgeries = [
  "",
  " techo",
  "TECHO",
  "Medicinas",
  "medicamentos, tres meses de tratamiento",
  "tratamiento tension",
  "agua potable para la señora del fondo",
];
const escaped = [];
for (const value of forgeries) {
  const result = await setCategory(value);
  if (!vocabulary.includes(result)) escaped.push(`${value} -> ${result}`);
}
check(
  "Nada de lo que se escriba en la categoría se publica fuera del vocabulario",
  escaped.length === 0,
  escaped.join(" | "),
);

// La prueba de conjunto: la misma frase metida a la vez en los dos campos que
// escribe quien ofrece la ayuda —la descripción y la categoría— y después se mira
// la fila publicada entera, columna por columna. No se comprueba que una columna
// esté limpia, se comprueba que la frase no asoma por ninguna.
await asUser("charlie@test.com");
await sql(`update public.offers
  set resource = 'Tratamiento para la tensión, tres meses',
      category = 'tratamiento para la tensión, tres meses'
  where offerer_name = 'Ferretería El Progreso'`);

await asAnon();
const forgedRows = await db.query("select * from public.aid_log");
const forgedValues = forgedRows.rows.flatMap((row) => Object.values(row).map(String));
check(
  "Con la frase en la descripción y en la categoría, no asoma en ninguna columna publicada",
  !forgedValues.some((value) => value.toLowerCase().includes("tensión")),
  forgedValues.join(" | "),
);

// Se deja como estaba para lo que viene después.
await asUser("charlie@test.com");
await sql(
  `update public.offers set resource = '600 tejas de zinc', category = 'techo'
     where offerer_name = 'Ferretería El Progreso'`,
);
await asAnon();

// --- Lo que no sale por la vía pública ----------------------------------
await expectError(
  "El público no puede pedir el día de la entrega: la columna no existe",
  "select delivered_on from public.aid_log",
  'column "delivered_on" does not exist',
);

await expectError(
  "El público no puede pedir la descripción de la ayuda: la columna no existe",
  "select resource from public.aid_log",
  'column "resource" does not exist',
);

// Ni por el rodeo de pedirla desde la tabla del fondo con la vista de por medio:
// `anon` no tiene permiso sobre `public.offers`, así que ni siquiera llega a las
// políticas.
await expectError(
  "El público no puede pedir la descripción desde la tabla de ofertas",
  "select resource from public.offers",
  "permission denied",
);

// El equipo sí la conserva completa: el recorte es de lo que se publica, no de lo
// que se guarda. Sin esto, no se podría responder a quien mandó la ayuda ni saber
// qué se movió.
await asUser("charlie@test.com");
const teamKeepsText = await one(
  "select resource from public.offers where offerer_name = 'Ferretería El Progreso'",
);
check(
  "El equipo conserva en su bandeja la descripción completa de la ayuda",
  teamKeepsText.resource === "600 tejas de zinc",
  String(teamKeepsText.resource),
);
await asAnon();

// Ni por un rodeo: el mes es texto 'YYYY-MM' y no una fecha recortada al
// imprimirla, así que no hay día que extraer de él por mucho que se insista.
const monthOnly = await one(
  "select delivered_month, length(delivered_month)::int as len from public.aid_log",
);
check(
  "El mes que se publica no lleva día dentro",
  monthOnly.len === 7,
  JSON.stringify(monthOnly),
);

// El equipo sí conserva la fecha completa: el recorte es de lo que se publica, no
// de lo que se guarda. Sin esto el recorte sería pérdida de información.
await asUser("charlie@test.com");
const teamKeepsDay = await one(
  `select delivered_on, to_char(delivered_on, 'YYYY-MM') as month
     from public.offers where offerer_name = 'Ferretería El Progreso'`,
);
check(
  "El equipo conserva el día exacto de la entrega",
  teamKeepsDay.delivered_on !== null && teamKeepsDay.month === monthOnly.delivered_month,
  JSON.stringify(teamKeepsDay),
);

// --- El caso al que fue no sale por la vía pública ----------------------
for (const column of ["case_id", "case_name"]) {
  await asAnon();
  await expectError(
    `El público no puede pedir ${column} del registro: la columna no existe`,
    `select ${column} from public.aid_log`,
    `column "${column}" does not exist`,
  );
}

// Una entrega contra una necesidad DE UN CASO es el rodeo que hay que cerrar: el
// título de esa necesidad está escrito en la ficha de la familia, así que
// publicarlo sería nombrarla sin nombrarla. Se comprueba con la necesidad "Agua
// potable" del caso de la familia Mosquera.
await asUser("charlie@test.com");
// Entra como la que manda quien ofrece —pendiente y sin fecha, que es lo único
// que deja la política de inserción— y la marca entregada el equipo.
await sql(`
insert into public.offers (city_id, need_id, case_id, offerer_name, offerer_contact,
                           resource, category)
  select n.city_id, n.id, n.case_id, 'Droguería del Centro', '3007776655',
         'Tratamiento para la tensión, tres meses', 'medicamentos'
  from public.needs n where n.title = 'Agua potable' and n.case_id is not null;

update public.offers set status = 'aceptada', delivered_on = current_date - 1
  where offerer_name = 'Droguería del Centro';
`);

const teamSeesCase = await one(
  `select o.case_id is not null as linked, o.delivered_on is not null as delivered
     from public.offers o where o.offerer_name = 'Droguería del Centro'`,
);
check(
  "En la bandeja del equipo la entrega sigue colgada de su caso",
  teamSeesCase.linked === true && teamSeesCase.delivered === true,
  JSON.stringify(teamSeesCase),
);

// La fila ya no se puede buscar por su descripción, porque la descripción no está
// en la vista. Se busca por la categoría, que es lo único que se publica de qué
// llegó: es la entrega de medicamentos, y es la única.
await asAnon();
const caseDelivery = await one(
  "select city_name, need_title from public.aid_log where category = 'medicamentos'",
);
check(
  "Una entrega a un caso sale con su municipio y sin nada del caso",
  caseDelivery?.city_name === "Quibdó" && caseDelivery?.need_title === null,
  JSON.stringify(caseDelivery),
);

// Y no hay forma de llegar al caso desde el registro: ningún valor de ninguna
// fila coincide con el identificador ni con el nombre del caso, ni contiene la
// descripción que escribió quien ofreció la ayuda —que es el rodeo que 0002 dejaba
// abierto: «tratamiento para la tensión, tres meses» junto a la ficha de una señora
// con la tensión alta la señala sin nombrarla—.
await asPostgres();
const caseIdentity = await one(
  "select id::text as id, display_name from public.cases where display_name = 'Familia Mosquera'",
);
const writtenText = await one(
  "select resource from public.offers where offerer_name = 'Droguería del Centro'",
);
await asAnon();
const wholeLog = await db.query("select * from public.aid_log");
const flattened = wholeLog.rows.flatMap((row) => Object.values(row).map(String));
check(
  "En ninguna fila del registro aparece el identificador ni el nombre del caso",
  !flattened.includes(caseIdentity.id) && !flattened.includes(caseIdentity.display_name),
  `filas=${wholeLog.rows.length}`,
);

// Se comprueba por trozos y no por igualdad: lo que no puede pasar es que ese texto
// asome dentro de otro valor, aunque sea recortado.
check(
  "En ninguna fila del registro asoma el texto que escribió quien ofreció la ayuda",
  !flattened.some((value) => value.includes(writtenText.resource)) &&
    !flattened.some((value) => value.toLowerCase().includes("tensión")),
  `filas=${wholeLog.rows.length}, texto=${writtenText.resource}`,
);

await asPostgres();
await sql("delete from public.offers where offerer_name = 'Droguería del Centro'");

// ===========================================================================
// Las dos barreras de las ofertas, cada una sin la otra
//
// El contacto de quien ofrece ayuda está detrás de dos cosas que no dependen
// entre sí: que `anon` no tenga permiso de select sobre la tabla, y que no tenga
// política que se lo dé. Ver que la API devuelve cero filas no dice cuál de las
// dos está trabajando, y esa confusión es justo lo que dejó a la base de datos
// del proyecto meses con una sola: la lista salía vacía igual.
//
// Así que se tira cada barrera por separado y se mira si la otra aguanta sola.
// ===========================================================================

// La política, sola: aunque alguien conceda por error el permiso de lectura, no
// hay política pública que devuelva ninguna fila.
await asPostgres();
await sql("grant select on public.offers to anon");
await asAnon();
const leaked = await one("select count(*)::int as n from public.offers");
check(
  "Con permiso de tabla concedido por error, la política sigue sin dar ninguna oferta",
  leaked.n === 0,
  `n=${leaked.n}`,
);

// Y el permiso, solo, contra el descuido que 0002 temía: una política de lectura
// añadida para depurar algo o para una pantalla nueva que «solo lee».
//
// Primero se comprueba, con las dos barreras caídas a la vez, que esa política
// devuelve de verdad el teléfono. Sin este paso la comprobación siguiente
// pasaría igual de bien con la política mal escrita, que es la manera en que una
// prueba de seguridad deja de comprobar nada sin que se note.
await asPostgres();
await sql("create policy offers_descuido_read on public.offers for select to anon using (true)");
await asAnon();
const bothBarriersDown = await one("select offerer_contact from public.offers limit 1");
check(
  "Con las dos barreras caídas el contacto sí sale, así que la política del descuido es real",
  typeof bothBarriersDown?.offerer_contact === "string" && bothBarriersDown.offerer_contact !== "",
  JSON.stringify(bothBarriersDown),
);

await asPostgres();
await sql("revoke select on public.offers from anon");
await asAnon();
await expectError(
  "Con esa política puesta, el permiso de tabla niega las ofertas él solo",
  "select offerer_contact from public.offers",
  "permission denied",
);

await asPostgres();
await sql("drop policy offers_descuido_read on public.offers");

// --- Lo que el público tampoco puede pedir, y ahora falla donde debe ------
//
// Sin permiso, estas cuatro ni llegan a las políticas. Antes tampoco tocaban
// nada —no hay política que las ampare—, pero un update o un delete sin política
// aplicable no dan error: dicen «cero filas» y siguen adelante. La diferencia
// deja de ser cosmética el día que aparezca una política de más.
await asAnon();
await expectError(
  "El público no puede modificar una oferta ya enviada",
  "update public.offers set team_notes = 'colado'",
  "permission denied",
);

await expectError(
  "El público no puede borrar ofertas",
  "delete from public.offers",
  "permission denied",
);

await expectError(
  "El público no puede vaciar la tabla de ofertas de un golpe",
  "truncate public.offers",
  "permission denied",
);

await expectError(
  "El público no puede escribir en las tablas del portal",
  "insert into public.cities (name, slug, lat, lng) values ('Colado', 'colado', 5, -76)",
  "permission denied",
);

// --- Y la puerta que sí tiene que seguir abierta -------------------------
//
// Ofrecer ayuda es lo único que el público escribe en todo el portal, y es lo
// que un `revoke` de más se lleva por delante sin que se note hasta que alguien
// intenta ofrecer de verdad. Se manda igual que la manda la Server Action de
// /ofrecer: pendiente, sin fecha y sin releer la fila.
await asAnon();
await sql(`insert into public.offers (offerer_name, offerer_contact, resource, category)
  values ('Panadería La Esperanza', '3005554433', '300 panes cada semana', 'alimentos')`);

await asPostgres();
const stillDelivering = await one(
  "select status, delivered_on from public.offers where offerer_name = 'Panadería La Esperanza'",
);
check(
  "Con el permiso recortado al mínimo, el formulario de /ofrecer sigue entregando",
  stillDelivering?.status === "pendiente" && stillDelivering.delivered_on === null,
  JSON.stringify(stillDelivering),
);
await sql("delete from public.offers where offerer_name = 'Panadería La Esperanza'");

// --- El nombre, solo con autorización expresa --------------------------
await asUser("charlie@test.com");
await sql(
  "update public.offers set publish_name = true where offerer_name = 'Ferretería El Progreso'",
);

await asAnon();
const authorized = await one("select offerer_name from public.aid_log");
check(
  "Con autorización, el nombre sí aparece",
  authorized.offerer_name === "Ferretería El Progreso",
  String(authorized.offerer_name),
);

await asUser("charlie@test.com");
await sql(
  `update public.offers set offerer_name = 'Marta, 3167778899'
     where offerer_name = 'Ferretería El Progreso'`,
);

await asAnon();
const phoneInName = await one("select offerer_name from public.aid_log");
check(
  "Un teléfono escrito en el campo del nombre no se publica, ni con autorización",
  phoneInName.offerer_name === null,
  String(phoneInName.offerer_name),
);

await expectError(
  "Quien ofrece ayuda no puede darse por entregada al enviarla",
  `insert into public.offers (offerer_name, offerer_contact, resource, delivered_on)
     values ('Bot', '3001112222', 'algo', current_date)`,
  "row-level security",
);

await asPostgres();
await sql(
  `update public.offers set offerer_name = 'Ferretería El Progreso', publish_name = false
     where offerer_name = 'Marta, 3167778899'`,
);

// --- Seguimiento del caso -----------------------------------------------
await asUser("documenta@test.com");
await sql(`
insert into public.case_updates (case_id, city_id, happened_on, title, body)
  select id, city_id, '2026-08-12', 'Llegaron bloques', 'Ochenta, de un vecino.'
  from public.cases where display_name = 'Familia Mosquera';
`);
check("Quien documenta anota el seguimiento de su municipio", true);

// El canal de donación del caso no lo pone quien documenta —eso tiene su propia
// sección, más abajo—, así que aquí lo escribe coordinación para poder
// comprobar después que el público lo lee.
await asUser("charlie@test.com");
await sql(`update public.cases set donation_url = 'https://vaki.co/vaki/mosquera'
  where display_name = 'Familia Mosquera'`);
await asUser("documenta@test.com");

await expectError(
  "Quien documenta no anota seguimiento en un municipio ajeno",
  `insert into public.case_updates (case_id, city_id, happened_on, title)
     select id, city_id, '2026-08-12', 'Colado'
     from public.cases where display_name = 'Familia de Istmina'`,
  "row-level security",
);

await expectError(
  "Una nota no puede colgarse de un caso de otro municipio",
  `insert into public.case_updates (case_id, city_id, happened_on, title)
     select k.id, c.id, '2026-08-12', 'Cruzado'
     from public.cases k, public.cities c
     where k.display_name = 'Familia Mosquera' and c.slug = 'istmina'`,
  "no pertenece",
);

await asUser("documenta@test.com");
await sql(`
insert into public.photos (city_id, case_id, storage_path)
  select k.city_id, k.id, 'quibdo/casos/avance.jpg'
  from public.cases k where k.display_name = 'Familia Mosquera';
update public.case_updates u set photo_id = p.id
  from public.photos p, public.cases k
  where u.case_id = k.id
    and k.display_name = 'Familia Mosquera'
    and p.storage_path = 'quibdo/casos/avance.jpg';
`);
check("Quien documenta cuelga una foto del propio caso en el avance", true);

await expectError(
  "La foto del avance no puede ser de otra familia",
  `update public.case_updates u set photo_id = p.id
     from public.photos p
     where p.storage_path = 'istmina/casos/1.jpg'
       and u.title = 'Llegaron bloques'`,
  "tiene que ser de ese caso",
);

await expectError(
  "La foto del avance no puede ser una foto del municipio",
  `update public.case_updates u set photo_id = p.id
     from public.photos p
     where p.storage_path = 'quibdo/1.jpg'
       and u.title = 'Llegaron bloques'`,
  "tiene que ser de ese caso",
);

await asAnon();
const publicFollow = await one(`select
  (select count(*)::int from public.case_updates) as notas,
  (select photo_id is not null from public.case_updates limit 1) as con_foto,
  (select donation_url from public.cases where display_name = 'Familia Mosquera') as donar`);
check(
  "El público ve el seguimiento, su foto y el canal de donación del caso publicado",
  publicFollow.notas === 1 &&
    publicFollow.con_foto === true &&
    publicFollow.donar === "https://vaki.co/vaki/mosquera",
  JSON.stringify(publicFollow),
);

await asUser("documenta@test.com");
await sql("delete from public.photos where storage_path = 'quibdo/casos/avance.jpg'");
await asPostgres();
const afterAdvancePhoto = await one("select photo_id from public.case_updates");
check(
  "Borrar la foto del avance deja la nota sin imagen, no el diario roto",
  afterAdvancePhoto.photo_id === null,
  JSON.stringify(afterAdvancePhoto),
);

// ===========================================================================
// El encuadre de cada foto
//
// Las fotos llegan del móvil, verticales y con el motivo donde cayó, y el portal
// las mete en cajas distintas: el círculo del retrato, el 3:2 del carrusel, el
// cuadrado del diario. `focus_x`, `focus_y` y `zoom` —0009— son la ventana que se
// enseña de cada una. El archivo de Storage no se recorta: el original sigue
// entero, que es la documentación, y lo que cambia es qué parte se mira.
//
// Hay dos cosas que demostrar aquí. Que los tres números no puedan quedarse a
// medias ni salirse de su rango, porque un encuadre inválido no se ve en el panel:
// se ve más tarde como una cara cortada en la tarjeta de alguien. Y que encuadrar
// sea escribir —y por tanto respete el reparto de municipios de 0002—, porque
// mover la ventana de una foto es decidir qué se enseña de una persona, y eso es
// lo que menos parece una escritura de todo el panel: no crea ni borra nada, y
// desde fuera se lee como un ajuste de presentación.
//
// Y hay un motivo para que esta sección exista y no baste con que la migración
// esté escrita: `lib/data.ts` pide las tres columnas por su nombre en la ficha del
// municipio y en las listas de casos. Una base con 0001–0008 no da error en
// pantalla, deja esas listas sin casos —el error de PostgREST viaja aparte y esas
// funciones solo leen `data`—, que es la misma clase de silencio que dejó a la base
// real meses sin dos migraciones.
// ===========================================================================

await asPostgres();
const frameColumns = await db.query(`
  select column_name, data_type, column_default, is_nullable
  from information_schema.columns
  where table_schema = 'public' and table_name = 'photos'
    and column_name in ('focus_x', 'focus_y', 'zoom')
  order by column_name`);
check(
  "Las tres columnas del encuadre existen y son números reales",
  frameColumns.rows.length === 3 && frameColumns.rows.every((row) => row.data_type === "real"),
  frameColumns.rows.map((row) => `${row.column_name}=${row.data_type}`).join(", "),
);

// Nulas y sin valor por omisión, y esto no es un detalle: un `default` de 50, 50, 1
// habría reencuadrado de golpe todas las fotos que ya están subidas al aplicar la
// migración. Nulo significa «usa el recorte por omisión de esa caja», así que una
// foto que nadie ha tocado se sigue viendo igual que antes de 0009.
check(
  "El encuadre nace nulo y sin valor por omisión, así que aplicar 0009 no mueve ninguna foto ya subida",
  frameColumns.rows.every((row) => row.column_default === null && row.is_nullable === "YES"),
  frameColumns.rows
    .map((row) => `${row.column_name}: default=${row.column_default} nulable=${row.is_nullable}`)
    .join(" | "),
);

const unframed = await one(`select count(*)::int as n from public.photos
  where focus_x is not null or focus_y is not null or zoom is not null`);
check(
  "Las fotos cargadas hasta aquí no tienen encuadre guardado",
  unframed.n === 0,
  `n=${unframed.n}`,
);

// --- En su municipio, encuadra ------------------------------------------
await asUser("documenta@test.com");
await sql(`update public.photos set focus_x = 38, focus_y = 24, zoom = 1.8
  where storage_path = 'quibdo/1.jpg'`);

await asPostgres();
const framed = await one(
  "select focus_x, focus_y, zoom from public.photos where storage_path = 'quibdo/1.jpg'",
);
check(
  "Quien documenta encuadra una foto de su municipio y los tres números quedan guardados",
  Number(framed.focus_x) === 38 &&
    Number(framed.focus_y) === 24 &&
    Math.abs(Number(framed.zoom) - 1.8) < 0.001,
  JSON.stringify(framed),
);

// --- Los tres números, dentro de su rango o no entran -------------------
//
// El panel ya recorta los valores antes de mandarlos (`clampFrame`), así que esto
// protege de la otra puerta: cualquiera con sesión hablando con la Data API por su
// cuenta, o un cliente futuro que mande el campo a su manera.
await asUser("documenta@test.com");
await expectError(
  "El foco horizontal no puede pasarse del ancho de la foto",
  "update public.photos set focus_x = 140 where storage_path = 'quibdo/1.jpg'",
  "photos_focus_x_range",
);

await expectError(
  "El foco horizontal no puede ser negativo",
  "update public.photos set focus_x = -1 where storage_path = 'quibdo/1.jpg'",
  "photos_focus_x_range",
);

await expectError(
  "El foco vertical no puede salirse de la foto",
  "update public.photos set focus_y = 101 where storage_path = 'quibdo/1.jpg'",
  "photos_focus_y_range",
);

// Menos de 1 sería alejarse de una foto que ya está entera: dejaría hueco dentro
// de la caja en vez de llenarla.
await expectError(
  "El zoom no puede alejarse por debajo de la foto entera",
  "update public.photos set zoom = 0.5 where storage_path = 'quibdo/1.jpg'",
  "photos_zoom_range",
);

await expectError(
  "El zoom no puede pasar de 3, donde la foto del móvil ya es una mancha",
  "update public.photos set zoom = 4 where storage_path = 'quibdo/1.jpg'",
  "photos_zoom_range",
);

// --- Los tres, o ninguno -----------------------------------------------
//
// Medio encuadre no tiene lectura posible: quien pinta no sabría si completar con
// el recorte por omisión o con el número que falta, y `savedFrame()` lo leería como
// «esta foto no tiene encuadre», o sea que el ajuste guardado se perdería en
// silencio. Se cierra en la base de datos y no en la Server Action.
await expectError(
  "No se puede guardar el encuadre sin una de las dos coordenadas",
  "update public.photos set focus_y = null where storage_path = 'quibdo/1.jpg'",
  "photos_encuadre_completo",
);

await expectError(
  "No se puede guardar el zoom sin decir dónde mira el recorte",
  `update public.photos set focus_x = null, focus_y = null
     where storage_path = 'quibdo/1.jpg'`,
  "photos_encuadre_completo",
);

// Los tres a la vez sí se pueden dejar en nulo: es el «quitar el encuadre» del
// panel, que devuelve la foto al recorte por omisión de su caja sin volver a subir
// el archivo. Tiene que ser tan fácil de deshacer como de hacer.
await asUser("documenta@test.com");
await sql(`update public.photos set focus_x = null, focus_y = null, zoom = null
  where storage_path = 'quibdo/1.jpg'`);

await asPostgres();
const cleared = await one(
  "select focus_x, focus_y, zoom from public.photos where storage_path = 'quibdo/1.jpg'",
);
check(
  "Quitar el encuadre devuelve la foto al recorte por omisión de cada caja",
  cleared.focus_x === null && cleared.focus_y === null && cleared.zoom === null,
  JSON.stringify(cleared),
);

await asUser("documenta@test.com");
await sql(`update public.photos set focus_x = 38, focus_y = 24, zoom = 1.8
  where storage_path = 'quibdo/1.jpg'`);

// --- Fuera de su municipio, tampoco el encuadre ------------------------
//
// Lo gobierna la misma política que el resto de la fila —`photos_assigned_update`
// de 0002—, y un UPDATE sin política aplicable no lanza error: no encuentra
// ninguna fila. Se comprueba que no toque nada y que los valores sigan donde
// estaban, que es la garantía real. La foto elegida es la de una persona de otro
// municipio, que es donde esto pesa: reencuadrar la cara de alguien a quien no se
// documenta es enseñar de ella algo que no eligió nadie que estuviera allí.
await asUser("documenta@test.com");
const foreignFrame = await db.exec(
  `update public.photos set focus_x = 90, focus_y = 90, zoom = 3
     where storage_path = 'istmina/casos/1.jpg'`,
);
check(
  "Quien documenta no encuadra la foto de una persona de un municipio ajeno",
  foreignFrame[0].affectedRows === 0,
  `filas=${foreignFrame[0].affectedRows}`,
);

await asPostgres();
const foreignUntouched = await one(
  "select focus_x, focus_y, zoom from public.photos where storage_path = 'istmina/casos/1.jpg'",
);
check(
  "La foto del municipio ajeno se queda con sus tres nulos",
  foreignUntouched.focus_x === null &&
    foreignUntouched.focus_y === null &&
    foreignUntouched.zoom === null,
  JSON.stringify(foreignUntouched),
);

await asUser("otra@test.com");
await sql(`update public.photos set focus_x = 50, focus_y = 30, zoom = 1.2
  where storage_path = 'istmina/casos/1.jpg'`);

await asPostgres();
const istminaFrame = await one(`select focus_x is not null as encuadrada
  from public.photos where storage_path = 'istmina/casos/1.jpg'`);
check(
  "Quien documenta Istmina sí encuadra las fotos de Istmina",
  istminaFrame.encuadrada === true,
  JSON.stringify(istminaFrame),
);

// Tener sesión no es estar en el equipo, y sin `where` el intento va contra las
// fotos de todo el portal.
await asUser("intrusa@test.com");
const intruderFrame = await db.exec(
  "update public.photos set focus_x = 0, focus_y = 0, zoom = 3",
);
check(
  "Un usuario con sesión pero fuera del equipo no encuadra ninguna foto del portal",
  intruderFrame[0].affectedRows === 0,
  `filas=${intruderFrame[0].affectedRows}`,
);

// El público no llega ni a las políticas: 0008 le dejó `select` y nada más.
await asAnon();
await expectError(
  "El público no puede reencuadrar una foto, que ni siquiera es una escritura visible",
  "update public.photos set focus_x = 0, focus_y = 0, zoom = 3",
  "permission denied",
);

// Y el encuadre sí tiene que salir al público con la foto: es lo que la página usa
// para pintar el recorte, así que se guarda para que se vea. Si no llegara, el
// ajuste que alguien hizo en terreno no existiría fuera del panel.
const publicFrame = await one(
  "select focus_x, focus_y, zoom from public.photos where storage_path = 'quibdo/1.jpg'",
);
check(
  "El público lee el encuadre de una foto publicada, que es lo que recorta la imagen",
  Number(publicFrame.focus_x) === 38 && Number(publicFrame.focus_y) === 24,
  JSON.stringify(publicFrame),
);

// --- Volver a pegar la migración no descoloca un encuadre guardado -----
//
// 0009 rehace sus cuatro restricciones cada vez, así que al volver a pasarla
// Postgres revalida las filas que ya están: un encuadre guardado que no cumpliera
// pararía la migración en vez de colarse. Y las columnas se añaden con
// `if not exists`, de modo que los tres números tienen que seguir intactos.
await asPostgres();
await sql(migration("migrations/0009_encuadre_de_fotos.sql"));
const frameAfterRerun = await one(
  "select focus_x, focus_y, zoom from public.photos where storage_path = 'quibdo/1.jpg'",
);
check(
  "Volver a pasar la migración no descoloca el encuadre de ninguna foto",
  Number(frameAfterRerun.focus_x) === 38 &&
    Number(frameAfterRerun.focus_y) === 24 &&
    Math.abs(Number(frameAfterRerun.zoom) - 1.8) < 0.001,
  JSON.stringify(frameAfterRerun),
);

// ===========================================================================
// El canal de donación de un caso, y el general cuando no tiene el suyo
//
// Aquí vivía la llave global que 0011 retiró, y después el reparto de 0011:
// un canal por municipio y uno por caso. Hoy hay canales de caso y un canal
// general, y ninguno de municipio (0015). El cambio de fondo es que un caso sin
// canal propio YA NO se queda sin nada: usa el general.
//
// Eso invierte la regla que este bloque defendía —«sin canal propio, no hay
// canal»— y por eso hay que decir con precisión qué se conserva de ella. Se
// conserva entera la preocupación: que nadie mande dinero a un destino que no
// es el que cree. Lo que cambia es cómo se cumple. Antes callando; ahora
// diciéndolo. Y la mitad que se puede demostrar aquí es que el esquema NO
// mezcla los dos: el canal general vive en su propia tabla y la columna del
// caso sigue vacía cuando está vacía, así que ninguna consulta puede confundir
// uno con otro. Que la ficha lo escriba con palabras es de `caseDonation()` y
// de `GeneralChannelNote`, y eso no se ve desde aquí.
//
// Cinco cosas:
//
//   1. Que la llave global de 0010 no exista ya en ninguna forma, ni vuelva
//      pegando otra vez las migraciones en orden. El canal general de 0015 es
//      otra tabla, con otro nombre, y esa distinción es lo que hace que
//      reconstruir el histórico no deje dos.
//   2. Que el municipio ya no tenga canal, ni columna donde volver a tenerlo.
//   3. Que un canal sea una llave, un enlace o un número, nunca dos.
//   4. Que solo coordinación lo escriba, y esto es lo que no se parece a nada de
//      lo de arriba: quien documenta SÍ puede escribir en el caso entero de su
//      municipio —es su trabajo—, así que la política de la tabla lo deja pasar y
//      quien lo para es el disparador. Por eso se prueba con la sesión de
//      documentación DE ESE MISMO MUNICIPIO, que es la única que llega hasta ahí,
//      y se prueba también que sigue pudiendo guardar el resto de la ficha.
//   5. Que la columna del caso sin canal siga leyendo vacía, que es lo que
//      permite a la página distinguir «el suyo» de «el general».
// ===========================================================================

await asPostgres();

// --- La llave global no está, y no vuelve --------------------------------
//
// Sigue en pie después de 0015, y ahí está el detalle que evita una sorpresa al
// reconstruir el histórico: el canal general nuevo NO resucita
// `public.donation_key`. Son dos tablas con dos nombres, y solo la segunda
// sobrevive a su migración siguiente.
const globalKeyGone = await one(`select
  (select count(*)::int from information_schema.tables
     where table_schema = 'public' and table_name = 'donation_key')            as tabla,
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname = 'stamp_donation_key')         as sello`);
check(
  "La llave global de 0010 ya no existe, ni la tabla ni su disparador",
  globalKeyGone.tabla === 0 && globalKeyGone.sello === 0,
  JSON.stringify(globalKeyGone),
);

const channelColumns = await one(`select
  (select count(*)::int from information_schema.columns
     where table_schema = 'public' and table_name = 'cities'
       and column_name like 'donation%')                                       as municipio,
  (select count(*)::int from information_schema.columns
     where table_schema = 'public' and table_name = 'cases'
       and column_name in ('donation_key','donation_url','donation_phone',
                           'donation_app','donation_holder'))                  as caso,
  (select count(*)::int from information_schema.columns
     where table_schema = 'public' and table_name = 'donation_channel'
       and column_name in ('donation_key','donation_url','donation_phone',
                           'donation_app','donation_holder'))                  as general`);
check(
  "El caso y el canal general tienen las cinco columnas del destino, y el municipio ninguna",
  channelColumns.municipio === 0 &&
    channelColumns.caso === 5 &&
    channelColumns.general === 5,
  JSON.stringify(channelColumns),
);

// Que la columna no esté es lo que hace que no pueda volver a llenarse por la
// Data API sin que ninguna pantalla lo enseñe, que es la peor forma de tener un
// destino de dinero: uno que nadie mira.
await expectError(
  "Un municipio ya no puede recibir un canal ni por la puerta de atrás",
  "update public.cities set donation_key = '@quibdo-alcaldia' where slug = 'quibdo'",
  "donation_key",
);

const cityGuardGone = await one(`select count(*)::int as n from pg_trigger
  where tgname = 'cities_guard_donation_channel'`);
check(
  "Sin columna que vigilar, el disparador del municipio se va con ella",
  cityGuardGone.n === 0,
  `n=${cityGuardGone.n}`,
);

// Y el del caso se queda, que es donde de verdad hace falta.
const caseGuardStays = await one(`select count(*)::int as n from pg_trigger
  where tgname = 'cases_guard_donation_channel'`);
check(
  "El disparador del caso sigue en pie: es la escritura que hay que vigilar",
  caseGuardStays.n === 1,
  `n=${caseGuardStays.n}`,
);

// --- Una llave o un enlace, nunca los dos --------------------------------
//
// Como propietario, así que el disparador no interviene: lo que se comprueba
// aquí es la restricción de la tabla, que aguanta venga de donde venga.
await expectError(
  "Un caso no puede tener a la vez una llave y un enlace",
  `update public.cases set donation_key = '@familia', donation_url = 'https://ejemplo.org/donar'
     where display_name = 'Familia Rentería'`,
  "cases_donation_one_channel",
);

// --- Coordinación pone los canales ---------------------------------------
await asUser("charlie@test.com");
// El caso se publica aquí de paso: hace falta que el público llegue a él para
// poder comprobar más abajo que lee su canal, y sin consentimiento no se puede
// publicar (`cases_publish_requires_consent`).
await sql(`
update public.cases set donation_key = '@familia-renteria', donation_app = 'Bre-B',
  donation_holder = 'Rentería Mosquera', consent_to_publish = true, published = true
  where display_name = 'Familia Rentería';
`);

await asPostgres();
const written = await one(`select
  (select donation_key    from public.cases where display_name = 'Familia Rentería') as caso_llave,
  (select donation_holder from public.cases where display_name = 'Familia Rentería') as caso_titular,
  (select donation_url    from public.cases where display_name = 'Familia Mosquera') as caso_enlace,
  (select donation_key    from public.donation_channel)                              as general`);
check(
  "Coordinación pone el canal de un caso en llave y el de otro en enlace, y el general sigue aparte",
  written.caso_llave === "@familia-renteria" &&
    written.caso_titular === "Rentería Mosquera" &&
    written.caso_enlace === "https://vaki.co/vaki/mosquera" &&
    written.general === "@soschoco",
  JSON.stringify(written),
);

// --- Quien documenta ese mismo municipio, no ------------------------------
//
// Esta es la sesión que importa y la que va a existir en los teléfonos del
// equipo. Tiene Quibdó asignado, así que `cases_assigned_update` la deja
// escribir la fila: sin el disparador, cambiar el canal sería una edición más
// del caso, hecha desde el móvil y delante de la familia.
await asUser("documenta@test.com");

await expectError(
  "Quien documenta ese municipio no cambia la llave del caso, aunque pueda editar el caso entero",
  "update public.cases set donation_key = '@desviada' where display_name = 'Familia Rentería'",
  "canal de donación",
);

await expectError(
  "Tampoco el enlace, que es la otra forma del mismo canal",
  `update public.cases set donation_url = 'https://ladron.example/donar'
     where display_name = 'Familia Mosquera'`,
  "canal de donación",
);

// El titular es la única comprobación que le queda a quien dona: si se pudiera
// cambiar solo, se podría dejar la llave buena y el nombre de otra cuenta, que
// es la forma silenciosa de este mismo daño.
await expectError(
  "Tampoco el titular, que es la única comprobación de quien dona",
  "update public.cases set donation_holder = 'Otro nombre' where display_name = 'Familia Rentería'",
  "canal de donación",
);

await expectError(
  "Ni puede crear un caso que ya venga con canal dentro",
  `insert into public.cases (city_id, display_name, donation_key)
     select id, 'Familia con llave', '@colada' from public.cities where slug = 'quibdo'`,
  "canal de donación",
);

// Y lo que no se le puede quitar: seguir documentando. El disparador mira el
// cambio y no el valor, así que una ficha con canal ya puesto se guarda entera
// sin tropezar con él.
await sql(`update public.cases set story = 'Se apuntaló el muro esta semana.'
  where display_name = 'Familia Rentería'`);

await asPostgres();
const stillWorking = await one(`select story, donation_key
  from public.cases where display_name = 'Familia Rentería'`);
check(
  "Quien documenta sigue guardando el resto del caso, con el canal puesto y sin tocarlo",
  stillWorking.story === "Se apuntaló el muro esta semana." &&
    stillWorking.donation_key === "@familia-renteria",
  JSON.stringify(stillWorking),
);

// Y el municipio, que es lo primero que se edita al llegar a un pueblo. Aquí ya
// no hay canal que esquivar —0015 se llevó las columnas—, así que lo que se
// comprueba es que quitarlas no le haya quitado a nadie el trabajo de siempre.
await asUser("documenta@test.com");
await sql(`update public.cities set summary = 'Se documentó el barrio de la ribera.'
  where slug = 'quibdo'`);

await asPostgres();
const cityStillWorking = await one(
  "select summary from public.cities where slug = 'quibdo'",
);
check(
  "Quien documenta sigue guardando el resumen del municipio",
  cityStillWorking.summary === "Se documentó el barrio de la ribera.",
  JSON.stringify(cityStillWorking),
);

// --- Con sesión pero fuera del equipo ------------------------------------
//
// No llega al disparador: la política no le encuentra ninguna fila. Se comprueba
// que no toque nada Y que el canal siga donde estaba, que es la garantía de
// verdad.
await asUser("intrusa@test.com");
const intruderChannel = await db.exec(
  "update public.cases set donation_key = '@desviada' where display_name = 'Familia Rentería'",
);
check(
  "Un usuario con sesión pero fuera del equipo no toca ningún canal",
  intruderChannel[0].affectedRows === 0,
  `filas=${intruderChannel[0].affectedRows}`,
);

// --- El público lo lee y no lo toca --------------------------------------
await asAnon();
const publicChannels = await one(`select
  (select donation_key    from public.cases where display_name = 'Familia Rentería') as caso,
  (select donation_app    from public.cases where display_name = 'Familia Rentería') as app,
  (select donation_holder from public.cases where display_name = 'Familia Rentería') as titular,
  (select donation_key    from public.donation_channel)                              as general`);
check(
  "El público lee el canal del caso y el general enteros, con su app y su titular",
  publicChannels.caso === "@familia-renteria" &&
    publicChannels.app === "Bre-B" &&
    publicChannels.titular === "Rentería Mosquera" &&
    publicChannels.general === "@soschoco",
  JSON.stringify(publicChannels),
);

// Ni llega a las políticas: `anon` solo tiene `select` sobre los casos (0008).
await expectError(
  "El público no puede cambiar el canal de un caso",
  "update public.cases set donation_key = '@ladron'",
  "permission denied",
);

// --- Sin canal propio, el general, y la columna sigue vacía --------------
//
// La regla que había aquí era «sin canal propio, no hay canal», y 0015 la
// invierte a propósito. De la nueva, lo que se puede demostrar en el esquema es
// que los dos destinos NO se mezclan: la columna del caso lee vacía y el general
// vive en otra tabla, de modo que la página puede distinguir siempre cuál está
// enseñando. Que lo diga con palabras —«este caso usa el canal general del
// portal»— es de `caseDonation()` y de `GeneralChannelNote`, y ahí es donde
// sigue viva la preocupación de 0011: lo que no se puede es dejar creer que el
// general es el suyo.
await asUser("documenta@test.com");
await sql(`insert into public.cases (city_id, display_name, story, consent_to_publish, published)
  select id, 'Familia sin canal', 'Recibe por el canal general.', true, true
  from public.cities where slug = 'quibdo'`);

await asAnon();
const noInheritance = await one(`select
  (select donation_key || donation_url || donation_phone || donation_app || donation_holder
     from public.cases where display_name = 'Familia sin canal') as caso,
  (select donation_key from public.donation_channel)             as general`);
check(
  "Un caso sin canal propio lee vacío: el general está en otra tabla y no se cuela en la suya",
  noInheritance.caso === "" && noInheritance.general === "@soschoco",
  JSON.stringify(noInheritance),
);

// --- «Comprobado» no es «editado», y no se hereda ------------------------
//
// `donation_verified_on` (0016) es lo que sustituye a la insignia de «donación
// protegida» que aquí sería mentira: el dinero no pasa por el portal, así que no
// hay nada que el portal proteja. Lo que sí se puede afirmar es que alguien de
// coordinación llamó a ese número o mandó mil pesos a esa llave, tal día.
//
// De eso, dos cosas se pueden demostrar en el esquema y las dos son la razón de
// que la columna exista: que la fecha esté en el mismo círculo pequeño que el
// destino, y que NO SOBREVIVA a un cambio de destino. Lo segundo es el fallo
// silencioso: la ficha diciendo «Comprobado el 3 de agosto» debajo de una llave
// que se cambió el 12 de septiembre. Que envejezca a la vista pasados 60 días es
// de lib/donation-channel.ts, que es donde se lee.
await asUser("charlie@test.com");
await sql(`update public.cases
  set donation_verified_on = current_date - 5
  where display_name = 'Familia Rentería'`);

await asAnon();
const verifiedRead = await one(`select donation_verified_on is not null as puesta
  from public.cases where display_name = 'Familia Rentería'`);
check(
  "Coordinación anota cuándo comprobó el canal de un caso, y el público lo lee",
  verifiedRead.puesta === true,
  JSON.stringify(verifiedRead),
);

// Sexta columna del guardián de 0011. Sin ella, quien documenta podría escribir
// «Comprobado hoy» sobre un canal que no ha comprobado, y esa frase es justo la
// que el portal pone para que alguien se fíe.
await asUser("documenta@test.com");
await expectError(
  "Quien documenta ese municipio no puede afirmar que el canal está comprobado",
  `update public.cases set donation_verified_on = current_date
     where display_name = 'Familia Rentería'`,
  "canal de donación",
);

// Y lo que sigue pudiendo hacer, que es la mitad de por qué el guardián mira el
// cambio y no el valor: guardar la ficha entera con la fecha ya puesta dentro.
await sql(`update public.cases set story = 'Llegaron las tejas el jueves.'
  where display_name = 'Familia Rentería'`);

await asPostgres();
const storyWithVerification = await one(`select story, donation_verified_on is not null as puesta
  from public.cases where display_name = 'Familia Rentería'`);
check(
  "Quien documenta guarda la ficha con la comprobación ya puesta, sin tropezar con ella",
  storyWithVerification.story === "Llegaron las tejas el jueves." &&
    storyWithVerification.puesta === true,
  JSON.stringify(storyWithVerification),
);

// El corazón de 0016: mover el destino borra la comprobación sola. Se prueba
// sobre el caso del enlace para no tocar la llave que las comprobaciones de más
// abajo esperan encontrar intacta.
await asUser("charlie@test.com");
await sql(`update public.cases set donation_verified_on = current_date - 2
  where display_name = 'Familia Mosquera'`);
await sql(`update public.cases set donation_url = 'https://vaki.co/vaki/mosquera-2'
  where display_name = 'Familia Mosquera'`);

await asPostgres();
const stale = await one(`select donation_url, donation_verified_on
  from public.cases where display_name = 'Familia Mosquera'`);
check(
  "Cambiar el destino borra la comprobación: no se hereda de la cuenta anterior",
  stale.donation_url === "https://vaki.co/vaki/mosquera-2" &&
    stale.donation_verified_on === null,
  JSON.stringify(stale),
);

// Y el caso normal, que no es una excepción: coordinación cambia la llave y en la
// misma pantalla anota que acaba de comprobar la nueva. Se distingue igual que en
// el guardián, comparando con la fila vieja.
await asUser("charlie@test.com");
await sql(`update public.cases
  set donation_url = 'https://vaki.co/vaki/mosquera-3', donation_verified_on = current_date
  where display_name = 'Familia Mosquera'`);

await asPostgres();
const reverified = await one(`select donation_url, donation_verified_on = current_date as hoy
  from public.cases where display_name = 'Familia Mosquera'`);
check(
  "Cambiar el destino y comprobarlo en la misma escritura sí deja la fecha nueva",
  reverified.donation_url === "https://vaki.co/vaki/mosquera-3" && reverified.hoy === true,
  JSON.stringify(reverified),
);

// Una comprobación fechada en el futuro es la frase de fiarse, estirada para que
// aguante dos meses más de los que le tocan.
await asUser("charlie@test.com");
await expectError(
  "Una comprobación del canal no puede estar fechada en el futuro",
  `update public.cases set donation_verified_on = current_date + 30
     where display_name = 'Familia Rentería'`,
  "fecha futura",
);

// Lo mismo en el canal general, y hay que comprobarlo aparte: son dos tablas con
// dos disparadores, así que una puede quedarse sin la regla sin que la otra lo
// note. Es el destino con más alcance del portal, o sea donde una comprobación
// heredada de una cuenta vieja alcanza a más gente a la vez.
await sql("update public.donation_channel set donation_verified_on = current_date - 10");
await sql("update public.donation_channel set donation_key = '@soschoco-2'");

await asPostgres();
const staleGeneral = await one(
  "select donation_key, donation_verified_on from public.donation_channel",
);
check(
  "En el canal general, cambiar la llave borra también su comprobación",
  staleGeneral.donation_key === "@soschoco-2" && staleGeneral.donation_verified_on === null,
  JSON.stringify(staleGeneral),
);

// Se devuelve la llave general a su valor, que es el que espera la comprobación
// de la reconciliación de más abajo.
await sql("update public.donation_channel set donation_key = '@soschoco'");

// --- Qué es la causa, y la frase que viaja por WhatsApp ------------------
//
// Las dos columnas de 0016 que SÍ escribe quien documenta, al contrario que la
// comprobación del canal: son lo que se ve en terreno. Y las dos tienen una
// restricción en la base de datos porque las dos se pueden saltar desde un móvil
// —un `maxlength` no viaja en una llamada a la API— y lo que hay al otro lado no
// es un texto feo, es una vista previa de WhatsApp con media frase.
await asUser("documenta@test.com");
await sql(`update public.cases
  set case_kind = 'colegio', summary = 'La escuela del barrio Niño Jesús perdió el techo de dos salones.'
  where display_name = 'Familia Mosquera'`);

await asPostgres();
const kindWritten = await one(`select case_kind, summary
  from public.cases where display_name = 'Familia Mosquera'`);
check(
  "Quien documenta registra qué es la causa y su resumen, que es su trabajo",
  kindWritten.case_kind === "colegio" && kindWritten.summary.startsWith("La escuela"),
  JSON.stringify(kindWritten),
);

// Por omisión, persona: las causas que ya estaban escritas lo son todas, y un
// campo obligatorio nuevo habría dejado sin poder guardarse la ficha de la mujer
// de Quibdó hasta que alguien contestara una pregunta cuya respuesta ya se sabe.
const kindDefault = await one(`select case_kind
  from public.cases where display_name = 'Familia Rentería'`);
check(
  "Una causa que nadie ha clasificado es una persona, que es lo que son todas hoy",
  kindDefault.case_kind === "persona",
  kindDefault.case_kind,
);

await expectError(
  "Un tipo de causa que no está en la lista no entra",
  `update public.cases set case_kind = 'empresa' where display_name = 'Familia Rentería'`,
  "cases_kind_valid",
);

await expectError(
  "Un resumen más largo de lo que cabe en una vista previa no entra",
  `update public.cases set summary = repeat('x', 121) where display_name = 'Familia Rentería'`,
  "cases_summary_len",
);

// --- Volver a pegar las migraciones no devuelve la llave global ----------
//
// Todas las migraciones de este proyecto se vuelven a pegar cuando hay que
// reconstruir algo, y 0010 sigue en la carpeta con `@soschoco` escrita dentro.
// Pegadas en orden, 0011 la retira otra vez, 0015 crea el canal general en su
// propia tabla y los canales de caso se quedan donde estaban. El estado final es
// UN canal general y ninguna llave global, que es la sorpresa que había que
// evitar: pegar el histórico entero no puede dejar dos destinos con el mismo
// valor y distinto nombre.
await asPostgres();
await sql(migration("migrations/0010_llave_de_transferencia.sql"));
await sql(migration("migrations/0011_canal_de_donacion.sql"));
await sql(migration("migrations/0015_canal_general.sql"));
const afterRerun = await one(`select
  (select count(*)::int from information_schema.tables
     where table_schema = 'public' and table_name = 'donation_key')                  as llave_global,
  (select count(*)::int from public.donation_channel)                                as generales,
  (select donation_key from public.donation_channel)                                 as general,
  (select donation_key from public.cases where display_name = 'Familia Rentería')    as caso`);
check(
  "Pegar 0010, 0011 y 0015 en orden deja un canal general, ninguna llave global y los casos intactos",
  afterRerun.llave_global === 0 &&
    afterRerun.generales === 1 &&
    afterRerun.general === "@soschoco" &&
    afterRerun.caso === "@familia-renteria",
  JSON.stringify(afterRerun),
);

// Y la reconciliación del caso real: 0015 vacía el canal propio de los casos cuya
// llave ERA la general, porque repetirla en la ficha diría que es suya. El
// destino no se mueve —la misma llave, la misma cuenta—; lo que cambia es lo que
// la ficha afirma. Se comprueba con un caso puesto a mano en ese estado, que es
// exactamente el de Quibdó en la base real.
await sql(`update public.cases set donation_key = '@soschoco', donation_app = 'Bre-B',
  donation_holder = 'Alguien' where display_name = 'Familia sin canal'`);
await sql(migration("migrations/0015_canal_general.sql"));
const reconciled = await one(`select
  (select donation_key || donation_app || donation_holder
     from public.cases where display_name = 'Familia sin canal')                  as caso,
  (select donation_key from public.cases where display_name = 'Familia Rentería') as otro,
  (select donation_key from public.donation_channel)                              as general`);
check(
  "Un caso cuyo canal propio era la llave general se queda sin canal propio, y ningún otro se toca",
  reconciled.caso === "" &&
    reconciled.otro === "@familia-renteria" &&
    reconciled.general === "@soschoco",
  JSON.stringify(reconciled),
);

// ===========================================================================
// El registro público de lo prometido
//
// `public.offer_log` (0012) publica lo que la gente ha ofrecido y todavía no ha
// llegado: el tiempo de en medio que le faltaba al portal entre «lo que falta» y
// «lo que llegó». Con ella sale al público, por primera vez, un texto que
// escribe cualquiera desde /ofrecer sin que nadie lo revise antes —`resource`—,
// y de ahí viene casi todo lo que hay que demostrar aquí.
//
// Cinco cosas, y ninguna se puede comprobar mirando la página:
//
//   1. Que el contacto, el mensaje y el caso no existan como columna, igual que
//      en `aid_log`. La vista es la API: lo que no está no se puede pedir.
//   2. Que un teléfono o un correo escritos DENTRO del texto salgan tapados. Es
//      el atajo que alguien va a usar precisamente porque el formulario no
//      publica su contacto, y las tres formas en que se escribe un móvil
//      colombiano tienen que caer las tres.
//   3. Que tapar de más no se coma una cantidad. «600 tejas de zinc de 2,44 m»
//      es el texto real de los datos de muestra: si eso saliera tapado, el
//      recorte se llevaría la información por la que el registro existe.
//   4. Que el nombre no salga mientras la oferta esté pendiente. `publish_name`
//      es permiso para figurar en una lista de cosas hechas, y con la oferta sin
//      valorar nadie del equipo ha hablado todavía con esa persona.
//   5. Que los dos registros sean disjuntos y que la lista caduque sola: lo
//      entregado vive solo en `aid_log`, y una promesa de hace más de ocho
//      semanas deja de contarse sin que nadie tenga que retirarla.
// ===========================================================================

await asPostgres();

const offerLogColumns = (
  await db.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'offer_log'",
  )
).rows.map((row) => row.column_name);

check(
  "El registro de lo ofrecido no tiene contacto, ni el mensaje largo, ni las notas del equipo",
  !offerLogColumns.includes("offerer_contact") &&
    !offerLogColumns.includes("message") &&
    !offerLogColumns.includes("team_notes"),
  offerLogColumns.join(", "),
);

// `delivered_on` no está por dos motivos que se suman: es el día exacto de una
// entrega —lo que 0002 no publica— y aquí además siempre valdría nulo, porque
// una oferta entregada no entra en esta vista.
check(
  "Tampoco el caso al que apunta ni la fecha de entrega",
  !offerLogColumns.some((name) => name.startsWith("case")) &&
    !offerLogColumns.includes("delivered_on"),
  offerLogColumns.join(", "),
);

// --- El estado nuevo: retirada -------------------------------------------
const statusVocabulary = await one(
  "select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'offers_status_valid'",
);
check(
  "«retirada» entra en el vocabulario de estados sin sacar a ninguno de los tres",
  ["pendiente", "aceptada", "rechazada", "retirada"].every((value) =>
    statusVocabulary.def.includes(value),
  ),
  statusVocabulary.def,
);

// La regla de 0002 sigue diciendo lo que tiene que decir sin nombrar el estado
// nuevo: una retirada nunca lleva fecha de entrega.
await expectError(
  "Una oferta retirada no puede figurar como entregada",
  `update public.offers set status = 'retirada', delivered_on = current_date
     where offerer_name = 'Ferretería El Progreso'`,
  "offers_delivery_requires_acceptance",
);

// Retirar es del equipo. Que haya una palabra más en la lista no le da al
// público una forma nueva de escribir el estado de su propia oferta.
await asAnon();
await expectError(
  "El público no puede enviar una oferta ya retirada",
  `insert into public.offers (offerer_name, offerer_contact, resource, status)
     values ('Bot', '3001112222', 'algo', 'retirada')`,
  "row-level security",
);

// --- El escenario: una oferta de cada clase ------------------------------
//
// Se cargan como propietario para poder fijar el estado y la fecha a mano, que
// es lo que hace el equipo desde la bandeja y lo que la política de inserción no
// deja hacer al público.
await asPostgres();
await sql(`
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category,
                           status, publish_name, created_at)
select q.id, s.nombre, s.contacto, s.recurso, s.categoria, s.estado, s.publicar,
       now() - s.antiguedad
from (select id from public.cities where slug = 'quibdo') q
cross join (values
  ('Móvil pegado',        '3001110001', '600 tejas, llámame al 3167778899',
   'techo', 'pendiente', false, interval '0'),
  ('Móvil con espacios',  '3001110002', '600 tejas, llámame al 316 777 8899',
   'techo', 'pendiente', false, interval '0'),
  ('Móvil con guiones',   '3001110003', '600 tejas, llámame al 316-777-8899',
   'techo', 'pendiente', false, interval '0'),
  ('Correo dentro del texto', '3001110004',
   'Camión de 8 toneladas, escríbeme a bodega@transportes.co',
   'transporte', 'pendiente', false, interval '0'),
  ('Arroba de red social', '3001110005', 'Diez bultos de ropa por tallas, soy @martaenlaweb',
   'ropa', 'pendiente', false, interval '0'),
  ('Cantidades intactas', '3001110006', '600 tejas de zinc de 2,44 m y 300 bloques',
   'techo', 'pendiente', false, interval '0'),
  ('Promesa vieja',       '3001110007', '40 colchonetas que ya nadie recuerda',
   'otro', 'pendiente', false, interval '9 weeks'),
  ('Rechazada de prueba', '3001110008', 'Ropa usada sin clasificar',
   'ropa', 'rechazada', false, interval '0'),
  ('Retirada de prueba',  '3001110009', 'Un lote de tejas que ya se vendió',
   'techo', 'retirada', false, interval '0'),
  ('Confirmada con nombre', '3001110010', '25 tanques de 500 litros',
   'agua', 'aceptada', true, interval '0'),
  ('Pendiente con permiso', '3001110011', '15 bultos de cemento',
   'techo', 'pendiente', true, interval '0'),
  ('Nombre con teléfono dentro, 3167778899', '3001110012', '10 mercados armados',
   'alimentos', 'aceptada', true, interval '0')
) as s(nombre, contacto, recurso, categoria, estado, publicar, antiguedad);

-- Las dos que apuntan a una necesidad heredan de ella el municipio y el caso, que
-- es lo que hace /ofrecer con el destino que trae el enlace.
insert into public.offers (city_id, need_id, case_id, offerer_name, offerer_contact,
                           resource, category)
select n.city_id, n.id, n.case_id, 'Ofrece contra una necesidad de zona', '3001110013',
       'Tejas para la escuela', 'techo'
  from public.needs n where n.title = 'Tejas de zinc' and n.case_id is null;

insert into public.offers (city_id, need_id, case_id, offerer_name, offerer_contact,
                           resource, category)
select n.city_id, n.id, n.case_id, 'Ofrece contra la necesidad de un caso', '3001110014',
       'Bidones y filtro de cerámica', 'agua'
  from public.needs n where n.title = 'Agua potable' and n.case_id is not null;

-- Y la misma sin copiar el caso, que es la que prueba la segunda mitad del
-- guardián del texto. Hoy /ofrecer no puede escribir esta fila —getOfferTarget
-- copia el caso de la necesidad—, pero nada en la tabla lo impide: no hay ninguna
-- restricción que ate need_id con case_id, así que una consulta del panel o un
-- flujo nuevo puede guardar solo la necesidad y el texto saldría por ahí.
insert into public.offers (city_id, need_id, offerer_name, offerer_contact,
                           resource, category)
select n.city_id, n.id, 'Apunta a la necesidad de un caso sin copiar el caso', '3001110015',
       'Bidones para la señora que vive sola en la casa del filtro roto', 'agua'
  from public.needs n where n.title = 'Agua potable' and n.case_id is not null;
`);

const publishedOffer = (name) =>
  one(`select * from public.offer_log
         where id = (select id from public.offers where offerer_name = '${name}')`);

// --- El teléfono escrito dentro del texto -------------------------------
const masked = {
  pegado: await publishedOffer("Móvil pegado"),
  espacios: await publishedOffer("Móvil con espacios"),
  guiones: await publishedOffer("Móvil con guiones"),
};
check(
  "Un móvil dentro del texto sale tapado, escrito de las tres formas en que se escribe",
  Object.values(masked).every(
    (row) => row?.resource === "600 tejas, llámame al [número oculto]",
  ),
  Object.entries(masked)
    .map(([forma, row]) => `${forma}: ${row?.resource}`)
    .join(" | "),
);

const mailed = await publishedOffer("Correo dentro del texto");
check(
  "Un correo dentro del texto sale tapado",
  mailed?.resource === "Camión de 8 toneladas, escríbeme a [contacto oculto]",
  String(mailed?.resource),
);

// Una arroba de red social es un contacto igual, y `aid_log` ya descarta el
// nombre entero por llevar una (0002). Aquí no se puede descartar el texto, así
// que se tapa la palabra.
const handled = await publishedOffer("Arroba de red social");
check(
  "Un «@usuario» de red social sale tapado, que es un contacto como el correo",
  handled?.resource === "Diez bultos de ropa por tallas, soy [contacto oculto]",
  String(handled?.resource),
);

// El otro lado del recorte, y el que se rompe sin que se note: si tapar de más
// se comiera las cantidades, el registro dejaría de servir para lo que existe.
// El texto es el de los datos de muestra, literal.
const quantities = await publishedOffer("Cantidades intactas");
check(
  "Las cantidades no se tapan: ni «2,44 m» ni «300 bloques» ni «600 tejas»",
  quantities?.resource === "600 tejas de zinc de 2,44 m y 300 bloques",
  String(quantities?.resource),
);

// Y la prueba de conjunto: ningún contacto de la tabla asoma por ninguna columna
// de ninguna fila publicada, ni entero ni recortado. No se comprueba una columna:
// se comprueba la fila, que es lo que sirve la API.
await asPostgres();
const everyContact = (
  await db.query("select offerer_contact from public.offers")
).rows.map((row) => row.offerer_contact);

await asAnon();
const wholeOfferLog = await db.query("select * from public.offer_log");
const offerValues = wholeOfferLog.rows.flatMap((row) =>
  Object.values(row).map((value) => String(value)),
);
check(
  "Ningún contacto de la tabla de ofertas asoma en ninguna columna publicada",
  !everyContact.some((contact) => offerValues.some((value) => value.includes(contact))),
  `filas=${wholeOfferLog.rows.length}, contactos=${everyContact.length}`,
);

// La misma idea sin depender de qué contactos haya cargados: nada que se parezca
// a un teléfono o a un correo. `id` queda fuera del barrido y no por comodidad:
// es el identificador de la oferta, hexadecimal, y la vista lo publica a
// propósito —igual que `aid_log`— porque es lo que va a enlazar «puedo completar
// esto». Un uuid trae dígitos seguidos por casualidad y no es el contacto de
// nadie.
const offerValuesSinId = wholeOfferLog.rows.flatMap((row) =>
  Object.entries(row)
    .filter(([column]) => column !== "id")
    .map(([, value]) => String(value)),
);
check(
  "En ninguna columna publicada queda algo con forma de teléfono ni de correo",
  !offerValuesSinId.some((value) => /[0-9]{7}/.test(value)) &&
    !offerValuesSinId.some((value) => value.includes("@")),
  offerValuesSinId.filter((value) => /[0-9]{7}/.test(value) || value.includes("@")).join(" | "),
);

// --- El nombre, y la condición que aid_log no tiene ---------------------
await asPostgres();
const namedStates = {
  confirmada: await publishedOffer("Confirmada con nombre"),
  pendiente: await publishedOffer("Pendiente con permiso"),
  conTelefono: await publishedOffer("Nombre con teléfono dentro, 3167778899"),
};
check(
  "Con la oferta aceptada y autorización, el nombre sí aparece",
  namedStates.confirmada?.offerer_name === "Confirmada con nombre",
  String(namedStates.confirmada?.offerer_name),
);

// La condición que no está en `aid_log`: allí el nombre acompaña a algo que ya
// ocurrió. Aquí acompañaría a una promesa que nadie del equipo ha valorado y que
// puede acabar rechazada, y eso no es lo que autorizó quien marcó la casilla.
check(
  "Con la oferta pendiente el nombre no sale, aunque esté autorizado",
  namedStates.pendiente?.offerer_name === null,
  String(namedStates.pendiente?.offerer_name),
);

check(
  "Un teléfono escrito en el campo del nombre no se publica, ni con autorización",
  namedStates.conTelefono?.offerer_name === null,
  String(namedStates.conTelefono?.offerer_name),
);

// --- Los dos estados públicos -------------------------------------------
check(
  "El estado se publica en dos palabras que hablan de fiabilidad y no de la bandeja",
  namedStates.confirmada?.state === "confirmada" &&
    namedStates.pendiente?.state === "sin_confirmar",
  `${namedStates.confirmada?.state} | ${namedStates.pendiente?.state}`,
);

// --- Qué necesidad se puede nombrar -------------------------------------
const zoneOffer = await publishedOffer("Ofrece contra una necesidad de zona");
const caseOffer = await publishedOffer("Ofrece contra la necesidad de un caso");
check(
  "Una oferta contra una necesidad de zona la nombra: la escribió el equipo y describe al pueblo",
  zoneOffer?.need_title === "Tejas de zinc",
  String(zoneOffer?.need_title),
);

// El título de una necesidad de un caso está escrito en la ficha de esa familia,
// así que nombrarlo aquí es señalarla dando un rodeo. La fila sale; el título, no.
check(
  "Una oferta contra la necesidad de un caso sale sin nombrarla, y con su municipio",
  caseOffer !== undefined &&
    caseOffer.need_title === null &&
    caseOffer.city_name === "Quibdó",
  JSON.stringify(caseOffer),
);

// --- El texto, solo si la oferta no va dirigida a nadie ------------------
//
// El mismo rodeo que el título, por el otro campo y con más margen: `resource` lo
// escribe quien ofrece, después de leer la ficha, y nadie lo revisa antes de que
// se guarde. Una oferta a la familia de una señora de 78 años que vive sola puede
// llegar descrita como «el tratamiento de la señora», y eso la señala igual que
// nombrar su necesidad.
//
// Lo que se comprueba aquí es el reparto, no el recorte: la fila se queda —es lo
// que permite que alguien le ponga el transporte que le falta— y lo que se va es
// la frase. Las dos mitades, y en las dos direcciones, porque cada una se rompe
// sola: sin la primera se publica a una familia, y sin la segunda el registro se
// queda sin lo único que permite cruzar unas tejas con un camión.
check(
  "Una oferta dirigida a una familia no publica su texto, y la fila sigue estando",
  caseOffer !== undefined && caseOffer.resource === null,
  JSON.stringify(caseOffer),
);

check(
  "Una oferta de zona sí publica su texto",
  zoneOffer?.resource === "Tejas para la escuela",
  String(zoneOffer?.resource),
);

// La segunda mitad del guardián: apuntar a la necesidad de un caso basta, aunque
// la oferta no lleve el caso copiado. Es la fila que hoy no escribe nadie y que
// ninguna restricción de la tabla impide.
const needOnlyOffer = await publishedOffer(
  "Apunta a la necesidad de un caso sin copiar el caso",
);
check(
  "Apuntar solo a la necesidad de un caso también deja el texto sin publicar",
  needOnlyOffer !== undefined && needOnlyOffer.resource === null,
  JSON.stringify(needOnlyOffer),
);

// Y la prueba de conjunto, que es la que aguanta cuando alguien añada una oferta
// más: se cuenta contra la tabla, no contra las filas que este archivo escribió.
// Si un día se puede llegar a una familia por una tercera columna, esto lo dice.
const textoDeCasos = await one(`select
  count(*) filter (where l.resource is not null)::int as con_caso_y_con_texto,
  count(*)::int                                       as con_caso
from public.offer_log l
  join public.offers o on o.id = l.id
 where o.case_id is not null
    or exists (select 1 from public.needs cn
                where cn.id = o.need_id and cn.case_id is not null)`);
check(
  "Ninguna fila publicada que llegue a una familia lleva texto, por ninguna de las dos vías",
  textoDeCasos.con_caso_y_con_texto === 0 && textoDeCasos.con_caso > 0,
  JSON.stringify(textoDeCasos),
);

// El otro lado, por si el `case` de la vista se cerrara de más: lo de zona sigue
// publicando. Un registro donde nada trae texto no protege a nadie: no sirve.
const textoDeZona = await one(`select
  count(*) filter (where l.resource is not null)::int as con_texto,
  count(*)::int                                       as de_zona
from public.offer_log l
  join public.offers o on o.id = l.id
 where o.case_id is null
   and not exists (select 1 from public.needs cn
                    where cn.id = o.need_id and cn.case_id is not null)`);
check(
  "Las ofertas que no van a nadie siguen publicando su texto, todas",
  textoDeZona.con_texto === textoDeZona.de_zona && textoDeZona.de_zona > 0,
  JSON.stringify(textoDeZona),
);

// --- Quién no entra -----------------------------------------------------
const excluded = {
  rechazada: await publishedOffer("Rechazada de prueba"),
  retirada: await publishedOffer("Retirada de prueba"),
  vieja: await publishedOffer("Promesa vieja"),
  entregada: await publishedOffer("Ferretería El Progreso"),
};
check(
  "Lo rechazado, lo retirado, lo caducado y lo ya entregado no se publican como prometido",
  Object.values(excluded).every((row) => row === undefined),
  Object.entries(excluded)
    .map(([clase, row]) => `${clase}: ${row ? "SALE" : "fuera"}`)
    .join(", "),
);

// Los dos registros son disjuntos, y esto es lo que lo demuestra sobre la misma
// fila: la entrega de la ferretería está en uno y no puede estar en el otro.
await asAnon();
const bothLogs = await one(`select
  (select count(*)::int from public.aid_log)                                as entregado,
  (select count(*)::int from public.offer_log)                              as prometido,
  (select count(*)::int from public.aid_log a
     join public.offer_log l on l.id = a.id)                                as en_los_dos`);
check(
  "Ninguna oferta está a la vez en lo prometido y en lo que llegó",
  bothLogs.en_los_dos === 0 && bothLogs.entregado > 0 && bothLogs.prometido > 0,
  JSON.stringify(bothLogs),
);

// La caducidad es por fecha y no una columna que alguien tenga que mantener,
// porque una oferta no se cancela: se olvida. Se comprueba moviendo la fecha de
// la fila vieja al presente, que es lo que separa «no aparece» de «no aparece
// porque el filtro de ocho semanas la deja fuera».
await asPostgres();
await sql(
  "update public.offers set created_at = now() where offerer_name = 'Promesa vieja'",
);
const revived = await publishedOffer("Promesa vieja");
check(
  "La misma oferta con fecha de hoy sí aparece, así que lo que la dejaba fuera era la caducidad",
  revived?.resource === "40 colchonetas que ya nadie recuerda",
  String(revived?.resource),
);

// El día de la oferta sí se publica —hace falta para atenuar lo que lleva
// semanas esperando— y es el día de Colombia, no el de UTC. Es el motivo por el
// que 0002 eligió `date` para `delivered_on`: una oferta enviada a las 20:30 en
// Quibdó se guarda como la 01:30 del día siguiente en UTC, así que un `::date` a
// secas publicaría el día de después.
//
// La fecha se coloca a 01:30 UTC de anteayer, que es exactamente ese caso, y se
// calcula desde `now()` para que la prueba no caduque con el calendario. La
// segunda mitad de la comprobación es la que le da sentido a la primera: si el
// instante elegido no cruzara la medianoche, las dos respuestas coincidirían y
// esto pasaría con la vista mal escrita.
await sql(`update public.offers
  set created_at = (((now() at time zone 'UTC')::date - 2) + time '01:30') at time zone 'UTC'
  where offerer_name = 'Promesa vieja'`);
const bogota = await one(`select
  to_char(timezone('America/Bogota', o.created_at), 'YYYY-MM-DD') as dia_colombia,
  to_char(timezone('UTC', o.created_at), 'YYYY-MM-DD')            as dia_utc,
  to_char(l.offered_on, 'YYYY-MM-DD')                             as publicado
  from public.offers o join public.offer_log l on l.id = o.id
  where o.offerer_name = 'Promesa vieja'`);
check(
  "El día que se publica es el de Colombia y no el de UTC",
  bogota?.publicado === bogota?.dia_colombia && bogota?.dia_utc !== bogota?.dia_colombia,
  JSON.stringify(bogota),
);

// --- La categoría, contra el mismo vocabulario cerrado ------------------
//
// `offers.category` es texto libre, así que sin el `case` de la vista bastaría
// escribir la frase entera ahí para publicarla por una puerta que nadie mira. Es
// la misma comprobación que se hace sobre `aid_log`, y hay que hacerla otra vez
// porque son dos vistas y cada una tiene su propio `case`.
await sql(`update public.offers set category = 'Tratamiento para la tensión, tres meses'
  where offerer_name = 'Cantidades intactas'`);
const forgedOfferCategory = await publishedOffer("Cantidades intactas");
check(
  "Una frase escrita en el campo de la categoría no se publica: sale «otro»",
  forgedOfferCategory?.category === "otro",
  String(forgedOfferCategory?.category),
);
await sql(
  "update public.offers set category = 'techo' where offerer_name = 'Cantidades intactas'",
);

// --- El público lee la vista y no la tabla ------------------------------
await asAnon();
const anonReadsLog = await one("select count(*)::int as n from public.offer_log");
check(
  "El público lee el registro de lo ofrecido",
  anonReadsLog.n > 0,
  `n=${anonReadsLog.n}`,
);

// La otra mitad, y la que importa: la vista abierta no abre la tabla. Falla por
// permiso de tabla, antes de llegar a las políticas, igual que con `aid_log`.
await expectError(
  "Publicar lo ofrecido no le da al público ninguna puerta nueva a la tabla de ofertas",
  "select offerer_contact from public.offers",
  "permission denied",
);

await expectError(
  "El público no puede pedir el mensaje del registro: la columna no existe",
  "select message from public.offer_log",
  'column "message" does not exist',
);

// --- Volver a pegar la migración no reabre la vista ---------------------
//
// `create view` hace una vista nueva y una vista nueva de `public` nace con todo
// concedido al público. El `revoke` vive en 0012 justo por esto, y esto es lo que
// comprueba que sigue viviendo ahí: es el descuido que dejó `aid_log` abierta
// entre 0005 y 0008.
await asPostgres();
await sql(migration("migrations/0012_registro_de_lo_ofrecido.sql"));
const logPrivileges = (await publicTablePrivileges()).offer_log;
check(
  "Volver a pegar 0012 deja la vista con select y nada más",
  logPrivileges?.anon === "SELECT" && logPrivileges?.authenticated === "SELECT",
  JSON.stringify(logPrivileges),
);

// ===========================================================================
// «Puedo completar esto»: el camino de vuelta
//
// El muro publica ofertas sin contacto, así que el emparejamiento no puede pasar
// por el teléfono de quien ofreció: pasa por el portal. Quien ve las 600 tejas
// sin transporte llega a /ofrecer?completa=<id de la oferta> y manda la suya, y
// las dos tienen que llegar emparejadas a la bandeja del equipo. Emparejadas
// quiere decir con el mismo `city_id` y el mismo `need_id`.
//
// Y ahí está el problema que se comprueba aquí. La vista no publica ninguno de
// los dos —son punteros, y por `need_id` se llega a la necesidad de un caso, o
// sea a la ficha de una familia—, pero `getOfferTarget` (lib/data.ts) no puede
// leerlos de `public.offers`: esa página es pública y en la tabla está el
// contacto. Así que los reconstruye desde lo que la vista sí publica, y estas
// comprobaciones recorren ese camino exactamente como lo recorre el portal: como
// anónimo, de la vista al municipio por el `slug` y del municipio a la necesidad
// de zona por el título. Ni una tabla más.
// ===========================================================================

await asPostgres();
const zoneSource = await one(`select id, city_id, need_id from public.offers
  where offerer_name = 'Ofrece contra una necesidad de zona'`);
const caseSource = await one(`select id, city_id, need_id from public.offers
  where offerer_name = 'Ofrece contra la necesidad de un caso'`);

const inherited = (id) =>
  one(`select c.id as city_id, n.id as need_id
    from public.offer_log l
      left join public.cities c on c.slug = l.city_slug
      left join public.needs n
        on n.city_id = c.id and n.case_id is null and n.title = l.need_title
    where l.id = '${id}'`);

await asAnon();
const zoneInherited = await inherited(zoneSource.id);
check(
  "Desde el registro público se llega al municipio y a la necesidad de la oferta original, sin abrir la tabla",
  zoneInherited?.city_id === zoneSource.city_id && zoneInherited?.need_id === zoneSource.need_id,
  JSON.stringify({ heredado: zoneInherited, original: zoneSource }),
);

// El límite del camino, y no es un fallo: de una oferta dirigida a una familia se
// hereda el municipio y nada más, porque la vista deja `need_title` en nulo justo
// para que por ese título no se llegue a la ficha de esa familia. La oferta nueva
// entra al municipio correcto y el equipo, que sí lo ve todo, la vincula desde la
// bandeja.
const caseInherited = await inherited(caseSource.id);
check(
  "De una oferta dirigida a una familia se hereda el municipio y no la necesidad, que es lo que la vista esconde",
  caseInherited?.city_id === caseSource.city_id &&
    caseInherited?.need_id === null &&
    caseSource.need_id !== null,
  JSON.stringify({ heredado: caseInherited, original: caseSource }),
);

// Y la pregunta de fondo: recorrer ese camino no expone el contacto de quien hizo
// la oferta original. Se barre el camino entero —la fila de la vista, la del
// municipio y la de la necesidad, con todas sus columnas— contra la lista de
// contactos de la tabla. Va en un solo `jsonb` por fila y no en columnas
// sueltas porque las tres relaciones repiten nombres de columna, y una fila
// aplanada perdería valores por el camino: se barrería menos de lo que parece.
await asPostgres();
const contactsInTable = (await db.query("select offerer_contact from public.offers")).rows.map(
  (row) => row.offerer_contact,
);

await asAnon();
const wholePath = (
  await db.query(`select jsonb_build_object(
      'oferta',    to_jsonb(l),
      'municipio', to_jsonb(c),
      'necesidad', to_jsonb(n)
    )::text as fila
    from public.offer_log l
      left join public.cities c on c.slug = l.city_slug
      left join public.needs n
        on n.city_id = c.id and n.case_id is null and n.title = l.need_title`)
).rows.map((row) => row.fila);

check(
  "Completar una oferta no expone el contacto de la original: en el camino entero no aparece ninguno",
  !contactsInTable.some((contact) => wholePath.some((fila) => fila.includes(contact))),
  `filas=${wholePath.length}, contactos=${contactsInTable.length}`,
);

// ===========================================================================
// Quitar del muro, de un clic
//
// La bandeja publica al entrar, así que necesita salida rápida. El botón escribe
// un estado y ninguna otra columna, y eso es lo que hay que demostrar: que la
// oferta sale de lo público al momento, que sigue entera para el equipo, y que
// volver a publicarla es tan fácil como quitarla —que es lo que permite que
// quitar no pida confirmación—.
// ===========================================================================

await asUser("charlie@test.com");
await sql(`update public.offers set team_notes = 'Llamé, no contesta'
  where offerer_name = 'Cantidades intactas'`);
await sql(`update public.offers set status = 'retirada'
  where offerer_name = 'Cantidades intactas'`);

await asAnon();
const withdrawn = await one(`select count(*)::int as n from public.offer_log
  where resource like '600 tejas de zinc%'`);
check("Retirar una oferta la saca del muro público al momento", withdrawn.n === 0, `n=${withdrawn.n}`);

await asPostgres();
const withdrawnRow = await one(`select status, team_notes, offerer_contact
  from public.offers where offerer_name = 'Cantidades intactas'`);
check(
  "La oferta retirada sigue entera en la bandeja: es una baja, no un borrado",
  withdrawnRow.status === "retirada" &&
    withdrawnRow.team_notes === "Llamé, no contesta" &&
    withdrawnRow.offerer_contact === "3001110006",
  JSON.stringify(withdrawnRow),
);

// Quitar es de quien atiende ese municipio, y esto es la mitad que no está en el
// panel. Un clic tiene menos fricción que un formulario, así que la barrera de
// abajo importa más: la política no le deja ni ver la fila para escribirla, de
// modo que el `update` no falla, simplemente no toca nada.
await asUser("otra@test.com");
await sql(`update public.offers set status = 'retirada'
  where offerer_name = 'Ofrece contra una necesidad de zona'`);
await asPostgres();
const foreignOffer = await one(`select status from public.offers
  where offerer_name = 'Ofrece contra una necesidad de zona'`);
check(
  "Quien documenta otro municipio no puede retirar una oferta ajena",
  foreignOffer.status === "pendiente",
  foreignOffer.status,
);

// La otra mitad de la misma frase, y hay que comprobarla aparte: sin ella, lo de
// arriba pasaría igual si la política le prohibiera a documentación tocar
// cualquier oferta, que no es lo que dice. Lo que recorta es el municipio.
await asUser("documenta@test.com");
await sql(`update public.offers set status = 'retirada'
  where offerer_name = 'Ofrece contra una necesidad de zona'`);
await asPostgres();
const ownOffer = await one(`select status from public.offers
  where offerer_name = 'Ofrece contra una necesidad de zona'`);
check(
  "Quien documenta el municipio de la oferta sí la retira",
  ownOffer.status === "retirada",
  ownOffer.status,
);

await asUser("charlie@test.com");
await sql(`update public.offers set status = 'pendiente'
  where offerer_name = 'Cantidades intactas'`);
await asAnon();
const restored = await one(`select count(*)::int as n from public.offer_log
  where resource like '600 tejas de zinc%'`);
check(
  "Reponer una oferta retirada la devuelve al muro, así que la baja se deshace",
  restored.n === 1,
  `n=${restored.n}`,
);

// El escenario de esta sección se retira: lo que viene después cuenta ofertas.
await asPostgres();
await sql("delete from public.offers where offerer_contact like '300111%'");

// ===========================================================================
// El contador de aportes
//
// `public.offer_tally` (0015) es el número que sale en «Quiero ayudar». Es un
// agregado y no expone a nadie —dos enteros, sin fecha, sin municipio y sin
// categoría—, así que lo que hay que demostrar no es privacidad: es que cuente
// lo que dice que cuenta. De aquí ya salió un fallo publicado con las
// necesidades abiertas (ver lib/needs.ts), y un contador de aportes con el mismo
// defecto le diría a quien llega que hay más ayuda de la que hay.
//
// Se mide por diferencia y no en absoluto: así estas comprobaciones no dependen
// de cuántas ofertas hayan dejado por el camino las secciones de arriba, que es
// justo la clase de acoplamiento que hace que un arnés se vuelva frágil.
// ===========================================================================

await asAnon();
const tallyBefore = await one("select ofrecidos, entregados from public.offer_tally");

await asPostgres();
await sql(`
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Cuenta pendiente', '3009990001', 'Dos mercados', 'alimentos', 'pendiente'
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status, delivered_on)
  select id, 'Cuenta entregada', '3009990002', 'Tejas', 'techo', 'aceptada', current_date
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Cuenta rechazada', '3009990003', 'Ropa usada mojada', 'ropa', 'rechazada'
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Cuenta retirada', '3009990004', 'Duplicado', 'otro', 'retirada'
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Cuenta sin publicar', '3009990005', 'Bidones', 'agua', 'pendiente'
  from public.cities where slug = 'istmina';
`);

await asAnon();
const tallyAfter = await one("select ofrecidos, entregados from public.offer_tally");

// Cinco ofertas nuevas y el contador sube dos: la pendiente y la entregada. Lo
// rechazado y lo retirado no cuentan —un contador que sume el spam y lo que el
// equipo descartó afirma una participación que no existe— y lo de un municipio
// sin publicar tampoco, por la cascada.
check(
  "El contador suma lo que sigue en pie y no lo rechazado, lo retirado ni lo de un municipio sin publicar",
  tallyAfter.ofrecidos - tallyBefore.ofrecidos === 2,
  JSON.stringify({ tallyBefore, tallyAfter }),
);

check(
  "Y cuenta como entregado solo lo que ya llegó, que es un subconjunto de lo ofrecido",
  tallyAfter.entregados - tallyBefore.entregados === 1 &&
    tallyAfter.entregados <= tallyAfter.ofrecidos,
  JSON.stringify(tallyAfter),
);

// La comprobación que sostiene la condición repetida: `entregados` y el largo de
// /ayudas tienen que ser el mismo número. La vista no puede contar `aid_log`
// directamente —0005 empieza con un `drop view` y una dependencia lo rompería al
// volver a pegar las migraciones—, así que la regla está escrita dos veces y esto
// es lo que impide que se separen.
const tallyVsLog = await one(`select
  (select entregados from public.offer_tally) as contador,
  (select count(*)::int from public.aid_log)  as registro`);
check(
  "El contador de entregados dice exactamente lo mismo que el largo del registro de ayudas",
  tallyVsLog.contador === tallyVsLog.registro,
  JSON.stringify(tallyVsLog),
);

// El público lee el agregado y no la tabla del fondo, igual que con los dos
// registros: el contador no es una puerta nueva a las ofertas.
await expectError(
  "El contador no le abre al público la tabla de ofertas",
  "select offerer_contact from public.offers",
  "permission denied",
);

// ===========================================================================
// El correo de avisos
//
// Es dato personal en un portal que ya maneja información sensible, y la promesa
// es corta: el público lo deja y no lo lee nadie salvo coordinación. Ni la lista,
// ni el recuento, ni por la API.
//
// Se comprueban las dos barreras por separado, que es lo que 0008 dejó escrito
// para el contacto de quien ofrece: el permiso de tabla y la política. Con una
// sola, el día que alguien añada una política de lectura para depurar algo, la
// lista de correos sale por la API sin que falle nada más que avise.
// ===========================================================================

await asAnon();
await sql("insert into public.newsletter_signups (email) values ('vecina@quibdo.co')");
check("Cualquiera puede dejar su correo para los avisos", true);

await expectError(
  "El público no puede leer la lista de correos: no tiene permiso de tabla",
  "select email from public.newsletter_signups",
  "permission denied",
);

// El recuento es una lectura como cualquier otra, y en la API se pide igual de
// fácil que la lista (`Prefer: count=exact`). Sin `select` no hay número, y eso
// importa: «cuántas personas se han apuntado» ya es un dato del portal que no le
// corresponde a nadie de fuera.
await expectError(
  "Ni el recuento, que por la API se pide igual de fácil que la lista",
  "select count(*) from public.newsletter_signups",
  "permission denied",
);

// Apuntarse dos veces tiene que responder lo mismo que apuntarse una. Con el
// índice único a secas, el error de duplicado convertiría el formulario en una
// forma de preguntar si un correo está en la lista.
await sql("insert into public.newsletter_signups (email) values ('vecina@quibdo.co')");
check("Repetir el correo no da error, así que el formulario no dice quién está dentro", true);

// Y en mayúsculas es la misma persona: dos filas serían dos avisos.
await sql("insert into public.newsletter_signups (email) values ('Vecina@Quibdo.co')");

await asPostgres();
const signups = await one("select count(*)::int as n from public.newsletter_signups");
check(
  "De los tres intentos con el mismo correo queda una sola fila",
  signups.n === 1,
  `n=${signups.n}`,
);

// La forma se comprueba en la base de datos y no solo en el formulario: la Data
// API acepta un insert de cualquiera, así que un campo vacío o un teclazo
// entrarían igual.
await asAnon();
await expectError(
  "Un correo sin forma de correo no entra, venga de donde venga",
  "insert into public.newsletter_signups (email) values ('no-es-un-correo')",
  "newsletter_email_shape",
);

// Quien documenta tampoco la lee: no es una lista de nadie en particular, así
// que no hay municipio asignado que la haga suya.
await asUser("documenta@test.com");
const documentaSignups = await one("select count(*)::int as n from public.newsletter_signups");
check(
  "Quien documenta no ve ningún correo: la política es de coordinación, no de todo el equipo",
  documentaSignups.n === 0,
  `n=${documentaSignups.n}`,
);

await asUser("charlie@test.com");
const coordinationSignups = await one(
  "select count(*)::int as n, min(email) as correo from public.newsletter_signups",
);
check(
  "Coordinación sí la lee, que es la única excepción",
  coordinationSignups.n === 1 && coordinationSignups.correo === "vecina@quibdo.co",
  JSON.stringify(coordinationSignups),
);

// ===========================================================================
// Las donaciones en pesos: un importe no entra desde el navegador
//
// La pasarela no existe todavía y esta tabla está vacía, así que aquí no se
// comprueba ningún flujo de pago. Se comprueba la única cosa de 0017 que hay que
// dejar cerrada ANTES de que exista: quién puede escribir un importe.
//
// Son tres barreras que no dependen la una de la otra, y cada una se prueba sin
// las otras dos. Es el mismo trato que 0008 le da al contacto de quien ofrece, y
// por la misma razón: la que se cae es la que nadie estaba mirando.
//
//   1. El permiso de tabla. Ni `anon` ni `authenticated` tienen `insert`.
//   2. La política. No hay ninguna de escritura, así que con RLS puesta la
//      operación está negada aunque alguien conceda el permiso.
//   3. El disparador, que mira el rol de la CONEXIÓN. Es el que queda cuando
//      alguien desarma las dos primeras, y es el que se prueba abajo con las dos
//      primeras desarmadas a mano.
//
// Que coordinación tampoco pueda escribir un importe no es desconfianza: un
// importe no es un dato que alguien decida, es un hecho que el banco confirma.
// Teclearlo a mano produciría una barra de recaudado que no cuadra con ningún
// extracto y que nadie podría auditar después.
// ===========================================================================

await asAnon();
await expectError(
  "El público no puede registrar una donación: no tiene permiso de tabla",
  `insert into public.donations (case_id, amount_cop, provider, payment_ref)
     select id, 50000, 'pasarela', 'pago-del-publico' from public.cases limit 1`,
  "permission denied",
);

await expectError(
  "Ni leer lo que ha entrado, que sería el historial de quién dona a quién",
  "select count(*) from public.donations",
  "permission denied",
);

// La sesión que importa, y la que sí existe hoy en los teléfonos del equipo.
// Coordinación puede escribir en todas las tablas del portal menos en esta.
await asUser("charlie@test.com");
await expectError(
  "Coordinación tampoco escribe un importe, y es la comprobación que da sentido a la tabla",
  `insert into public.donations (case_id, amount_cop, provider, payment_ref)
     select id, 50000, 'pasarela', 'pago-a-mano' from public.cases limit 1`,
  "permission denied",
);

// El webhook sí, que es el único. Entra como `service_role`, con una clave que
// solo existe en el servidor y que nunca baja al HTML.
await asService();
await sql(`insert into public.donations
  (case_id, amount_cop, status, provider, payment_ref, donor_name, publish_name, settled_at)
  select id, 120000, 'confirmada', 'pasarela', 'pago-001', 'Marta Palacios', true, now()
  from public.cases where display_name = 'Familia Rentería'`);

await asPostgres();
const donationWritten = await one(`select amount_cop, status, payment_ref, case_id is not null as con_causa
  from public.donations where payment_ref = 'pago-001'`);
check(
  "El webhook registra el importe, su estado, la referencia del pago y su causa",
  Number(donationWritten.amount_cop) === 120000 &&
    donationWritten.status === "confirmada" &&
    donationWritten.con_causa === true,
  JSON.stringify(donationWritten),
);

// El registro público sale de la vista, no de la tabla. `anon` sigue sin poder
// leer `public.donations` —está comprobado unas líneas más arriba— y aun así
// tiene que ver el importe, la causa y el nombre autorizado. Lo que no tiene
// que ver es la referencia del pago: no está en la vista, y pedirlo es un
// error de columna, no una celda vacía.
await asAnon();
const namedLog = await one(`select donor_name, amount_cop, case_name, city_slug, publish_name
  from public.donation_log
  where amount_cop = 120000`);
check(
  "El público lee el registro: el nombre autorizado, el importe y la causa, no la tabla",
  namedLog.donor_name === "Marta Palacios" &&
    Number(namedLog.amount_cop) === 120000 &&
    namedLog.case_name === "Familia Rentería" &&
    namedLog.city_slug === "quibdo" &&
    namedLog.publish_name === true,
  JSON.stringify(namedLog),
);

await expectError(
  "Del registro no sale la referencia del pago: esa columna no existe",
  "select payment_ref from public.donation_log",
  "column",
);

await expectError(
  "Tampoco el proveedor: el registro no dice por qué pasarela llegó el dinero",
  "select provider from public.donation_log",
  "column",
);

// Un aviso repetido del proveedor no suma dos veces. Es la primera caída de red
// del webhook convertida en una cifra que no cuadra con el extracto, y con el
// índice único es un error en vez de un pago inventado.
await asService();
await expectError(
  "El mismo aviso del proveedor llegando dos veces no cuenta dos donaciones",
  `insert into public.donations (case_id, amount_cop, provider, payment_ref)
     select id, 120000, 'pasarela', 'pago-001' from public.cases where display_name = 'Familia Rentería'`,
  "donations_payment_unique",
);

await expectError(
  "Un importe de cero o negativo no es una donación",
  `insert into public.donations (case_id, amount_cop, provider, payment_ref)
     select id, 0, 'pasarela', 'pago-002' from public.cases where display_name = 'Familia Rentería'`,
  "donations_amount_positive",
);

// --- Quién lo lee ---------------------------------------------------------
//
// Coordinación, para conciliar. Quien documenta un municipio no: lo que necesita
// de esa ficha es qué falta y qué ha pasado, y ya lo tiene. Es el mismo círculo
// que la lista de correos de avisos (0015).
await asUser("charlie@test.com");
const coordinationDonations = await one("select count(*)::int as n from public.donations");
check(
  "Coordinación lee las donaciones, que es lo que hace falta para conciliar",
  coordinationDonations.n === 1,
  `n=${coordinationDonations.n}`,
);

await asUser("documenta@test.com");
const documentationDonations = await one("select count(*)::int as n from public.donations");
check(
  "Quien documenta no ve ningún importe: la política es de coordinación",
  documentationDonations.n === 0,
  `n=${documentationDonations.n}`,
);

// Una donación anónima, una pendiente y un nombre que es un teléfono. Las tres
// tienen que caer del lado correcto del recorte, y se comprueban juntas porque
// son la regla que 0017 no pudo escribir a ciegas: cuáles nombres salen.
await asService();
await sql(`insert into public.donations
  (case_id, amount_cop, status, provider, payment_ref, donor_name, publish_name, settled_at)
  select id, 80000, 'confirmada', 'pasarela', 'pago-anon-001', 'Carlos Vélez', false, now()
  from public.cases where display_name = 'Familia Rentería'`);
await sql(`insert into public.donations
  (case_id, amount_cop, status, provider, payment_ref, donor_name, publish_name)
  select id, 50000, 'pendiente', 'pasarela', 'pago-pend-001', 'Nadie Publicado', true
  from public.cases where display_name = 'Familia Rentería'`);
await sql(`insert into public.donations
  (case_id, amount_cop, status, provider, payment_ref, donor_name, publish_name, settled_at)
  select id, 30000, 'confirmada', 'pasarela', 'pago-tel-001', 'Marta 3167778899', true, now()
  from public.cases where display_name = 'Familia Rentería'`);

await asAnon();
const logCut = await one(`select
  count(*)::int                                                    as n,
  count(*) filter (where donor_name is not null)::int              as con_nombre,
  count(*) filter (where donor_name is null)::int                  as anonimas,
  count(*) filter (where amount_cop = 50000)::int                  as pendientes,
  count(*) filter (where donor_name like '%316%')::int             as telefono
  from public.donation_log`);
check(
  "Del registro salen las confirmadas, el nombre solo si se autorizó y no es un teléfono, y nunca lo pendiente",
  logCut.n === 3 &&
    logCut.con_nombre === 1 &&
    logCut.anonimas === 2 &&
    logCut.pendientes === 0 &&
    logCut.telefono === 0,
  JSON.stringify(logCut),
);

// --- La tercera barrera, con las dos primeras desarmadas a mano ----------
//
// Esto es lo que va a pasar de verdad algún día: alguien concede un permiso para
// probar algo y añade una política de `insert` porque la aplicación «necesita
// registrar la intención de pago». Las dos líneas parecen razonables escritas. Lo
// que tiene que seguir en pie después de las dos es el disparador.
await asPostgres();
await sql(`
grant insert on public.donations to authenticated;
create policy donaciones_de_prueba on public.donations
  for insert to authenticated with check (true);
`);

await asUser("charlie@test.com");
await expectError(
  "Con el permiso concedido y una política puesta, el disparador sigue rechazando el importe",
  `insert into public.donations (case_id, amount_cop, provider, payment_ref)
     select id, 99000, 'pasarela', 'pago-por-la-web' from public.cases where display_name = 'Familia Rentería'`,
  "webhook",
);

await asPostgres();
await sql(`
drop policy if exists donaciones_de_prueba on public.donations;
revoke insert on public.donations from authenticated;
`);

// Y que el desarme se deshizo: si esta línea falla, todas las de arriba sobre los
// permisos de esta tabla dejan de significar nada.
const donationPrivsRestored = (await publicTablePrivileges()).donations;
check(
  "Deshecho el desarme, las donaciones vuelven a conceder solo lectura con sesión",
  JSON.stringify(donationPrivsRestored) === JSON.stringify({ authenticated: "SELECT" }),
  JSON.stringify(donationPrivsRestored),
);

// --- La donación al fondo, y las dos formas de perder de vista el dinero ---
//
// 0022 deja entrar la donación que no elige familia, y lo que hay que comprobar
// no es que entre —eso es una columna menos obligatoria— sino que siga siendo
// imposible lo que 0017 escribió el `not null` para impedir: que el dinero de una
// familia acabe en el fondo común sin que nadie lo haya decidido.
await asService();
await sql(`insert into public.donations
  (destination, amount_cop, status, provider, payment_ref, donor_name, publish_name, settled_at)
  values ('fondo', 200000, 'confirmada', 'pasarela', 'pago-fondo-001', 'Aura Bermúdez', true, now())`);

await expectError(
  "Una donación a una causa que llega sin la causa no entra: falla en voz alta en vez de irse al fondo",
  `insert into public.donations (amount_cop, provider, payment_ref)
     values (70000, 'pasarela', 'pago-sin-causa')`,
  "donations_destination_consistent",
);

await expectError(
  "Y una al fondo que llega con una causa pegada tampoco: son dos flujos confundidos",
  `insert into public.donations (destination, case_id, amount_cop, provider, payment_ref)
     select 'fondo', id, 70000, 'pasarela', 'pago-fondo-con-causa'
     from public.cases where display_name = 'Familia Rentería'`,
  "donations_destination_consistent",
);

// El fragmento que se espera no es el nombre de la restricción, y es a propósito:
// las dos se solapan —la de consistencia nombra los dos destinos, así que un
// tercero la incumple siempre— y cuál de las dos salta primero lo decide
// Postgres. Lo que se comprueba es que un destino inventado no entra; que la
// restricción del vocabulario siga escrita se comprueba en la línea siguiente,
// porque el día que alguien afloje la de consistencia esta es la que queda.
await expectError(
  "Un destino inventado no es un destino",
  `insert into public.donations (destination, amount_cop, provider, payment_ref)
     values ('reserva', 70000, 'pasarela', 'pago-destino-raro')`,
  "violates check constraint",
);

await asPostgres();
const destinationChecks = await one(`select count(*)::int as n from pg_constraint
  where conrelid = 'public.donations'::regclass
    and conname in ('donations_destination_valid', 'donations_destination_consistent')`);
check(
  "El destino lo guardan dos restricciones y no una: el vocabulario y su acuerdo con la causa",
  destinationChecks.n === 2,
  `n=${destinationChecks.n}`,
);
await asService();

// La del fondo sale en el registro general, sin causa y sin municipio, y dice
// que es del fondo con una palabra y no con un hueco.
await asAnon();
const fundRow = await one(`select destination, donor_name, amount_cop, case_id, case_name, city_slug
  from public.donation_log where amount_cop = 200000`);
check(
  "La donación al fondo sale en el registro, dicha por su nombre y sin causa ni municipio",
  fundRow.destination === "fondo" &&
    fundRow.donor_name === "Aura Bermúdez" &&
    fundRow.case_id === null &&
    fundRow.case_name === null &&
    fundRow.city_slug === null,
  JSON.stringify(fundRow),
);

// Y el agujero que abren los `left join`: una donación a una causa sin publicar
// no puede sobrevivir en el registro con las columnas de la causa vacías, porque
// eso es exactamente una donación al fondo mal leída. Publicar el dinero de una
// familia que no ha consentido aparecer es la única cosa que este portal no
// puede hacer, y aquí es donde se comprueba que no la hace.
await asPostgres();
await sql(`insert into public.cases (city_id, display_name, story, published, consent_to_publish)
  select id, 'Familia Sin Publicar', 'Una ficha que todavía no está lista.', false, false
  from public.cities where slug = 'quibdo'`);
await asService();
await sql(`insert into public.donations
  (case_id, amount_cop, status, provider, payment_ref, donor_name, publish_name, settled_at)
  select id, 310000, 'confirmada', 'pasarela', 'pago-sin-publicar', 'Nadie Debe Ver Esto', true, now()
  from public.cases where display_name = 'Familia Sin Publicar'`);

await asAnon();
const hiddenDonation = await one(`select
  count(*) filter (where amount_cop = 310000)::int          as la_fila,
  count(*) filter (where destination = 'fondo')::int        as del_fondo
  from public.donation_log`);
check(
  "Una donación a una causa sin publicar no sale del registro, ni disfrazada de donación al fondo",
  hiddenDonation.la_fila === 0 && hiddenDonation.del_fondo === 1,
  JSON.stringify(hiddenDonation),
);

// Se deshace, para que las comprobaciones de más abajo cuenten las causas que
// contaban antes. La donación se va primero: el `on delete restrict` de 0017 no
// deja borrar una causa que recibió dinero, y eso ya está comprobado aparte.
await asPostgres();
await sql(`delete from public.donations where payment_ref = 'pago-sin-publicar';
  delete from public.cases where display_name = 'Familia Sin Publicar';`);

// ===========================================================================
// El tablero: el recado del momento y el movimiento hacia un pueblo
// ===========================================================================

await asPostgres();
const focusRows = await one("select count(*)::int as n from public.campaign_focus");
check("Hay un foco del momento y solo uno", focusRows.n === 1, `n=${focusRows.n}`);

await expectError(
  "No cabe un segundo foco: la fila es única por construcción",
  "insert into public.campaign_focus (singleton) values (false)",
  "campaign_focus_one_row",
);

await asUser("documenta@test.com");
const focusEdit = await db.exec("update public.campaign_focus set note = 'ladron'");
check(
  "Quien documenta no cambia el foco del momento",
  focusEdit[0].affectedRows === 0,
  `filas=${focusEdit[0].affectedRows}`,
);

await asAnon();
const publicFocus = await one("select city_id, note from public.campaign_focus");
check(
  "El público lee el foco",
  publicFocus !== null && publicFocus.note === "",
  JSON.stringify(publicFocus),
);

await expectError(
  "El público no escribe el foco",
  "update public.campaign_focus set note = 'ladron'",
  "permission denied",
);

await asUser("charlie@test.com");
await sql(`
update public.campaign_focus
   set city_id = (select id from public.cities where slug = 'quibdo'),
       note = 'Techo'
`);
const setFocus = await one("select note, updated_by from public.campaign_focus");
check(
  "Coordinación marca el foco y la base de datos firma quién lo tocó",
  setFocus.note === "Techo" && setFocus.updated_by === "charlie@test.com",
  JSON.stringify(setFocus),
);

await sql(`
update public.campaign_focus
   set case_id = (select id from public.cases where display_name = 'Familia Rentería')
`);
const caseFocus = await one(`
select city_id = (select city_id from public.cases where display_name = 'Familia Rentería') as ok
  from public.campaign_focus
`);
check(
  "Si el recado es de una causa, el pueblo es el de esa causa",
  caseFocus.ok === true,
  JSON.stringify(caseFocus),
);

await sql("update public.campaign_focus set city_id = null, case_id = null, note = ''");

await asAnon();
const activityBefore = await one(
  "select coalesce(sum(en_camino), 0)::int as n from public.city_offer_activity",
);

await asPostgres();
await sql(`
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Tablero pendiente', '3008880001', 'Mercados', 'alimentos', 'pendiente'
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status, delivered_on)
  select id, 'Tablero entregado', '3008880002', 'Tejas', 'techo', 'aceptada', current_date
  from public.cities where slug = 'quibdo';
insert into public.offers (city_id, offerer_name, offerer_contact, resource, category, status)
  select id, 'Tablero rechazado', '3008880003', 'Ropa mojada', 'ropa', 'rechazada'
  from public.cities where slug = 'quibdo';
`);

await asAnon();
const activityAfter = await one(
  "select coalesce(sum(en_camino), 0)::int as n from public.city_offer_activity",
);
check(
  "El tablero cuenta lo que va de camino y no lo entregado ni lo rechazado",
  activityAfter.n - activityBefore.n === 1,
  JSON.stringify({ activityBefore, activityAfter }),
);

const activityLeak = await one(`
select count(*)::int as n
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'city_offer_activity'
   and column_name in ('offerer_name', 'offerer_contact', 'message', 'resource')
`);
check(
  "El movimiento del tablero no expone contacto ni lo que se ofreció",
  activityLeak.n === 0,
  `n=${activityLeak.n}`,
);

await asPostgres();

// --- Una causa que recibió dinero no se borra de un botón ----------------
//
// `on delete restrict` y no `cascade`, al contrario que el resto del portal: la
// fila que se llevaría por delante es el rastro de lo que alguien mandó para esa
// familia, y hace falta para conciliar con el banco aunque la ficha ya no esté
// publicada. CUANDO HAYA PASARELA, esto hará fallar «Borrar caso» en el panel y
// habrá que darle un mensaje que lo explique.
await expectError(
  "Borrar una causa que ha recibido dinero lo rechaza la base de datos",
  "delete from public.cases where display_name = 'Familia Rentería'",
  "donations",
);

// --- Despublicar un municipio esconde todo su contenido -----------------
await asUser("charlie@test.com");
await sql("update public.cities set published = false where slug = 'quibdo'");

await asAnon();
const afterUnpublish = await one(`select
  (select count(*) from public.cities)        as cities,
  (select count(*) from public.cases)         as cases,
  (select count(*) from public.needs)         as needs,
  (select count(*) from public.photos)        as photos,
  (select count(*) from public.case_updates)  as updates`);
check(
  "Al despublicar el municipio se esconde todo su contenido",
  Object.values(afterUnpublish).every((value) => Number(value) === 0),
  JSON.stringify(afterUnpublish),
);

// La vista se consulta con los derechos de su propietario, así que las RLS de
// las tablas del fondo no la protegen: la cascada está reescrita en sus joins y
// esto es lo que comprueba que sigue puesta.
const aidAfterUnpublish = await one("select count(*)::int as n from public.aid_log");
check(
  "Al despublicar el municipio, sus entregas salen del registro público",
  aidAfterUnpublish.n === 0,
  `n=${aidAfterUnpublish.n}`,
);

// Lo que queda es la donación al fondo, que no pertenece a ningún pueblo y no
// cuenta nada de nadie. Es el mismo recorte que se le hace a lo prometido justo
// debajo: se cuenta lo que sí tenía municipio, porque contar el total diría cero
// solo mientras nadie done al fondo.
const donationAfterUnpublish = await one(`select
  count(*)::int                                      as n,
  count(*) filter (where city_name is not null)::int as con_municipio
  from public.donation_log`);
check(
  "Al despublicar el municipio, sus donaciones salen del registro público y solo queda la del fondo",
  donationAfterUnpublish.con_municipio === 0 && donationAfterUnpublish.n === 1,
  JSON.stringify(donationAfterUnpublish),
);

// Lo mismo con lo prometido, y hay que comprobarlo aparte: son dos vistas con dos
// copias de la cascada, así que una puede quedarse sin ella sin que la otra lo
// note. Lo que queda es la oferta sin municipio —un camión, un cupo de carga—,
// que no pertenece a ningún pueblo y no cuenta nada de nadie.
const offerAfterUnpublish = await one(`select
  count(*)::int                                    as n,
  count(*) filter (where city_name is not null)::int as con_municipio
  from public.offer_log`);
check(
  "Al despublicar el municipio, sus ofertas salen de lo prometido y solo quedan las que no van a ningún sitio",
  offerAfterUnpublish.con_municipio === 0,
  JSON.stringify(offerAfterUnpublish),
);

// Y el contador es una tercera copia de la misma cascada, así que hay que
// mirarlo aparte por lo mismo: puede quedarse sin ella sin que las otras dos lo
// noten, y entonces el número de la portada diría que hay aportes donde el
// portal ya no enseña ninguno. Lo que tiene que seguir cuadrando es la igualdad
// con el registro, que aquí queda vacío.
const tallyAfterUnpublish = await one(`select
  (select entregados from public.offer_tally) as contador,
  (select count(*)::int from public.aid_log)  as registro`);
check(
  "El contador también sigue la cascada: despublicado el municipio, no cuenta lo que ya no se ve",
  tallyAfterUnpublish.contador === 0 && tallyAfterUnpublish.registro === 0,
  JSON.stringify(tallyAfterUnpublish),
);

// El canal de un caso se va con la cascada, y eso es lo que antes no pasaba: la
// llave global de 0010 seguía publicada con el portal entero despublicado,
// porque no era de nadie. El canal de un caso sí es de alguien, así que
// despublicar a esa gente se lleva también a dónde enviarles.
//
// El general NO se va, y esa asimetría es la que hay que dejar escrita: no
// pertenece a ningún municipio, así que no hay nada que despublicar con él y
// tiene que seguir en pie para los casos de los pueblos que sí están publicados.
// Es la misma condición `true` de su política, mirada desde el otro lado. Lo que
// lo hace aceptable —y es lo que 0011 no podía decir de la llave global— es que
// ninguna ficha lo presenta como el canal de nadie.
const channelsAfterUnpublish = await one(`select
  (select count(*)::int from public.cases
     where donation_key <> '' or donation_url <> '' or donation_phone <> '') as casos,
  (select count(*)::int from public.donation_channel
     where donation_key <> '')                                              as general`);
check(
  "Al despublicar el municipio, el canal de sus casos desaparece con él y el general se queda",
  channelsAfterUnpublish.casos === 0 && channelsAfterUnpublish.general === 1,
  JSON.stringify(channelsAfterUnpublish),
);

const activityAfterUnpublish = await one(
  "select count(*)::int as n from public.city_offer_activity",
);
check(
  "Al despublicar el municipio, su movimiento desaparece del tablero",
  activityAfterUnpublish.n === 0,
  `n=${activityAfterUnpublish.n}`,
);

// ===========================================================================
// Presupuesto y las tres ofertas (0020)
// ===========================================================================

await asPostgres();
await sql("update public.cities set published = true where slug = 'quibdo'");
const daniela = await one("select id, city_id from public.cases where display_name = 'Familia Rentería'");

await asUser("charlie@test.com");
await sql(`insert into public.budget_items (case_id, city_id, title, amount_cop)
  values ('${daniela.id}', '${daniela.city_id}', '40 tejas de zinc', 1600000)`);

const item = await one("select title, amount_cop, purchased from public.budget_items where title = '40 tejas de zinc'");
check(
  "Coordinación anota un ítem del presupuesto con su precio",
  item.title === "40 tejas de zinc" && Number(item.amount_cop) === 1600000 && item.purchased === false,
  JSON.stringify(item),
);

await sql("update public.budget_items set purchased = true where title = '40 tejas de zinc'");
const bought = await one("select purchased, purchased_on is not null as con_fecha from public.budget_items where title = '40 tejas de zinc'");
check(
  "Al marcar un ítem como comprado se le pone el día",
  bought.purchased === true && bought.con_fecha === true,
  JSON.stringify(bought),
);

await asAnon();
const publicItem = await one("select title, amount_cop from public.budget_items where title = '40 tejas de zinc'");
check(
  "El público lee el ítem de una causa publicada, con su precio",
  publicItem?.title === "40 tejas de zinc",
  JSON.stringify(publicItem),
);

await expectError(
  "El público no puede marcar un ítem como comprado",
  "update public.budget_items set purchased = false where title = '40 tejas de zinc'",
  "permission denied",
);

const raised = await one("select goal_cop, used_cop, donated_cop from public.case_budget where case_id = (select id from public.cases where display_name = 'Familia Rentería')");
check(
  "La vista pública suma meta, usado y lo donado confirmado, sin nombres de quien dona",
  Number(raised.goal_cop) >= 1600000 && Number(raised.used_cop) >= 1600000 && Number(raised.donated_cop) >= 0,
  JSON.stringify(raised),
);

await asAnon();
await sql(`insert into public.support_offers (kind, person_name, contact, skills, availability)
  values ('voluntario', 'Camila Hurtado', '3004412290', 'Olla común y censo', 'Fines de semana')`);

await expectError(
  "El público no lee las ofertas de apoyo: ni el contacto ni lo que ofreció",
  "select person_name from public.support_offers",
  "permission denied",
);

await asUser("charlie@test.com");
const offerRead = await one("select kind, person_name, contact from public.support_offers where person_name = 'Camila Hurtado'");
check(
  "El equipo sí lee la oferta de apoyo, con el contacto",
  offerRead.kind === "voluntario" && offerRead.contact === "3004412290",
  JSON.stringify(offerRead),
);

await asUser("documenta@test.com");
await sql("delete from public.support_offers where person_name = 'Camila Hurtado'");
const stillThere = await one("select count(*)::int as n from public.support_offers where person_name = 'Camila Hurtado'");
check(
  "Quien documenta no borra una oferta de apoyo",
  stillThere.n === 1,
  `n=${stillThere.n}`,
);

await asUser("charlie@test.com");
await sql("delete from public.support_offers where person_name = 'Camila Hurtado'");
const afterDelete = await one("select count(*)::int as n from public.support_offers where person_name = 'Camila Hurtado'");
check(
  "Coordinación puede borrar una oferta de apoyo",
  afterDelete.n === 0,
  `n=${afterDelete.n}`,
);

await asPostgres();
await expectError(
  "Una oferta de apoyo no admite un tipo inventado",
  `insert into public.support_offers (kind, person_name, contact)
     values ('dinero', 'Nadie', '3000000000')`,
  "support_offers_kind_valid",
);

// --- Informe -----------------------------------------------------------
await asPostgres();
const failed = results.filter((result) => !result.ok);
for (const result of results) {
  console.log(`${result.ok ? "PASA" : "FALLA"}  ${result.name}${result.extra ? `  [${result.extra}]` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length === 0 ? 0 : 1);
