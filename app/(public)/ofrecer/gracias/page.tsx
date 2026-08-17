import Link from "next/link";
import type { Metadata } from "next";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Oferta recibida",
};

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-20 pt-32 sm:px-8">
      {/* El visto se dibuja al entrar: confirma el envío sin necesidad de leer. */}
      <span className="flex size-14 items-center justify-center rounded-full bg-teal-soft">
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
          <path
            d="M5 13l4.5 4.5L19 7"
            className="draws-check stroke-teal-light"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>

      <h1 className="enters enters-1 mt-6 font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
        Gracias, lo recibimos
      </h1>
      <p className="enters enters-2 mt-5 max-w-prose text-[17px] leading-[1.7] text-muted">
        El equipo revisa las ofertas a diario y te escribe al contacto que dejaste. Si es algo
        urgente y prefieres no esperar, en la página del municipio está el WhatsApp de la fundación
        que trabaja allí.
      </p>
      <div className="enters enters-3 mt-9 flex flex-wrap gap-3">
        <Link href="/" className={button.primary}>
          Volver al mapa
        </Link>
        <Link href="/ofrecer" className={button.secondary}>
          Ofrecer otra cosa
        </Link>
      </div>
    </div>
  );
}
