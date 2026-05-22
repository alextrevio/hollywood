import type { Json } from "@/types/database"
import type { Brief, BriefComment } from "@/types/db"

// ---------------------------------------------------------------------------
// Entrada / salida de la Edge Function generate-briefs
// ---------------------------------------------------------------------------
export type BriefObjective = "awareness" | "promotion" | "event" | "engagement"
export type BriefStatus = "pending" | "approved" | "rejected"

export interface GenerateBriefsInput {
  brand_id: string
  occasion: string
  objective: BriefObjective
  num_ideas: number
  format_preferences: string[]
  extra_notes?: string
}

export interface GenerateBriefsResult {
  session_id: string
  briefs: Brief[]
}

// ---------------------------------------------------------------------------
// Shapes estructurados de las columnas JSONB de briefs
// ---------------------------------------------------------------------------
export interface FormatSuggestion {
  type: string
  dimensions: string
}

export interface VisualBrief {
  uses_stock: boolean
  image_description: string
  style: "photographic" | "illustration" | "minimalist" | "collage" | "typography_focused"
  mood: string
  composition: string
  text_position: "top" | "center" | "bottom" | "left" | "right" | "overlay" | "none"
  colors: string[]
}

export function parseFormatSuggestions(json: Json | null): FormatSuggestion[] {
  return Array.isArray(json) ? (json as unknown as FormatSuggestion[]) : []
}

export function parseVisualBrief(json: Json | null): VisualBrief | null {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as unknown as VisualBrief
  }
  return null
}

// ---------------------------------------------------------------------------
// Tipos de resultados de query (con relaciones embebidas)
// ---------------------------------------------------------------------------
export interface BriefSessionInfo {
  id: string
  occasion: string | null
  objective: string | null
  started_at: string | null
}

export interface BriefWithSession extends Brief {
  session: BriefSessionInfo | null
}

export interface CommentWithProfile extends BriefComment {
  profile: { full_name: string | null; avatar_url: string | null } | null
}

// ---------------------------------------------------------------------------
// Opciones para la UI (Bloque 18)
// ---------------------------------------------------------------------------
export const OBJECTIVE_OPTIONS: { value: BriefObjective; label: string }[] = [
  { value: "awareness", label: "Awareness" },
  { value: "promotion", label: "Promoción" },
  { value: "event", label: "Evento" },
  { value: "engagement", label: "Engagement" },
]

export const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "carousel", label: "Carrusel" },
  { value: "email_banner", label: "Banner email" },
  { value: "flyer", label: "Flyer" },
]
