"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCaseUpdate, deleteCaseUpdate, updateCaseUpdate } from "@/app/admin/actions";
import { PhotoCropEditor, defaultFrame } from "./PhotoCropEditor";
import { PhotoFrameButton } from "./PhotoFrameButton";
import { uploadCasePhoto } from "./upload-case-photo";
import { DangerSubmitButton } from "./SubmitButton";
import { Photo } from "@/components/ui/Photo";
import { button, field } from "@/components/ui/styles";
import { formatDay } from "@/lib/format";
import type { PhotoFrame } from "@/lib/photo-frame";
import { isDemoMode } from "@/lib/supabase/env";
import type { CaseUpdate } from "@/lib/types";

export function ProgressManager({
  cityId,
  caseId,
  updates,
}: {
  cityId: string;
  caseId: string;
  updates: CaseUpdate[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{ url: string; frame: PhotoFrame } | null>(null);
  const demo = isDemoMode();

  function onCreate(form: HTMLFormElement) {
    setError("");
    const data = new FormData(form);
    const file = data.get("photo");

    if (!(file instanceof File) || file.size === 0) {
      setError("Cada avance necesita una fotografía.");
      return;
    }

    const frame = draft?.frame ?? null;

    startTransition(async () => {
      try {
        const photoId = await uploadCasePhoto(file, cityId, caseId, frame);
        data.set("photo_id", photoId);
        data.delete("photo");
        await createCaseUpdate(data);
        if (draft) URL.revokeObjectURL(draft.url);
        setDraft(null);
        form.reset();
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo guardar el avance.");
      }
    });
  }

  return (
    <div>
      {demo ? (
        <p className="mb-4 rounded-lg border border-dashed border-line-strong bg-panel px-3.5 py-3 text-sm text-muted">
          Añadir avances con foto necesita Storage. Con datos de muestra se ve el historial, pero
          no hay dónde guardar uno nuevo.
        </p>
      ) : (
        <form
          className="rounded-xl border border-line bg-panel p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate(event.currentTarget);
          }}
        >
          <input type="hidden" name="city_id" value={cityId} />
          <input type="hidden" name="case_id" value={caseId} />

          <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <label className="block">
              <span className={field.label}>Fecha</span>
              <input name="happened_on" type="date" required defaultValue={today} className={field.input} />
            </label>
            <label className="block">
              <span className={field.label}>Título</span>
              <input
                name="title"
                required
                className={field.input}
                placeholder="Ej.: Arquitecto asignado"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={field.label}>Qué se hizo</span>
              <textarea
                name="body"
                required
                rows={3}
                className={field.textarea}
                placeholder="Lo concreto: el plano, quién quedó a cargo, qué material llegó."
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={field.label}>Fotografía</span>
              <input
                name="photo"
                type="file"
                accept="image/*"
                required
                className={field.input}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (draft) URL.revokeObjectURL(draft.url);
                  if (!file) {
                    setDraft(null);
                    return;
                  }
                  setDraft({ url: URL.createObjectURL(file), frame: defaultFrame("situation") });
                }}
              />
            </label>
          </div>

          {draft && (
            <div className="mt-4">
              <PhotoCropEditor
                src={draft.url}
                kind="situation"
                value={draft.frame}
                onChange={(frame) => setDraft((current) => (current ? { ...current, frame } : current))}
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-need-high">{error}</p>}

          <div className="mt-3">
            <button type="submit" className={`${button.primary} disabled:opacity-60`} disabled={pending}>
              {pending ? "Añadiendo…" : "Añadir al seguimiento"}
            </button>
          </div>
        </form>
      )}

      {updates.length > 0 && (
        <ol className="mt-4 divide-y divide-line rounded-xl border border-line bg-panel">
          {updates.map((update) => (
            <li key={update.id} className="p-4">
              <div className="flex gap-3">
                <Photo
                  path={update.photoPath}
                  frame={update.photoFrame}
                  alt={update.title}
                  className="size-20 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-faint">{formatDay(update.happened_on)}</p>
                  <h4 className="mt-0.5 font-display text-[16px] leading-tight text-ink">
                    {update.title}
                  </h4>
                  {update.body && (
                    <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted">{update.body}</p>
                  )}
                </div>
              </div>

              {!demo && (
                <>
                  {update.photo_id && update.photoPath && (
                    <div className="mt-3">
                      <PhotoFrameButton
                        photo={{
                          id: update.photo_id,
                          city_id: update.city_id,
                          case_id: update.case_id,
                          storage_path: update.photoPath,
                          thumb_path: "",
                          caption: "",
                          sort_order: 0,
                          focus_x: update.photoFrame?.focusX ?? null,
                          focus_y: update.photoFrame?.focusY ?? null,
                          zoom: update.photoFrame?.zoom ?? null,
                          byte_size: 0,
                          thumb_byte_size: 0,
                          created_at: update.created_at,
                        }}
                        kind="situation"
                      />
                    </div>
                  )}
                  <UpdateEditor update={update} cityId={cityId} caseId={caseId} />
                  <form action={deleteCaseUpdate} className="mt-2">
                    <input type="hidden" name="id" value={update.id} />
                    <DangerSubmitButton confirmText="¿Borrar este avance del seguimiento?">
                      Borrar avance
                    </DangerSubmitButton>
                  </form>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function UpdateEditor({
  update,
  cityId,
  caseId,
}: {
  update: CaseUpdate;
  cityId: string;
  caseId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<{ url: string; frame: PhotoFrame } | null>(null);

  return (
    <form
      className="mt-3 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get("photo");
        setError("");

        startTransition(async () => {
          try {
            if (file instanceof File && file.size > 0) {
              const photoId = await uploadCasePhoto(file, cityId, caseId, draft?.frame ?? null);
              data.set("photo_id", photoId);
            }
            data.delete("photo");
            await updateCaseUpdate(data);
            if (draft) URL.revokeObjectURL(draft.url);
            setDraft(null);
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "No se pudo guardar el avance.");
          }
        });
      }}
    >
      <input type="hidden" name="id" value={update.id} />
      <label className="block">
        <span className={field.label}>Fecha</span>
        <input
          name="happened_on"
          type="date"
          required
          defaultValue={update.happened_on.slice(0, 10)}
          className={field.input}
        />
      </label>
      <label className="block">
        <span className={field.label}>Título</span>
        <input name="title" required defaultValue={update.title} className={field.input} />
      </label>
      <label className="block sm:col-span-2">
        <span className={field.label}>Qué se hizo</span>
        <textarea name="body" required rows={3} defaultValue={update.body} className={field.textarea} />
      </label>
      <label className="block sm:col-span-2">
        <span className={field.label}>Cambiar fotografía</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className={field.input}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (draft) URL.revokeObjectURL(draft.url);
            if (!file) {
              setDraft(null);
              return;
            }
            setDraft({ url: URL.createObjectURL(file), frame: defaultFrame("situation") });
          }}
        />
      </label>
      {draft && (
        <div className="sm:col-span-2">
          <PhotoCropEditor
            src={draft.url}
            kind="situation"
            value={draft.frame}
            onChange={(frame) => setDraft((current) => (current ? { ...current, frame } : current))}
          />
        </div>
      )}
      {error && <p className="text-sm text-need-high sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className={`${button.secondary} disabled:opacity-60`} disabled={pending}>
          {pending ? "Guardando…" : "Guardar avance"}
        </button>
      </div>
    </form>
  );
}
