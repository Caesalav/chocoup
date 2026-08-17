"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** createBrowserClient ya es un singleton: se puede llamar en cada componente. */
export function createSupabaseBrowserClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
