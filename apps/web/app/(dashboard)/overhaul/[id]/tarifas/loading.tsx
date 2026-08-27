import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

export default function LoadingTarifas() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 overflow-hidden pb-24">
      {/* Cabecera */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* TarifaSummary */}
      <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-background px-4 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
        <div className="flex items-center gap-2 bg-background px-4 py-3 sm:col-span-2 lg:col-span-4">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>

      {/* TarifasForm Esqueleto */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="lg:w-64 lg:shrink-0 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-32 min-w-0 flex-1 rounded-md" /> {/* Upload box */}
        </div>
        
        <Separator />
        
        {/* Moneda */}
        <div className="space-y-2 max-w-48">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Grupos */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-24 w-full rounded-md" /> {/* Bloque de grupo */}
      </div>

      {/* Floating Action Button (Repuestos) */}
      <Skeleton className="fixed right-6 bottom-6 z-30 h-11 w-32 rounded-md shadow-lg" />
    </section>
  )
}