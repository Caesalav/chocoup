/**
 * El cupo de fotos del plan gratuito, y cómo se reparte entre municipios y causas.
 *
 * Las fotos viven en Supabase Storage, no en Vercel. Vercel sirve el HTML; el
 * JPEG sale del bucket `fotos`. El número que hay que mirar es 1 GB de archivos
 * y, si el portal se comparte mucho, 5 GB de salida al mes: servir la grande
 * (1600 px) en cada tarjeta gastaría ese segundo cupo diez veces más rápido
 * que servir la miniatura.
 */

/** 1 GB de archivos, plan gratuito de Supabase. */
export const SUPABASE_FREE_FILE_BYTES = 1 * 1024 * 1024 * 1024;

/** 5 GB de salida al mes, plan gratuito de Supabase. */
export const SUPABASE_FREE_EGRESS_BYTES = 5 * 1024 * 1024 * 1024;

/** Tope de un solo archivo en el plan gratuito. */
export const SUPABASE_FREE_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export type PhotoUsageRow = {
  id: string;
  city_id: string;
  city_name: string;
  city_slug: string;
  case_id: string | null;
  case_name: string | null;
  byte_size: number;
  thumb_byte_size: number;
};

export type CaseUsage = {
  caseId: string | null;
  caseName: string | null;
  photoCount: number;
  bytes: number;
};

export type CityUsage = {
  cityId: string;
  cityName: string;
  citySlug: string;
  photoCount: number;
  bytes: number;
  cases: CaseUsage[];
};

export type StorageUsage = {
  totalBytes: number;
  photoCount: number;
  quotaBytes: number;
  cities: CityUsage[];
};

export function photoStoredBytes(row: {
  byte_size: number | null | undefined;
  thumb_byte_size: number | null | undefined;
}): number {
  return Math.max(0, Number(row.byte_size) || 0) + Math.max(0, Number(row.thumb_byte_size) || 0);
}

export function groupPhotoUsage(
  rows: PhotoUsageRow[],
  quotaBytes: number = SUPABASE_FREE_FILE_BYTES,
): StorageUsage {
  const cities = new Map<string, CityUsage>();

  for (const row of rows) {
    const bytes = photoStoredBytes(row);
    let city = cities.get(row.city_id);
    if (!city) {
      city = {
        cityId: row.city_id,
        cityName: row.city_name,
        citySlug: row.city_slug,
        photoCount: 0,
        bytes: 0,
        cases: [],
      };
      cities.set(row.city_id, city);
    }
    city.photoCount += 1;
    city.bytes += bytes;

    const caseKey = row.case_id ?? "";
    let caseRow = city.cases.find((entry) => (entry.caseId ?? "") === caseKey);
    if (!caseRow) {
      caseRow = {
        caseId: row.case_id,
        caseName: row.case_name,
        photoCount: 0,
        bytes: 0,
      };
      city.cases.push(caseRow);
    }
    caseRow.photoCount += 1;
    caseRow.bytes += bytes;
  }

  const list = [...cities.values()].sort((a, b) => b.bytes - a.bytes);
  for (const city of list) {
    city.cases.sort((a, b) => b.bytes - a.bytes);
  }

  return {
    totalBytes: list.reduce((sum, city) => sum + city.bytes, 0),
    photoCount: list.reduce((sum, city) => sum + city.photoCount, 0),
    quotaBytes,
    cities: list,
  };
}

export function usageRatio(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.min(1, Math.max(0, used / quota));
}
