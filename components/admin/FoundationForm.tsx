import { deleteFoundation, saveFoundation } from "@/app/admin/actions";
import { DangerSubmitButton, SubmitButton } from "./SubmitButton";
import { field } from "@/components/ui/styles";
import type { Foundation } from "@/lib/types";

export function FoundationForm({
  cityId,
  foundation,
}: {
  cityId: string;
  foundation?: Foundation;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4">
      <form action={saveFoundation} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="city_id" value={cityId} />
        {foundation && <input type="hidden" name="id" value={foundation.id} />}

        <label className="block sm:col-span-2">
          <span className={field.label}>Nombre de la fundación</span>
          <input
            name="name"
            required
            defaultValue={foundation?.name}
            className={field.input}
            placeholder="Ej.: Fundación Amanecer Atrato"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={field.label}>Qué hacen</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={foundation?.description}
            className={field.textarea}
            placeholder="Una o dos frases sobre su trabajo en el municipio"
          />
        </label>

        <label className="block">
          <span className={field.label}>Persona de contacto</span>
          <input
            name="contact_name"
            defaultValue={foundation?.contact_name}
            className={field.input}
          />
        </label>

        <label className="block">
          <span className={field.label}>WhatsApp</span>
          <input
            name="whatsapp"
            defaultValue={foundation?.whatsapp}
            className={field.input}
            placeholder="3001234567"
            inputMode="tel"
          />
        </label>

        <label className="block">
          <span className={field.label}>Teléfono</span>
          <input
            name="phone"
            defaultValue={foundation?.phone}
            className={field.input}
            inputMode="tel"
          />
        </label>

        <label className="block">
          <span className={field.label}>Correo</span>
          <input
            name="email"
            type="email"
            defaultValue={foundation?.email}
            className={field.input}
          />
        </label>

        <label className="block">
          <span className={field.label}>Dirección</span>
          <input name="address" defaultValue={foundation?.address} className={field.input} />
        </label>

        <label className="block">
          <span className={field.label}>Web</span>
          <input
            name="website"
            defaultValue={foundation?.website}
            className={field.input}
            placeholder="https://"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={field.label}>Enlace de donación</span>
          <input
            name="donation_url"
            defaultValue={foundation?.donation_url}
            className={field.input}
            placeholder="https://vaki.co/vaki/… o la página oficial de la fundación"
            inputMode="url"
          />
          <span className={field.hint}>
            El botón &laquo;Donar dinero&raquo; de la página pública abre este enlace, y es también
            el canal por el que se envía dinero a cada familia del municipio. Debe ser una página que
            controle la fundación (su web, una Vaki, un botón de pago). Déjalo vacío si aún no lo
            tienes: aparecerá el WhatsApp para coordinar.
          </span>
        </label>

        <label className={`${field.checkboxRow} sm:col-span-2`}>
          <input
            type="checkbox"
            name="is_primary"
            defaultChecked={foundation ? foundation.is_primary : true}
            className={field.checkbox}
          />
          <span>
            Es la fundación madre del municipio
            <span className="mt-0.5 block text-xs text-muted">
              Aparece destacada como canal de donación en la página pública.
            </span>
          </span>
        </label>

        <div className="sm:col-span-2">
          <SubmitButton>{foundation ? "Guardar fundación" : "Añadir fundación"}</SubmitButton>
        </div>
      </form>

      {foundation && (
        <form action={deleteFoundation} className="mt-3 border-t border-line pt-3">
          <input type="hidden" name="id" value={foundation.id} />
          <DangerSubmitButton confirmText={`¿Quitar ${foundation.name}?`}>
            Quitar fundación
          </DangerSubmitButton>
        </form>
      )}
    </div>
  );
}
