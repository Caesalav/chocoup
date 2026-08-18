import { personInitials } from "@/components/case/PersonBadge";
import { FramedPhoto } from "@/components/ui/Photo";
import { photoUrl } from "@/lib/format";
import type { PhotoFrame } from "@/lib/photo-frame";

/**
 * El retrato de una persona documentada: la foto que el equipo eligió para
 * representarla, y sus iniciales cuando no hay ninguna.
 *
 * Vive aparte porque lo usan las tarjetas de un caso —la grande de la ficha de
 * su municipio, la fila de /casos y /buscar, y el perfil de la persona en su
 * ficha— y todas tienen que resolver la ausencia igual. La fila enseñaba la
 * primera foto del caso, que es el convenio que `portrait_photo_id` existe para
 * romper: la primera foto que se hace al entrar en una casa es la casa, así que
 * la lista acababa poniendo un recorte de escombros donde va una cara.
 *
 * Cuando no hay retrato —y no va a haber en la mayoría de los casos: las fotos
 * llegan de un móvil con mala luz y hay familias que no quieren aparecer— van sus
 * iniciales sobre la misma superficie hundida que usa cualquier hueco de imagen del
 * portal. No es un aviso de que falte algo ni una silueta genérica repetida quince
 * veces: es una respuesta, y la tarjeta se sostiene igual. Ojo, tampoco es el hueco
 * de `Photo`, que lleva la marca en contorno y un «Sin foto»: eso está bien para el
 * paisaje de un pueblo que todavía no se ha fotografiado y aquí diría que a esta
 * familia le falta algo.
 *
 * El recorte por omisión lo hace `.photo-portrait`: la cara va en el tercio alto.
 * El `.photo-crop` de los paisajes recorta desde abajo y aquí se comería la frente.
 * Si el equipo encuadró esta foto, ese recorte pisa el 22 %.
 *
 * `path` llega ya resuelto a una ruta por la capa de datos (`portraitOf` en
 * lib/data.ts), que la busca entre las fotos de este caso: un puntero viejo o una
 * foto que las RLS esconden se leen aquí como «sin retrato» y nunca como la cara de
 * otra familia. La forma y el tamaño los pone quien lo usa, incluido el cuerpo de
 * las iniciales, que tiene que ir a la medida del hueco.
 */
export function CasePortrait({
  name,
  path,
  frame = null,
  className = "",
  eager = false,
}: {
  name: string;
  path: string | null;
  frame?: PhotoFrame | null;
  className?: string;
  /** En la ficha de la persona va arriba del todo: no espera. */
  eager?: boolean;
}) {
  if (!path) {
    return (
      <div
        aria-hidden
        className={`flex shrink-0 items-center justify-center bg-land font-display leading-none text-ink ${className}`}
      >
        {personInitials(name)}
      </div>
    );
  }

  return (
    // Sin texto alternativo: el nombre está pegado al lado y describir la
    // fotografía de una persona identificable a partir de nada sería inventar.
    <FramedPhoto
      src={photoUrl(path)}
      alt=""
      kind="portrait"
      frame={frame}
      eager={eager}
      className={`shrink-0 ${className}`}
    />
  );
}
