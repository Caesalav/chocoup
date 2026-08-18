import Link from "next/link";

export type CaseView = "necesidades" | "seguimiento";

/**
 * Lo que falta es la vista por defecto y vive en la ficha a secas.
 *
 * El seguimiento puede ser largo —cinco fotos con texto ya empujan «qué
 * necesita» fuera de la primera pantalla— y por eso son pestañas y no dos
 * bloques uno debajo del otro. El parámetro solo aparece cuando se mira el
 * diario: la dirección que se comparte es la de las necesidades, que es a lo
 * que se viene a ayudar.
 */
export function parseCaseView(value: string | undefined): CaseView {
  return value === "seguimiento" ? "seguimiento" : "necesidades";
}

/**
 * Las dos lecturas de un caso: qué le falta y qué ha pasado.
 *
 * Dos enlaces, no un componente con estado: sin JavaScript funcionan igual, y
 * cada pestaña se puede pegar en un WhatsApp y abre lo que quien la mandó
 * estaba mirando. Es la misma pastilla que el municipio y las donaciones.
 */
export function CaseViewTabs({
  href,
  active,
  needsCount,
  updateCount,
}: {
  /** La ficha a secas, sin parámetro. */
  href: string;
  active: CaseView;
  needsCount: number;
  updateCount: number;
}) {
  const tabs: { id: CaseView; label: string; to: string }[] = [
    { id: "necesidades", label: "Qué necesita", to: `${href}#contenido` },
    { id: "seguimiento", label: "Seguimiento", to: `${href}?ver=seguimiento#contenido` },
  ];
  const counts: Record<CaseView, number> = {
    necesidades: needsCount,
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
