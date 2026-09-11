import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para usar en Server Components / Server Actions con la sesión
// del organizador (respeta RLS mediante el JWT del usuario logueado).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se ignora si se llama desde un Server Component: el
            // middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    },
  );
}
