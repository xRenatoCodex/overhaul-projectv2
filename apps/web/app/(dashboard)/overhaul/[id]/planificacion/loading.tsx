import { Skeleton } from "@workspace/ui/components/skeleton"

export default function LoadingPlanificacion() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-md" />
    </section>
  )
}