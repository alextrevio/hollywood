/**
 * Database types — PLACEHOLDER STUB.
 *
 * This is a hand-written stub so the typed Supabase client compiles today.
 * Once the migration (supabase/migrations/0001_initial_schema.sql) is applied,
 * regenerate the real types with the Supabase CLI:
 *
 *   npx supabase gen types typescript --project-id kkydesabgmsoailjslsv > src/types/database.ts
 *
 * See CLAUDE.md ("Cómo agregar una nueva tabla") for the full workflow.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
