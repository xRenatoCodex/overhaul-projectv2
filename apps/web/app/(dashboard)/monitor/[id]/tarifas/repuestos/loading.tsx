import { Skeleton } from "@workspace/ui/components/skeleton"

export default function LoadingRepuestos() {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* Cabecera y Botón Volver */}
      <div className="space-y-4">
        <Skeleton className="h-9 w-24" /> {/* Botón ghost */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Métricas (3 columnas) */}
      <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 bg-background px-4 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
        <div className="flex flex-col gap-2 bg-background px-4 py-3">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2 mt-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>

      {/* Subida de archivo */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-32 w-full rounded-md border-dashed border-2" />
      </div>

      {/* Tabla de Repuestos (DataTable skeleton) */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-9 w-40" /> {/* Botón importar */}
        </div>
        <div className="rounded-md border p-4 space-y-4">
           <Skeleton className="h-10 w-64" /> {/* Search input */}
           <Skeleton className="h-64 w-full" /> {/* Table body */}
        </div>
      </div>
    </section>
  )
}