import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CaseDirectory } from "@/components/admin/CaseDirectory";
import { CasesIcon } from "@/components/ui/icons";
import { button } from "@/components/ui/styles";
import { getAdminCases } from "@/lib/admin-data";
import { MONEY_REVIEW_PATH } from "@/lib/admin-sections";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * Casos: todas las causas del portal, de todos los municipios.
 *
 * Es la pantalla que faltaba. A una causa solo se llegaba entrando por su
 * municipio, que es el recorrido de quien la documenta por primera vez y no el de
 * quien vuelve: el jueves siguiente hay que escribir el avance de la familia
 * Klinger, y pasar por la ficha de Bahía Solano para encontrarla son dos pantallas
 * y una pregunta —«¿en qué pueblo estaba?»— que el panel puede contestar solo.
 *
 * LA FICHA DE UNA CAUSA NO SE HA MOVIDO: sigue en
 * /admin/ciudades/[slug]/casos/[id], que es la dirección que ya tenía y que hay
 * escrita en enlaces guardados y en `moneyDestinationsOf`. `activeAdminSection()`
 * la asigna a esta sección, así que la barra señala Casos mientras se edita una.
 * Cambiar la ruta habría sido una mudanza sin nada a cambio.
 *
 * Cada tarjeta enseña lo que hace falta para elegir: quién es, de dónde, cuánto
 * del plan de recursos está cubierto y qué falta todavía. Lo que no está: el
 * destino de su dinero. Eso se repasa entero en `MONEY_REVIEW_PATH`, que es de
 * coordinación, y esta lista la ve también quien documenta.
 */
export default async function AdminCasesPage() {
  const [cases, team] = await Promise.all([getAdminCases(), currentTeam()]);
  const writableIds = cases
    .filter((row) => canWriteCity(team, row.cityId))
    .map((row) => row.cityId)
    .filter((id, index, all) => all.indexOf(id) === index);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin"
        backLabel="Panel del equipo"
        title="Casos"
        Icon={CasesIcon}
        description={
          <>
            Busca por nombre o municipio. El plan de cada causa son los recursos
            que le faltan; lo cubierto es lo que ya se reunió.
            {team?.role === "coordinacion" && (
              <>
                {" "}
                Los destinos juntos se repasan en{" "}
                <Link href={MONEY_REVIEW_PATH} className="text-accent hover:underline">
                  a dónde va el dinero
                </Link>
                . Quien donó, en{" "}
                <Link href="/admin/casos/donantes" className="text-accent hover:underline">
                  donantes
                </Link>
                .
              </>
            )}
          </>
        }
        actions={
          <Link href="/admin/casos/nuevo" className={button.primary}>
            Nuevo caso
          </Link>
        }
      />

      <CaseDirectory cases={cases} writableIds={writableIds} />
    </div>
  );
}
