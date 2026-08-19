"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MoneyTrackFill } from "@/components/case/CaseMoneyTrack";
import { DonateLink, DonateOverlay } from "@/components/donations/DonateOverlay";
import { ShareLink } from "@/components/ShareLink";
import { button } from "@/components/ui/styles";
import {
  moneyAction,
  shortCOP,
  type MoneyAction,
  type MoneyProgress,
} from "@/lib/money-progress";

/** El bloque de la meta en la ficha: cuando deja de verse, sale la tarjeta flotante. */
export const CASE_META_ANCHOR = "meta-del-caso";
export const DONATIONS_ANCHOR = "donaciones-recibidas";

type Props = {
  caseName: string;
  caseId: string;
  progress: MoneyProgress;
  donateHref: string;
  budgetHref: string;
  shareUrl: string;
  shareTitle: string;
  /** «Lucía Restrepo donó $150 mil». Lleva al registro. */
  donorLabel?: string | null;
  donorHref?: string;
  children: React.ReactNode;
};

function useMetaStillInView(id: string) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = document.getElementById(id);
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [id]);

  return inView;
}

function ActionButton({
  action,
  donateHref,
  budgetHref,
  className,
}: {
  action: MoneyAction;
  donateHref: string;
  budgetHref: string;
  className: string;
}) {
  if (action.kind === "donar") {
    return (
      <DonateLink href={donateHref} className={className}>
        {action.label}
      </DonateLink>
    );
  }
  return (
    <Link href={budgetHref} className={className}>
      {action.label}
    </Link>
  );
}

function Pair({
  action,
  donateHref,
  budgetHref,
  shareUrl,
  shareTitle,
  mainClass,
  shareClass,
}: {
  action: MoneyAction;
  donateHref: string;
  budgetHref: string;
  shareUrl: string;
  shareTitle: string;
  mainClass: string;
  shareClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <ActionButton
        action={action}
        donateHref={donateHref}
        budgetHref={budgetHref}
        className={mainClass}
      />
      <ShareLink url={shareUrl} title={shareTitle} className={shareClass}>
        Compartir
      </ShareLink>
    </div>
  );
}

/**
 * Donar y compartir: en la ficha, debajo de la meta, y otra vez abajo cuando
 * esa meta ya no se ve.
 *
 * La tarjeta flotante no sustituye a los mandos de arriba: los de arriba son
 * los de la referencia, a un toque de abrir la ficha. La flotante es para
 * cuando se ha bajado a la historia.
 */
export function CaseActions({
  caseName,
  caseId,
  progress,
  donateHref,
  budgetHref,
  shareUrl,
  shareTitle,
  donorLabel,
  donorHref,
  children,
}: Props) {
  const action = moneyAction(progress);
  const metaInView = useMetaStillInView(CASE_META_ANCHOR);
  const revealed = !metaInView;
  // `primary` y no `invite`: la acción principal debajo del retrato de alguien
  // es el bloque de `selva`, no el de `brote`. Ver MARCA.md, «Los dos
  // registros», y la regla del final de eslint.config.mjs, que lo falla.
  const main = `${button.primary} min-w-0 flex-1 text-[15px]`;
  const share = `${button.share} min-w-0 flex-1 text-[15px]`;
  const pair = {
    action,
    donateHref,
    budgetHref,
    shareUrl,
    shareTitle,
    mainClass: main,
    shareClass: share,
  };

  const hero = (
    <div id={CASE_META_ANCHOR}>
      {children}
      <div className="mt-5">
        <Pair {...pair} />
      </div>
    </div>
  );

  const dock = (
    <div
      className={`case-donate-dock fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${
        revealed
          ? "translate-y-0"
          : "invisible pointer-events-none translate-y-[calc(100%+1.25rem)]"
      }`}
    >
      <div className="w-full max-w-[420px] rounded-[28px] border border-line bg-panel-high/95 p-2.5 shadow-float backdrop-blur">
        {progress.goal > 0 && (
          <div className="px-1.5 pb-2.5 pt-0.5">
            <MoneyTrackFill progress={progress} className="h-1.5" />
            <p className="mt-2 text-[13px] leading-snug text-muted">
              <span className="font-medium text-ink">
                {shortCOP(progress.raised > 0 ? progress.raised : progress.delivered)}{" "}
                {progress.raised > 0 ? "donados" : "entregados"}
              </span>{" "}
              <span className="text-faint">de {shortCOP(progress.goal)}</span>
            </p>
            {donorLabel && donorHref && (
              <p className="mt-0.5 truncate">
                <Link
                  href={donorHref}
                  className="text-[12px] leading-snug text-faint underline decoration-line-strong underline-offset-2 hover:text-ink hover:decoration-ink"
                >
                  {donorLabel}
                  <span aria-hidden> ›</span>
                </Link>
              </p>
            )}
          </div>
        )}
        <Pair {...pair} />
      </div>
    </div>
  );

  const tree =
    action.kind === "donar" ? (
      <DonateOverlay title={`Donar a ${caseName}`} caseId={caseId}>
        {hero}
        {dock}
      </DonateOverlay>
    ) : (
      <>
        {hero}
        {dock}
      </>
    );

  return (
    <>
      <noscript>
        <style>{`.case-donate-dock{visibility:visible!important;transform:none!important;pointer-events:auto!important}`}</style>
      </noscript>
      {tree}
    </>
  );
}
