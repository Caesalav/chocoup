/**
 * Las claves se leen en cada llamada y no al cargar el módulo: así el portal
 * compila y arranca antes de que exista el proyecto de Supabase, y muestra un
 * aviso de configuración en vez de romperse.
 */
export function supabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = supabaseEnv();
  return url.length > 0 && key.length > 0;
}

/**
 * Sin base de datos, el portal se llena con datos de muestra para poder
 * valorar el diseño y el recorrido. En cuanto existan las claves, desaparece.
 */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
