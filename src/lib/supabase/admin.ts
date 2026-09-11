import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service role key: bypassa RLS. Uso exclusivo en
// server actions / route handlers, nunca en código que corra en el browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
