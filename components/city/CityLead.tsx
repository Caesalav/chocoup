import { excerpt } from "@/lib/format";

/**
 * Lo que se lee bajo el nombre del municipio: el primer párrafo, recortado.
 *
 * El resumen en base de datos puede ser largo —dos o tres bloques, el censo, la
 * vía—. En el encabezado no cabe: empuja el carrete y la ficha fuera de la
 * primera pantalla.
 *
 * Aquí iba también la fundación madre con su botón de donar, que era lo que
 * convertía la presentación del pueblo en una pantalla de dinero. Se fue con
 * 0015: las fundaciones no son una entidad del portal y un municipio no tiene
 * canal. El dinero va a cada caso, y se pide en la ficha de esa persona, con su
 * historia delante.
 */
export function CityLead({
  summary,
  onPhoto,
}: {
  summary: string;
  onPhoto?: boolean;
}) {
  const lead = summary ? excerpt(summary.split(/\n\s*\n/)[0] ?? "", 180) : "";
  if (!lead) return null;

  return (
    <p
      className={`mt-5 max-w-[68ch] text-[15px] leading-relaxed ${
        onPhoto ? "text-paper" : "text-body"
      }`}
    >
      {lead}
    </p>
  );
}
