import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { removeFile, uploadFile } from "@/lib/storage"
import type { BrandLogo } from "@/types/db"

const BUCKET = "logos"

export function useBrandLogos(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-logos", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<BrandLogo[]> => {
      const { data, error } = await supabase
        .from("brand_logos")
        .select("*")
        .eq("brand_id", brandId as string)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useUploadLogo(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, variant }: { file: File; variant: string }) => {
      const path = await uploadFile(BUCKET, brandId, file)
      const ext = file.name.split(".").pop()?.toLowerCase() ?? null
      const { error } = await supabase.from("brand_logos").insert({
        brand_id: brandId,
        variant,
        storage_path: path,
        file_format: ext,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-logos", brandId] }),
  })
}

export function useDeleteLogo(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (logo: BrandLogo) => {
      await removeFile(BUCKET, logo.storage_path)
      const { error } = await supabase.from("brand_logos").delete().eq("id", logo.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brand-logos", brandId] }),
  })
}
