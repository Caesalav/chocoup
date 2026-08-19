import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { NewCaseForm } from "@/components/admin/NewCaseForm";
import { CasesIcon } from "@/components/ui/icons";
import { getAdminCities } from "@/lib/admin-data";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ciudad?: string }> };

/**
 * Abrir una causa nueva, con todo lo que se puede decir de ella el primer día:
 * municipio, nombre, historia, consentimiento y las fotos que ya se tienen.
 *
 * Las necesidades, los avances y el canal se añaden en la ficha, porque piden
 * que la causa ya exista. Las fotos no: se eligen aquí y se suben al crear.
 */
export default async function NewCasePage({ searchParams }: Props) {
  const { ciudad } = await searchParams;
  const [cities, team] = await Promise.all([getAdminCities(), currentTeam()]);
  const writable = cities.filter((city) => canWriteCity(team, city.id));
  const preset = ciudad ? writable.find((city) => city.slug === ciudad) : undefined;

  if (writable.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader backHref="/admin/casos" backLabel="Casos" title="Nuevo caso" Icon={CasesIcon} />
        <p className="mt-8 max-w-prose text-[14px] leading-relaxed text-muted">
          No tienes ningún municipio asignado, así que no puedes abrir una causa. Pídeselo a
          coordinación. Los pueblos se crean en{" "}
          <Link href="/admin/ciudades" className="text-accent hover:underline">
            Ciudades
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/casos"
        backLabel="Casos"
        title="Nuevo caso"
        Icon={CasesIcon}
        description="Primero el municipio —de los que ya están creados—, luego nombre, fotos e historia. Lo que falta y el canal se añaden en la ficha."
      />

      <NewCaseForm
        cities={writable.map((city) => ({ id: city.id, name: city.name }))}
        defaultCityId={preset?.id ?? (writable.length === 1 ? writable[0].id : undefined)}
      />
    </div>
  );
}
