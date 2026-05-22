import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno de Supabase. Copia .env.example a .env.local y " +
      "rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.",
  )
}

/**
 * Typed Supabase client (singleton).
 *
 * Uses the ANON key, which is public-by-design (it ships in the browser bundle).
 * Data access is protected by Row Level Security (RLS), defined in the migration.
 * Never use the service_role key in client code.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
