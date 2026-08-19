import type { Metadata } from "next";
import { FeedbackForm } from "./FeedbackForm";
import { blockInvite } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sugerencias",
  description: "Reporta un error del portal o pide una función. Lo lee el equipo y no se publica.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ desde?: string }>;
};

function safePath(value: string | undefined): string {
  if (!value) return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "";
  return value.slice(0, 300);
}

export default async function FeedbackPage({ searchParams }: Props) {
  const { desde } = await searchParams;
  const pagePath = safePath(desde);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-6 sm:px-8 lg:pb-20 lg:pt-14">
      {/* La misma entradilla de lavanda que /ofrecer, por el mismo motivo: las dos
          pantallas piden algo a quien mira y son las dos únicas del portal que lo
          hacen. Si una lleva la superficie de invitación y la otra no, el color
          deja de significar algo y pasa a ser el adorno que le tocó a una página.

          La tinta se queda en `body` (8,39:1 sobre lavanda), no en `faint`, que
          ahí cae a 3,51:1. */}
      <div className={`${blockInvite} p-5 sm:p-6 lg:p-8`}>
        <p className="text-[13px] text-body">Sugerencias y errores</p>
        <h1 className="mt-1.5 font-display text-[28px] leading-tight text-ink lg:text-[38px]">
          Cuéntanos
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          Si algo no funciona, o si echas de menos una función, escríbelo aquí. Lo lee el equipo y
          no se publica.
        </p>
      </div>
      <FeedbackForm pagePath={pagePath} />
    </div>
  );
}
