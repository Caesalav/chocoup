import { saveCampaignFocus } from "@/app/admin/actions";
import { FormSection } from "@/components/admin/FormSection";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { field } from "@/components/ui/styles";
import type { CampaignFocusRow } from "@/lib/campaign";

/**
 * El recado del momento, para coordinación.
 *
 * Vacío es válido y es lo normal: entonces el portal señala solo el pueblo
 * más atrasado. Marcar uno reúne a todo el mundo ahí, como una orden de
 * campaña. No es un destino de dinero.
 */

type CityOption = { id: string; name: string };
type CaseOption = { id: string; display_name: string; city_id: string };

export function CampaignFocusForm({
  focus,
  cities,
  cases,
}: {
  focus: CampaignFocusRow;
  cities: CityOption[];
  cases: CaseOption[];
}) {
  return (
    <form action={saveCampaignFocus} className="mt-6">
      <FormSection
        title="Foco del momento"
        hint="El mapa siempre pinta dónde falta. Esto es un recado extra: «ahora, aquí». Vacío, el aviso del inicio cae solo en el pueblo más atrasado."
      >
        <label className="block">
          <span className={field.label}>Municipio</span>
          <select name="city_id" defaultValue={focus.city_id ?? ""} className={field.select}>
            <option value="">Ninguno: que lo decida el mapa</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={field.label}>Causa, si el recado es de una sola</span>
          <select name="case_id" defaultValue={focus.case_id ?? ""} className={field.select}>
            <option value="">Todo el municipio</option>
            {cases.map((entry) => {
              const city = cities.find((row) => row.id === entry.city_id);
              return (
                <option key={entry.id} value={entry.id}>
                  {city ? `${city.name} · ${entry.display_name}` : entry.display_name}
                </option>
              );
            })}
          </select>
        </label>

        <label className="block">
          <span className={field.label}>Nota, opcional</span>
          <input
            type="text"
            name="note"
            maxLength={280}
            defaultValue={focus.note}
            placeholder="Esta semana, techo en Quibdó"
            className={field.input}
          />
        </label>

        <SubmitButton>Guardar el foco</SubmitButton>
      </FormSection>
    </form>
  );
}
