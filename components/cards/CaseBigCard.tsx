import Link from "next/link";
import { CasePortrait } from "@/components/case/CasePortrait";
import { DonationMeter } from "@/components/cards/DonationMeter";
import { CategoryChip } from "@/components/ui/Chip";
import { card, lifts } from "@/components/ui/styles";
import { caseLead, thumbUrl } from "@/lib/format";
import { savedFrame } from "@/lib/photo-frame";
import type { CaseWithPhotos } from "@/lib/types";
import { FramedPhoto } from "@/components/ui/Photo";

/**
 * La tarjeta de una persona o una familia en la ficha de su municipio.
 *
 * Lleva dentro todo lo que es suyo: su retrato, su nombre, qué le está pasando y
 * sus fotos. Las fotos de los casos estaban antes en una tira aparte, todas
 * juntas y sin dueño, y eso no era una decisión de maquetación: una foto de un
 * caso es de esa persona, con su consentimiento detrás, y sacarla de su ficha la
 * convertía en material de archivo sobre un pueblo.
 *
 * ---------------------------------------------------------------------------
 * Un carrusel dentro de un enlace es un conflicto, y aquí no lo hay
 *
 * Si el carrusel viviera dentro del <a>, arrastrar para ver la siguiente foto
 * acabaría abriendo la ficha —y encima el navegador intentaría arrastrar el
 * enlace—, así que mirar sería navegar sin querer. Y al revés: un lector de
 * pantalla leería todas sus fotos como parte del nombre del enlace.
 *
 * De modo que son hermanos y no uno dentro del otro:
 *
 *   * El enlace es el nombre, y su ::after se estira sobre la tarjeta entera.
 *     Pulsar en cualquier parte de la tarjeta abre la ficha, que es lo que la
 *     tarjeta promete, sin que el nombre deje de ser un enlace de verdad para
 *     quien navega con teclado o con lector.
 *   * El carrusel va POR ENCIMA de ese ::after (z-10). Arrastrarlo, girar la
 *     rueda o tocarlo solo mueve las fotos, y ni siquiera levanta la tarjeta:
 *     la ausencia de respuesta es la que dice que esa zona no lleva a ninguna
 *     parte. Es una lista con `tabindex`, así que con teclado se entra en ella y
 *     se pasa con las flechas.
 *   * Las fotos no son enlaces ni botones. Se miran y ya; ampliarlas es lo que
 *     hay en su ficha, a un toque de aquí.
 *
 * El desplazamiento con ajuste es de CSS, así que el carrusel funciona igual con
 * el JavaScript caído. No hay estado, no hay flechas que dependan de un
 * componente cliente y no hay librería.
 */

/**
 * El levantamiento de la tarjeta, que en `cardLink` va en la misma clase que el
 * enlace. Aquí el enlace es una parte de la tarjeta y no la tarjeta, así que la
 * señal se cuelga de `has-*`: responde cuando el puntero está sobre lo que navega
 * —incluido el ::after estirado, que es casi toda la tarjeta— y se queda quieta
 * sobre el carrusel. Esa quietud es información: dice que ahí no se va a ninguna
 * parte.
 *
 * La transición viene de `lifts`, la misma que usa `cardLink`. Lo único propio de
 * aquí son los disparadores.
 */
const hasLift =
  `${lifts} ` +
  "has-[a:hover]:-translate-y-1 has-[a:hover]:border-line-strong has-[a:hover]:shadow-lift " +
  "has-[a:focus-visible]:border-line-strong has-[a:focus-visible]:shadow-lift " +
  "has-[a:active]:translate-y-0 has-[a:active]:scale-[0.97] has-[a:active]:border-ink/25 has-[a:active]:shadow-press";

