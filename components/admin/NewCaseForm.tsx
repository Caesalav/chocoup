"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCase, createCaseRecord, setCasePortrait } from "@/app/admin/actions";
import { CaseFields } from "./CaseFields";
import { CasePhotoDrafts, type DraftPhoto } from "./CasePhotoDrafts";
import { FormSection } from "./FormSection";
import { uploadCasePhoto } from "./upload-case-photo";
import { alertBox, button } from "@/components/ui/styles";
import { isDemoMode } from "@/lib/supabase/env";

/**
 * Abrir una causa con lo que se sabe el primer día, incluidas las fotos.
 *
 * Sin JavaScript el formulario envía la identidad y salta a la ficha, donde se
 * pueden añadir las fotos a mano. Con JavaScript las comprime en el teléfono,
 * crea el caso y las sube seguidas —una a una, por la señal del Chocó—.
 */
export function NewCaseForm({
  cities,
  defaultCityId,
}: {
  cities: { id: string; name: string }[];
  defaultCityId?: string;
}) {
  const router = useRouter();
  const demo = isDemoMode();
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [portraitKey, setPortraitKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) URL.revokeObjectURL(photo.url);
    };
  }, []);

  function addFiles(files: File[]) {
    const drafts = files.map((file) => ({
      key: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...drafts]);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        setStatus("Creando el caso…");
        const created = await createCaseRecord(data);

        if (!demo && photos.length > 0) {
          let portraitId: string | null = null;

          for (let index = 0; index < photos.length; index++) {
            const draft = photos[index];
            setStatus(`Subiendo fotos ${index + 1} de ${photos.length}…`);
            try {
              const photoId = await uploadCasePhoto(draft.file, created.cityId, created.id);
              if (draft.key === portraitKey) portraitId = photoId;
            } catch {
              // La causa ya existe: lo que no suba se puede completar en la ficha.
            }
          }

          if (portraitId) {
            const portrait = new FormData();
            portrait.set("case_id", created.id);
            portrait.set("photo_id", portraitId);
            await setCasePortrait(portrait);
          }
        }

        router.push(`/admin/ciudades/${created.slug}/casos/${created.id}`);
        router.refresh();
      } catch (caught) {
        setStatus("");
        setError(caught instanceof Error ? caught.message : "No se pudo crear el caso.");
      }
    });
  }

  return (
    <form action={createCase} onSubmit={onSubmit} className="mt-8">
      {error && <p className={`${alertBox} mb-5`}>{error}</p>}

      <div className="space-y-5">
        <FormSection
          title="Quién es y qué le pasó"
          hint="Esto es lo que sale en la tarjeta y en WhatsApp. Sin consentimiento se guarda, pero nadie fuera del equipo lo ve."
        >
          <CaseFields cities={cities} defaultCityId={defaultCityId} />
        </FormSection>

        <FormSection
          title="Fotos"
          hint="Toca la cara de la persona para marcarla como retrato: sale en la tarjeta, recortada en redondo. El resto son de la situación. Si ninguna sirve de retrato, no toques ninguna: la tarjeta pone las iniciales."
        >
          {demo ? (
            <p className="rounded-lg border border-dashed border-line-strong bg-panel-high px-3.5 py-3 text-sm text-muted">
              Subir fotos necesita Storage. Con datos de muestra el caso se puede abrir, pero no hay
              dónde guardar las imágenes.
            </p>
          ) : (
            <CasePhotoDrafts
              photos={photos}
              portraitKey={portraitKey}
              onAdd={addFiles}
              onRemove={(key) => setPhotos((current) => current.filter((photo) => photo.key !== key))}
              onPortrait={setPortraitKey}
              disabled={pending}
            />
          )}
        </FormSection>
      </div>

      <div className="mt-6">
        <button type="submit" className={button.primary} disabled={pending}>
          {pending ? status || "Creando…" : "Crear caso"}
        </button>
        {photos.length > 0 && !pending && (
          <p className="mt-2 text-xs text-muted">
            {photos.length === 1
              ? "Va una foto."
              : `Van ${photos.length} fotos.`}
            {portraitKey ? " Una queda de retrato." : " Sin retrato, de momento."}
          </p>
        )}
      </div>
    </form>
  );
}
