import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * El cliente que se salta las RLS. Existe para una sola cosa: que el webhook de
 * pagos pueda escribir un importe.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ ESTE ARCHIVO ES PELIGROSO Y QUÉ LO SOSTIENE
 *
 * `SUPABASE_SERVICE_ROLE_KEY` es la credencial que la base de datos considera
 * `service_role`, y `service_role` no obedece ninguna política: lee cualquier
 * fila de cualquier tabla y escribe donde quiera. Es, exactamente, la llave que
 * 0017_donaciones_preparadas.sql dejó como única puerta a la tabla de
 * donaciones, y por eso mismo es la única que no puede acercarse al navegador.
 *
 * Tres cosas la mantienen dentro del servidor, y hacen falta las tres:
 *
 *   1. EL NOMBRE. No lleva el prefijo `NEXT_PUBLIC_`, que es lo que hace que
 *      Next meta una variable en el JavaScript que descarga el navegador. Por
 *      eso no está en `supabaseEnv()` con las otras dos: esa función la llama
 *      código que también corre en el cliente.
 *   2. `server-only`. Importar este archivo desde un componente de cliente no
 *      compila. Es la comprobación que no depende de que nadie se acuerde.
 *   3. QUE NO SE USE PARA LEER. Cualquier lectura hecha desde aquí sale sin
 *      pasar por las RLS, así que una consulta escrita con este cliente
 *      «porque es más cómodo» publicaría datos que las políticas esconden. Las
 *      lecturas van por `createSupabaseServerClient()`, siempre, incluidas las
 *      del panel del equipo.
 *
 * Sin la clave devuelve null y no lanza. El portal tiene que poder compilar y
 * servirse sin ella —así está montado el resto de la configuración— y quien la
 * necesita es un webhook que, sin clave, responde que no está listo y lo deja
 * escrito en el registro.
 * ---------------------------------------------------------------------------
 */
export function createSupabaseAdminClient() {
  const { url } = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
