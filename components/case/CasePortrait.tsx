import { personInitials } from "@/components/case/PersonBadge";
import { FramedPhoto } from "@/components/ui/Photo";
import { CASE_KINDS } from "@/lib/constants";
import { photoUrl } from "@/lib/format";
import type { PhotoFrame } from "@/lib/photo-frame";
import type { CaseKind } from "@/lib/types";

/**
 * El retrato de una causa documentada: la foto que el equipo eligió para
 * representarla y, cuando no hay ninguna, lo que se pueda decir de ella con letra.
 *
 * Vive aparte porque lo usan las tarjetas de un caso —la grande de la ficha de
 * su municipio, la fila de /casos y /buscar, y el perfil de la persona en su
 * ficha— y todas tienen que resolver la ausencia igual. La fila enseñaba la
 * primera foto del caso, que es el convenio que `portrait_photo_id` existe para
 * romper: la primera foto que se hace al entrar en una casa es la casa, así que
 * la lista acababa poniendo un recorte de escombros donde va una cara.
 *
 * Cuando no hay retrato —y no va a haber en la mayoría de los casos: las fotos
 * llegan de un móvil con mala luz y hay familias que no quieren aparecer— el hueco
 * escribe algo sobre la misma superficie hundida que usa cualquier hueco de imagen
 * del portal. No es un aviso de que falte algo ni una silueta genérica repetida
 * quince veces: es una respuesta, y la tarjeta se sostiene igual. Ojo, tampoco es el
 * hueco de `Photo`, que lleva la marca en contorno y un «Sin foto»: eso está bien
 * para el paisaje de un pueblo que todavía no se ha fotografiado y aquí diría que a
 * esta familia le falta algo.
 *
 * ---------------------------------------------------------------------------
 * QUÉ SE ESCRIBE, Y POR QUÉ DEPENDE DE QUÉ ES LA CAUSA
 *
 * Las iniciales del nombre son la respuesta para UNA PERSONA: «DC» donde va la cara
 * de Daniela Córdoba se lee como una persona sin foto, que es exactamente lo que
 * pasa. Para lo demás son un error de bulto, y de los silenciosos —no rompe nada,
 * solo miente—: «IE» en un círculo donde tenía que haber una escuela se lee como un
 * dato mal guardado, y un animal no tiene iniciales de nada.
 *
 * Así que del tipo de causa sale la palabra («Colegio», «Animal», «Fundación») y esa
 * palabra está en `CASE_KINDS[].empty` (lib/constants.ts) y no aquí: es la decisión
 * de fondo de 0016 y la comparte el desplegable del panel. `empty` es nulo justo en
 * 'persona', que es la única que se contesta con iniciales.
 *
 * `caseKind` es OBLIGATORIO y no tiene valor por omisión, aunque la base de datos sí
 * lo tenga. Un `"persona"` por omisión dejaría que una tarjeta nueva se olvidara
 * de pasarlo y volviera a poner dos letras inventadas en el círculo de un colegio, y
 * ese fallo no se ve en una captura: hay que saber qué causa se estaba mirando. Con
 * la prop obligatoria, olvidarse no compila.
 *
 * ---------------------------------------------------------------------------
 * EL CUERPO DE LETRA DE LA PALABRA LO PONE ESTE COMPONENTE, EN `em`
 *
 * El tamaño del hueco y el de las iniciales los pone quien lo usa con `className`
 * —28 px en la ficha, 34 en escritorio, 26 en la tarjeta grande— porque es quien
 * sabe de qué medida es el círculo. A ese cuerpo caben dos letras y no cabe
 * «Fundación»: en un círculo de 5,75 rem, la palabra se saldría por los dos lados.
 *
 * Y no se arregla pidiendo a los tres sitios que manden además un segundo tamaño:
 * eso es cuatro números que hay que mantener a la vez y el cuarto se queda atrás.
 * Se arregla midiendo en `em`, o sea en proporción de lo que ya mandaron: 0,4 del
 * cuerpo de las iniciales. Cada hueco escala solo, incluido el que se dibuje mañana,
 * y quien lo use sigue teniendo un único número que decidir.
 */
export function CasePortrait({
  name,
  caseKind,
  path,
  frame = null,
  className = "",
  eager = false,
}: {
  name: string;
  /**
   * Una persona, un colegio, un animal o una fundación. Decide qué se escribe
   * cuando no hay foto, y por eso no tiene valor por omisión.
   *
   * Se llama así y no `kind` porque ahí abajo hay otro `kind`, el de `FramedPhoto`,
   * que dice por dónde recortar la imagen. Son dos preguntas distintas en doce
   * líneas de distancia y con el mismo nombre se confunden al leerlas.
   */
  caseKind: CaseKind;
  path: string | null;
  frame?: PhotoFrame | null;
  className?: string;
  /** En la ficha de la persona va arriba del todo: no espera. */
  eager?: boolean;
}) {
  if (!path) {
    const word = CASE_KINDS.find((option) => option.value === caseKind)?.empty ?? null;

    return (
      <div
        aria-hidden
        className={`flex shrink-0 items-center justify-center bg-land font-display leading-none text-ink ${className}`}
      >
        {word ? (
          <span className="px-1 text-center text-[0.4em] leading-tight">{word}</span>
        ) : (
          personInitials(name)
        )}
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
