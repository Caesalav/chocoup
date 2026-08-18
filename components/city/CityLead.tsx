import { DonationIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";
import { excerpt, externalUrl } from "@/lib/format";
import type { Foundation } from "@/lib/types";

/**
 * Lo que se lee bajo el nombre del municipio: un párrafo, y la fundación madre
 * con su botón de donar.
 *
 * El resumen en base de datos puede ser largo —dos o tres bloques, el censo, la
 * vía—. En el encabezado no cabe: empuja el carrete y la ficha fuera de la
 * primera pantalla. Aquí siempre es el primer párrafo, recortado. La fundación
 * iba más abajo, en una tarjeta que había que buscar; el nombre y donar salen
 * juntos, aquí, que es donde se presenta el pueblo.
 */
export function CityLead({
  summary,
  cityName,
  foundation,
  onPhoto,
}: {
  summary: string;
  cityName: string;
  foundation: Foundation | null;
  onPhoto?: boolean;
}) {
  const lead = summary ? excerpt(summary.split(/\n\s*\n/)[0] ?? "", 180) : "";
  const donate = foundation ? externalUrl(foundation.donation_url) : "";

  if (!lead && !foundation) return null;

  return (
    <div className="mt-5 max-w-[68ch]">
      {lead && (
        <p
          className={`text-[15px] leading-relaxed ${onPhoto ? "text-paper" : "text-body"}`}
        >
          {lead}
        </p>
      )}

      {foundation && (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${lead ? "mt-4" : ""}`}>
          <p
            className={`min-w-0 font-display text-[16px] leading-snug ${
              onPhoto ? "text-paper" : "text-ink"
            }`}
          >
            Fundación Madre {cityName}
          </p>
          {donate && (
            <a
              href={donate}
              target="_blank"
              rel="noreferrer noopener"
              className={`${button.primary} min-h-11 shrink-0 gap-1.5 px-4 py-2`}
            >
              <DonationIcon className="size-4" />
              Donar
            </a>
          )}
        </div>
      )}
    </div>
  );
}
