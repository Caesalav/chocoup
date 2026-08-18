import { CopyKeyButton } from "@/components/donations/CopyKeyButton";
import { card } from "@/components/ui/styles";
import type { DonationKey } from "@/lib/types";

type Props = {
  donationKey: DonationKey;
  /**
   * La versión grande, para cuando la llave es lo principal de la pantalla
   * (/donaciones). En la columna lateral de un municipio o de un caso va la
   * normal, que es la misma pieza a menor cuerpo.
   */
  featured?: boolean;
};

/**
 * La llave de transferencia, escrita para copiarla.
 *
 * Es lo contrario de un botón de donar y por eso no se parece a uno. Un enlace se
 * pulsa y te lleva; una llave hay que llevársela a otra aplicación, así que lo que
 * tiene que hacer esta pieza es que se pueda leer de un vistazo, seleccionar de un
 * toque y teclear a mano si hace falta —con mala señal y en un móvil prestado, eso
 * último pasa—. De ahí las tres decisiones que la definen:
 *
 *   * La llave va escrita entera y en cuerpo grande, no truncada ni escondida
 *     detrás de un «Copiar». Sin JavaScript no hay portapapeles, y una llave que
 *     solo existe dentro de un botón sería una llave que no se puede usar.
 *   * `select-all` para que un solo toque seleccione la llave completa y no la
 *     palabra que haya debajo del dedo. Es lo que más ayuda de todo esto y no
 *     necesita nada encendido.
 *   * `break-all` porque el hueco es de 344 px en un móvil de 390 y una llave
 *     larga tiene que caber partida antes que desbordar la tarjeta. Se parte por
 *     donde toque y no por palabras: no hay palabras que respetar.
 *
 * Los pasos van numerados porque tienen orden, y el segundo —comprobar el nombre
 * antes de confirmar— es el único control que le queda a quien dona: `@soschoco`
 * no dice nada por sí mismo, y el nombre que le sale en la app antes de confirmar
 * sí. Mientras no haya nombre registrado el paso no se inventa uno: enseña a
 * mirarlo igual, porque la comprobación existe aunque aquí no podamos decir cuál
 * es la respuesta correcta.
 */
export function TransferKey({ donationKey, featured = false }: Props) {
  const { value, app, holder } = donationKey;

  return (
    <div className={`${card} p-5 ${featured ? "border-accent/35 shadow-lift" : ""}`}>
      <p className="text-[12px] text-accent-strong">
        Llave de transferencia
        {app && <span className="text-faint"> · {app}</span>}
      </p>

      {/* El hueco de la llave se hunde respecto a la tarjeta —`canvas` es una de
          las dos superficies por debajo del papel— para que se lea como un campo
          del que se saca algo y no como un titular. Es lo mismo que hace el canal
          de una barra de progreso.

          Y va en monoespaciada, que es la única letra del portal que no es de
          marca. No es un guiño técnico: `@soschoco` no tiene dígitos hoy, pero la
          llave va a cambiar y la siguiente puede llevar un 1 junto a una l o un 0
          junto a una O. Quien la teclee a mano —pasa, con un móvil prestado— no
          puede tener que adivinar. Es la misma razón por la que los números del
          portal van en `tabular-nums`. */}
      <p
        className={`mt-2.5 rounded-xl bg-canvas px-4 py-3.5 text-center font-mono leading-none text-ink select-all break-all ${
          featured ? "text-[28px] lg:text-[34px]" : "text-[23px]"
        }`}
      >
        {value}
      </p>

      <CopyKeyButton value={value} />

      <ol className="mt-4 space-y-2.5">
        {[
          `Copia la llave y pégala en ${app || "tu app de banco o billetera"}, en la opción de enviar dinero con llave.`,
          holder
            ? `Antes de confirmar, comprueba que la app dice ${holder}. Si dice otro nombre, no envíes nada.`
            : "Antes de confirmar, tu app te dice a nombre de quién va. Míralo: es lo único que confirma que la llave llega a donde tiene que llegar.",
        ].map((step, index) => (
          <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-body">
            <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] font-medium tabular-nums text-faint">
              {index + 1}
            </span>
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-faint">
        La transferencia se hace dentro de tu app. Este portal no cobra ni recibe nada: solo
        publica la llave.
      </p>
    </div>
  );
}
