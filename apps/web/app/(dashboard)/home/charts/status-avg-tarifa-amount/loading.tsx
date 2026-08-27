import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function StatusAvgTarifaAmountLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  )
}
