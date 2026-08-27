import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

export default function LoadingNecesidad() {
  return (
    <section className=" w-full max-w-5xl space-y-8">
      {/* 1. Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Etapa 1 - Necesidad */}
        <Skeleton className="h-8 w-64" /> {/* Título del proyecto */}
      </div>

      {/* 2. Grid de Campos Superiores Skeleton */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-5 w-48" /> {/* Value */}
          </div>
        ))}
      </div>

      <Separator />

      {/* 3. Grid de Fechas Skeleton */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-40" /> {/* Label */}
            <Skeleton className="h-5 w-32" /> {/* Value */}
          </div>
        ))}
      </div>

      <Separator />

      {/* 4. Tabla de Máquinas Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" /> {/* Subtítulo "Máquinas incluidas" */}
        <div className="overflow-hidden rounded-md border">
          {/* Falsa tabla */}
          <div className="border-b bg-muted/40 p-3">
             <Skeleton className="h-4 w-full" />
          </div>
          <div className="p-3">
             <Skeleton className="h-10 w-full" />
          </div>
          <div className="p-3 border-t">
             <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}