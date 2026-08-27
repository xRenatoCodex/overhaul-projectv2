import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

export default function LoadingPropuesta() {
  return (
    <section className="w-full max-w-5xl space-y-8">
      {/* Título y subtítulo */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Grid 1: Estado, Fechas y Documento */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>

      <Separator />

      {/* Grid 2: Información de contacto */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>

      <Separator />

      {/* Condiciones */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2 pl-5">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>

      <Separator />

      {/* Inclusiones y exclusiones por sistema */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-72" />
        <div className="space-y-4">
          {/* Mostramos un par de cajas simulando los sistemas */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-md border p-4 space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 uppercase" />
                  <div className="space-y-2 pl-5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-20 uppercase" />
                  <div className="space-y-2 pl-5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Grid 3: Términos generales y Garantías */}
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}