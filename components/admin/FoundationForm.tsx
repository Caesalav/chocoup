"use client";

import { useActionState } from "react";
import {
  saveFoundation,
  type FoundationFormState,
} from "@/app/admin/recursos/fundaciones/actions";
import { alertBox, button, field } from "@/components/ui/styles";
import { NEED_CATEGORIES } from "@/lib/constants";
import type { Foundation } from "@/lib/types";

/**
 * La ficha de una fundación, editable.
 *
 * Es la diferencia entera con la bandeja de ofertas: aquello se lee y se llama,
 * esto se corrige. Una fundación cambia de sede, de representante y de estado
 * de revisión, y lo que el equipo averigüe al llamar tiene que poder escribirse
 * encima de lo que la organización escribió de sí misma.
 *
 * Las notas van al final y separadas por un filete: es lo único de esta
 * pantalla que NO viene del formulario público, y mezclarlas entre los demás
 * campos haría dudar de si la fundación las ve. No las ve.
 */
export function FoundationForm({ foundation }: { foundation: Foundation }) {
  const [state, action, pending] = useActionState<FoundationFormState, FormData>(
    saveFoundation,
    null,
  );

  const ok = state !== null && "ok" in state ? state.ok : null;
  const error = state !== null && "error" in state ? state.error : null;

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="id" value={foundation.id} />

      <label className="block">
        <span className={field.label}>Estado de la revisión</span>
        <select
          name="status"
          defaultValue={foundation.status}
          className={field.select}
        >
          <option value="pendiente">Pendiente de comprobar</option>
          <option value="verificada">Verificada</option>
          <option value="descartada">Descartada</option>
        </select>
        <span className={field.hint}>
          Verificada quiere decir que alguien comprobó que existe y hace lo que dice.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>Nombre legal</span>
        <input
          name="legal_name"
          required
          defaultValue={foundation.legal_name}
          className={field.input}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Cómo se les conoce</span>
          <input name="display_name" defaultValue={foundation.display_name} className={field.input} />
        </label>
        <label className="block">
          <span className={field.label}>NIT</span>
          <input name="nit" defaultValue={foundation.nit} className={field.input} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Quién responde</span>
          <input
            name="contact_name"
            required
            defaultValue={foundation.contact_name}
            className={field.input}
          />
        </label>
        <label className="block">
          <span className={field.label}>Correo</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={foundation.email}
            className={field.input}
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Teléfono</span>
          <input name="phone" defaultValue={foundation.phone} className={field.input} />
        </label>
        {/* `site_url`, el mismo nombre que en el formulario público. Aquí no hay
            trampa para robots con la que chocar, pero dos nombres para el
            mismo dato es cómo se vuelve a colar el fallo que ya se coló. */}
        <label className="block">
          <span className={field.label}>Página o red</span>
          <input name="site_url" defaultValue={foundation.website} className={field.input} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Sede</span>
          <input name="city_name" defaultValue={foundation.city_name} className={field.input} />
        </label>
        <label className="block">
          <span className={field.label}>En qué ayudan sobre todo</span>
          <select name="category" defaultValue={foundation.category} className={field.select}>
            {NEED_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={field.label}>Dónde trabajan</span>
        <input name="coverage" defaultValue={foundation.coverage} className={field.input} />
      </label>

      <label className="block">
        <span className={field.label}>A qué se dedican</span>
        <textarea name="focus" required rows={3} defaultValue={foundation.focus} className={field.textarea} />
      </label>
      <label className="block">
        <span className={field.label}>Qué pueden aportar</span>
        <textarea name="offering" rows={3} defaultValue={foundation.offering} className={field.textarea} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Cuánta gente son</span>
          <input name="team_size" defaultValue={foundation.team_size} className={field.input} />
        </label>
        <label className="block">
          <span className={field.label}>Desde qué año</span>
          <input name="founded_year" defaultValue={foundation.founded_year} className={field.input} />
        </label>
      </div>

      <label className="block">
        <span className={field.label}>Lo que escribieron</span>
        <textarea name="message" rows={3} defaultValue={foundation.message} className={field.textarea} />
      </label>

      <div className="border-t border-line pt-5">
        <label className="block">
          <span className={field.label}>Notas del equipo</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={foundation.notes}
            className={field.textarea}
            placeholder="Qué se comprobó, con quién se habló, qué quedó pendiente."
          />
          <span className={field.hint}>
            Solo lo ve el equipo. La fundación nunca lo lee.
          </span>
        </label>
      </div>

      {error && <p className={alertBox}>{error}</p>}
      {ok && (
        <p role="status" className="rounded-lg bg-selva px-3.5 py-2.5 text-sm text-luz">
          {ok}
        </p>
      )}

      <button type="submit" disabled={pending} className={button.primary}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
