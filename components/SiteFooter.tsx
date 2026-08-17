import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8">
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          {SITE_NAME} documenta la situación en municipios del Chocó tras el terremoto. Las fotos y
          los casos se publican con el consentimiento de las personas afectadas. Las donaciones se
          coordinan directamente con la fundación de cada municipio.
        </p>
        <p className="mt-4 max-w-prose text-xs leading-relaxed text-faint">
          Si encuentras un dato incorrecto o quieres que retiremos una publicación, escríbenos por el
          canal de la fundación de la ciudad correspondiente.
        </p>
      </div>
    </footer>
  );
}
