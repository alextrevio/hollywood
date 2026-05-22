import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Brand } from "@/types/db"

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useBrand(slug: string | undefined) {
  return useQuery({
    queryKey: ["brand", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Brand> => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug as string)
        .single()
      if (error) throw error
      return data
    },
  })
}

export interface CreateBrandInput {
  name: string
  slug: string
  industry: string | null
  description: string | null
}

export function useCreateBrand() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBrandInput): Promise<Brand> => {
      const { data: userData } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from("brands")
        .insert({
          name: input.name,
          slug: input.slug,
          industry: input.industry,
          description: input.description,
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error

      // Create the initial (empty) identity row for the brand.
      const { error: identityError } = await supabase
        .from("brand_identities")
        .insert({ brand_id: data.id })
      if (identityError) throw identityError

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}
