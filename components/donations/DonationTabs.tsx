import Link from "next/link";

export type DonationView = "fundaciones" | "causas";

/**
 * Las fundaciones son la vista por defecto y viven en /donaciones a secas.
 *
 * Es la misma decisión que en el mapa: colgarle un parámetro a lo normal solo
 * alarga la dirección que más se comparte, y aquí la dirección que se comparte es
 * «a dónde va el dinero». Cualquier valor que no sea "causas" cae en fundaciones,
 * así que un enlace mal copiado desde un WhatsApp abre una pantalla y no un error.
 */
export function parseDonationView(value: string | undefined): DonationView {
  return value === "causas" ? "causas" : "fundaciones";
}

const VIEWS: { id: DonationView; label: string; href: string }[] = [
  { id: "fundaciones", label: "Fundaciones", href: "/donaciones" },
  { id: "causas", label: "Causas", href: "/donaciones?ver=causas" },
];

/**
 * Las dos formas de dar dinero: a un municipio o a una familia.
 *
 * Dos enlaces y no un componente con estado, por lo mismo que el resto de los
 * conmutadores del portal: sin JavaScript funciona igual, y cada pestaña se puede
 * pegar en un WhatsApp —que es como llega aquí la gente— y abre lo que quien la
 * mandó estaba mirando.
 *
 * El conmutador no crece con la página: dos pestañas de 700 px dejan de leerse
 * como un conmutador y pasan a ser dos botones sueltos.
 */
export function DonationTabs({
  active,
  foundationCount,
  caseCount,
}: {
  active: DonationView;
  foundationCount: number;
  caseCount: number;
}) {
  const counts: Record<DonationView, number> = {
    fundaciones: foundationCount,
    causas: caseCount,
  };

  return (
    <nav
      aria-label="Formas de donar"
      className="grid grid-cols-2 rounded-full border border-line bg-panel-high p-1 shadow-card sm:max-w-md"
    >
      {VIEWS.map((view) => {
        const selected = view.id === active;

        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {view.label}
            <span className={`tabular-nums ${selected ? "text-paper/70" : "text-faint"}`}>
              {counts[view.id]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
