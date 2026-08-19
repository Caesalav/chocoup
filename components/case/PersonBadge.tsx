/** Iniciales de las dos primeras palabras con peso, saltando los enlaces. */
export function personInitials(name: string): string {
  const skip = new Set(["de", "del", "la", "las", "los", "y", "el"]);
  return name
    .split(/\s+/)
    .filter((word) => word.length > 1 && !skip.has(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/*
 * Del archivo se han ido dos componentes y queda la función.
 *
 * Primero un `PersonPortrait` que dibujaba las iniciales de una familia y que ya
 * no llamaba nadie: eso lo hace `CasePortrait`, que además sabe pintar el retrato
 * cuando lo hay. Y ahora el `PersonBadge` que le daba nombre, que enseñaba a la
 * fundación del municipio y a su persona de contacto al pie de la ficha de un
 * caso; las fundaciones se fueron con 0015 y ese bloque con ellas.
 *
 * El nombre del archivo se queda. `personInitials` la llama `CasePortrait` y
 * renombrarlo movería un import por un archivo que no cambia de oficio: sigue
 * siendo de dónde salen las dos letras cuando no hay cara que enseñar.
 */
