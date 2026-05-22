import { NavLink } from "react-router-dom"
import { Clapperboard, LayoutDashboard, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBrands } from "@/hooks/use-brands"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
  )
}

export function Sidebar() {
  const { data: brands, isPending } = useBrands()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Clapperboard className="h-5 w-5" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Hollywood</p>
          <p className="text-xs text-muted-foreground">Brand Studio</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/brands/new" className={navLinkClass}>
          <Plus className="h-4 w-4" />
          Nueva marca
        </NavLink>
      </nav>

      <Separator />

      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Marcas
        </p>
        {isPending ? (
          <div className="space-y-2 px-3">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="flex flex-col gap-1">
            {brands.map((brand) => (
              <NavLink
                key={brand.id}
                to={`/brands/${brand.slug}`}
                className={navLinkClass}
              >
                <span className="truncate">{brand.name}</span>
              </NavLink>
            ))}
          </div>
        ) : (
          <p className="px-3 text-sm text-muted-foreground">Aún no hay marcas.</p>
        )}
      </div>
    </aside>
  )
}
