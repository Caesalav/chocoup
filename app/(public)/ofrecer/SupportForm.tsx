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

/**
 * De qué pantalla sale el envío.
 *
 * Viaja en el formulario porque la acción no puede saberlo de otra forma, y la
 * acción lo necesita para una sola decisión: si redirige a la pantalla de
 * gracias o si contesta sin moverse. Desde la landing tiene que contestar,
 * porque /ofrecer/gracias está detrás del cerrojo. Está explicado en
 * support-actions.ts.
 */
function From({ from }: { from?: string }) {
  return from ? <input type="hidden" name="desde" value={from} /> : null;
}

/**
 * Lo que se ve cuando el envío salió bien y no hubo redirección.
 *
 * Sustituye al formulario entero en vez de ponerse encima: dejarlo debajo de
 * un formulario todavía relleno invita a darle otra vez, y son dos filas en la
 * bandeja del equipo para la misma persona.
 */
function Sent() {
  return (
    <div
      role="status"
      className="mt-6 rounded-2xl border border-selva/20 bg-brote p-5 text-selva"
    >
      <p className="font-display text-[20px] leading-tight">Recibido, gracias.</p>
      <p className="mt-2 text-[14px] leading-relaxed">
        Ya está en la bandeja del equipo. Te escribimos al correo que dejaste
        cuando podamos encajarte. No publicamos tu contacto.
      </p>
    </div>
  );
}

function isSent(state: SupportFormState): boolean {
  return state !== null && "ok" in state;
}

function errorOf(state: SupportFormState): string | null {
  return state !== null && "error" in state ? state.error : null;
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

export function VolunteerForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  if (isSent(state)) return <Sent />;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="voluntario" />
      <From from={from} />
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
      {errorOf(state) && <p className={alertBox}>{errorOf(state)}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

export function ProfessionForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  if (isSent(state)) return <Sent />;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="profesion" />
      <From from={from} />
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
      {errorOf(state) && <p className={alertBox}>{errorOf(state)}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

export function ResourceForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  if (isSent(state)) return <Sent />;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="recurso" />
      <From from={from} />
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
      {errorOf(state) && <p className={alertBox}>{errorOf(state)}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

/**
 * La fundación, que es el único de los cuatro que no pregunta por una persona
 * sino por una organización.
 *
 * De ahí que no use `ContactFields`: ahí «Tu nombre» es quien ofrece, y aquí
 * quien ofrece es la entidad. Se pregunta el nombre legal —el que sirve para
 * comprobar que existe— y aparte quién responde al teléfono, que son dos datos
 * distintos y meterlos en un solo campo obliga al equipo a adivinar cuál tiene
 * delante cuando llama.
 *
 * El NIT es opcional a propósito: media ayuda del Chocó la mueven colectivos
 * sin formalizar, y exigirlo dejaría fuera justo a quien ya está en el pueblo.
 * Está explicado en 0026.
 */
export function FoundationForm({ from }: { from?: string }) {
  const [state, action, pending] = useActionState<SupportFormState, FormData>(
    submitSupportOffer,
    null,
  );

  if (isSent(state)) return <Sent />;

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="kind" value="fundacion" />
      <From from={from} />
      <Honeypot />

      <label className="block">
        <span className={field.label}>Nombre legal de la fundación</span>
        <input
          name="legal_name"
          required
          minLength={2}
          maxLength={200}
          className={field.input}
          placeholder="Corporación para el Desarrollo del Atrato"
        />
      </label>
      <label className="block">
        <span className={field.label}>Cómo se les conoce</span>
        <input
          name="display_name"
          maxLength={200}
          className={field.input}
          placeholder="Atrato Vive"
        />
        <span className={field.hint}>Déjalo vacío si es el mismo nombre.</span>
      </label>
      <label className="block">
        <span className={field.label}>NIT</span>
        <input name="nit" maxLength={40} className={field.input} placeholder="901234567-8" />
        <span className={field.hint}>
          Si todavía no están formalizados, déjalo vacío: se pueden apuntar igual.
        </span>
      </label>

      <label className="block">
        <span className={field.label}>Quién responde</span>
        <input
          name="contact_name"
          required
          minLength={2}
          maxLength={120}
          className={field.input}
          autoComplete="name"
        />
        <span className={field.hint}>Por quién preguntamos cuando llamemos.</span>
      </label>
      <label className="block">
        <span className={field.label}>Correo</span>
        <input name="email" type="email" required className={field.input} autoComplete="email" />
        <span className={field.hint}>No se publica.</span>
      </label>
      <label className="block">
        <span className={field.label}>Teléfono o WhatsApp</span>
        <input name="phone" className={field.input} autoComplete="tel" placeholder="300 123 4567" />
      </label>
      {/* `site_url` y no `website`, que sería el nombre natural: `website` ya lo
          usa la trampa para robots de `Honeypot`, que va antes en el
          formulario. Con dos campos del mismo nombre, `formData.get("website")`
          devuelve el primero —la trampa, siempre vacía— y la dirección que
          escribió la fundación se pierde sin un solo error. Pasó, y solo se vio
          mirando la fila en la base. */}
      <label className="block">
        <span className={field.label}>Página o red social</span>
        <input name="site_url" maxLength={300} className={field.input} placeholder="atratovive.org" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Dónde está la sede</span>
          <input name="city_name" className={field.input} placeholder="Quibdó" />
        </label>
        <label className="block">
          <span className={field.label}>En qué ayudan sobre todo</span>
          <select name="category" className={field.select} defaultValue="otro">
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
        <input
          name="coverage"
          maxLength={400}
          className={field.input}
          placeholder="El medio Atrato, cinco veredas de Bojayá…"
        />
      </label>

      <label className="block">
        <span className={field.label}>A qué se dedican</span>
        <textarea
          name="focus"
          required
          rows={3}
          className={field.textarea}
          placeholder="Qué hacen y desde cuándo, en pocas palabras."
        />
      </label>
      <label className="block">
        <span className={field.label}>Qué pueden aportar ahora</span>
        <textarea
          name="offering"
          rows={3}
          className={field.textarea}
          placeholder="Diez voluntarios, una bodega en Istmina, un camión, brigada médica…"
        />
        <span className={field.hint}>
          Es lo que nos deja saber a quién llamar cuando falte algo concreto.
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={field.label}>Cuánta gente son</span>
          <input name="team_size" maxLength={80} className={field.input} placeholder="12 personas" />
        </label>
        <label className="block">
          <span className={field.label}>Desde qué año</span>
          <input name="founded_year" maxLength={20} className={field.input} placeholder="2018" />
        </label>
      </div>

      <label className="block">
        <span className={field.label}>Algo más que debamos saber</span>
        <textarea name="message" rows={3} className={field.textarea} />
      </label>

      {errorOf(state) && <p className={alertBox}>{errorOf(state)}</p>}
      <button type="submit" disabled={pending} className={button.invite}>
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}

/**
 * `from` solo lo pasa la landing. En /ofrecer se omite, y entonces la acción se
 * comporta como siempre: guarda y redirige a la pantalla de gracias.
 */
export function SupportForm({ kind, from }: { kind: SupportOfferKind; from?: string }) {
  if (kind === "voluntario") return <VolunteerForm from={from} />;
  if (kind === "profesion") return <ProfessionForm from={from} />;
  if (kind === "fundacion") return <FoundationForm from={from} />;
  return <ResourceForm from={from} />;
}
