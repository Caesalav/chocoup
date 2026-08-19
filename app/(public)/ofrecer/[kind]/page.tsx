import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SupportForm } from "../SupportForm";
import { blockInvite } from "@/components/ui/styles";
import { supportKindMeta } from "@/lib/support";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ kind: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  const meta = supportKindMeta(kind);
  if (!meta) return { title: "Ofrecer" };
  return { title: meta.title, description: meta.blurb };
}

export default async function OfferKindPage({ params }: Props) {
  const { kind } = await params;
  const meta = supportKindMeta(kind);
  if (!meta) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 pb-8 pt-6 sm:px-8 lg:pb-20 lg:pt-14">
      <p className="text-[13px] text-muted">
        <Link href="/ofrecer" className="hover:text-ink hover:underline">
          ← Cómo puedes ayudar
        </Link>
      </p>
      <div className={`${blockInvite} mt-4 p-5 sm:p-6`}>
        <p className="text-[13px] text-body">{meta.label}</p>
        <h1 className="mt-1.5 font-display text-[28px] leading-tight text-ink lg:text-[34px]">
          {meta.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-body">{meta.blurb}</p>
      </div>
      <SupportForm kind={meta.value} />
    </div>
  );
}
