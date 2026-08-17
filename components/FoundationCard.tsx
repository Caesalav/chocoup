import { externalUrl, telLink, whatsappLink } from "@/lib/format";
import type { Foundation } from "@/lib/types";
import { button, panel } from "./ui/styles";

type Props = {
  foundation: Foundation;
  cityName: string;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line py-2.5 text-sm">
      <dt className="w-24 shrink-0 text-[11px] uppercase tracking-[0.12em] text-faint">{label}</dt>
      <dd className="min-w-0 break-words text-body">{children}</dd>
    </div>
  );
}

export function FoundationCard({ foundation, cityName }: Props) {
  const donate = externalUrl(foundation.donation_url);
  const whatsapp = whatsappLink(
    foundation.whatsapp,
    `Hola, escribo por la situación en ${cityName}. Quiero ayudar.`,
  );

  return (
    <div className={`${panel} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-amber">
        {foundation.is_primary ? "Fundación madre" : "Organización aliada"}
      </p>
      <h3 className="mt-2 font-display text-2xl leading-tight text-ink">{foundation.name}</h3>

      {foundation.description && (
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          {foundation.description}
        </p>
      )}

      <dl className="mt-5">
        {foundation.contact_name && <Row label="Contacto">{foundation.contact_name}</Row>}
        {foundation.phone && (
          <Row label="Teléfono">
            <a href={telLink(foundation.phone)} className="text-amber hover:underline">
              {foundation.phone}
            </a>
          </Row>
        )}
        {foundation.email && (
          <Row label="Correo">
            <a href={`mailto:${foundation.email}`} className="text-amber hover:underline">
              {foundation.email}
            </a>
          </Row>
        )}
        {foundation.address && <Row label="Dirección">{foundation.address}</Row>}
        {foundation.website && (
          <Row label="Web">
            <a
              href={foundation.website}
              target="_blank"
              rel="noreferrer noopener"
              className="text-amber hover:underline"
            >
              {foundation.website}
            </a>
          </Row>
        )}
      </dl>

      {(donate || whatsapp) && (
        <div className="mt-5 flex flex-col gap-2.5">
          {donate && (
            <a
              href={donate}
              target="_blank"
              rel="noreferrer noopener"
              className={`${button.primary} w-full`}
            >
              Donar dinero
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className={`${donate ? button.secondary : button.primary} w-full`}
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
