import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface CostSummary {
  totalProjectUsd: number
  totalMonthUsd: number
  briefCount: number
  avgPerBriefUsd: number
  byBrand: { brandId: string; name: string; costUsd: number }[]
}

// Forma del row con la marca embebida (evitamos pelear con la inferencia del embed).
type SessionRow = {
  total_cost_usd: number | null
  started_at: string | null
  brand_id: string
  brand: { name: string } | { name: string }[] | null
}

function brandName(brand: SessionRow["brand"]): string {
  const obj = Array.isArray(brand) ? brand[0] : brand
  return obj?.name ?? "(sin nombre)"
}

export function useCostSummary() {
  return useQuery({
    queryKey: ["brief-costs"],
    queryFn: async (): Promise<CostSummary> => {
      const { data: sessions, error } = await supabase
        .from("generation_sessions")
        .select("total_cost_usd, started_at, brand_id, brand:brands(name)")
      if (error) throw error

      // Conteo total de briefs (head: true → solo el count, sin traer filas).
      const { count, error: countError } = await supabase
        .from("briefs")
        .select("*", { count: "exact", head: true })
      if (countError) throw countError

      const rows = (sessions ?? []) as unknown as SessionRow[]
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      let totalProjectUsd = 0
      let totalMonthUsd = 0
      const brandMap = new Map<string, { name: string; costUsd: number }>()

      for (const s of rows) {
        const cost = Number(s.total_cost_usd ?? 0)
        totalProjectUsd += cost
        if (s.started_at && new Date(s.started_at) >= monthStart) {
          totalMonthUsd += cost
        }
        const existing = brandMap.get(s.brand_id)
        if (existing) existing.costUsd += cost
        else brandMap.set(s.brand_id, { name: brandName(s.brand), costUsd: cost })
      }

      const briefCount = count ?? 0
      return {
        totalProjectUsd,
        totalMonthUsd,
        briefCount,
        avgPerBriefUsd: briefCount > 0 ? totalProjectUsd / briefCount : 0,
        byBrand: Array.from(brandMap.entries())
          .map(([brandId, v]) => ({ brandId, name: v.name, costUsd: v.costUsd }))
          .sort((a, b) => b.costUsd - a.costUsd),
      }
    },
  })
}
