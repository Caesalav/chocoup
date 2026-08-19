import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CityDirectory } from "@/components/admin/CityDirectory";
import { TownIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";
import { getAdminCities } from "@/lib/admin-data";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * Ciudades: crear, ubicar, describir y fotografiar un municipio.
 *
 * Los casos se documentan en Casos. Aquí no se abren familias ni se anota
 * lo que falta en la zona: este listado es el de los pueblos.
 */
export default async function AdminCitiesPage() {
  const [cities, team] = await Promise.all([getAdminCities(), currentTeam()]);
  const canCreate = team?.role === "coordinacion";
  const writableIds = cities.filter((city) => canWriteCity(team, city.id)).map((city) => city.id);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin"
        backLabel="Panel del equipo"
        title="Ciudades"
        Icon={TownIcon}
        description="Busca el municipio por su nombre: si es del Chocó, el mapa ya sabe dónde queda. Luego la descripción y las fotos."
        actions={
          canCreate ? (
            <Link href="/admin/ciudades/nueva" className={button.primary}>
              Nuevo municipio
            </Link>
          ) : undefined
        }
      />

      {team?.role === "documentacion" && cities.length > 0 && writableIds.length === 0 && (
        <p className="mt-6 max-w-prose text-[14px] leading-relaxed text-muted">
          Todavía no tienes ningún municipio asignado: pídeselo a coordinación.
        </p>
      )}

      <CityDirectory cities={cities} canCreate={!!canCreate} writableIds={writableIds} />
    </div>
  );
}
