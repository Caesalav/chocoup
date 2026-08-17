import Link from "next/link";
import { CategoryChip, NeedStatusChip, UrgentChip } from "./ui/Chip";
import type { Need } from "@/lib/types";

type Props = {
  needs: Need[];
  emptyLabel?: string;
};

export function NeedsList({ needs, emptyLabel }: Props) {
  if (needs.length === 0) {
    return emptyLabel ? <p className="text-sm text-muted">{emptyLabel}</p> : null;
  }

  return (
    <ul className="border-t border-line">
      {needs.map((need) => (
        <li key={need.id} className="border-b border-line py-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={need.category} />
            <NeedStatusChip status={need.status} />
            {need.urgent && need.status !== "cubierta" && <UrgentChip />}
          </div>

          <h3 className="mt-3 font-display text-xl leading-tight text-ink">{need.title}</h3>
          {need.quantity && <p className="mt-1 text-sm text-body">{need.quantity}</p>}
          {need.details && (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{need.details}</p>
          )}

          {need.status !== "cubierta" && (
            <Link
              href={`/ofrecer?need=${need.id}`}
              className="smallcaps mt-3 inline-flex items-center gap-2 text-[15px] text-amber transition-colors hover:text-amber-bright"
            >
              <span className="size-1.5 rounded-full bg-amber" />
              Puedo aportar esto
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
