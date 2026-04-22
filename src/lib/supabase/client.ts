import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseEnv();

  // ### keep the browser client aligned with the SSR auth callback so cookies and client auth state stay in sync
  browserClient = createBrowserClient<Database>(url, anonKey, {
    isSingleton: true,
  });

  return browserClient;
}
