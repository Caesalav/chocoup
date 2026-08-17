"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { submitOffer, type OfferFormState } from "./actions";
import { NEED_CATEGORIES } from "@/lib/constants";
import { button, field } from "@/components/ui/styles";
import type { OfferTarget } from "@/lib/types";

/** Ejemplos que se pueden tocar: quien no sabe qué escribir, copia uno. */
const EXAMPLES = [
  "20 tejas de zinc",
  "Un mercado para una familia",
  "Transporte desde Medellín",
  "Medicinas para la tensión",
  "Un día de trabajo",
];

const STEPS = [
  { title: "¿Qué puedes dar?", hint: "Escríbelo con tus palabras." },
  { title: "¿Cómo te contactamos?", hint: "Solo lo ve el equipo." },
  { title: "¿Algo más que debamos saber?", hint: "Puedes dejarlo vacío." },
] as const;

/** Falso en el servidor y verdadero en el navegador, sin pasar por un efecto. */
const noop = () => () => {};
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/**
 * Una pregunta por pantalla.
 *
 * Antes eran cinco campos a la vez, que es donde la gente abandona. Ahora se
 * avanza de a una pregunta, con el progreso siempre visible y ejemplos que se
 * pueden tocar.
 *
 * Se hidrata progresivamente: el servidor manda las tres preguntas visibles, así
 * que sin JavaScript el formulario sigue siendo un formulario normal, y solo al
 * hidratarse se convierte en pasos.
 */
export function OfferForm({ target }: { target: OfferTarget | null }) {
  const [state, action, pending] = useActionState<OfferFormState, FormData>(submitOffer, null);
  const [step, setStep] = useState(0);
  const [resource, setResource] = useState("");
  const [contact, setContact] = useState("");
  const [nudge, setNudge] = useState("");

  const isWizard = useHydrated();
  const lastStep = STEPS.length - 1;
  const shows = (index: number) => !isWizard || step === index;

  function advance() {
    if (step === 0 && resource.trim().length < 2) {
      setNudge("Cuéntanos qué puedes dar, aunque sea en pocas palabras.");
      return;
    }
    if (step === 1 && contact.trim().length < 5) {
      setNudge("Necesitamos un teléfono, WhatsApp o correo para poder responderte.");
      return;
    }
    setNudge("");
    setStep((current) => Math.min(current + 1, lastStep));
  }

  return (
    <form
      action={action}
      className="mt-8"
      onKeyDown={(event) => {
        // Enter en un paso intermedio avanza, no envía a medias.
        if (event.key === "Enter" && isWizard && step < lastStep) {
          const target = event.target as HTMLElement;
          if (target.tagName === "INPUT") {
            event.preventDefault();
            advance();
          }
        }
      }}
    >
      <input type="hidden" name="need_id" value={target?.needId ?? ""} />
      <input type="hidden" name="case_id" value={target?.caseId ?? ""} />
      <input type="hidden" name="city_id" value={target?.cityId ?? ""} />

      {/* Campo trampa para bots: invisible y sin foco por teclado. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] size-0"
      />

      {isWizard && (
        <div className="mb-8">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  index <= step ? "bg-amber" : "bg-line-strong"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-faint">
            Paso {step + 1} de {STEPS.length} · {STEPS[step].hint}
          </p>
        </div>
      )}

      {/* ------------------------------- Paso 1 ------------------------------ */}
      {shows(0) && (
        <div className="enters">
          <h2 className="font-display text-3xl leading-tight text-ink">{STEPS[0].title}</h2>

          <label className="mt-5 block">
            <span className={field.label}>Lo que puedes dar</span>
            <input
              name="resource"
              required
              maxLength={200}
              value={resource}
              onChange={(event) => setResource(event.target.value)}
              className={field.input}
              placeholder="Ej.: 20 tejas de zinc"
              autoComplete="off"
            />
          </label>

          <p className="mt-4 text-xs text-faint">O toca un ejemplo:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => {
                    setResource(example);
                    setNudge("");
                  }}
                  className="rounded-full border border-line-strong px-3.5 py-2 text-[13px] text-muted transition-[color,border-color,transform] duration-150 hover:border-amber hover:text-ink active:scale-[0.97]"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>

          <label className="mt-6 block">
            <span className={field.label}>¿De qué tipo es?</span>
            <select
              name="category"
              defaultValue={target?.needCategory ?? "otro"}
              className={field.select}
            >
              {NEED_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* ------------------------------- Paso 2 ------------------------------ */}
      {shows(1) && (
        <div className={isWizard ? "enters" : "mt-8"}>
          <h2 className="font-display text-3xl leading-tight text-ink">{STEPS[1].title}</h2>

          <label className="mt-5 block">
            <span className={field.label}>Tu nombre</span>
            <input
              name="offerer_name"
              required
              maxLength={120}
              autoComplete="name"
              className={field.input}
              placeholder="Nombre y apellido"
            />
          </label>

          <label className="mt-5 block">
            <span className={field.label}>Teléfono, WhatsApp o correo</span>
            <input
              name="offerer_contact"
              required
              maxLength={200}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className={field.input}
              placeholder="300 123 4567"
            />
            <span className={field.hint}>
              Nunca lo publicamos. Solo el equipo lo ve, para escribirte.
            </span>
          </label>
        </div>
      )}

      {/* ------------------------------- Paso 3 ------------------------------ */}
      {shows(2) && (
        <div className={isWizard ? "enters" : "mt-8"}>
          <h2 className="font-display text-3xl leading-tight text-ink">{STEPS[2].title}</h2>

          <label className="mt-5 block">
            <span className={field.label}>Detalles</span>
            <textarea
              name="message"
              rows={4}
              maxLength={2000}
              className={field.textarea}
              placeholder="Cuándo puedes entregarlo, desde dónde, si hace falta transporte, si conoces a la persona que dona…"
            />
          </label>

          {isWizard && resource && (
            <div className="mt-6 rounded-xl border border-line bg-panel/50 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">Vas a enviar</p>
              <p className="mt-1.5 text-[15px] text-ink">{resource}</p>
              {contact && <p className="mt-0.5 text-[13px] text-muted">Contacto: {contact}</p>}
            </div>
          )}
        </div>
      )}

      {(nudge || state?.error) && (
        <p
          role="alert"
          className="enters mt-6 rounded-lg bg-amber-soft px-3.5 py-2.5 text-sm text-amber"
        >
          {state?.error ?? nudge}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        {isWizard && step < lastStep ? (
          <button type="button" onClick={advance} className={button.primary}>
            Continuar
          </button>
        ) : (
          <button type="submit" className={button.primary} disabled={pending}>
            {pending ? "Enviando…" : "Enviar"}
          </button>
        )}

        {isWizard && step > 0 && (
          <button
            type="button"
            onClick={() => {
              setNudge("");
              setStep((current) => current - 1);
            }}
            className="text-sm text-faint transition-colors hover:text-body"
          >
            Volver
          </button>
        )}

        {!isWizard || step === lastStep ? (
          <p className="text-xs text-faint">El equipo te escribe al contacto que dejaste.</p>
        ) : null}
      </div>
    </form>
  );
}
