import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { readImageSize, removeFile, uploadFile } from "@/lib/storage"
import type { StockAsset } from "@/types/db"

const BUCKET = "stock"

export function useStockAssets(brandId: string | undefined) {
  return useQuery({
    queryKey: ["stock-assets", brandId],
    enabled: !!brandId,
    queryFn: async (): Promise<StockAsset[]> => {
      const { data, error } = await supabase
        .from("stock_assets")
        .select("*")
        .eq("brand_id", brandId as string)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Counts stock assets per brand in a single query (used by the dashboard). */
export function useStockCounts() {
  return useQuery({
    queryKey: ["stock-counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase.from("stock_assets").select("brand_id")
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of data) {
        counts[row.brand_id] = (counts[row.brand_id] ?? 0) + 1
      }
      return counts
    },
  })
}

/** Carga stock_assets por una lista de IDs (para el stock sugerido de un brief). */
export function useStockAssetsByIds(ids: string[]) {
  return useQuery({
    queryKey: ["stock-by-ids", [...ids].sort()],
    enabled: ids.length > 0,
    queryFn: async (): Promise<
      Pick<StockAsset, "id" | "title" | "storage_path" | "category">[]
    > => {
      const { data, error } = await supabase
        .from("stock_assets")
        .select("id, title, storage_path, category")
        .in("id", ids)
      if (error) throw error
      return data
    },
  })
}

export interface UploadStockInput {
  file: File
  title: string | null
  category: string | null
  tags: string[]
}

export function useUploadStockAsset(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, title, category, tags }: UploadStockInput) => {
      const size = await readImageSize(file)
      const path = await uploadFile(BUCKET, brandId, file)
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from("stock_assets").insert({
        brand_id: brandId,
        storage_path: path,
        title: title || file.name,
        category,
        tags,
        width: size?.width ?? null,
        height: size?.height ?? null,
        file_size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: userData.user?.id ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-assets", brandId] })
      qc.invalidateQueries({ queryKey: ["stock-counts"] })
    },
  })
}

export function useDeleteStockAsset(brandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (asset: StockAsset) => {
      await removeFile(BUCKET, asset.storage_path)
      const { error } = await supabase.from("stock_assets").delete().eq("id", asset.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-assets", brandId] })
      qc.invalidateQueries({ queryKey: ["stock-counts"] })
    },
  })
}
