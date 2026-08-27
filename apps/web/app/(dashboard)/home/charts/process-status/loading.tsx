import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ProcessStatusLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="aspect-square w-full max-w-[280px] rounded-full" />
      </CardContent>
    </Card>
  )
}
