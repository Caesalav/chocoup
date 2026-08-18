import { CopyKeyButton } from "@/components/donations/CopyKeyButton";
import { ChatIcon, DonationIcon, PhoneIcon } from "@/components/ui/icons";
import { button, card } from "@/components/ui/styles";
import type { DonationChannel } from "@/lib/donation-channel";
import { formatPhone, telLink, whatsappLink } from "@/lib/format";

type Props = {
  channel: DonationChannel;
  /**
   * La versión grande, para cuando el canal es lo principal de la pantalla. En la
   * columna lateral de un municipio o de un caso va la normal, que es la misma
   * pieza a menor cuerpo.
   */
  featured?: boolean;
};

/**
 * El canal de donación de un municipio o de una familia, en sus tres formatos.
 *
 * Los tres viven en la misma pieza a propósito. Son gestos distintos —una
 * llave se copia y se lleva a otra aplicación, un enlace se pulsa, un
 * teléfono se llama o se escribe— pero ocupan el mismo sitio en la pantalla y
 * contestan la misma pregunta, así que partirlos en tres componentes habría
 * dejado que uno se quedara atrás: el borde, el aire y la línea de que el
 * portal no cobra nada tienen que ser los mismos se reciba por donde se reciba.
 *
 * Quién es el dueño del canal no se escribe aquí: lo dice la frase que cada
 * pantalla pone encima, donde cabe en una oración —«el canal de Quibdó», «el
 * canal que el equipo registró para Daniela»— en vez de en un rótulo que tendría
 * que aguantar un nombre de caso entero.
 *
 * De la llave, tres decisiones que la definen y que no son de estilo:
 *
 *   * Va escrita entera y en cuerpo grande, no truncada ni escondida detrás de un
 *     «Copiar». Sin JavaScript no hay portapapeles, y una llave que solo existe
 *     dentro de un botón sería una llave que no se puede usar.
 *   * `select-all` para que un solo toque seleccione la llave completa y no la
 *     palabra que haya debajo del dedo. Es lo que más ayuda de todo esto y no
 *     necesita nada encendido.
 *   * `break-all` porque el hueco es de 344 px en un móvil de 390 y una llave
 *     larga tiene que caber partida antes que desbordar la tarjeta. Se parte por
 *     donde toque y no por palabras: no hay palabras que respetar.
 *
 * Los pasos van numerados porque tienen orden, y el segundo —comprobar el nombre
 * antes de confirmar— es el único control que le queda a quien dona: una llave no
 * dice nada por sí misma, y el nombre que le sale en la app antes de confirmar
 * sí. Mientras no haya titular registrado el paso no se inventa uno: enseña a
 * mirarlo igual, porque la comprobación existe aunque aquí no podamos decir cuál
 * es la respuesta correcta.
 */
export function DonationChannelCard({ channel, featured = false }: Props) {
  if (channel.kind === "enlace") {
    return (
      <div className={`${card} p-5 ${featured ? "border-accent/35 shadow-lift" : ""}`}>
        <p className="text-[12px] text-accent-strong">Enlace de recaudación</p>

        <a
          href={channel.url}
          target="_blank"
          rel="noreferrer noopener"
          className={`${button.primary} mt-3 w-full ${featured ? "min-h-14 text-[16px]" : ""}`}
        >
          <DonationIcon className="size-5" />
          Donar dinero
        </a>

        {/* El destino escrito debajo del botón, y no solo dentro del `href`. Un
            botón no dice a dónde lleva hasta que se pulsa, y aquí lo que hay al
            otro lado es dinero: quien dona tiene derecho a leer el dominio antes
            de salir del portal. Es la misma información que la llave enseña de
            frente, y por eso también va monoespaciada y partible. */}
        <p className="mt-3 break-all font-mono text-[12px] leading-relaxed text-faint">
          {channel.url}
        </p>

        <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-faint">
          El enlace abre la página de quien recauda. Este portal no cobra ni recibe nada.
        </p>
      </div>
    );
  }

  if (channel.kind === "telefono") {
    const display = formatPhone(channel.value);
    const call = telLink(channel.value);
    const chat = whatsappLink(channel.value);

    return (
      <div className={`${card} p-5 ${featured ? "border-accent/35 shadow-lift" : ""}`}>
        <p className="text-[12px] text-accent-strong">Número de contacto</p>

        <p
          className={`mt-2.5 rounded-xl bg-canvas px-4 py-3.5 text-center font-mono leading-none text-ink select-all ${
            featured ? "text-[28px] lg:text-[34px]" : "text-[23px]"
          }`}
        >
          {display}
        </p>

        <CopyKeyButton value={channel.value} noun="número" />

        <p className="mt-4 text-[14px] leading-relaxed text-body">
          Por este número se pueden gestionar todo tipo de donaciones de forma directa.
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          {call && (
            <a href={call} className={`${button.primary} w-full ${featured ? "min-h-14 text-[16px]" : ""}`}>
              <PhoneIcon className="size-5" />
              Llamar
            </a>
          )}
          {chat && (
            <a
              href={chat}
              target="_blank"
              rel="noreferrer noopener"
              className={`${button.secondary} w-full`}
            >
              <ChatIcon className="size-5" />
              Escribir por WhatsApp
            </a>
          )}
        </div>

        <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-faint">
          La donación se coordina con quien atiende este número. Este portal no cobra ni
          recibe nada.
        </p>
      </div>
    );
  }

  const { value, app, holder } = channel;

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
          marca. No es un guiño técnico: una llave puede llevar un 1 junto a una l
          o un 0 junto a una O, y quien la teclee a mano —pasa, con un móvil
          prestado— no puede tener que adivinar. Es la misma razón por la que los
          números del portal van en `tabular-nums`. */}
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
