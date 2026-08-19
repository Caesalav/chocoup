import Link from "next/link";
import type { Metadata } from "next";
import { CheckIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Oferta recibida",
};

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-10 sm:px-8 lg:pb-24 lg:pt-16">
      {/* El visto se dibuja al entrar: confirma el envío sin necesidad de leer.
          Es el mismo glifo que lleva la pastilla «Cubierta», a tamaño de sello y
          con el trazo animado.

          El sello va en `brote` y la pastilla en el lavado verde, aunque el glifo
          sea el mismo, y la diferencia es a propósito: una pastilla «Cubierta»
          aparece dentro de una lista de necesidades, entre otras tres pastillas
          con las que se compara, y ahí el lavado es lo que la deja en su sitio.
          Esto es la única cosa que hay en la pantalla y confirma algo que acaba
          de pasar, así que puede ser lo más vivo de la paleta. `selva` sobre
          `brote` da 9,52:1. */}
      <span className="flex size-14 items-center justify-center rounded-full bg-brote text-selva">
        <CheckIcon className="draws-check size-7 stroke-[2.5]" />
      </span>

      <h1 className="enters enters-1 mt-6 font-display text-[30px] leading-tight text-ink">
        Gracias, lo recibimos
      </h1>
      <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
        El equipo te escribe al contacto que dejaste. Tu nombre y tu teléfono no se publican.
      </p>
      <div className="enters enters-3 mt-8 flex flex-wrap gap-3">
        <Link href="/" className={button.primary}>
          Volver al inicio
        </Link>
        <Link href="/ofrecer" className={button.secondary}>
          Ofrecer otra cosa
        </Link>
      </div>
    </div>
  );
}
