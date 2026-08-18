"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPhoto } from "@/app/admin/actions";
import { PHOTO_BUCKET } from "@/lib/constants";
import { formatBytes, prepareImage, storagePathsFor } from "@/lib/photos";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { button } from "@/components/ui/styles";

type Item = {
  key: string;
  name: string;
  state: "preparando" | "subiendo" | "listo" | "error";
  note: string;
};

/**
 * Comprime en el navegador y sube directo a Storage, una foto a la vez.
 * Secuencial a propósito: con la señal del Chocó, cinco subidas en paralelo se
 * estorban entre ellas y fallan todas.
 */
export function PhotoUploader({
  cityId,
  caseId = null,
}: {
  cityId: string;
  caseId?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function update(key: string, patch: Partial<Item>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  async function onFiles(files: FileList) {
    const supabase = createSupabaseBrowserClient();
    const queue = Array.from(files).map((file) => ({
      file,
      key: `${file.name}-${crypto.randomUUID()}`,
    }));

    setItems((current) => [
      ...current,
      ...queue.map(({ file, key }) => ({
        key,
        name: file.name,
        state: "preparando" as const,
        note: formatBytes(file.size),
      })),
    ]);
    setBusy(true);

    for (const { file, key } of queue) {
      const { full, thumb, extension, originalSize } = await prepareImage(file);
      update(key, {
        state: "subiendo",
        note: `${formatBytes(originalSize)} → ${formatBytes(full.size)}`,
      });

      const paths = storagePathsFor(cityId, caseId, extension);
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(paths.full, full, {
        contentType: full.type || "image/jpeg",
        upsert: false,
      });

      if (error) {
        update(key, { state: "error", note: error.message });
        continue;
      }

      // Si la miniatura no sube, la foto ya está a salvo: se registra sin ella y
      // las cuadrículas usarán la grande.
      let thumbPath = "";
      if (thumb) {
        const upload = await supabase.storage.from(PHOTO_BUCKET).upload(paths.thumb, thumb, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (!upload.error) thumbPath = paths.thumb;
      }

      try {
        await registerPhoto({ cityId, caseId, storagePath: paths.full, thumbPath });
        update(key, {
          state: "listo",
          note: thumbPath
            ? `${formatBytes(full.size)} + ${formatBytes(thumb!.size)}`
            : formatBytes(full.size),
        });
      } catch {
        update(key, { state: "error", note: "Se subió pero no se registró" });
      }
    }

    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void onFiles(event.target.files);
        }}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        className={button.secondary}
        disabled={busy}
      >
        {busy ? "Subiendo…" : "Añadir fotos"}
      </button>
      {/* Dentro de un caso hay un paso más que no se ve en el botón: una de estas
          fotos va a ser el retrato de la persona, y hay que elegirla. Se dice aquí
          porque es el momento en el que el equipo acaba de mirar las fotos y sabe
          cuál es; el selector está justo debajo. */}
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Se comprimen en el teléfono antes de subir, para que lleguen con mala señal.
        {caseId && " Cuando terminen, marca abajo cuál es su retrato y encuadra cada foto."}
      </p>

      {items.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {items.map((item) => (
            <li key={item.key} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-muted">{item.name}</span>
              {/* Lo que falló va en el rojo de la escala y lo que subió en
                  verde. Eran dos verdes casi iguales, y en una lista de diez
                  fotos subiendo con mala señal hay que ver de un vistazo cuál
                  se quedó por el camino. */}
              <span
                className={
                  item.state === "error"
                    ? "shrink-0 text-need-high"
                    : item.state === "listo"
                      ? "shrink-0 text-accent-strong"
                      : "shrink-0 text-faint"
                }
              >
                {item.state === "listo" ? item.note : `${item.state} · ${item.note}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
