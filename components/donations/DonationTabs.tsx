import Link from "next/link";

export type DonationView = "municipios" | "fundaciones" | "causas";

/**
 * Los municipios son la vista por defecto y viven en /donaciones a secas.
 *
 * Es la misma decisión que en el mapa: colgarle un parámetro a lo normal solo
 * alarga la dirección que más se comparte, y aquí la dirección que se comparte es
 * «a dónde va el dinero». Cualquier valor que no sea de las otras dos pestañas
 * cae en municipios, así que un enlace mal copiado desde un WhatsApp abre una
 * pantalla y no un error.
 */
export function parseDonationView(value: string | undefined): DonationView {
  if (value === "causas") return "causas";
  if (value === "fundaciones") return "fundaciones";
  return "municipios";
}

const VIEWS: { id: DonationView; label: string; href: string }[] = [
  { id: "municipios", label: "Municipios", href: "/donaciones" },
  { id: "fundaciones", label: "Fundaciones", href: "/donaciones?ver=fundaciones" },
  { id: "causas", label: "Causas", href: "/donaciones?ver=causas" },
];

/**
 * Las tres formas de mirar a quién donar: un pueblo, su fundación o una familia.
 *
 * Tres enlaces y no un componente con estado, por lo mismo que el resto de los
 * conmutadores del portal: sin JavaScript funciona igual, y cada pestaña se puede
 * pegar en un WhatsApp.
 */
export function DonationTabs({
  active,
  cityCount,
  foundationCount,
  caseCount,
}: {
  active: DonationView;
  cityCount: number;
  foundationCount: number;
  caseCount: number;
}) {
  const counts: Record<DonationView, number> = {
    municipios: cityCount,
    fundaciones: foundationCount,
    causas: caseCount,
  };

  return (
    <nav
      aria-label="Formas de donar"
      className="grid grid-cols-3 rounded-full border border-line bg-panel-high p-1 shadow-card sm:max-w-xl"
    >
      {VIEWS.map((view) => {
        const selected = view.id === active;

        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-full px-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-2 sm:text-[14px] ${
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
