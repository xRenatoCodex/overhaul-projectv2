"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const errorMessage =
      error?.message || "Ocurrió un error al cargar el dashboard"
    toast.error("Error en el dashboard", {
      description: errorMessage,
      position: "top-center",
      richColors: true,
    })
  }, [error])

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-auto p-2">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            Algo salió mal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No pudimos cargar los datos del dashboard. Esto puede ocurrir si la base de datos
            no está disponible.
          </p>
          <div className="bg-muted/50 p-3 rounded text-xs font-mono text-muted-foreground overflow-auto max-h-24">
            {error?.message}
          </div>
          <Button onClick={reset} variant="outline" size="sm">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
