import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"

export default function LoadingAlcance() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      {/* Cabecera */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="space-y-8">
        {/* Esqueleto de un Sistema (AlcanceForm) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-10 w-10" />
          </div>
          
          {/* Tabla de componentes */}
          <div className="overflow-x-auto rounded-md border">
            <div className="border-b bg-muted/40 p-3 flex gap-4">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="p-3 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-40" /> {/* Botón Añadir componente */}
          <Separator />
        </div>
        
        <Skeleton className="h-9 w-36" /> {/* Botón Añadir sistema */}
      </div>
    </section>
  )
}