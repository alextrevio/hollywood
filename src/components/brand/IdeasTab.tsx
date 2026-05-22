import { useMemo, useState } from "react"
import { Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useBriefs, useUpdateBriefStatus } from "@/hooks/use-briefs"
import type { BriefStatus, BriefWithSession } from "@/types/briefs"
import { BriefCard } from "@/components/brand/BriefCard"
import { BriefDetailDialog } from "@/components/brand/BriefDetailDialog"
import { GenerateIdeasDialog } from "@/components/brand/GenerateIdeasDialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_FILTERS: { value: BriefStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
]

export function IdeasTab({ brandId }: { brandId: string }) {
  const [status, setStatus] = useState<BriefStatus | "all">("all")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null)

  const { data: briefs, isPending } = useBriefs(brandId, { status })
  const updateStatus = useUpdateBriefStatus()

  const selectedBrief = useMemo(
    () => (briefs ?? []).find((b) => b.id === selectedBriefId),
    [briefs, selectedBriefId],
  )

  function approve(briefId: string) {
    updateStatus.mutate(
      { briefId, brandId, status: "approved" },
      {
        onError: (e) =>
          toast.error("Error al aprobar", { description: (e as Error).message }),
      },
    )
  }

  // Rechazo directo por ahora; el Bloque 19 lo reemplaza por un modal con razón.
  function reject(briefId: string) {
    updateStatus.mutate(
      { briefId, brandId, status: "rejected" },
      {
        onError: (e) =>
          toast.error("Error al rechazar", { description: (e as Error).message }),
      },
    )
  }

  // Agrupar por sesión preservando el orden (briefs vienen más recientes primero).
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { session: BriefWithSession["session"]; items: BriefWithSession[] }
    >()
    for (const b of briefs ?? []) {
      const existing = map.get(b.session_id)
      if (existing) existing.items.push(b)
      else map.set(b.session_id, { session: b.session, items: [b] })
    }
    return Array.from(map.values())
  }, [briefs])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={status === f.value ? "default" : "outline"}
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Generar nuevas ideas
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-8">
          {groups.map((g, i) => (
            <section key={i} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-2 border-b pb-1">
                <h3 className="font-semibold">{g.session?.occasion ?? "Sesión"}</h3>
                {g.session?.objective && (
                  <span className="text-sm text-muted-foreground">
                    · {g.session.objective}
                  </span>
                )}
                {g.session?.started_at && (
                  <span className="text-xs text-muted-foreground">
                    · {new Date(g.session.started_at).toLocaleDateString("es-MX")}
                  </span>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {g.items.map((b) => (
                  <BriefCard
                    key={b.id}
                    brief={b}
                    onApprove={() => approve(b.id)}
                    onReject={() => reject(b.id)}
                    onOpenDetail={() => setSelectedBriefId(b.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Aún no hay ideas</p>
            <p className="text-sm text-muted-foreground">
              Genera tu primera tanda de briefs para esta marca.
            </p>
          </div>
          <Button onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Generar ideas
          </Button>
        </Card>
      )}

      <GenerateIdeasDialog
        brandId={brandId}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
      />
      <BriefDetailDialog
        brief={selectedBrief}
        brandId={brandId}
        open={selectedBriefId !== null}
        onOpenChange={(o) => {
          if (!o) setSelectedBriefId(null)
        }}
      />
    </div>
  )
}
