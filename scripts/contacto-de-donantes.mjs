/**
 * Los datos de contacto de quien donó, para poder escribirle.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTO ES UN GUION Y NO UNA PANTALLA DEL PANEL
 *
 * El portal NO guarda el correo de quien dona. Llega en la respuesta de Mercado
 * Pago cuando el webhook pregunta por el pago, se usa para mandar el
 * agradecimiento y se suelta; lib/email.ts lo deja escrito y 0024 lo repite. No
 * hay lista de correos de donantes, y no la va a haber por ese camino.
 *
 * Así que esta información no se puede «consultar en el panel»: hay que ir a
 * pedirla a la pasarela cada vez. Y que cueste un guion es la parte buena. Una
 * pantalla del panel con los correos de todo el que donó es una lista de
 * distribución esperando a que alguien la use para algo que nadie autorizó:
 * quien dio su correo se lo dio a Mercado Pago para pagar, no al portal para
 * recibir cosas.
 *
 * Se usa para lo que se está usando hoy —dar tranquilidad a ocho personas cuyo
 * dinero no apareció en el registro por un fallo nuestro— y no se guarda el
 * resultado en ningún sitio.
 * ---------------------------------------------------------------------------
 *
 * Uso: node scripts/contacto-de-donantes.mjs [días]
 *
 * Lee MP_ACCESS_TOKEN y NEXT_PUBLIC_SUPABASE_* de .env.local.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DAYS = Number(process.argv[2]) || 20;

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const at = trimmed.indexOf("=");
      if (at > 0 && trimmed.slice(0, at).trim() === name) {
        return trimmed.slice(at + 1).trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    /* cae al aviso de abajo */
  }
  return "";
}

const token = env("MP_ACCESS_TOKEN");
const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

if (!token) {
  console.error("Falta MP_ACCESS_TOKEN en .env.local.");
  process.exit(1);
}

/** El nombre de cada causa, del registro público. Es lectura con RLS. */
async function caseNames() {
  if (!supabaseUrl || !supabaseKey) return new Map();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/donation_log?select=case_id,case_name,city_name`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
  );
  if (!response.ok) return new Map();
  const rows = await response.json();
  const map = new Map();
  for (const row of rows) {
    if (row.case_id) map.set(row.case_id, `${row.case_name} · ${row.city_name}`);
  }
  return map;
}

const params = new URLSearchParams({
  sort: "date_created",
  criteria: "desc",
  range: "date_created",
  begin_date: `NOW-${DAYS}DAYS`,
  end_date: "NOW",
  limit: "50",
});

const [search, names] = await Promise.all([
  fetch(`https://api.mercadopago.com/v1/payments/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => (r.ok ? r.json() : null)),
  caseNames(),
]);

if (!search) {
  console.error("Mercado Pago no contestó.");
  process.exit(1);
}

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const approved = (search.results ?? []).filter((p) => p.status === "approved");

console.log(`${approved.length} donaciones aprobadas en los últimos ${DAYS} días.`);
console.log("");

for (const payment of approved) {
  const ref = payment.external_reference ?? "";
  const caseId = ref.startsWith("caso:") ? ref.slice(5) : null;
  const destino = caseId ? (names.get(caseId) ?? `causa ${caseId}`) : "Fondo general";

  const payer = payment.payer ?? {};
  const nombreEnFormulario = payment.metadata?.donor_name || "";
  const autorizaPublicar = payment.metadata?.publish_name === true;
  const nombreTitular = [payer.first_name, payer.last_name].filter(Boolean).join(" ");
  const doc = payer.identification?.number
    ? `${payer.identification.type ?? ""} ${payer.identification.number}`.trim()
    : "";

  console.log(`${money.format(payment.transaction_amount)}  ·  ${destino}`);
  console.log(`  cuándo         ${payment.date_approved}`);
  console.log(`  correo         ${payer.email || "— el pago no trae correo —"}`);
  console.log(`  nombre dado    ${nombreEnFormulario || "— no escribió nombre —"}`);
  console.log(`  publicar       ${autorizaPublicar ? "sí, autorizó" : "no autorizó"}`);
  if (nombreTitular) console.log(`  titular pago   ${nombreTitular}`);
  if (doc) console.log(`  documento      ${doc}`);
  console.log(`  medio          ${payment.payment_method_id ?? "?"}`);
  console.log(`  pago nº        ${payment.id}`);
  console.log("");
}

console.log(`Total: ${money.format(approved.reduce((s, p) => s + p.transaction_amount, 0))}`);
