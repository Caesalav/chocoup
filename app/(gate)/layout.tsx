/**
 * La landing no lleva la navegación del portal: esas rutas todavía no son
 * públicas, y un enlace a /mapa desde aquí sería una puerta falsa.
 */
export default function GateLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}
