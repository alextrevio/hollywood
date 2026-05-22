import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/database"

// Row aliases for the Phase 1 tables.
export type Brand = Tables<"brands">
export type BrandInsert = TablesInsert<"brands">
export type BrandIdentity = Tables<"brand_identities">
export type BrandIdentityUpdate = TablesUpdate<"brand_identities">
export type BrandLogo = Tables<"brand_logos">
export type StockAsset = Tables<"stock_assets">
export type BrandReference = Tables<"brand_references">
export type Profile = Tables<"profiles">

// Structured shapes for the JSONB columns on brand_identities.
export interface PaletteColor {
  name: string
  hex: string
  usage: string
}

export interface Typeface {
  family: string
  usage: string
  weights: number[]
}

/** Safely reads the color_palette JSONB column into a typed array. */
export function parsePalette(json: Json | null): PaletteColor[] {
  return Array.isArray(json) ? (json as unknown as PaletteColor[]) : []
}

/** Safely reads the typography JSONB column into a typed array. */
export function parseTypography(json: Json | null): Typeface[] {
  return Array.isArray(json) ? (json as unknown as Typeface[]) : []
}

// Allowed logo variants and stock categories (single source of truth).
export const LOGO_VARIANTS = [
  "primary",
  "horizontal",
  "isotype",
  "mono-light",
  "mono-dark",
] as const

export const STOCK_CATEGORIES = [
  "lobby",
  "room",
  "food",
  "exterior",
  "people",
  "detail",
  "other",
] as const

export const INDUSTRIES = ["hospitality", "restaurant", "retail", "other"] as const
