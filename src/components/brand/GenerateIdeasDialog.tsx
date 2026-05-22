import { useMemo, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { getAllOccasions, getRelevantOccasion } from "@/lib/calendar"
import { useGenerateBriefs } from "@/hooks/use-briefs"
import { FORMAT_OPTIONS, OBJECTIVE_OPTIONS } from "@/types/briefs"
import type { BriefObjective } from "@/types/briefs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export function GenerateIdeasDialog({
  brandId,
  open,
  onOpenChange,
}: {
  brandId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const generate = useGenerateBriefs()
  const suggested = useMemo(() => getRelevantOccasion(new Date())?.name ?? "", [])
  const occasionOptions = useMemo(
    () => getAllOccasions(new Date()).map((o) => o.name),
    [],
  )

  const [occasion, setOccasion] = useState(suggested)
  const [objective, setObjective] = useState<BriefObjective>("awareness")
  const [numIdeas, setNumIdeas] = useState(5)
  const [formats, setFormats] = useState<string[]>(["post"])
  const [extraNotes, setExtraNotes] = useState("")

  function toggleFormat(value: string, checked: boolean) {
    setFormats((prev) =>
      checked ? [...prev, value] : prev.filter((f) => f !== value),
    )
  }

  function handleGenerate() {
    if (!occasion.trim()) {
      toast.error("Indica una ocasión")
      return
    }
    generate.mutate(
      {
        brand_id: brandId,
        occasion: occasion.trim(),
        objective,
        num_ideas: numIdeas,
        format_preferences: formats,
        extra_notes: extraNotes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`${res.briefs.length} idea(s) generada(s)`)
          onOpenChange(false)
        },
        onError: (e) =>
          toast.error("No se pudieron generar las ideas", {
            description: (e as Error).message,
          }),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // No permitir cerrar mientras genera (evita perder la respuesta).
        if (!generate.isPending) onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar ideas</DialogTitle>
          <DialogDescription>
            El agente creará briefs de campaña para esta marca.
          </DialogDescription>
        </DialogHeader>

        {generate.isPending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="font-medium">Generando ideas…</p>
            <p className="text-sm text-muted-foreground">
              Esto toma ~20-30 segundos. No cierres esta ventana.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occasion">Ocasión</Label>
              <Input
                id="occasion"
                list="occasion-options"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="Día de las Madres"
              />
              <datalist id="occasion-options">
                {occasionOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              {suggested && (
                <p className="text-xs text-muted-foreground">
                  Sugerencia para hoy: {suggested}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select
                value={objective}
                onValueChange={(v) => setObjective(v as BriefObjective)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Número de ideas</Label>
                <span className="text-sm font-medium">{numIdeas}</span>
              </div>
              <Slider
                value={[numIdeas]}
                min={1}
                max={15}
                step={1}
                onValueChange={(values) => setNumIdeas(values[0])}
              />
            </div>

            <div className="space-y-2">
              <Label>Formatos</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <label
                    key={f.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={formats.includes(f.value)}
                      onCheckedChange={(c) => toggleFormat(f.value, c === true)}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas extras (opcional)</Label>
              <Textarea
                id="notes"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                rows={2}
                placeholder="Algo específico que quieras que el agente considere…"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generate.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={generate.isPending}>
            <Sparkles className="mr-1 h-4 w-4" />
            {generate.isPending ? "Generando…" : "Generar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
