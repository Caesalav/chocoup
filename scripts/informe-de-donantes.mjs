/**
 * El informe de donantes en HTML, para imprimir o mandar en PDF.
 *
 * Es la versión presentable de scripts/contacto-de-donantes.mjs, y existe por el
 * mismo motivo que aquel: el portal NO guarda el correo de quien dona, así que
 * esta información no se puede sacar de una pantalla del panel. Hay que ir a
 * pedirla a la pasarela, y lo que sale de aquí es un documento suelto.
 *
 * ---------------------------------------------------------------------------
 * ESTE ARCHIVO PRODUCE UN DOCUMENTO CON DATOS PERSONALES
 *
 * Correos, cédulas y a qué familia dio dinero cada persona. Se escribe FUERA
 * del repositorio a propósito —en el Escritorio— para que no haya forma de
 * commitearlo por descuido, y no se guarda ninguna copia en ningún otro sitio.
 *
 * Quien reciba el PDF tiene delante la lista de quién donó a quién. Sirve para
 * escribirle a esas personas sobre su propia donación; no es una lista de
 * distribución, y nadie dio su correo para eso.
 * ---------------------------------------------------------------------------
 *
 * Uso: node scripts/informe-de-donantes.mjs [días]
 * Escribe ~/Desktop/donantes-chocoup.html
 */

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const DAYS = Number(process.argv[2]) || 20;
const OUT = join(homedir(), "Desktop", "donantes-chocoup.html");

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

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const day = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

const escape = (value) =>
  String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function fromSupabase(path) {
  if (!supabaseUrl || !supabaseKey) return [];
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  return response.ok ? response.json() : [];
}

const params = new URLSearchParams({
  sort: "date_created",
  criteria: "desc",
  range: "date_created",
  begin_date: `NOW-${DAYS}DAYS`,
  end_date: "NOW",
  limit: "50",
});

