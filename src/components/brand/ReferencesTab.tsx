import { useState } from "react"
import { ExternalLink, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { BrandReference } from "@/types/db"
import {
  useBrandReferences,
  useCreateReference,
  useDeleteReference,
} from "@/hooks/use-brand-references"
import { AssetImage } from "@/components/shared/AssetImage"
import { FileDropzone } from "@/components/shared/FileDropzone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

export function ReferencesTab({ brandId }: { brandId: string }) {
  const { data: references, isPending } = useBrandReferences(brandId)
  const create = useCreateReference(brandId)
  const remove = useDeleteReference(brandId)

  const [title, setTitle] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [performance, setPerformance] = useState("")
  const [quality, setQuality] = useState<"good" | "bad">("good")
  const [file, setFile] = useState<File | null>(null)

  function reset() {
    setTitle("")
    setExternalUrl("")
    setNotes("")
    setPerformance("")
    setQuality("good")
    setFile(null)
  }

  function handleSubmit() {
    if (!title && !externalUrl && !file) {
      toast.error("Agrega al menos un título, un link o un archivo")
      return
    }
    create.mutate(
      {
        title: title || null,
        externalUrl: externalUrl || null,
        notes: notes || null,
        performance_notes: performance || null,
        is_good_example: quality === "good",
        file,
      },
      {
        onSuccess: () => {
          toast.success("Referencia agregada")
          reset()
        },
        onError: (e) =>
          toast.error("Error al guardar", { description: (e as Error).message }),
      },
    )
  }

  function handleDelete(reference: BrandReference) {
    remove.mutate(reference, {
      onSuccess: () => toast.success("Referencia eliminada"),
      onError: (e) =>
        toast.error("Error al eliminar", { description: (e as Error).message }),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Campaña verano 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Link externo (opcional)</Label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>¿Funcionó? ¿Por qué?</Label>
              <Textarea
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Tipo de ejemplo</Label>
              <Select
                value={quality}
                onValueChange={(v) => setQuality(v as "good" | "bad")}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Buen ejemplo</SelectItem>
                  <SelectItem value="bad">Mal ejemplo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              {create.isPending ? "Guardando…" : "Agregar referencia"}
            </Button>
          </div>
          <FileDropzone
            onFiles={(files) => setFile(files[0] ?? null)}
            accept="image/*,.pdf"
            disabled={create.isPending}
          >
            <p className="text-sm">
              {file
                ? `Archivo: ${file.name}`
                : "Arrastra una imagen/PDF de referencia (opcional)"}
            </p>
          </FileDropzone>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : references && references.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {references.map((ref) => (
            <Card key={ref.id} className="overflow-hidden">
              {ref.storage_path && (
                <AssetImage
                  bucket="references"
                  path={ref.storage_path}
                  alt={ref.title ?? "referencia"}
                  className="h-40 w-full"
                />
              )}
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{ref.title ?? "Sin título"}</p>
                  <Badge variant={ref.is_good_example ? "default" : "destructive"}>
                    {ref.is_good_example ? "Bueno" : "Malo"}
                  </Badge>
                </div>
                {ref.notes && (
                  <p className="text-sm text-muted-foreground">{ref.notes}</p>
                )}
                {ref.performance_notes && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Resultado: </span>
                    {ref.performance_notes}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  {ref.external_url ? (
                    <a
                      href={ref.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir link
                    </a>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(ref)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no hay referencias.</p>
      )}
    </div>
  )
}
