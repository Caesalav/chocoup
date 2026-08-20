import Link from "next/link";

export type MapView = "choco" | "colombia";

/** El Chocó es la vista por defecto y vive en /mapa a secas: esa es la dirección
 *  que se comparte, y colgarle un parámetro a lo normal solo alarga el enlace. */
export function parseMapView(value: string | undefined): MapView {
  return value === "colombia" ? "colombia" : "choco";
}

const VIEWS: { id: MapView; label: string; href: string }[] = [
  { id: "choco", label: "El Chocó", href: "/mapa" },
  { id: "colombia", label: "En Colombia", href: "/mapa?ver=colombia" },
];

/**
 * Conmutador de las dos vistas del mapa.
 *
 * Vive en la URL y no en estado de cliente por las dos razones de siempre en este
 * portal: son dos enlaces, así que sin JavaScript funcionan igual, y «el Chocó
 * dentro de Colombia» se puede pegar en WhatsApp, que es cómo llega aquí la
 * gente. La pastilla abierta es tinta con `luz`: el verde de marca no entra en
 * el atlas para no pelear con el mosaico, que es donde vive el único dato.
 */
export function MapViewTabs({ active }: { active: MapView }) {
  return (
    <nav
      aria-label="Vista del mapa"
      className="inline-grid grid-cols-2 rounded-full border border-line bg-panel-high p-1 shadow-card"
    >
      {VIEWS.map((view) => {
        const selected = view.id === active;

        return (
          <Link
            key={view.id}
            href={view.href}
            aria-current={selected ? "page" : undefined}
            className={`flex min-h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              selected ? "bg-ink text-luz" : "text-muted hover:text-ink"
            }`}
          >
            {view.label}
          </Link>
        );
      })}
    </nav>
  );
}
