import { panel } from "./ui/styles";

/**
 * Se muestra mientras no existan las claves de Supabase, para que el portal
 * arranque y sea navegable antes de tener el proyecto creado.
 */
export function SetupNotice() {
  return (
    <div className={`${panel} p-6`}>
      <h2 className="font-display text-2xl text-ink">Falta conectar la base de datos</h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        Crea un proyecto en Supabase, ejecuta{" "}
        <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">
          supabase/migrations/0001_init.sql
        </code>{" "}
        y copia las claves en{" "}
        <code className="rounded bg-line px-1.5 py-0.5 text-xs text-body">.env.local</code>. Los
        pasos exactos están en el README.
      </p>
    </div>
  );
}
