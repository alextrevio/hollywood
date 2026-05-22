import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Hollywood</h1>
        <p className="text-muted-foreground">Brand Studio · Fase 1 — Brand Vault</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructivo</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Tailwind v3 + shadcn/ui (new-york · zinc) — alias @/ funcionando ✅
      </p>
    </div>
  )
}

export default App