export function CaseBigCard({
  caseRecord,
  citySlug,
}: {
  caseRecord: CaseWithPhotos;
  citySlug: string;
}) {
  // El hogar dice quiénes son y la historia qué les está pasando: dos cosas
  // distintas, y la segunda es a lo que se viene. Va debajo del nombre, a tres
  // renglones, y el hogar queda de subtítulo.
  //
  // La frase la elige `caseLead()` y no un recorte a pelo: si el equipo escribió el
  // resumen de esta causa, va ese. El recorte automático corta donde cae —a mitad de
  // frase, a veces a mitad de palabra— y aquí hay ocho tarjetas seguidas cortadas
  // igual, así que la ficha del municipio es donde más se nota. Los 150 se quedan:
  // es el hueco de tres renglones a 12 px, y `caseLead` recorta también el resumen
  // escrito a mano por si un día la columna se estrecha.
  const story = caseLead(caseRecord, 150);
  const gallery = caseRecord.photos.filter((photo) => photo.id !== caseRecord.portrait_photo_id);

  return (
    <article className={`${card} ${hasLift} relative flex h-full flex-col p-3.5`}>
      <div className="flex items-start gap-3.5">
        <CasePortrait
          name={caseRecord.display_name}
          caseKind={caseRecord.case_kind}
          path={caseRecord.portraitPath}
          frame={caseRecord.portraitFrame}
          className="size-20 rounded-full text-[26px]"
        />

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-[17px] leading-tight text-ink">
            <Link
              href={`/ciudades/${citySlug}/casos/${caseRecord.id}`}
              className="rounded-sm after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {caseRecord.display_name}
            </Link>
          </h3>

          {caseRecord.household && (
            <p className="mt-1 text-[12px] leading-snug text-faint">{caseRecord.household}</p>
          )}

          <DonationMeter budget={caseRecord.budget} />
        </div>
      </div>

      {story && (
        <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-body">{story}</p>
      )}

      {caseRecord.categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {caseRecord.categories.slice(0, 3).map((category) => (
            <li key={category}>
              <CategoryChip category={category} />
            </li>
          ))}
        </ul>
      )}

      {/* Anclado abajo, y no pegado a lo de arriba: en una fila de dos, una
          persona con una foto y otra con seis dejarían la fila en escalera. El
          hueco cae entre el texto y las fotos, que es donde no se nota. */}
      {gallery.length === 0 ? (
        caseRecord.portraitPath ? (
          <div className="mt-auto" />
        ) : (
          <p className="mt-auto pt-4 text-[11px] leading-snug text-faint">
            Sin fotografías publicadas.
          </p>
        )
      ) : (
        <div className="relative z-10 mt-auto pt-4">
          {/* El carril se queda dentro del relleno de la tarjeta en vez de salir
              al filo: la esquina va muy redondeada y una foto pegada al borde se
              saldría de la curva. La foto cortada por la derecha —que es lo que
              dice que hay más— la corta igual el recorte del propio carril. */}
          <ul
            tabIndex={0}
            aria-label={`Fotos de ${caseRecord.display_name}`}
            className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {/* Todas perezosas, sin excepción para las primeras. Una ficha de
                municipio con ocho personas son ocho retratos y treinta fotos de
                carril, y ninguna está en pantalla al abrir —el encabezado
                fotográfico ocupa casi el alto entero—: pedirlas de entrada sería
                gastar la señal del Chocó en lo que nadie está mirando. */}
            {gallery.map((photo) => (
              <li key={photo.id} className="w-[5.5rem] shrink-0 snap-start">
                <FramedPhoto
                  src={thumbUrl(photo)}
                  alt={photo.caption || `Situación de ${caseRecord.display_name}`}
                  frame={savedFrame(photo)}
                  className="aspect-square w-full rounded-lg border border-line"
                />
              </li>
            ))}
          </ul>

          {/* «Se pasan deslizando» y no «desliza para verlas»: describe el
              mecanismo en vez de dar una orden, que en una tarjeta ancha donde
              las tres fotos ya caben sería una orden falsa. */}
          {gallery.length > 1 && (
            <p className="mt-2 text-[11px] leading-snug text-faint">
              {gallery.length} fotos suyas · se pasan deslizando
            </p>
          )}
        </div>
      )}
    </article>
  );
}
