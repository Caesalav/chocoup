/**
 * Comprueba el esquema y las reglas de acceso contra un Postgres real (PGlite,
 * sin Docker), con stubs de lo único que aporta Supabase: los roles `anon` y
 * `authenticated`, `auth.jwt()` y el esquema `storage`.
 *
 *     npm run verify:sql
 *
 * Ejecútalo después de tocar la migración. Aquí se protege lo que de verdad
 * importa: que un caso sin consentimiento no se pueda publicar, que los
 * contactos de las ofertas no sean públicos y que despublicar un municipio
 * esconda todo su contenido.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
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
await sql(`
create role anon;
create role authenticated;

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

// --- La migración de verdad -------------------------------------------------
try {
  await sql(readFileSync(join(HERE, "migrations/0001_init.sql"), "utf8"));
  check("La migración 0001_init.sql se ejecuta sin errores", true);
} catch (error) {
  check("La migración 0001_init.sql se ejecuta sin errores", false, String(error.message));
  console.log(results);
  process.exit(1);
}

// Idempotencia: el equipo puede pegarla dos veces sin romper nada.
try {
  await sql(readFileSync(join(HERE, "migrations/0001_init.sql"), "utf8"));
  check("La migración se puede ejecutar dos veces", true);
} catch (error) {
  check("La migración se puede ejecutar dos veces", false, String(error.message));
}

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
check("Se crean las 16 políticas RLS", policyCount.n === 16, `n=${policyCount.n}`);

// --- Allowlist del equipo --------------------------------------------------
await asPostgres();
await sql(
  "delete from private.team_members; insert into private.team_members (email) values ('charlie@test.com');",
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

// --- Despublicar un municipio esconde todo su contenido -----------------
await asUser("charlie@test.com");
await sql("update public.cities set published = false where slug = 'quibdo'");

await asAnon();
const afterUnpublish = await one(`select
  (select count(*) from public.cities)      as cities,
  (select count(*) from public.cases)       as cases,
  (select count(*) from public.needs)       as needs,
  (select count(*) from public.photos)      as photos,
  (select count(*) from public.foundations) as foundations`);
check(
  "Al despublicar el municipio se esconde todo su contenido",
  Object.values(afterUnpublish).every((value) => Number(value) === 0),
  JSON.stringify(afterUnpublish),
);

// --- Informe -----------------------------------------------------------
await asPostgres();
const failed = results.filter((result) => !result.ok);
for (const result of results) {
  console.log(`${result.ok ? "PASA" : "FALLA"}  ${result.name}${result.extra ? `  [${result.extra}]` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length === 0 ? 0 : 1);
