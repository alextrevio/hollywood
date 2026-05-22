import { Check, MessageSquare, X } from "lucide-react"
import type { BriefWithSession } from "@/types/briefs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
}

export function BriefCard({
  brief,
  onApprove,
  onReject,
  onOpenDetail,
}: {
  brief: BriefWithSession
  onApprove: () => void
  onReject: () => void
  onOpenDetail: () => void
}) {
  const meta = STATUS_META[brief.status] ?? STATUS_META.pending
  const date = brief.created_at
    ? new Date(brief.created_at).toLocaleDateString("es-MX")
    : ""

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className="cursor-pointer text-base hover:underline"
            onClick={onOpenDetail}
          >
            {brief.concept}
          </CardTitle>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <p className="font-medium">{brief.headline}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {brief.copy_body}
        </p>
        <div className="flex flex-wrap gap-1">
          {(brief.hashtags ?? []).slice(0, 6).map((h) => (
            <Badge key={h} variant="outline">
              #{h}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onApprove}
          disabled={brief.status === "approved"}
        >
          <Check className="mr-1 h-4 w-4" />
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={brief.status === "rejected"}
        >
          <X className="mr-1 h-4 w-4" />
          Rechazar
        </Button>
        <Button size="sm" variant="ghost" onClick={onOpenDetail}>
          <MessageSquare className="mr-1 h-4 w-4" />
          Comentar
        </Button>
      </CardFooter>
    </Card>
  )
}
