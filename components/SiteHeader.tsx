import Link from "next/link";
import { CHOCO_PATH, LAND } from "@/lib/choco-map";
import { SITE_NAME } from "@/lib/constants";

const NAV = [
  { href: "/", label: "Municipios" },
  { href: "/ofrecer", label: "Ofrecer recurso" },
  { href: "/admin", label: "Equipo" },
] as const;

/** La silueta del departamento como marca: es la forma del proyecto. */
function Mark() {
  return (
    <svg
      viewBox={`0 0 ${LAND.width} ${LAND.height}`}
      className="h-8 w-auto shrink-0"
      aria-hidden="true"
    >
      <path d={CHOCO_PATH} className="fill-amber" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <Mark />
          <span className="font-display leading-[1.05]">
            <span className="block text-[19px] text-ink">{SITE_NAME}</span>
            <span className="block text-[13px] tracking-[0.12em] text-muted">Chocó</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-10 lg:flex xl:gap-16">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="smallcaps text-[15px] text-body transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Menú móvil sin JavaScript. */}
        <details className="ml-auto lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-line-strong bg-panel/70 backdrop-blur [&::-webkit-details-marker]:hidden"
            aria-label="Abrir menú"
          >
            <span className="relative block h-2.5 w-4">
              <span className="absolute inset-x-0 top-0 h-px bg-body" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-body" />
            </span>
          </summary>
          <div className="absolute right-5 mt-3 flex w-56 flex-col rounded-xl border border-line bg-panel/95 p-2 backdrop-blur-md">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="smallcaps rounded-lg px-3 py-2.5 text-[16px] text-body hover:bg-line hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
