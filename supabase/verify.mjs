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
 * categorías, que un municipio no pueda tener dos fundaciones con dos enlaces de
 * donación, que la migración que impone esa regla se niegue a aplicarse en vez de
 * borrar una de las dos, que el retrato de una persona no pueda ser la foto de
 * otra, que la foto de un avance no pueda ser la de otra familia, que el encuadre
 * de una foto solo lo pueda mover quien documenta ese municipio, que el canal de
 * donación de un municipio o de un caso solo lo ponga coordinación —comprobado
 * también desde la sesión de quien documenta ese mismo municipio, que es la que
 * llega hasta ahí—, que un canal sea una llave o un enlace y nunca los dos, que un
 * caso sin canal propio no herede el de nadie, que el público los lea y no los
 * toque, que la llave global del portal ya no exista ni vuelva al volver a pegar
 * las migraciones, que del registro de lo que se ha prometido no salgan ni el
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

alter default privileges in schema public grant all on tables    to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

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

const policyCount = await one(
  "select count(*)::int as n from pg_policies where schemaname in ('public','storage')",
);
check("Se crean las 36 políticas RLS", policyCount.n === 36, `n=${policyCount.n}`);

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
  aid_log:      { anon: "SELECT", authenticated: "SELECT" },
  case_updates: { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  cases:        { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  cities:       { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  foundations:  { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  needs:        { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  offer_log:    { anon: "SELECT", authenticated: "SELECT" },
  offers:       { anon: "INSERT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
  photos:       { anon: "SELECT", authenticated: "DELETE,INSERT,SELECT,UPDATE" },
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
insert into public.foundations (city_id, name, whatsapp)
  select id, 'Fundación Atrato', '3001234567' from public.cities where slug = 'quibdo';
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
check("El equipo puede escribir municipio, fundación, caso, necesidades y fotos", true);

const updatedAt = await one(
  "select (updated_at > created_at) as touched from public.cities where slug = 'quibdo'",
);
check("El trigger actualiza updated_at al editar", updatedAt.touched === true);

// --- El público ve solo lo publicado --------------------------------------
await asAnon();
const pub = await one(`select
  (select count(*) from public.cities)      as cities,
  (select count(*) from public.cases)       as cases,
  (select count(*) from public.needs)       as needs,
  (select count(*) from public.photos)      as photos,
  (select count(*) from public.foundations) as foundations`);
check(
  "El público ve el municipio publicado con su contenido",
  Number(pub.cities) === 1 &&
    Number(pub.cases) === 1 &&
    Number(pub.needs) === 2 &&
    Number(pub.photos) === 2 &&
    Number(pub.foundations) === 1,
  JSON.stringify(pub),
);

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
insert into public.foundations (city_id, name, donation_url)
  select id, 'Fundación Istmina', 'https://legitima.org/donar' from public.cities where slug = 'istmina';
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

const donationEdit = await db.exec(
  "update public.foundations set donation_url = 'https://ladron.example/donar' where name = 'Fundación Istmina'",
);
check(
  "Quien documenta no puede cambiar el enlace de donación de una fundación",
  donationEdit[0].affectedRows === 0,
  `filas=${donationEdit[0].affectedRows}`,
);

await expectError(
  "Quien documenta no puede añadir fundaciones",
  `insert into public.foundations (city_id, name, donation_url)
     select id, 'Fundación falsa', 'https://ladron.example' from public.cities where slug = 'quibdo'`,
  "row-level security",
);

// ===========================================================================
// Una sola fundación por municipio
//
// `donation_url` es a dónde va el dinero de quien pulsa «Donar». Con varias
// fundaciones por municipio, cuál manda lo decidía un orden —la marcada como
// madre, y si no la primera—, así que dos marcadas o ninguna dejaban el botón
// apuntando a un enlace que nadie eligió, y sin que se notara en pantalla.
//
// Lo que hay que demostrar aquí es que la garantía está en la base de datos y no
// en el panel, porque el panel no es la única puerta; y que la migración que la
// impone se niega a aplicarse cuando encuentra dos, en vez de quedarse con una.
// ===========================================================================

await asUser("charlie@test.com");
await sql(
  "update public.foundations set donation_url = 'https://atratovive.org/donar' where name = 'Fundación Atrato'",
);

const foundationColumns = await db.query(
  "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'foundations'",
);
const foundationColumnNames = foundationColumns.rows.map((row) => row.column_name);
check(
  "La fundación ya no lleva marca de «es la madre»",
  !foundationColumnNames.includes("is_primary"),
  foundationColumnNames.join(", "),
);

await expectError(
  "Un municipio no puede tener dos fundaciones",
  `insert into public.foundations (city_id, name, donation_url)
     select id, 'Fundación paralela', 'https://ladron.example/donar' from public.cities where slug = 'quibdo'`,
  "foundations_one_per_city",
);

// La restricción no sirve de nada si el intento fallido deja el enlace movido: lo
// que se protege es a dónde va el dinero, no el número de filas.
const quibdoFoundation = await one(`select count(*)::int as n, min(donation_url) as url
  from public.foundations where city_id = (select id from public.cities where slug = 'quibdo')`);
check(
  "El intento rechazado deja intactos la fundación de Quibdó y su enlace de donación",
  quibdoFoundation.n === 1 && quibdoFoundation.url === "https://atratovive.org/donar",
  JSON.stringify(quibdoFoundation),
);

// La regla es «no más de una», no «tiene que haber una». Un municipio se crea
// antes de la visita y pasa días sin fundación registrada: si la restricción
// obligara a tener una, no se podría abrir el municipio en el panel.
const withoutFoundation = await one(`select count(*)::int as n from public.cities c
  where not exists (select 1 from public.foundations f where f.city_id = c.id)`);
check(
  "Un municipio puede seguir sin fundación, que es como nace",
  withoutFoundation.n === 8,
  `n=${withoutFoundation.n}`,
);

// Y la restricción es por municipio y no global: cada pueblo tiene la suya.
const oneEach = await one(`select count(*)::int as n, count(distinct city_id)::int as cities
  from public.foundations`);
check(
  "Dos municipios distintos tienen cada uno la suya",
  oneEach.n === 2 && oneEach.cities === 2,
  JSON.stringify(oneEach),
);

const uniqueIndex = await one(
  "select count(*)::int as n from pg_indexes where tablename = 'foundations' and indexname = 'foundations_city_idx'",
);
check(
  "El índice por municipio de 0001 lo sustituye el único, no se acumulan los dos",
  uniqueIndex.n === 0,
  `n=${uniqueIndex.n}`,
);

// --- La migración se niega antes que elegir por nadie --------------------
//
// Se retira la restricción para poder construir el estado que la migración tiene
// que encontrarse en la base de datos del viaje: dos fundaciones en un municipio,
// cargadas a mano cuando todavía no había regla que lo impidiera. Cada una lleva
// su propio enlace de donación, así que descartar una es decidir a dónde va el
// dinero de ese municipio.
await asPostgres();
await sql("alter table public.foundations drop constraint if exists foundations_one_per_city");
await sql(`insert into public.foundations (city_id, name, donation_url)
  select id, 'Fundación de la esquina', 'https://laotra.example/donar'
  from public.cities where slug = 'quibdo'`);

let guardMessage = "";
try {
  await sql(migration("migrations/0004_una_fundacion_por_municipio.sql"));
} catch (error) {
  guardMessage = String(error.message ?? error);
}
check(
  "Con dos fundaciones en un municipio, la migración se niega a aplicarse",
  guardMessage.includes("más de una fundación"),
  guardMessage.slice(0, 90),
);

// Un «hay duplicados» a secas obliga a escribir la consulta a mano para saber
// dónde, y esto se lee con prisa.
check(
  "El aviso dice en qué municipio están las dos",
  guardMessage.includes("Quibdó"),
  guardMessage.slice(0, 90),
);

const survivors = await db.query(`select name, donation_url from public.foundations
  where city_id = (select id from public.cities where slug = 'quibdo') order by name`);
check(
  "La migración que se niega no borra ninguna de las dos ni les cambia el enlace",
  survivors.rows.length === 2 &&
    survivors.rows[0].donation_url === "https://atratovive.org/donar" &&
    survivors.rows[1].donation_url === "https://laotra.example/donar",
  JSON.stringify(survivors.rows),
);

// Y con el municipio arreglado a mano —que es lo que pide el aviso— entra sin
// quejarse y deja la restricción puesta.
await sql("delete from public.foundations where name = 'Fundación de la esquina'");
try {
  await sql(migration("migrations/0004_una_fundacion_por_municipio.sql"));
  check("Resuelto el municipio a mano, la migración entra sin quejarse", true);
} catch (error) {
  check("Resuelto el municipio a mano, la migración entra sin quejarse", false, String(error.message));
}

const constraintBack = await one(
  "select count(*)::int as n from pg_constraint where conname = 'foundations_one_per_city'",
);
check(
  "Después de entrar, la restricción queda puesta",
  constraintBack.n === 1,
  `n=${constraintBack.n}`,
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
// El canal de donación: uno por municipio y uno por caso
//
// Aquí vivía la llave global del portal, que 0011 retira. `@soschoco` nunca fue
// «la llave del Chocó»: es el canal del caso de Quibdó y de nadie más. Cada
// municipio va a tener el suyo y cada caso el suyo, y el destino del dinero pasa
// a ser una columna de la fila de quien lo recibe.
//
// Eso cambia lo que hay que demostrar, y las cuatro cosas son distintas de las
// de antes:
//
//   1. Que la llave global no exista ya en ninguna forma, ni vuelva pegando otra
//      vez las migraciones en orden.
//   2. Que un canal sea una llave O un enlace, nunca los dos. Con los dos
//      puestos, «el canal» volvería a ser «el que la página mire primero», que es
//      el destino del dinero decidido por un orden que 0004 tuvo que arreglar en
//      las fundaciones. Y en terreno el fallo real es cambiar de destino con
//      prisa y olvidar borrar el anterior.
//   3. Que solo coordinación lo escriba, y esto es lo que no se parece a nada de
//      lo de arriba: quien documenta SÍ puede escribir en el caso entero de su
//      municipio —es su trabajo—, así que la política de la tabla lo deja pasar y
//      quien lo para es el disparador. Por eso se prueba con la sesión de
//      documentación DE ESE MISMO MUNICIPIO, que es la única que llega hasta ahí,
//      y se prueba también que sigue pudiendo guardar el resto de la ficha.
//   4. Que no haya herencia. Un caso sin canal propio lee vacío aunque su
//      municipio tenga uno: el dinero no puede acabar en un sitio que nadie
//      eligió para esa persona.
// ===========================================================================

await asPostgres();

// --- La llave global no está, y no vuelve --------------------------------
const globalKeyGone = await one(`select
  (select count(*)::int from information_schema.tables
     where table_schema = 'public' and table_name = 'donation_key')            as tabla,
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname = 'stamp_donation_key')         as sello`);
check(
  "La llave global del portal ya no existe, ni la tabla ni su disparador",
  globalKeyGone.tabla === 0 && globalKeyGone.sello === 0,
  JSON.stringify(globalKeyGone),
);

const channelColumns = await one(`select
  (select count(*)::int from information_schema.columns
     where table_schema = 'public' and table_name = 'cities'
       and column_name in ('donation_key','donation_url','donation_app','donation_holder')) as municipio,
  (select count(*)::int from information_schema.columns
     where table_schema = 'public' and table_name = 'cases'
       and column_name in ('donation_key','donation_url','donation_app','donation_holder')) as caso`);
check(
  "Los dos niveles tienen las cuatro columnas del canal, así que los dos admiten llave y enlace",
  channelColumns.municipio === 4 && channelColumns.caso === 4,
  JSON.stringify(channelColumns),
);

// --- Una llave o un enlace, nunca los dos --------------------------------
//
// Como propietario, así que el disparador no interviene: lo que se comprueba
// aquí es la restricción de la tabla, que aguanta venga de donde venga.
await expectError(
  "Un municipio no puede tener a la vez una llave y un enlace",
  `update public.cities set donation_key = '@quibdo', donation_url = 'https://ejemplo.org/donar'
     where slug = 'quibdo'`,
  "cities_donation_one_channel",
);

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
update public.cities set donation_key = '@quibdo-alcaldia', donation_app = 'Bre-B',
  donation_holder = 'Alcaldía de Quibdó' where slug = 'quibdo';
update public.cases set donation_key = '@soschoco', consent_to_publish = true, published = true
  where display_name = 'Familia Rentería';
`);

await asPostgres();
const written = await one(`select
  (select donation_key    from public.cities where slug = 'quibdo')                      as ciudad_llave,
  (select donation_holder from public.cities where slug = 'quibdo')                      as ciudad_titular,
  (select donation_key    from public.cases  where display_name = 'Familia Rentería')    as caso_llave,
  (select donation_url    from public.cases  where display_name = 'Familia Mosquera')    as caso_enlace`);
check(
  "Coordinación pone el canal del municipio y el del caso, en llave y en enlace",
  written.ciudad_llave === "@quibdo-alcaldia" &&
    written.ciudad_titular === "Alcaldía de Quibdó" &&
    written.caso_llave === "@soschoco" &&
    written.caso_enlace === "https://vaki.co/vaki/mosquera",
  JSON.stringify(written),
);

// --- Un municipio sin fundación también puede tener canal ----------------
//
// Es el motivo de que el canal del municipio no viva en `foundations`: Quibdó no
// tiene fundación y es el único municipio real publicado. Si el canal colgara de
// la fundación, el único pueblo con una persona documentada esperando sería
// justo el que no puede tener a dónde recibir.
await sql(`update public.cities set donation_key = '@sin-fundacion' where slug = 'condoto'`);
const cityWithoutFoundation = await one(`select
  (select donation_key from public.cities where slug = 'condoto')     as llave,
  (select count(*)::int from public.foundations f
     join public.cities c on c.id = f.city_id where c.slug = 'condoto') as fundaciones`);
check(
  "Un municipio sin fundación tiene canal propio, que es por lo que el canal no vive en la fundación",
  cityWithoutFoundation.llave === "@sin-fundacion" && cityWithoutFoundation.fundaciones === 0,
  JSON.stringify(cityWithoutFoundation),
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
  "Tampoco el canal de su propio municipio",
  "update public.cities set donation_key = '@desviada' where slug = 'quibdo'",
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
    stillWorking.donation_key === "@soschoco",
  JSON.stringify(stillWorking),
);

// Lo mismo en el municipio, que es lo primero que se edita al llegar a un pueblo.
// El disparador es el mismo, pero la fila no: aquí conviven el canal con el
// resumen que quien documenta escribe desde el móvil.
await asUser("documenta@test.com");
await sql(`update public.cities set summary = 'Se documentó el barrio de la ribera.'
  where slug = 'quibdo'`);

await asPostgres();
const cityStillWorking = await one(`select summary, donation_key, donation_holder
  from public.cities where slug = 'quibdo'`);
check(
  "Quien documenta sigue guardando el resumen del municipio con su canal puesto",
  cityStillWorking.summary === "Se documentó el barrio de la ribera." &&
    cityStillWorking.donation_key === "@quibdo-alcaldia" &&
    cityStillWorking.donation_holder === "Alcaldía de Quibdó",
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
  (select donation_key    from public.cities where slug = 'quibdo')                   as ciudad,
  (select donation_app    from public.cities where slug = 'quibdo')                   as app,
  (select donation_holder from public.cities where slug = 'quibdo')                   as titular,
  (select donation_key    from public.cases  where display_name = 'Familia Rentería') as caso`);
check(
  "El público lee los canales enteros, con su app y su titular: es justo para lo que están",
  publicChannels.ciudad === "@quibdo-alcaldia" &&
    publicChannels.app === "Bre-B" &&
    publicChannels.titular === "Alcaldía de Quibdó" &&
    publicChannels.caso === "@soschoco",
  JSON.stringify(publicChannels),
);

// Ni llega a las políticas: `anon` solo tiene `select` en las dos tablas (0008).
await expectError(
  "El público no puede cambiar el canal de un municipio",
  "update public.cities set donation_key = '@ladron' where slug = 'quibdo'",
  "permission denied",
);

await expectError(
  "El público no puede cambiar el canal de un caso",
  "update public.cases set donation_key = '@ladron'",
  "permission denied",
);

// --- Sin canal propio, no hay canal --------------------------------------
//
// De la regla entera, aquí se puede demostrar la mitad: que la fila de un caso
// sin canal lee vacía aunque su municipio tenga uno. La otra mitad —que la ficha
// no rellene ese hueco con el del municipio y lo diga con palabras— vive en la
// página y no en el esquema, y es donde estaba el fallo que 0011 viene a
// arreglar.
await asUser("documenta@test.com");
await sql(`insert into public.cases (city_id, display_name, story, consent_to_publish, published)
  select id, 'Familia sin canal', 'Todavía no hay a dónde enviarle nada.', true, true
  from public.cities where slug = 'quibdo'`);

await asAnon();
const noInheritance = await one(`select
  (select donation_key || donation_url || donation_app || donation_holder
     from public.cases where display_name = 'Familia sin canal')  as caso,
  (select donation_key from public.cities where slug = 'quibdo')  as ciudad`);
check(
  "Un caso sin canal propio lee vacío aunque su municipio tenga uno: no hay herencia",
  noInheritance.caso === "" && noInheritance.ciudad === "@quibdo-alcaldia",
  JSON.stringify(noInheritance),
);

// El enlace de la fundación es otra cosa y sigue siendo suyo: sale dentro de su
// tarjeta y bajo su nombre. Que las dos convivan sin mezclarse es lo que permite
// que el canal del municipio no tuviera que sustituir a nada.
//
// Se mira como propietario y no como público porque Istmina está sin publicar:
// aquí la pregunta es cómo está guardado el dato, no quién lo ve.
await asPostgres();

// `f.donation_url` va con su tabla delante y no a secas: desde 0011 la columna
// existe también en `cities`, así que un `donation_url` suelto dentro del join
// es ambiguo. Escribirlo entero es lo que impide que esta comprobación acabe
// mirando el canal del municipio y dando por buena la separación que quiere
// demostrar.
const foundationApart = await one(`select
  (select f.donation_url from public.foundations f
     join public.cities c on c.id = f.city_id where c.slug = 'istmina' limit 1) as fundacion,
  (select donation_key from public.cities where slug = 'istmina')               as municipio`);
check(
  "El enlace de una fundación y el canal de su municipio son dos datos distintos",
  foundationApart.fundacion === "https://legitima.org/donar" && foundationApart.municipio === "",
  JSON.stringify(foundationApart),
);

// --- Volver a pegar las migraciones no devuelve la llave global ----------
//
// Todas las migraciones de este proyecto se vuelven a pegar cuando hay que
// reconstruir algo, y 0010 sigue en la carpeta con `@soschoco` escrita dentro.
// Pegadas en orden, 0011 la retira otra vez y los canales se quedan donde
// estaban. Pegar 0010 suelta sí devolvería la llave global: está dicho en su
// propio archivo.
await asPostgres();
await sql(migration("migrations/0010_llave_de_transferencia.sql"));
await sql(migration("migrations/0011_canal_de_donacion.sql"));
const afterRerun = await one(`select
  (select count(*)::int from information_schema.tables
     where table_schema = 'public' and table_name = 'donation_key')            as llave_global,
  (select donation_key from public.cities where slug = 'quibdo')               as ciudad,
  (select donation_key from public.cases where display_name = 'Familia Rentería') as caso`);
check(
  "Volver a pegar 0010 y 0011 en orden deja fuera la llave global y los canales donde estaban",
  afterRerun.llave_global === 0 &&
    afterRerun.ciudad === "@quibdo-alcaldia" &&
    afterRerun.caso === "@soschoco",
  JSON.stringify(afterRerun),
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

// --- Despublicar un municipio esconde todo su contenido -----------------
await asUser("charlie@test.com");
await sql("update public.cities set published = false where slug = 'quibdo'");

await asAnon();
const afterUnpublish = await one(`select
  (select count(*) from public.cities)        as cities,
  (select count(*) from public.cases)         as cases,
  (select count(*) from public.needs)         as needs,
  (select count(*) from public.photos)        as photos,
  (select count(*) from public.foundations)   as foundations,
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

// Los canales se van con la cascada, y eso es lo que antes no pasaba: la llave
// global seguía publicada con el portal entero despublicado, porque no era de
// nadie. Ahora el destino del dinero es una columna de la fila de quien lo
// recibe, así que despublicar a esa gente se lleva también a dónde enviarles.
// Se comprueba aquí, donde desaparece todo lo demás, porque es la prueba de que
// el canal pertenece de verdad a alguien.
const channelsAfterUnpublish = await one(`select
  (select count(*)::int from public.cities
     where donation_key <> '' or donation_url <> '') as ciudades,
  (select count(*)::int from public.cases
     where donation_key <> '' or donation_url <> '') as casos`);
check(
  "Al despublicar el municipio, sus canales de donación desaparecen con él",
  channelsAfterUnpublish.ciudades === 0 && channelsAfterUnpublish.casos === 0,
  JSON.stringify(channelsAfterUnpublish),
);

// --- Informe -----------------------------------------------------------
await asPostgres();
const failed = results.filter((result) => !result.ok);
for (const result of results) {
  console.log(`${result.ok ? "PASA" : "FALLA"}  ${result.name}${result.extra ? `  [${result.extra}]` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length === 0 ? 0 : 1);
