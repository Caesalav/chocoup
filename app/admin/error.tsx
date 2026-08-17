"use client";

import { button } from "@/components/ui/styles";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl text-ink">No se pudo completar la acción</h1>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        {error.message || "Algo falló al guardar. Puede ser la conexión."}
      </p>
      <p className="mt-2 text-sm text-muted">
        Vuelve a intentarlo. Si estás con mala señal, espera unos segundos antes de reintentar.
      </p>
      <button type="button" onClick={reset} className={`${button.primary} mt-6`}>
        Reintentar
      </button>
    </div>
  );
}
