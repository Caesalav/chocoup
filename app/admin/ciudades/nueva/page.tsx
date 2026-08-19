import Link from "next/link";
import { createCity } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FormSection } from "@/components/admin/FormSection";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TownPicker } from "@/components/admin/TownPicker";
import { TownIcon } from "@/components/ui/icons";
import { currentTeam } from "@/lib/team";
import { townByName } from "@/lib/choco-towns";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ nombre?: string }> };

export default async function NewCityPage({ searchParams }: Props) {
  const { nombre } = await searchParams;
  const team = await currentTeam();
  const preset = nombre ? townByName(nombre) : undefined;

  if (team?.role !== "coordinacion") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader
          backHref="/admin/ciudades"
          backLabel="Ciudades"
          title="Los municipios los crea coordinación"
          Icon={TownIcon}
          description="Si hace falta uno nuevo, pídelo por el grupo con el nombre."
        />
        <p className="mt-8 max-w-prose text-[14px] leading-relaxed text-muted">
          En cuanto lo creen y te lo asignen, aparecerá en{" "}
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
        backHref="/admin/ciudades"
        backLabel="Ciudades"
        title="Nuevo municipio"
        Icon={TownIcon}
        description="Escribe el nombre. Si es uno de los treinta del Chocó, la ubicación se pone sola en el mapa."
      />

      <form action={createCity} className="mt-8">
        <FormSection
          title="¿Cuál es?"
          hint="El pin sale en el esquema del departamento. Se crea sin publicar: la descripción y las fotos se escriben en su ficha."
        >
          <TownPicker
            defaultName={preset?.name ?? ""}
            defaultLat={preset?.lat ?? null}
            defaultLng={preset?.lng ?? null}
          />
          <SubmitButton pendingLabel="Creando…">Crear municipio</SubmitButton>
        </FormSection>
      </form>
    </div>
  );
}
