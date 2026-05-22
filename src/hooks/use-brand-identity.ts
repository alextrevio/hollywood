import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Json } from "@/types/database"
import type { BrandIdentity, PaletteColor, Typeface } from "@/types/db"

export function useBrandIdentity(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-identity", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<BrandIdentity | null> => {
      const { data, error } = await supabase
        .from("brand_identities")
        .select("*")
        .eq("brand_id", brandId as string)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export interface IdentityPayload {
  color_palette: PaletteColor[]
  typography: Typeface[]
  voice_description: string | null
  voice_examples_good: string[]
  voice_examples_bad: string[]
  dos: string[]
  donts: string[]
  notes: string | null
}

export function useUpsertBrandIdentity(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: IdentityPayload) => {
      // brand_id is UNIQUE, so upsert keeps the one-row-per-brand invariant.
      // The structured arrays are stored as JSONB.
      const { error } = await supabase.from("brand_identities").upsert(
        {
          brand_id: brandId,
          color_palette: values.color_palette as unknown as Json,
          typography: values.typography as unknown as Json,
          voice_description: values.voice_description,
          voice_examples_good: values.voice_examples_good,
          voice_examples_bad: values.voice_examples_bad,
          dos: values.dos,
          donts: values.donts,
          notes: values.notes,
        },
        { onConflict: "brand_id" },
      )
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-identity", brandId] })
    },
  })
}
