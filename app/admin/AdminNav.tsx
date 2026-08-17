import Link from "next/link";

export function AdminNav({ email, pendingOffers }: { email: string; pendingOffers: number }) {
  return (
    <div className="border-b border-line bg-panel/70 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
        <nav className="flex items-center gap-2">
          <Link href="/admin" className="smallcaps rounded-full px-3 py-1.5 text-[15px] text-ink hover:bg-line">
            Panel
          </Link>
          <Link
            href="/admin/ofertas"
            className="smallcaps flex items-center gap-2 rounded-full px-3 py-1.5 text-[15px] text-muted hover:bg-line hover:text-ink"
          >
            Ofertas
            {pendingOffers > 0 && (
              <span className="rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-base">
                {pendingOffers}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-faint sm:inline">{email}</span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-xs text-muted hover:text-ink hover:underline">
              Salir
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
