/**
 * Qué pagos tiene Mercado Pago, y cuáles de ellos no están en el portal.
 *
 * Es la herramienta de diagnóstico del 23 de agosto: entraron donaciones, el
 * cobro salió en la pasarela y `public.donations` se quedó vacía. Sin poder
 * mirar la lista de la pasarela no hay forma de saber cuánto dinero falta por
 * registrar ni a qué causa iba.
 *
 * Uso: node scripts/pagos-de-mercadopago.mjs [días]
 *
 * Lee MP_ACCESS_TOKEN de .env.local. No escribe nada en ningún sitio: solo
 * pregunta y escribe en pantalla. Lo que importa el dinero es la conciliación
 * del panel, que corre en el servidor.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DAYS = Number(process.argv[2]) || 15;

function envFromFile(name) {
  if (process.env[name]) return process.env[name];
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const at = trimmed.indexOf("=");
      if (at < 0) continue;
      if (trimmed.slice(0, at).trim() === name) {
        return trimmed.slice(at + 1).trim().replace(/^"|"$/g, "");
      }
    }
  } catch {
    // Sin .env.local se cae al mensaje de abajo, que dice qué falta.
  }
  return "";
}

const token = envFromFile("MP_ACCESS_TOKEN");
if (!token) {
  console.error("Falta MP_ACCESS_TOKEN en .env.local.");
  process.exit(1);
}

const params = new URLSearchParams({
  sort: "date_created",
  criteria: "desc",
  range: "date_created",
  begin_date: `NOW-${DAYS}DAYS`,
  end_date: "NOW",
  limit: "50",
});

const response = await fetch(
  `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
  { headers: { Authorization: `Bearer ${token}` } },
);

if (!response.ok) {
  console.error(`Mercado Pago contestó ${response.status}`);
  console.error((await response.text()).slice(0, 600));
  process.exit(1);
}

const body = await response.json();
const results = body.results ?? [];

console.log(`Pagos en los últimos ${DAYS} días: ${results.length} (de ${body.paging?.total ?? "?"})`);
console.log("");

if (results.length === 0) {
  console.log("Mercado Pago no tiene ningún pago en esta ventana.");
  console.log("Si el dinero se cobró, no fue por esta cuenta ni por esta aplicación.");
  process.exit(0);
}

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

for (const payment of results) {
  console.log(`  id            ${payment.id}`);
  console.log(`  creado        ${payment.date_created}`);
  console.log(`  aprobado      ${payment.date_approved ?? "—"}`);
  console.log(`  estado        ${payment.status} (${payment.status_detail ?? "—"})`);
  console.log(`  importe       ${money.format(payment.transaction_amount ?? 0)}`);
  console.log(`  medio         ${payment.payment_type_id ?? "—"} / ${payment.payment_method_id ?? "—"}`);
  console.log(`  referencia    ${payment.external_reference ?? "— SIN REFERENCIA —"}`);
  console.log(`  en vivo       ${payment.live_mode}`);
  console.log(`  metadata      ${JSON.stringify(payment.metadata ?? {})}`);
  console.log(`  aviso a       ${payment.notification_url ?? "— SIN notification_url —"}`);
  console.log("");
}

const approved = results.filter((row) => row.status === "approved");
const total = approved.reduce((sum, row) => sum + (row.transaction_amount ?? 0), 0);
console.log(`Aprobados: ${approved.length}. Suma: ${money.format(total)}`);
