import Link from "next/link";
import type { Metadata } from "next";
import { CheckIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Mensaje recibido",
  robots: { index: false, follow: false },
};

export default function FeedbackThanksPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-10 sm:px-8 lg:pb-24 lg:pt-16">
      {/* El mismo sello de brote que /ofrecer/gracias: ver la nota de allí sobre
          por qué no lleva el lavado verde de la pastilla «Cubierta». */}
      <span className="flex size-14 items-center justify-center rounded-full bg-brote text-selva">
        <CheckIcon className="draws-check size-7 stroke-[2.5]" />
      </span>

      <h1 className="enters enters-1 mt-6 font-display text-[30px] leading-tight text-ink">
        Gracias, lo recibimos
      </h1>
      <p className="enters enters-2 mt-4 text-[15px] leading-relaxed text-muted">
        El equipo lo lee. Si dejaste un contacto, te escribimos si hace falta una respuesta.
      </p>
      <div className="enters enters-3 mt-8">
        <Link href="/" className={button.primary}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
