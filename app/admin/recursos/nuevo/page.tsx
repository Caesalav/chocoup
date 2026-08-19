import { createOffer } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FormSection } from "@/components/admin/FormSection";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PledgeIcon } from "@/components/ui/icons";
import { field } from "@/components/ui/styles";
import { getAdminCases, getAdminCities } from "@/lib/admin-data";
import { NEED_CATEGORIES } from "@/lib/constants";
import { canWriteCity, currentTeam } from "@/lib/team";

export const dynamic = "force-dynamic";

/**
 * Un recurso que el equipo registra a mano: una llamada, un mensaje de WhatsApp,
 * algo que no pasó por /ofrecer. Sale en el muro si se marca; si no, queda en la
 * bandeja hasta que alguien lo ponga.
 */
export default async function NewOfferPage() {
  const [cities, cases, team] = await Promise.all([
    getAdminCities(),
    getAdminCases(),
    currentTeam(),
  ]);
  const writable = cities.filter((city) => canWriteCity(team, city.id));
  const writableCases = cases.filter((row) => canWriteCity(team, row.cityId));
  const isCoordination = team?.role === "coordinacion";

  if (!isCoordination && writable.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <AdminHeader
          backHref="/admin/recursos"
          backLabel="Verificación"
          title="Añadir recurso"
          Icon={PledgeIcon}
        />
        <p className="mt-8 max-w-prose text-[14px] leading-relaxed text-muted">
          No tienes ningún municipio asignado, así que no puedes registrar un recurso. Pídeselo a
          coordinación.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <AdminHeader
        backHref="/admin/recursos"
        backLabel="Verificación"
        title="Añadir recurso"
        Icon={PledgeIcon}
        description="Para lo que llega por teléfono o por el grupo, no por el formulario público. El contacto no se publica."
      />

      <form action={createOffer} className="mt-8">
        <FormSection
          title="Qué se ofrece"
          hint="Las mismas palabras que vería alguien en el muro: el recurso y su tipo. El mensaje largo se queda en el equipo."
        >
          <label className="block">
            <span className={field.label}>Recurso</span>
            <input
              name="resource"
              required
              className={field.input}
              placeholder="Ej.: 600 tejas de zinc de 2,44 m"
            />
          </label>

          <label className="block">
            <span className={field.label}>Etiqueta</span>
            <select name="category" defaultValue="otro" className={field.select}>
              {NEED_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={field.label}>Municipio</span>
            <select
              name="city_id"
              defaultValue={isCoordination ? "" : (writable[0]?.id ?? "")}
              className={field.select}
            >
              {isCoordination && <option value="">Sin municipio todavía</option>}
              {writable.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          {writableCases.length > 0 && (
            <label className="block">
              <span className={field.label}>Caso, si ya se sabe</span>
              <select name="case_id" defaultValue="" className={field.select}>
                <option value="">Ninguno</option>
                {writableCases.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.cityName} · {row.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className={field.label}>Nota interna</span>
            <textarea
              name="message"
              rows={3}
              className={field.textarea}
              placeholder="Cómo llegó, plazos, si cubre el transporte…"
            />
          </label>
        </FormSection>

        <div className="mt-4">
          <FormSection
            title="Quién ofrece"
            hint="Solo lo ve el equipo. En el muro, el nombre sale únicamente si autorizó y el recurso está aceptado."
          >
            <label className="block">
              <span className={field.label}>Nombre</span>
              <input name="offerer_name" required className={field.input} />
            </label>
            <label className="block">
              <span className={field.label}>Teléfono, WhatsApp o correo</span>
              <input name="offerer_contact" required className={field.input} />
            </label>
            <label className={field.checkboxRow}>
              <input type="checkbox" name="publish_name" className={field.checkbox} />
              <span>Autorizó aparecer con nombre en el muro</span>
            </label>
            <label className={field.checkboxRow}>
              <input type="checkbox" name="accepted" className={field.checkbox} />
              <span>
                Ya está verificado
                <span className="mt-0.5 block text-xs text-muted">
                  Si ya hablaste con esa persona. Si no, queda pendiente de revisión.
                </span>
              </span>
            </label>
            <label className={field.checkboxRow}>
              <input type="checkbox" name="on_wall" defaultChecked className={field.checkbox} />
              <span>
                Activo en el muro
                <span className="mt-0.5 block text-xs text-muted">
                  Lo que se ha ofrecido, en público. Puedes apagarlo después sin negar el recurso.
                </span>
              </span>
            </label>
          </FormSection>
        </div>

        <div className="mt-6">
          <SubmitButton pendingLabel="Guardando…">Guardar recurso</SubmitButton>
        </div>
      </form>
    </div>
  );
}
