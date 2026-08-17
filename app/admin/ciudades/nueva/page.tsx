import Link from "next/link";
import { createCity } from "@/app/admin/actions";
import { LocationPicker } from "@/components/map/LocationPicker";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { field } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

export default function NewCityPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <Link
        href="/admin"
        className="smallcaps inline-flex items-center gap-2 text-[15px] text-muted transition-colors hover:text-ink"
      >
        <span className="text-amber">←</span> Panel
      </Link>

      <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-faint">Nuevo municipio</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] text-ink">¿Dónde estamos?</h1>
      <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted">
        Se crea sin publicar. Documenta la situación con calma y publícalo cuando esté listo para
        que lo vea la gente.
      </p>

      <form action={createCity} className="mt-6 space-y-5">
        <label className="block">
          <span className={field.label}>Nombre del municipio</span>
          <input
            name="name"
            required
            className={field.input}
            placeholder="Ej.: Bahía Solano"
            autoComplete="off"
          />
        </label>

        <div>
          <span className={field.label}>Ubicación</span>
          <div className="mt-1.5">
            <LocationPicker />
          </div>
        </div>

        <SubmitButton pendingLabel="Creando…">Crear municipio</SubmitButton>
      </form>
    </div>
  );
}
