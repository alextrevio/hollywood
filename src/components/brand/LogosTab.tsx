import { useState } from "react"
import { Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { LOGO_VARIANTS } from "@/types/db"
import type { BrandLogo } from "@/types/db"
import {
  useBrandLogos,
  useDeleteLogo,
  useUploadLogo,
} from "@/hooks/use-brand-logos"
import { AssetImage } from "@/components/shared/AssetImage"
import { FileDropzone } from "@/components/shared/FileDropzone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export function LogosTab({ brandId }: { brandId: string }) {
  const { data: logos, isPending } = useBrandLogos(brandId)
  const upload = useUploadLogo(brandId)
  const remove = useDeleteLogo(brandId)
  const [variant, setVariant] = useState<string>(LOGO_VARIANTS[0])

  function handleFiles(files: File[]) {
    const file = files[0]
    if (!file) return
    upload.mutate(
      { file, variant },
      {
        onSuccess: () => toast.success("Logo subido"),
        onError: (e) =>
          toast.error("Error al subir", { description: (e as Error).message }),
      },
    )
  }

  function handleDelete(logo: BrandLogo) {
    remove.mutate(logo, {
      onSuccess: () => toast.success("Logo eliminado"),
      onError: (e) =>
        toast.error("Error al eliminar", { description: (e as Error).message }),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Variante</Label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOGO_VARIANTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FileDropzone
            onFiles={handleFiles}
            accept="image/*,.svg,.pdf"
            disabled={upload.isPending}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p>
              {upload.isPending
                ? "Subiendo…"
                : "Arrastra un logo aquí o haz clic para elegir"}
            </p>
            <p className="text-xs text-muted-foreground">
              Se subirá como variante "{variant}"
            </p>
          </FileDropzone>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : logos && logos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {logos.map((logo) => (
            <Card key={logo.id} className="overflow-hidden">
              <AssetImage
                bucket="logos"
                path={logo.storage_path}
                alt={logo.variant}
                className="aspect-square w-full bg-muted"
              />
              <div className="flex items-center justify-between p-2">
                <Badge variant="secondary">{logo.variant}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(logo)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no hay logos.</p>
      )}
    </div>
  )
}
