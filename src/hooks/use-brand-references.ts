import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { removeFile, uploadFile } from "@/lib/storage"
import type { BrandReference } from "@/types/db"

const BUCKET = "references"

export function useBrandReferences(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-references", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<BrandReference[]> => {
      const { data, error } = await supabase
        .from("brand_references")
        .select("*")
        .eq("brand_id", brandId as string)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export interface CreateReferenceInput {
  title: string | null
  notes: string | null
  performance_notes: string | null
  is_good_example: boolean
  externalUrl: string | null
  file: File | null
}

export function useCreateReference(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReferenceInput) => {
      let storagePath: string | null = null
      if (input.file) {
        storagePath = await uploadFile(BUCKET, brandId, input.file)
      }
      const { error } = await supabase.from("brand_references").insert({
        brand_id: brandId,
        title: input.title,
        notes: input.notes,
        performance_notes: input.performance_notes,
        is_good_example: input.is_good_example,
        external_url: input.externalUrl,
        storage_path: storagePath,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-references", brandId] }),
  })
}

export function useDeleteReference(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reference: BrandReference) => {
      if (reference.storage_path) {
        await removeFile(BUCKET, reference.storage_path)
      }
      const { error } = await supabase
        .from("brand_references")
        .delete()
        .eq("id", reference.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-references", brandId] }),
  })
}
