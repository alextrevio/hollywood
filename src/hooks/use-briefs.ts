import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { generateBriefs } from "@/lib/edge-functions"
import { useAuth } from "@/hooks/use-auth"
import type {
  BriefStatus,
  BriefWithSession,
  CommentWithProfile,
  GenerateBriefsInput,
} from "@/types/briefs"

export interface BriefFilters {
  status?: BriefStatus | "all"
  occasion?: string
  dateFrom?: string
  dateTo?: string
}

/** Genera ideas llamando a la Edge Function; refresca la lista al terminar. */
export function useGenerateBriefs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateBriefsInput) => generateBriefs(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["briefs", variables.brand_id] })
      qc.invalidateQueries({ queryKey: ["brief-costs"] })
    },
  })
}

/** Lista los briefs de una marca (con su sesión embebida), filtrables. */
export function useBriefs(brandId: string | undefined, filters: BriefFilters = {}) {
  return useQuery({
    queryKey: ["briefs", brandId, filters],
    enabled: !!brandId,
    queryFn: async (): Promise<BriefWithSession[]> => {
      let query = supabase
        .from("briefs")
        .select(
          "*, session:generation_sessions(id, occasion, objective, started_at)",
        )
        .eq("brand_id", brandId as string)
        .order("created_at", { ascending: false })

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom)
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo)

      const { data, error } = await query
      if (error) throw error

      let rows = (data ?? []) as unknown as BriefWithSession[]
      if (filters.occasion) {
        rows = rows.filter((b) => b.session?.occasion === filters.occasion)
      }
      return rows
    },
  })
}

// Snapshot de todas las queries ["briefs", brandId, *] para poder revertir.
type BriefsSnapshot = [readonly unknown[], BriefWithSession[] | undefined][]

/** Aprueba o rechaza un brief (con razón de rechazo opcional). Optimista + rollback. */
export function useUpdateBriefStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      briefId: string
      brandId: string
      status: BriefStatus
      rejectionReason?: string | null
    }) => {
      const { error } = await supabase
        .from("briefs")
        .update({
          status: params.status,
          rejection_reason: params.rejectionReason ?? null,
        })
        .eq("id", params.briefId)
      if (error) throw error
    },
    // Actualiza la UI al instante.
    onMutate: async (vars): Promise<{ previous: BriefsSnapshot }> => {
      await qc.cancelQueries({ queryKey: ["briefs", vars.brandId] })
      const previous = qc.getQueriesData<BriefWithSession[]>({
        queryKey: ["briefs", vars.brandId],
      })
      qc.setQueriesData<BriefWithSession[]>(
        { queryKey: ["briefs", vars.brandId] },
        (old) =>
          old?.map((b) =>
            b.id === vars.briefId
              ? { ...b, status: vars.status, rejection_reason: vars.rejectionReason ?? null }
              : b,
          ),
      )
      return { previous }
    },
    // Revierte si el servidor falla.
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    // Reconcilia con el servidor pase lo que pase.
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["briefs", vars.brandId] })
    },
  })
}

/** Edita el copy_body de un brief (edición inline del Bloque 19). Optimista + rollback. */
export function useUpdateBriefCopy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      briefId: string
      brandId: string
      copyBody: string
    }) => {
      const { error } = await supabase
        .from("briefs")
        .update({ copy_body: params.copyBody })
        .eq("id", params.briefId)
      if (error) throw error
    },
    onMutate: async (vars): Promise<{ previous: BriefsSnapshot }> => {
      await qc.cancelQueries({ queryKey: ["briefs", vars.brandId] })
      const previous = qc.getQueriesData<BriefWithSession[]>({
        queryKey: ["briefs", vars.brandId],
      })
      qc.setQueriesData<BriefWithSession[]>(
        { queryKey: ["briefs", vars.brandId] },
        (old) =>
          old?.map((b) =>
            b.id === vars.briefId ? { ...b, copy_body: vars.copyBody } : b,
          ),
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data))
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["briefs", vars.brandId] })
    },
  })
}

/** Comentarios de un brief, con el perfil (nombre + avatar) embebido. */
export function useBriefComments(briefId: string | undefined) {
  return useQuery({
    queryKey: ["brief-comments", briefId],
    enabled: !!briefId,
    queryFn: async (): Promise<CommentWithProfile[]> => {
      const { data, error } = await supabase
        .from("brief_comments")
        .select("*, profile:profiles(full_name, avatar_url)")
        .eq("brief_id", briefId as string)
        .order("created_at", { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as CommentWithProfile[]
    },
  })
}

/** Agrega un comentario a un brief. */
export function useAddBriefComment() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { briefId: string; body: string }) => {
      const { error } = await supabase.from("brief_comments").insert({
        brief_id: params.briefId,
        user_id: user!.id,
        body: params.body,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["brief-comments", vars.briefId] })
    },
  })
}
