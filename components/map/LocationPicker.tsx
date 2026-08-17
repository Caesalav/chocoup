"use client";

import { useRef, useState } from "react";
import {
  CHOCO_PATH,
  projectToMap,
  unprojectFromMap,
  viewBoxAttr,
} from "@/lib/choco-map";
import { button, field } from "@/components/ui/styles";

type Props = {
  initialLat?: number | null;
  initialLng?: number | null;
};

/**
 * Fija las coordenadas de un municipio tocando el esquema del Chocó, y las
 * publica en inputs de texto para que el formulario siga siendo un POST normal.
 *
 * Los inputs guardan texto, no números: si se reformatearan en cada tecla no se
 * podría escribir un decimal a mano.
 */
export function LocationPicker({ initialLat = null, initialLng = null }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [latText, setLatText] = useState(initialLat === null ? "" : initialLat.toFixed(6));
  const [lngText, setLngText] = useState(initialLng === null ? "" : initialLng.toFixed(6));
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const lat = Number(latText);
  const lng = Number(lngText);
  const hasPoint = latText !== "" && lngText !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  const point = hasPoint ? projectToMap(lat, lng) : null;

  function place(nextLat: number, nextLng: number) {
    setLatText(nextLat.toFixed(6));
    setLngText(nextLng.toFixed(6));
  }

  function onMapClick(event: React.MouseEvent<SVGSVGElement>) {
    const element = svg.current;
    const matrix = element?.getScreenCTM();
    if (!element || !matrix) return;

    // Convierte el clic a coordenadas del viewBox sin suponer nada de la escala.
    const cursor = element.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const inViewBox = cursor.matrixTransform(matrix.inverse());

    const next = unprojectFromMap(inViewBox.x, inViewBox.y);
    place(next.lat, next.lng);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("Este navegador no comparte la ubicación.");
      return;
    }
    setGeoError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        place(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
        setGeoError("No pudimos leer tu ubicación. Toca el mapa o escribe las coordenadas.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line bg-canvas p-2">
        <svg
          ref={svg}
          viewBox={viewBoxAttr}
          onClick={onMapClick}
          className="mx-auto h-auto w-full max-w-64 cursor-crosshair"
          role="presentation"
        >
          <path
            d={CHOCO_PATH}
            className="fill-land stroke-contour"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {point && (
            <>
              <circle cx={point.x} cy={point.y} r={11} className="fill-amber" />
              <circle
                cx={point.x}
                cy={point.y}
                r={22}
                className="fill-none stroke-amber"
                strokeWidth={3}
                opacity={0.5}
              />
            </>
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          className={button.secondary}
          disabled={locating}
        >
          {locating ? "Buscando…" : "Usar mi ubicación"}
        </button>
        <p className="text-xs text-muted">
          {hasPoint
            ? "Toca el esquema para ajustarlo."
            : "Toca el esquema donde está el municipio."}
        </p>
      </div>

      {geoError && <p className="mt-2 text-xs text-amber">{geoError}</p>}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={field.label}>Latitud</span>
          <input
            name="lat"
            required
            inputMode="decimal"
            value={latText}
            onChange={(event) => setLatText(event.target.value)}
            className={field.input}
            placeholder="5.6947"
          />
        </label>
        <label className="block">
          <span className={field.label}>Longitud</span>
          <input
            name="lng"
            required
            inputMode="decimal"
            value={lngText}
            onChange={(event) => setLngText(event.target.value)}
            className={field.input}
            placeholder="-76.6611"
          />
        </label>
      </div>
    </div>
  );
}
