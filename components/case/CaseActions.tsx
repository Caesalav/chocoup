import Link from "next/link";
import { ShareLink } from "@/components/ShareLink";
import { ChatIcon, ShareIcon } from "@/components/ui/icons";

type Props = {
  offerHref: string;
  shareUrl: string;
  shareTitle: string;
  /** Enlace de WhatsApp de la fundación del municipio, o vacío si no lo hay. */
  whatsapp: string;
  whatsappLabel: string;
};

const circle =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-panel-high text-body transition-[border-color,color,scale] duration-150 hover:border-ink/40 hover:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * La barra de acciones del caso, anclada abajo.
 *
 * Ocupa el sitio de la barra de navegación en esta pantalla —dos barras fijas
 * apiladas se comen un tercio del móvil—, y por eso trae la acción principal a
 * pantalla completa en vez de esconderla al final del texto: quien llega aquí
 * desde un WhatsApp no baja hasta abajo.
 *
 * Donde la referencia pone el corazón de favoritos va compartir. Guardar en
 * favoritos a una familia que perdió su casa no significa nada; compartir sí,
 * porque es como se mueve este portal.
 *
 * Va clara y no oscura como la de navegación a propósito: son cosas distintas,
 * y aquí el único color fuerte tiene que ser el del botón que importa.
 *
 * En escritorio se despega del borde y se sienta arriba de la columna lateral,
 * al lado del nombre de la familia. Deja de tener sentido anclarla: la pantalla
 * ya no es una pila que hay que recorrer con el pulgar, y flotando encima del
 * texto solo taparía renglones. Las tres acciones y su orden no cambian.
 */
export function CaseActions({
  offerHref,
  shareUrl,
  shareTitle,
  whatsapp,
  whatsappLabel,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:p-0">
      <div className="flex w-full max-w-[420px] items-center gap-2 rounded-full border border-line bg-panel-high p-1.5 shadow-float lg:max-w-none lg:shadow-card">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={whatsappLabel}
            className={circle}
          >
            <ChatIcon className="size-5" />
          </a>
        )}

        <ShareLink url={shareUrl} title={shareTitle} className={circle}>
          <ShareIcon className="size-5" />
          <span className="sr-only">Compartir este caso</span>
        </ShareLink>

        <Link
          href={offerHref}
          className="flex min-w-0 flex-1 items-center justify-center rounded-full bg-accent px-4 py-3.5 text-[15px] font-medium text-paper transition-[background-color,scale] duration-150 hover:bg-accent-strong active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Ofrecer un recurso
        </Link>
      </div>
    </div>
  );
}
