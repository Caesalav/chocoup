/** Convierte "Bahía Solano" en "bahia-solano". */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Añade un sufijo numérico si el slug ya existe. */
export function uniqueSlug(base: string, taken: string[]): string {
  const root = slugify(base) || "ciudad";
  if (!taken.includes(root)) return root;
  for (let i = 2; i < 100; i += 1) {
    const candidate = `${root}-${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
