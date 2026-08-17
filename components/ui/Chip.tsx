import type { NeedStatus, OfferStatus } from "@/lib/types";
import { needCategoryLabel, needStatusLabel, offerStatusLabel } from "@/lib/constants";

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] whitespace-nowrap";

export function CategoryChip({ category }: { category: string }) {
  return (
    <span className={`${base} border border-line-strong text-muted`}>
      {needCategoryLabel(category)}
    </span>
  );
}

const needStatusStyles: Record<NeedStatus, string> = {
  abierta: "bg-amber-soft text-amber",
  parcial: "border border-line-strong text-body",
  cubierta: "bg-teal-soft text-teal-light",
};

export function NeedStatusChip({ status }: { status: NeedStatus }) {
  return (
    <span className={`${base} ${needStatusStyles[status] ?? needStatusStyles.abierta}`}>
      {needStatusLabel(status)}
    </span>
  );
}

const offerStatusStyles: Record<OfferStatus, string> = {
  pendiente: "bg-amber-soft text-amber",
  aceptada: "bg-teal-soft text-teal-light",
  rechazada: "border border-line text-faint",
};

export function OfferStatusChip({ status }: { status: OfferStatus }) {
  return (
    <span className={`${base} ${offerStatusStyles[status] ?? offerStatusStyles.pendiente}`}>
      {offerStatusLabel(status)}
    </span>
  );
}

export function UrgentChip() {
  return <span className={`${base} bg-amber text-base`}>Urgente</span>;
}

export function DraftChip({ label = "Borrador" }: { label?: string }) {
  return (
    <span className={`${base} border border-dashed border-line-strong text-faint`}>{label}</span>
  );
}

/** Insignia numerada, como los pines del mapa de la referencia. */
export function IndexBadge({
  index,
  tone = "teal",
  className = "",
}: {
  index: number;
  tone?: "teal" | "amber" | "outline";
  className?: string;
}) {
  const tones = {
    teal: "bg-teal text-ink",
    amber: "bg-amber text-base",
    outline: "border border-line-strong text-muted",
  };
  return (
    <span
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${tones[tone]} ${className}`}
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}
