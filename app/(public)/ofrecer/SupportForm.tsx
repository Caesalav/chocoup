"use client";

import { useActionState } from "react";
import { submitSupportOffer, type SupportFormState } from "./support-actions";
import { NEED_CATEGORIES } from "@/lib/constants";
import { alertBox, button, field } from "@/components/ui/styles";
import type { SupportOfferKind } from "@/lib/types";

function Honeypot() {
  return (
    <div className="hidden" aria-hidden>
      <label>
        Sitio web
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function ContactFields() {
  return (
    <>
      <label className="block">
        <span className={field.label}>Tu nombre</span>
        <input name="person_name" required minLength={2} className={field.input} autoComplete="name" />
      </label>
      <label className="block">
        <span className={field.label}>Tu correo</span>
        <input name="email" type="email" required className={field.input} autoComplete="email" />
        <span className={field.hint}>Para escribirte sobre esto. No se publica.</span>
      </label>
      <label className="block">
        <span className={field.label}>Teléfono o WhatsApp</span>
        <input name="contact" className={field.input} autoComplete="tel" placeholder="300 123 4567" />
      </label>
    </>
  );
}

export function VolunteerForm() {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="voluntario" />
      <Honeypot />
      <ContactFields />
      <label className="block">
        <span className={field.label}>¿En dónde te encuentras?</span>
        <input name="city_name" className={field.input} placeholder="Ej.: Medellín, o ya estoy en Quibdó" />
      </label>
      <label className="block">
        <span className={field.label}>Qué puedes hacer</span>
        <textarea
          name="skills"
          required
          rows={3}
          className={field.textarea}
          placeholder="Inventario, olla común, acompañar familias, cargar, traducir…"
        />
      </label>
      <label className="block">
        <span className={field.label}>Cuándo puedes</span>
        <input
          name="availability"
          required
          className={field.input}
          placeholder="Fines de semana, una semana en septiembre…"
        />
      </label>
      <label className="block">
        <span className={field.label}>Por cuánto tiempo</span>
        <input name="duration" className={field.input} placeholder="Tres días, dos semanas…" />
      </label>
      <label className={field.checkboxRow}>
        <input type="checkbox" name="has_transport" className={field.checkbox} />
        <span>Tengo transporte propio o puedo llevar carga</span>
      </label>
      <label className="block">
        <span className={field.label}>Algo más que debamos saber</span>
        <textarea name="message" rows={3} className={field.textarea} />
      </label>
      {state?.error && <p className={alertBox}>{state.error}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

export function ProfessionForm() {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="profesion" />
      <Honeypot />
      <ContactFields />
      <label className="block">
        <span className={field.label}>Tu profesión u oficio</span>
        <input name="profession" required className={field.input} placeholder="Médica, maestro de obra, psicóloga…" />
      </label>
      <label className="block">
        <span className={field.label}>Experiencia, en pocas palabras</span>
        <textarea name="experience" rows={3} className={field.textarea} />
      </label>
      <label className="block">
        <span className={field.label}>Cómo puedes atender</span>
        <select name="modality" required defaultValue="" className={field.select}>
          <option value="" disabled>
            Elige
          </option>
          <option value="presencial">Presencial, en el Chocó</option>
          <option value="remoto">A distancia</option>
          <option value="ambos">Las dos</option>
        </select>
      </label>
      <label className="block">
        <span className={field.label}>Títulos o permisos, si aplican</span>
        <input name="credentials" className={field.input} placeholder="Registro médico, matrícula…" />
      </label>
      <label className="block">
        <span className={field.label}>Cuándo puedes</span>
        <input name="availability" className={field.input} />
      </label>
      <label className="block">
        <span className={field.label}>Desde dónde</span>
        <input name="city_name" className={field.input} />
      </label>
      <label className="block">
        <span className={field.label}>En qué puedes ayudar concretamente</span>
        <textarea name="message" rows={3} className={field.textarea} />
      </label>
      {state?.error && <p className={alertBox}>{state.error}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

export function ResourceForm() {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="recurso" />
      <Honeypot />
      <ContactFields />
      <label className="block">
        <span className={field.label}>Qué puedes aportar</span>
        <input name="resource" required className={field.input} placeholder="200 tejas de zinc, 40 mercados…" />
      </label>
      <label className="block">
        <span className={field.label}>Cantidad</span>
        <input name="quantity" className={field.input} placeholder="200 unidades, un camión…" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Tipo</span>
          <select name="category" className={field.select} defaultValue="otro">
            {NEED_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={field.label}>Estado</span>
          <select name="condition" className={field.select} defaultValue="nuevo">
            <option value="nuevo">Nuevo</option>
            <option value="usado">Usado, en buen estado</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className={field.label}>Dónde está</span>
        <input name="city_name" className={field.input} placeholder="Bodega en Medellín, ya en Quibdó…" />
      </label>
      <label className={field.checkboxRow}>
        <input type="checkbox" name="can_deliver" className={field.checkbox} />
        <span>Puedo llevarlo yo</span>
      </label>
      <label className="block">
        <span className={field.label}>Algo más</span>
        <textarea name="message" rows={3} className={field.textarea} />
      </label>
      {state?.error && <p className={alertBox}>{state.error}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

export function SupportForm({ kind }: { kind: SupportOfferKind }) {
  if (kind === "voluntario") return <VolunteerForm />;
  if (kind === "profesion") return <ProfessionForm />;
  return <ResourceForm />;
}
