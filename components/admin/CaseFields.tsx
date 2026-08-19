import { field } from "@/components/ui/styles";
import { CASE_KINDS } from "@/lib/constants";

/**
 * Los datos de una causa que se escriben a mano: qué es, cómo aparece, la
 * frase de WhatsApp, la historia y el consentimiento.
 *
 * Las fotos van al lado, en el mismo formulario de alta; necesidades, avances
 * y canal piden que la causa ya exista y se rellenan en la ficha, justo después.
 */
export function CaseFields({
  cities,
  defaultCityId,
  values,
}: {
  cities?: { id: string; name: string }[];
  defaultCityId?: string;
  values?: {
    case_kind?: string;
    display_name?: string;
    household?: string;
    summary?: string;
    story?: string;
    consent_to_publish?: boolean;
  };
}) {
  return (
    <>
      {cities && cities.length > 0 && (
        <label className="block">
          <span className={field.label}>Municipio</span>
          <select
            name="city_id"
            required
            defaultValue={defaultCityId ?? ""}
            className={field.select}
          >
            <option value="" disabled>
              Elige el pueblo
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <span className={field.hint}>
            Elige una ciudad que ya exista. Las nuevas se crean en Ciudades, no aquí.
          </span>
        </label>
      )}

      <label className="block">
        <span className={field.label}>¿Qué es esta causa?</span>
        <select
          name="case_kind"
          defaultValue={values?.case_kind ?? "persona"}
          className={field.select}
        >
          {CASE_KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
        <span className={field.hint}>
          Cambia lo que se dibuja si todavía no hay retrato: de una persona, las iniciales; de un
          colegio o un animal, la palabra.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>El nombre con el que aparece</span>
        <input
          name="display_name"
          required
          defaultValue={values?.display_name ?? ""}
          className={field.input}
          placeholder="Ej.: Daniela, madre soltera reconstruye sola su casa"
        />
        <span className={field.hint}>
          De una persona, el nombre con el que acepta aparecer. De un colegio o un animal, cómo se
          le llama en el pueblo.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>Composición del hogar</span>
        <input
          name="household"
          defaultValue={values?.household ?? ""}
          className={field.input}
          placeholder="Ej.: 5 personas, 2 niños, una adulta mayor"
        />
        <span className={field.hint}>
          Quién vive ahí. En un colegio o una fundación, cuánta gente depende de ese lugar.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>La frase que resume esto</span>
        <input
          name="summary"
          maxLength={120}
          defaultValue={values?.summary ?? ""}
          className={field.input}
          placeholder="Daniela reconstruye sola su casa con sus dos hijas, en Quibdó."
        />
        <span className={field.hint}>
          Sale en la vista previa de WhatsApp, que es como se mueve este portal. Caben 120
          caracteres. Vacía, la tarjeta recorta la situación de abajo —a veces a mitad de una
          palabra—.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>Situación</span>
        <textarea
          name="story"
          rows={8}
          defaultValue={values?.story ?? ""}
          className={field.textarea}
          placeholder="Qué le pasó, dónde está durmiendo, qué perdió, qué necesita con urgencia. Separa párrafos con una línea en blanco."
        />
      </label>

      <label className={field.checkboxRow}>
        <input
          type="checkbox"
          name="consent_to_publish"
          defaultChecked={values?.consent_to_publish ?? false}
          className={field.checkbox}
        />
        <span>
          Hay consentimiento para publicar esta causa y sus fotos
          <span className="mt-0.5 block text-xs text-muted">
            Sin esta casilla se guarda, pero no se puede publicar. Las necesidades y el canal se
            añaden en el paso siguiente.
          </span>
        </span>
      </label>
    </>
  );
}