const [search, log] = await Promise.all([
  fetch(`https://api.mercadopago.com/v1/payments/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => (r.ok ? r.json() : null)),
  fromSupabase("donation_log?select=case_id,case_name,city_name"),
]);

if (!search) {
  console.error("Mercado Pago no contestó.");
  process.exit(1);
}

const names = new Map();
for (const row of log) {
  if (row.case_id) names.set(row.case_id, `${row.case_name} · ${row.city_name}`);
}

const approved = (search.results ?? []).filter((p) => p.status === "approved");

/** Una persona por correo: los mismos ocho pagos son de muchas menos personas. */
const people = new Map();
for (const payment of approved) {
  const payer = payment.payer ?? {};
  const email = (payer.email ?? "").toLowerCase() || "(sin correo en el pago)";
  const ref = payment.external_reference ?? "";
  const caseId = ref.startsWith("caso:") ? ref.slice(5) : null;

  const entry = people.get(email) ?? {
    email,
    document: "",
    donations: [],
    total: 0,
    namesGiven: new Set(),
    authorized: false,
  };

  if (!entry.document && payer.identification?.number) {
    entry.document = `${payer.identification.type ?? ""} ${payer.identification.number}`.trim();
  }
  const given = payment.metadata?.donor_name || "";
  if (given) entry.namesGiven.add(given);
  if (payment.metadata?.publish_name === true) entry.authorized = true;

  entry.donations.push({
    amount: payment.transaction_amount,
    target: caseId ? (names.get(caseId) ?? `Causa ${caseId}`) : "Fondo general",
    when: payment.date_approved,
    method: payment.payment_method_id ?? "",
    id: payment.id,
    given,
    publish: payment.metadata?.publish_name === true,
  });
  entry.total += payment.transaction_amount;
  people.set(email, entry);
}

const sorted = [...people.values()].sort((a, b) => b.total - a.total);
const total = approved.reduce((sum, p) => sum + p.transaction_amount, 0);

const rows = sorted
  .map((person, index) => {
    const donations = person.donations
      .sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""))
      .map(
        (d) => `
        <tr>
          <td class="num">${money.format(d.amount)}</td>
          <td>${escape(d.target)}</td>
          <td class="quiet">${d.when ? escape(day.format(new Date(d.when))) : "—"}</td>
          <td class="quiet">${escape(d.given || "—")}</td>
          <td class="quiet">${d.publish ? "Sí" : "No"}</td>
          <td class="quiet mono">${escape(d.id)}</td>
        </tr>`,
      )
      .join("");

    return `
    <section class="person">
      <h3><span class="rank">${index + 1}</span> ${escape(person.email)}</h3>
      <p class="lead">
        <strong>${money.format(person.total)}</strong> en
        ${person.donations.length === 1 ? "una donación" : `${person.donations.length} donaciones`}
        ${person.document ? ` · ${escape(person.document)}` : ""}
        ${person.namesGiven.size > 0 ? ` · nombre dado: ${escape([...person.namesGiven].join(", "))}` : " · no escribió nombre"}
      </p>
      <table>
        <thead>
          <tr><th>Importe</th><th>Destino</th><th>Cuándo</th><th>Nombre dado</th><th>¿Publicar?</th><th>Pago nº</th></tr>
        </thead>
        <tbody>${donations}</tbody>
      </table>
    </section>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Donaciones recibidas · ChocóUp</title>
<style>
  /* La paleta de MARCA.md: selva de autoridad, brote de acento, papel de fondo. */
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font: 400 11pt/1.5 -apple-system, "Helvetica Neue", Arial, sans-serif;
    color: #14211c; background: #fff;
  }
  header { border-bottom: 3px solid #0f352d; padding-bottom: 14px; margin-bottom: 22px; }
  .logo { font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; color: #4a6157; }
  h1 { margin: 6px 0 4px; font-size: 22pt; line-height: 1.15; color: #0f352d; letter-spacing: -.01em; }
  .sub { margin: 0; font-size: 10pt; color: #4a6157; }

  .totals { display: flex; gap: 10px; margin: 0 0 24px; }
  .card {
    flex: 1; border: 1px solid #d3ded7; border-radius: 10px;
    padding: 12px 14px; background: #f4f7f2;
  }
  .card .k { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: #4a6157; }
  .card .v { font-size: 17pt; font-weight: 600; color: #0f352d; margin-top: 3px; }

  .person { break-inside: avoid; margin-bottom: 20px; }
  .person h3 {
    margin: 0 0 3px; font-size: 12pt; color: #0f352d;
    display: flex; align-items: center; gap: 8px;
  }
  .rank {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%;
    background: #a5ed69; color: #0f352d; font-size: 9pt; font-weight: 700;
  }
  .lead { margin: 0 0 8px; font-size: 10pt; color: #3c534a; }

  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em;
    color: #4a6157; border-bottom: 1px solid #d3ded7; padding: 5px 6px 5px 0; font-weight: 600;
  }
  td { padding: 6px 6px 6px 0; border-bottom: 1px solid #eef2ec; font-size: 9.5pt; vertical-align: top; }
  .num { font-variant-numeric: tabular-nums; font-weight: 600; white-space: nowrap; }
  .quiet { color: #4a6157; }
  .mono { font-family: ui-monospace, Menlo, monospace; font-size: 8.5pt; }

  .note {
    break-inside: avoid;
    border-left: 3px solid #a5ed69; background: #f4f7f2;
    padding: 11px 14px; margin: 22px 0 0; font-size: 9.5pt; color: #24352e;
  }
  .note.warn { border-left-color: #b4472f; }
  .note h4 { margin: 0 0 5px; font-size: 10pt; color: #0f352d; }
  .note p { margin: 0 0 6px; }
  .note p:last-child { margin-bottom: 0; }
  footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #d3ded7; font-size: 8.5pt; color: #6b7f76; }
</style>
</head>
<body>
  <header>
    <p class="logo">ChocóUp · Coordinación</p>
    <h1>Donaciones recibidas</h1>
    <p class="sub">Últimos ${DAYS} días · según Mercado Pago · documento generado el ${escape(day.format(new Date()))}</p>
  </header>

  <div class="totals">
    <div class="card"><div class="k">Recibido</div><div class="v">${money.format(total)}</div></div>
    <div class="card"><div class="k">Pagos</div><div class="v">${approved.length}</div></div>
    <div class="card"><div class="k">Personas</div><div class="v">${sorted.length}</div></div>
  </div>

  ${rows}

  <div class="note">
    <h4>Qué se les puede decir</h4>
    <p>Su dinero nunca estuvo en riesgo: siempre estuvo en Mercado Pago, cobrado y acreditado. El fallo fue del portal, que no registraba el aviso de la pasarela.</p>
    <p>Ya está registrado y se ve en la ficha de cada familia, con su importe y su fecha. El nombre solo aparece de quien lo autorizó.</p>
  </div>

  <div class="note warn">
    <h4>Sobre estos datos</h4>
    <p>Estos correos se dieron a la pasarela <strong>para pagar</strong>. Escribirle a alguien sobre su propia donación es proporcionado; usarlos para avisos futuros necesita pedir permiso antes.</p>
    <p>El portal no guarda ninguna de estas direcciones: se leen de Mercado Pago cada vez que se saca este informe, y no queda copia en la base de datos.</p>
  </div>

  <footer>
    Generado con scripts/informe-de-donantes.mjs · Contiene datos personales: no subir al repositorio.
  </footer>
</body>
</html>`;

writeFileSync(OUT, html, "utf8");
console.log(`Escrito ${OUT}`);
console.log(`${approved.length} pagos · ${sorted.length} personas · ${money.format(total)}`);
