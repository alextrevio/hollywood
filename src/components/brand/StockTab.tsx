import { useMemo, useState } from "react"
import { Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { STOCK_CATEGORIES } from "@/types/db"
import type { StockAsset } from "@/types/db"
import {
  useDeleteStockAsset,
  useStockAssets,
  useUploadStockAsset,
} from "@/hooks/use-stock-assets"
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
import { formatBytes } from "@/lib/utils"

export function StockTab({ brandId }: { brandId: string }) {
  const { data: assets, isPending } = useStockAssets(brandId)
  const upload = useUploadStockAsset(brandId)
  const remove = useDeleteStockAsset(brandId)

  const [uploadCategory, setUploadCategory] = useState<string>(STOCK_CATEGORIES[0])
  const [uploadTags, setUploadTags] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterTag, setFilterTag] = useState("")

  function handleFiles(files: File[]) {
    const tags = uploadTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    let done = 0
    files.forEach((file) => {
      upload.mutate(
        { file, title: null, category: uploadCategory, tags },
        {
          onSuccess: () => {
            done += 1
            if (done === files.length) {
              toast.success(`${files.length} imagen(es) subida(s)`)
            }
          },
          onError: (e) =>
            toast.error("Error al subir", { description: (e as Error).message }),
        },
      )
    })
  }

  function handleDelete(asset: StockAsset) {
    remove.mutate(asset, {
      onSuccess: () => toast.success("Imagen eliminada"),
      onError: (e) =>
        toast.error("Error al eliminar", { description: (e as Error).message }),
    })
  }

  const filtered = useMemo(() => {
    if (!assets) return []
    return assets.filter((a) => {
      const catOk = filterCategory === "all" || a.category === filterCategory
      const tagOk =
        !filterTag ||
        (a.tags ?? []).some((t) =>
          t.toLowerCase().includes(filterTag.toLowerCase()),
        )
      return catOk && tagOk
    })
  }, [assets, filterCategory, filterTag])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Tags (separados por coma)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="alberca, atardecer, terraza"
              />
            </div>
          </div>
          <FileDropzone
            onFiles={handleFiles}
            accept="image/*"
            multiple
            disabled={upload.isPending}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p>
              {upload.isPending
                ? "Subiendo…"
                : "Arrastra varias imágenes o haz clic para elegir"}
            </p>
            <p className="text-xs text-muted-foreground">
              Se aplicarán la categoría y tags de arriba a todas
            </p>
          </FileDropzone>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Filtrar por categoría</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {STOCK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Buscar por tag</Label>
          <Input
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            placeholder="escribe un tag…"
          />
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <AssetImage
                bucket="stock"
                path={asset.storage_path}
                alt={asset.title ?? "stock"}
                className="aspect-square w-full"
              />
              <div className="space-y-1 p-2">
                <p className="truncate text-sm font-medium">
                  {asset.title ?? "Sin título"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {asset.category && (
                    <Badge variant="secondary">{asset.category}</Badge>
                  )}
                  {(asset.tags ?? []).map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                  <span>
                    {asset.width && asset.height
                      ? `${asset.width}×${asset.height}`
                      : ""}{" "}
                    · {formatBytes(asset.file_size_bytes)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(asset)}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {assets && assets.length > 0
            ? "Ninguna imagen coincide con el filtro."
            : "Aún no hay imágenes de stock."}
        </p>
      )}
    </div>
  )
}
