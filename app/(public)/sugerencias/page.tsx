import type { Metadata } from "next";
import { FeedbackForm } from "./FeedbackForm";

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
      <p className="text-[13px] text-faint">Sugerencias y errores</p>
      <h1 className="mt-1.5 font-display text-[28px] leading-tight text-ink lg:text-[38px]">
        Cuéntanos
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Si algo no funciona, o si echas de menos una función, escríbelo aquí. Lo lee el equipo y
        no se publica.
      </p>
      <FeedbackForm pagePath={pagePath} />
    </div>
  );
}
