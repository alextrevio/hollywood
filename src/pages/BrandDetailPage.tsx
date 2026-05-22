import { Link, useParams } from "react-router-dom"
import { useBrand } from "@/hooks/use-brands"
import { IdentityTab } from "@/components/brand/IdentityTab"
import { LogosTab } from "@/components/brand/LogosTab"
import { StockTab } from "@/components/brand/StockTab"
import { ReferencesTab } from "@/components/brand/ReferencesTab"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BrandDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: brand, isPending, isError } = useBrand(slug)

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !brand) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Marca no encontrada</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>No existe una marca con el slug "{slug}".</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Volver al dashboard</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Marcas
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
          {brand.industry && <Badge variant="secondary">{brand.industry}</Badge>}
        </div>
        {brand.description && (
          <p className="max-w-2xl text-muted-foreground">{brand.description}</p>
        )}
      </div>

      <Tabs defaultValue="identidad">
        <TabsList>
          <TabsTrigger value="identidad">Identidad</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="referencias">Referencias</TabsTrigger>
        </TabsList>
        <TabsContent value="identidad" className="pt-6">
          <IdentityTab brandId={brand.id} />
        </TabsContent>
        <TabsContent value="logos" className="pt-6">
          <LogosTab brandId={brand.id} />
        </TabsContent>
        <TabsContent value="stock" className="pt-6">
          <StockTab brandId={brand.id} />
        </TabsContent>
        <TabsContent value="referencias" className="pt-6">
          <ReferencesTab brandId={brand.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
