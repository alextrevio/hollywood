import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { parsePalette, parseTypography } from "@/types/db"
import type { PaletteColor } from "@/types/db"
import {
  useBrandIdentity,
  useUpsertBrandIdentity,
} from "@/hooks/use-brand-identity"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

interface TypefaceForm {
  family: string
  usage: string
  weights: string // comma-separated in the editor, parsed to number[] on save
}

function StringListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      {values.map((val, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={val}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...values]
              next[i] = e.target.value
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Agregar
      </Button>
    </div>
  )
}

function PaletteEditor({
  value,
  onChange,
}: {
  value: PaletteColor[]
  onChange: (next: PaletteColor[]) => void
}) {
  function update(i: number, patch: Partial<PaletteColor>) {
    onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  }
  return (
    <div className="space-y-3">
      {value.map((color, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <input
            type="color"
            value={color.hex || "#000000"}
            onChange={(e) => update(i, { hex: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border"
            aria-label="color"
          />
          <div className="space-y-1">
            <Label className="text-xs">Nombre</Label>
            <Input
              className="w-32"
              value={color.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="primary"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Hex</Label>
            <Input
              className="w-28"
              value={color.hex}
              onChange={(e) => update(i, { hex: e.target.value })}
              placeholder="#E84C24"
            />
          </div>
          <div className="min-w-40 flex-1 space-y-1">
            <Label className="text-xs">Uso</Label>
            <Input
              value={color.usage}
              onChange={(e) => update(i, { usage: e.target.value })}
              placeholder="CTA, headlines"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { name: "", hex: "#000000", usage: "" }])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Agregar color
      </Button>
    </div>
  )
}

function TypographyEditor({
  value,
  onChange,
}: {
  value: TypefaceForm[]
  onChange: (next: TypefaceForm[]) => void
}) {
  function update(i: number, patch: Partial<TypefaceForm>) {
    onChange(value.map((t, j) => (j === i ? { ...t, ...patch } : t)))
  }
  return (
    <div className="space-y-3">
      {value.map((tf, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Familia</Label>
            <Input
              className="w-40"
              value={tf.family}
              onChange={(e) => update(i, { family: e.target.value })}
              placeholder="Inter"
            />
          </div>
          <div className="min-w-32 flex-1 space-y-1">
            <Label className="text-xs">Uso</Label>
            <Input
              value={tf.usage}
              onChange={(e) => update(i, { usage: e.target.value })}
              placeholder="body"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pesos</Label>
            <Input
              className="w-32"
              value={tf.weights}
              onChange={(e) => update(i, { weights: e.target.value })}
              placeholder="400, 600"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { family: "", usage: "", weights: "" }])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Agregar tipografía
      </Button>
    </div>
  )
}

export function IdentityTab({ brandId }: { brandId: string }) {
  const { data: identity, isPending } = useBrandIdentity(brandId)
  const upsert = useUpsertBrandIdentity(brandId)

  const [colors, setColors] = useState<PaletteColor[]>([])
  const [typefaces, setTypefaces] = useState<TypefaceForm[]>([])
  const [voiceDescription, setVoiceDescription] = useState("")
  const [good, setGood] = useState<string[]>([])
  const [bad, setBad] = useState<string[]>([])
  const [dos, setDos] = useState<string[]>([])
  const [donts, setDonts] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!identity) return
    setColors(parsePalette(identity.color_palette))
    setTypefaces(
      parseTypography(identity.typography).map((t) => ({
        family: t.family,
        usage: t.usage,
        weights: (t.weights ?? []).join(", "),
      })),
    )
    setVoiceDescription(identity.voice_description ?? "")
    setGood(identity.voice_examples_good ?? [])
    setBad(identity.voice_examples_bad ?? [])
    setDos(identity.dos ?? [])
    setDonts(identity.donts ?? [])
    setNotes(identity.notes ?? "")
  }, [identity])

  function handleSave() {
    upsert.mutate(
      {
        color_palette: colors,
        typography: typefaces.map((t) => ({
          family: t.family,
          usage: t.usage,
          weights: t.weights
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !Number.isNaN(n)),
        })),
        voice_description: voiceDescription || null,
        voice_examples_good: good.filter(Boolean),
        voice_examples_bad: bad.filter(Boolean),
        dos: dos.filter(Boolean),
        donts: donts.filter(Boolean),
        notes: notes || null,
      },
      {
        onSuccess: () => toast.success("Identidad guardada"),
        onError: (e) =>
          toast.error("Error al guardar", { description: (e as Error).message }),
      },
    )
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paleta de color</CardTitle>
          <CardDescription>Colores de la marca y su uso.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaletteEditor value={colors} onChange={setColors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipografías</CardTitle>
          <CardDescription>Familias, uso y pesos.</CardDescription>
        </CardHeader>
        <CardContent>
          <TypographyEditor value={typefaces} onChange={setTypefaces} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tono de voz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Descripción del tono</Label>
            <Textarea
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              rows={3}
              placeholder="Cercano, cálido, sin tecnicismos…"
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ejemplos buenos</Label>
              <StringListEditor values={good} onChange={setGood} />
            </div>
            <div className="space-y-2">
              <Label>Ejemplos malos</Label>
              <StringListEditor values={bad} onChange={setBad} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas visuales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Do's</Label>
            <StringListEditor values={dos} onChange={setDos} placeholder="Sí hacer…" />
          </div>
          <div className="space-y-2">
            <Label>Don'ts</Label>
            <StringListEditor
              values={donts}
              onChange={setDonts}
              placeholder="No hacer…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? "Guardando…" : "Guardar identidad"}
        </Button>
      </div>
    </div>
  )
}
