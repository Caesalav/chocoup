import Link from "next/link";

export type CitySection = "personas" | "necesidades";

const TABS: { id: CitySection; label: string }[] = [
  { id: "personas", label: "Personas" },
  { id: "necesidades", label: "Necesidades" },
];

export function parseCitySection(value: string | undefined): CitySection {
  return value === "necesidades" ? "necesidades" : "personas";
}

/**
 * Pestañas del contenido de un municipio. Viven en la URL para que una vista
 * concreta se pueda compartir, y no piden JavaScript.
 */
export function SectionTabs({
  slug,
  active,
  peopleCount,
  needsCount,
}: {
  slug: string;
  active: CitySection;
  peopleCount: number;
  needsCount: number;
}) {
  const counts: Record<CitySection, number> = {
    personas: peopleCount,
    necesidades: needsCount,
  };

  // El conmutador no crece con la página: dos pestañas de 500 px dejan de
  // leerse como un conmutador y pasan a parecer dos botones sueltos.
  return (
    <nav
      id="contenido"
      aria-label="Contenido del municipio"
      className="grid grid-cols-2 rounded-full border border-line bg-panel-high p-1 shadow-card sm:max-w-md"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={`/ciudades/${slug}?ver=${tab.id}#contenido`}
            scroll
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
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
