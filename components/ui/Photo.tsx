import { Logo } from "@/components/Logo";
import { photoUrl } from "@/lib/format";
import { frameVars, type PhotoFrame } from "@/lib/photo-frame";

type Props = {
  /** Ruta en Storage, o null si todavía no hay foto. */
  path: string | null;
  alt: string;
  /** Proporción, redondeo y posición los pone quien lo usa. Van en el marco. */
  className?: string;
  /** La foto de apertura de una pantalla no espera; las de más abajo sí. */
  eager?: boolean;
  /** Qué se lee en el hueco cuando no hay imagen. */
  emptyLabel?: string;
  /** Encuadre guardado. Nulo: el recorte por omisión de `.photo-crop`. */
  frame?: PhotoFrame | null;
};

/**
 * La foto de un LUGAR —la apertura de un municipio, su tarjeta en el carrusel, su
 * fila en la lista, el carrete de la ficha— y son dos cosas: el encuadre y el
 * hueco. La foto de una persona no pasa por aquí: eso es `CasePortrait`, que
 * recorta al revés y resuelve la ausencia con iniciales y no con la marca.
 *
 * El encuadre por omisión lo resuelve `.photo-crop` (globals.css), que recorta
 * desde algo por debajo del centro. En campo el motivo cae abajo y el sello
 * «muestra» de las imágenes de archivo va incrustado en el borde inferior;
 * recortar por el centro se come los dos. Si el equipo guardó un encuadre, esas
 * variables pisan el 62 %.
 *
 * El hueco importa tanto como la foto porque va a aparecer a menudo: se
 * documenta un municipio el lunes y las fotos llegan el jueves, y hay casos que
 * no quieren imagen. Es una superficie hundida con la marca en contorno, no un
 * aviso de que falta algo: la ausencia de foto no es un error de la página.
 */
export function Photo({
  path,
  alt,
  className = "",
  eager = false,
  emptyLabel,
  frame = null,
}: Props) {
  if (!path) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-land px-4 ${className}`}
      >
        <Logo className="h-5 w-auto text-contour" />
        {emptyLabel && (
          <p className="text-center text-[11px] leading-snug text-muted">{emptyLabel}</p>
        )}
      </div>
    );
  }

  return (
    <FramedPhoto
      src={photoUrl(path)}
      alt={alt}
      frame={frame}
      eager={eager}
      className={className}
    />
  );
}

/**
 * El marco que recorta. Lo usan `Photo`, el retrato y las miniaturas del
 * carrusel: la clase de encuadre vive en la imagen y el overflow en el marco,
 * porque un `scale` en la propia etiqueta no se recorta a sí mismo.
 */
export function FramedPhoto({
  src,
  alt,
  frame = null,
  kind = "situation",
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  frame?: PhotoFrame | null;
  kind?: "situation" | "portrait";
  className?: string;
  eager?: boolean;
}) {
  return (
    <div className={`overflow-hidden bg-land ${className}`} style={frameVars(frame)}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`${kind === "portrait" ? "photo-portrait" : "photo-crop"} size-full rounded-[inherit]`}
      />
    </div>
  );
}
