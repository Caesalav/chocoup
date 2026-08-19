import Link from "next/link";

export type CaseView = "presupuesto" | "seguimiento";

export function parseCaseView(value: string | undefined): CaseView {
  return value === "seguimiento" ? "seguimiento" : "presupuesto";
}

/**
 * Las dos lecturas de un caso: el presupuesto y lo que ha pasado.
 */
export function CaseViewTabs({
  href,
  active,
  itemCount,
  updateCount,
}: {
  href: string;
  active: CaseView;
  itemCount: number;
  updateCount: number;
}) {
  const tabs: { id: CaseView; label: string; to: string }[] = [
    { id: "presupuesto", label: "Presupuesto", to: `${href}#contenido` },
    { id: "seguimiento", label: "Seguimiento", to: `${href}?ver=seguimiento#contenido` },
  ];
  const counts: Record<CaseView, number> = {
    presupuesto: itemCount,
    seguimiento: updateCount,
  };

  return (
    <nav
      id="contenido"
      aria-label="Contenido del caso"
      className="grid grid-cols-2 rounded-full border border-line bg-panel-high p-1 shadow-card sm:max-w-md"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.to}
            scroll
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-2 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
            <span className={`tabular-nums ${selected ? "text-paper/70" : "text-faint"}`}>
              {counts[tab.id]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
