"use client";

import { useMemo, useState } from "react";
import { LocationPicker } from "@/components/map/LocationPicker";
import { field } from "@/components/ui/styles";
import { findTowns, townByName, type ChocoTown } from "@/lib/choco-towns";

/**
 * Busca un municipio del Chocó por su nombre y, al reconocerlo, pone el pin
 * en el mapa. El formulario sigue siendo un POST: nombre y coordenadas van en
 * campos normales.
 */
export function TownPicker({
  defaultName = "",
  defaultLat = null,
  defaultLng = null,
}: {
  defaultName?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
}) {
  const known = defaultName ? townByName(defaultName) : undefined;
  const [name, setName] = useState(defaultName);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    defaultLat != null && defaultLng != null
      ? { lat: defaultLat, lng: defaultLng }
      : known
        ? { lat: known.lat, lng: known.lng }
        : null,
  );
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => findTowns(name).slice(0, 8), [name]);
  const exact = name ? townByName(name) : undefined;

  function choose(town: ChocoTown) {
    setName(town.name);
    setPin({ lat: town.lat, lng: town.lng });
    setOpen(false);
  }

  function onNameChange(value: string) {
    setName(value);
    setOpen(true);
    const hit = townByName(value);
    if (hit) setPin({ lat: hit.lat, lng: hit.lng });
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={field.label}>Municipio</span>
        <span className="relative mt-2 block">
          <input
            name="name"
            required
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            className={`${field.input} mt-0`}
            placeholder="Empieza a escribir: Quibdó, Unguía, Tadó…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="choco-towns"
          />
          {open && name.trim() && matches.length > 0 && (
            <ul
              id="choco-towns"
              role="listbox"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-line bg-panel-high py-1 shadow-float"
            >
              {matches.map((town) => (
                <li key={town.name}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={exact?.name === town.name}
                    className="flex w-full min-h-11 items-center px-3.5 text-left text-[15px] text-ink hover:bg-line"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(town)}
                  >
                    {town.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>
        <span className={field.hint}>
          Son los treinta del departamento. Al reconocerlo, el mapa se enciende en ese punto.
        </span>
      </label>

      <div>
        <span className={field.label}>Ubicación</span>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {pin
            ? exact
              ? `En el mapa: ${exact.name}. Ajústalo si el punto no cae donde está el pueblo.`
              : "Toca el esquema para ajustarlo."
            : "Elige un municipio arriba, o toca el esquema."}
        </p>
        <div className="mt-2">
          <LocationPicker
            key={pin ? `${pin.lat}:${pin.lng}` : "empty"}
            initialLat={pin?.lat ?? null}
            initialLng={pin?.lng ?? null}
          />
        </div>
      </div>
    </div>
  );
}
