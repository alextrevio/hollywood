import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Check, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { parseFormatSuggestions, parseVisualBrief } from "@/types/briefs"
import type { BriefWithSession } from "@/types/briefs"
import {
  useAddBriefComment,
  useBriefComments,
  useUpdateBriefCopy,
  useUpdateBriefStatus,
} from "@/hooks/use-briefs"
import { useProfile } from "@/hooks/use-profile"
import { useStockAssetsByIds } from "@/hooks/use-stock-assets"
import { useSignedUrl } from "@/hooks/use-signed-url"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

export function BriefDetailDialog({
  brief,
  brandId,
  open,
  onOpenChange,
}: {
  brief: BriefWithSession | undefined
  brandId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateStatus = useUpdateBriefStatus()
  const updateCopy = useUpdateBriefCopy()
  const addComment = useAddBriefComment()
  const { data: profile } = useProfile()
  const comments = useBriefComments(brief?.id)
  const stock = useStockAssetsByIds(brief?.suggested_stock_ids ?? [])

  const [editing, setEditing] = useState(false)
  const [copyDraft, setCopyDraft] = useState("")
  const [commentDraft, setCommentDraft] = useState("")
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState("")

  // Resetea el estado local al cambiar de brief.
  useEffect(() => {
    setEditing(false)
    setCommentDraft("")
    setRejectOpen(false)
    setReason("")
  }, [brief?.id])

  if (!brief) return null

  const isAdmin = profile?.role === "admin"
  const formats = parseFormatSuggestions(brief.format_suggestions)
  const visual = parseVisualBrief(brief.visual_brief)

  function approve() {
    if (!brief) return
    updateStatus.mutate(
      { briefId: brief.id, brandId, status: "approved" },
      {
        onSuccess: () => toast.success("Idea aprobada"),
        onError: (e) => toast.error("Error", { description: (e as Error).message }),
      },
    )
  }

  function confirmReject() {
    if (!brief) return
    updateStatus.mutate(
      {
        briefId: brief.id,
        brandId,
        status: "rejected",
        rejectionReason: reason.trim() || null,
      },
      {
        onSuccess: () => {
          setRejectOpen(false)
          toast.success("Idea rechazada")
        },
        onError: (e) => toast.error("Error", { description: (e as Error).message }),
      },
    )
  }

  function startEdit() {
    if (!brief) return
    setCopyDraft(brief.copy_body)
    setEditing(true)
  }

  function saveCopy() {
    if (!brief) return
    updateCopy.mutate(
      { briefId: brief.id, brandId, copyBody: copyDraft },
      {
        onSuccess: () => {
          setEditing(false)
          toast.success("Copy actualizado")
        },
        onError: (e) => toast.error("Error", { description: (e as Error).message }),
      },
    )
  }

  function submitComment() {
    if (!brief || !commentDraft.trim()) return
    addComment.mutate(
      { briefId: brief.id, body: commentDraft.trim() },
      {
        onSuccess: () => setCommentDraft(""),
        onError: (e) =>
          toast.error("Error al comentar", { description: (e as Error).message }),
      },
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <DialogTitle>{brief.concept}</DialogTitle>
              <Badge
                variant={
                  brief.status === "approved"
                    ? "default"
                    : brief.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {brief.status}
              </Badge>
            </div>
          </DialogHeader>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={approve}
              disabled={brief.status === "approved"}
            >
              <Check className="mr-1 h-4 w-4" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              disabled={brief.status === "rejected"}
            >
              <X className="mr-1 h-4 w-4" />
              Rechazar
            </Button>
            <Button size="sm" variant="outline" onClick={startEdit} disabled={editing}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar copy
            </Button>
          </div>

          {brief.status === "rejected" && brief.rejection_reason && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              Razón del rechazo: {brief.rejection_reason}
            </p>
          )}

          <Separator />

          {/* Contenido */}
          <div className="space-y-4 text-sm">
            <Field label="Headline">
              <p className="font-medium">{brief.headline}</p>
            </Field>

            <Field label="Copy">
              {editing ? (
                <div className="space-y-2">
                  <Textarea
                    value={copyDraft}
                    onChange={(e) => setCopyDraft(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveCopy} disabled={updateCopy.isPending}>
                      {updateCopy.isPending ? "Guardando…" : "Guardar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{brief.copy_body}</p>
              )}
            </Field>

            {brief.cta && (
              <Field label="CTA">
                <p>{brief.cta}</p>
              </Field>
            )}

            <Field label="Hashtags">
              <div className="flex flex-wrap gap-1">
                {(brief.hashtags ?? []).map((h) => (
                  <Badge key={h} variant="outline">
                    #{h}
                  </Badge>
                ))}
              </div>
            </Field>

            <Field label="Formatos">
              <div className="flex flex-wrap gap-1">
                {formats.map((f, i) => (
                  <Badge key={i} variant="secondary">
                    {f.type} · {f.dimensions}
                  </Badge>
                ))}
              </div>
            </Field>

            {visual && (
              <Field label="Brief visual">
                <div className="space-y-1">
                  <p>
                    <span className="text-muted-foreground">Imagen:</span>{" "}
                    {visual.image_description}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Estilo:</span>{" "}
                    {visual.style} · {visual.mood} · {visual.composition}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Texto:</span>{" "}
                    {visual.text_position}{" "}
                    <span className="text-muted-foreground">· Usa stock:</span>{" "}
                    {visual.uses_stock ? "sí" : "no"}
                  </p>
                </div>
              </Field>
            )}

            {/* Stock sugerido */}
            {(brief.suggested_stock_ids ?? []).length > 0 && (
              <Field label="Stock sugerido">
                {stock.isPending ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {(stock.data ?? []).map((s) => (
                      <SuggestedStockThumb
                        key={s.id}
                        path={s.storage_path}
                        title={s.title}
                      />
                    ))}
                  </div>
                )}
              </Field>
            )}
          </div>

          <Separator />

          {/* Comentarios */}
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Comentarios
            </p>
            {comments.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : comments.data && comments.data.length > 0 ? (
              <div className="space-y-3">
                {comments.data.map((c) => {
                  const name = c.profile?.full_name ?? "Usuario"
                  const date = c.created_at
                    ? new Date(c.created_at).toLocaleString("es-MX")
                    : ""
                  return (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{name}</span>{" "}
                          · {date}
                        </p>
                        <p className="text-sm">{c.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin comentarios aún.</p>
            )}
            <div className="space-y-2">
              <Textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={2}
                placeholder="Escribe un comentario…"
              />
              <Button
                size="sm"
                onClick={submitComment}
                disabled={addComment.isPending || !commentDraft.trim()}
              >
                Comentar
              </Button>
            </div>
          </div>

          {/* Debug (solo admin) */}
          {isAdmin && (
            <details className="rounded-md border p-3 text-xs">
              <summary className="cursor-pointer font-medium">Debug (admin)</summary>
              <div className="mt-2 space-y-2">
                <p className="text-muted-foreground">
                  Modelo: {brief.model_used} · in: {brief.tokens_input ?? "—"} tok ·
                  out: {brief.tokens_output ?? "—"} tok · costo: $
                  {brief.cost_usd != null ? brief.cost_usd.toFixed(6) : "—"}
                </p>
                <div>
                  <p className="font-medium">Prompt enviado</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">
                    {brief.raw_prompt ?? "(no disponible)"}
                  </pre>
                </div>
                <div>
                  <p className="font-medium">Respuesta cruda</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">
                    {brief.raw_response ?? "(no disponible)"}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de rechazo con razón */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Razón del rechazo (opcional)…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updateStatus.isPending}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SuggestedStockThumb({
  path,
  title,
}: {
  path: string
  title: string | null
}) {
  const { data: url } = useSignedUrl("stock", path)
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block space-y-1"
      title={title ?? undefined}
    >
      {url ? (
        <img
          src={url}
          alt={title ?? "stock"}
          className="aspect-square w-full rounded object-cover"
        />
      ) : (
        <Skeleton className="aspect-square w-full rounded" />
      )}
      <p className="truncate text-xs text-muted-foreground">{title ?? "—"}</p>
    </a>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}
