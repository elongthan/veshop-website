import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Used for all public catalog reads (home, shop, category, product pages).
// Unlike lib/supabase/server.js, this does NOT touch cookies/session,
// so it's safe to call during build and metadata generation.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
