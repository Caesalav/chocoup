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
          Es el mismo glifo que lleva la pastilla «Cubierta», solo que a tamaño
          de sello y con el trazo animado. */}
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <CheckIcon className="draws-check size-7 stroke-[2.5]" />
      </span>

      <h1 className="enters enters-1 mt-6 font-display text-[30px] leading-tight text-ink">
        Gracias, lo recibimos
      </h1>
      <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
        El equipo revisa las ofertas a diario y te escribe al contacto que dejaste. Si es algo
        urgente y prefieres no esperar, escríbelo en{" "}
        <Link href="/sugerencias" className="text-accent hover:underline">
          sugerencias
        </Link>{" "}
        y lo vemos antes.
      </p>
      {/* Se dice aquí, recién enviada la oferta, porque es cuando importa saber qué
          se va a publicar de esto y qué no. */}
      <p className="enters enters-2 mt-4 text-[14px] leading-relaxed text-muted">
        Cuando tu ayuda llegue al municipio, quedará anotada en el{" "}
        <Link href="/ayudas" className="text-accent hover:underline">
          registro de ayudas
        </Link>
        , con el mes en que llegó y el municipio. Tu contacto no se publica, y tu nombre solo si lo
        autorizaste.
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
