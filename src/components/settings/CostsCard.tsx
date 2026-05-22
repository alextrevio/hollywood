import { useCostSummary } from "@/hooks/use-costs"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function usd(n: number): string {
  return `$${n.toFixed(4)}`
}

export function CostsCard() {
  const { data, isPending } = useCostSummary()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costos del agente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isPending || !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Este mes" value={usd(data.totalMonthUsd)} />
              <Stat label="Total proyecto" value={usd(data.totalProjectUsd)} />
              <Stat label="Promedio / brief" value={usd(data.avgPerBriefUsd)} />
              <Stat label="Briefs generados" value={String(data.briefCount)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Desglose por marca</p>
              {data.byBrand.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byBrand.map((b) => (
                      <TableRow key={b.brandId}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {usd(b.costUsd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aún no hay gasto registrado.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
