import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useProfile, useUpdateProfile } from "@/hooks/use-profile"
import { CostsCard } from "@/components/settings/CostsCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

export function SettingsPage() {
  const { user } = useAuth()
  const { data: profile, isPending } = useProfile()
  const update = useUpdateProfile()

  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? "")
    setAvatarUrl(profile.avatar_url ?? "")
  }, [profile])

  function handleSave() {
    update.mutate(
      { full_name: fullName || null, avatar_url: avatarUrl || null },
      {
        onSuccess: () => toast.success("Perfil actualizado"),
        onError: (e) =>
          toast.error("Error al guardar", { description: (e as Error).message }),
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
              </div>
              <div className="flex items-center gap-2">
                <Label>Rol:</Label>
                <Badge variant="secondary">{profile?.role ?? "member"}</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL del avatar</Label>
                <Input
                  id="avatar_url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={update.isPending}>
                  {update.isPending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CostsCard />
    </div>
  )
}
