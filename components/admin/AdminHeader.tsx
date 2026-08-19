import type { ReactElement, ReactNode } from "react";
import Link from "next/link";

type Icon = (props: { className?: string }) => ReactElement;

/**
 * Cabecera de una pantalla del panel.
 *
 * La barra ya dice en qué sección estás; aquí no se repite «Panel del equipo» en
 * versalitas. El icono es el mismo del portal público, para que Ciudades, Casos
 * y Verificación se reconozcan al vuelo. Las acciones —crear, publicar— van a
 * la derecha, no mezcladas con el titular.
 */
export function AdminHeader({
  backHref,
  backLabel,
  title,
  Icon,
  badge,
  description,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  Icon?: Icon;
  badge?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header>
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-ink hover:underline"
      >
        ← {backLabel}
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2.5 font-display text-3xl leading-tight text-ink">
            {Icon && <Icon className="size-8 shrink-0 text-accent" />}
            {title}
            {badge}
          </h1>
          {description && (
            <div className="mt-2 max-w-prose text-[14px] leading-relaxed text-muted">
              {description}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
