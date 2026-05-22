import { Link } from "react-router-dom"
import { ImageIcon, Plus } from "lucide-react"
import { useBrands } from "@/hooks/use-brands"
import { useStockCounts } from "@/hooks/use-stock-assets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPage() {
  const { data: brands, isPending } = useBrands()
  const { data: counts } = useStockCounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground">Tus clientes y proyectos</p>
        </div>
        <Button asChild>
          <Link to="/brands/new">
            <Plus className="mr-1 h-4 w-4" />
            Nueva marca
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : brands && brands.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.id} to={`/brands/${brand.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-foreground/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{brand.name}</CardTitle>
                    {brand.industry && (
                      <Badge variant="secondary">{brand.industry}</Badge>
                    )}
                  </div>
                  {brand.description && (
                    <CardDescription className="line-clamp-2">
                      {brand.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    {counts?.[brand.id] ?? 0} en stock
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">Aún no hay marcas</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primera marca para empezar a guardar su identidad y stock.
            </p>
          </div>
          <Button asChild>
            <Link to="/brands/new">
              <Plus className="mr-1 h-4 w-4" />
              Crear primera marca
            </Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
