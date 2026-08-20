import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PhotoIcon } from "@/components/ui/icons";
import { panel } from "@/components/ui/styles";
import { getPhotoStorageUsage } from "@/lib/admin-data";
import { formatBytes, plural } from "@/lib/format";
import { SUPABASE_FREE_EGRESS_BYTES, usageRatio } from "@/lib/storage-usage";
import { isDemoMode } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Cuánto del cupo de fotos se ha gastado, por municipio y por causa.
 *
 * El plan gratuito de Supabase deja 1 GB de archivos. Vercel no guarda las
 * fotos: sirve el HTML. El segundo número que importa es la salida (5 GB al
 * mes): por eso cada foto se guarda en dos tamaños y las listas sirven la
 * miniatura.
 */
export default async function PhotoStoragePage() {
  const usage = await getPhotoStorageUsage();
  const ratio = usageRatio(usage.totalBytes, usage.quotaBytes);
  const percent = Math.round(ratio * 100);
  const remaining = Math.max(0, usage.quotaBytes - usage.totalBytes);
  const demo = isDemoMode();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin"
        backLabel="Panel"
        title="Espacio de fotos"
        Icon={PhotoIcon}
        description="Cada foto se comprime en el teléfono (1600 px y una miniatura de 400 px) antes de subir. El cupo es el del plan gratuito de Supabase: 1 GB de archivos. Vercel no las guarda."
      />

      {demo && (
        <p className={`${panel} mt-6 p-4 text-sm leading-relaxed text-muted`}>
          Estas fotos de muestra viven en el código, no en Storage. El recuento
          sale en cero a propósito: no comen del cupo real.
        </p>
      )}

      <section className={`${panel} mt-6 p-5`}>
        <p className="text-[13px] text-muted">Plan gratuito de Supabase</p>
        <p className="mt-1 font-display text-[28px] leading-tight text-ink">
          {formatBytes(usage.totalBytes)}
          <span className="ml-1 text-[16px] text-muted">de {formatBytes(usage.quotaBytes)}</span>
        </p>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-line"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Espacio de fotos usado"
        >
          <div
            className={`h-full rounded-full ${ratio >= 0.9 ? "bg-need-high" : "bg-accent"}`}
            style={{ width: `${Math.max(ratio > 0 ? 2 : 0, percent)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          {plural(usage.photoCount, "foto", "fotos")}
          {" · "}
          quedan {formatBytes(remaining)}
          {" · "}
          salida incluida: {formatBytes(SUPABASE_FREE_EGRESS_BYTES)} al mes
        </p>
      </section>

      {usage.cities.length === 0 ? (
        <p className={`${panel} mt-6 p-4 text-sm leading-relaxed text-muted`}>
          Todavía no hay fotos subidas.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {usage.cities.map((city) => (
            <li key={city.cityId} className={`${panel} p-4`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <Link
                  href={`/admin/ciudades/${city.citySlug}`}
                  className="font-display text-[20px] leading-tight text-ink hover:underline"
                >
                  {city.cityName}
                </Link>
                <p className="text-sm tabular-nums text-muted">
                  {formatBytes(city.bytes)} · {plural(city.photoCount, "foto", "fotos")}
                </p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {city.cases.map((entry) => (
                  <li
                    key={entry.caseId ?? "zona"}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px]"
                  >
                    {entry.caseId ? (
                      <Link
                        href={`/admin/ciudades/${city.citySlug}/casos/${entry.caseId}`}
                        className="text-body hover:underline"
                      >
                        {entry.caseName}
                      </Link>
                    ) : (
                      <span className="text-muted">Fotos del municipio</span>
                    )}
                    <span className="tabular-nums text-faint">
                      {formatBytes(entry.bytes)} · {entry.photoCount}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
