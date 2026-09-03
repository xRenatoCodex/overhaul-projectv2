"use client"

import { useState } from "react"
import { GitBranch, Lock } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

/**
 * A completed stage is read-only until the user explicitly starts a new version.
 * Returns `isLocked` (drive `disabled` from it) and `startNewVersion`.
 */
export function useStageLock(isCompleted: boolean, version: number) {
  const [isEditing, setIsEditing] = useState(false)

  return {
    isLocked: isCompleted && !isEditing,
    isEditing,
    nextVersion: version + 1,
    startNewVersion: () => setIsEditing(true),
    lockAgain: () => setIsEditing(false),
  }
}

export function StageLockBanner({
  isLocked,
  isEditing,
  version,
  nextVersion,
  onStartNewVersion,
  className,
}: {
  isLocked: boolean
  isEditing: boolean
  version: number
  nextVersion: number
  onStartNewVersion: () => void
  className?: string
}) {
  if (isLocked) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-md border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Etapa completada · versión {version}
            </p>
            <p className="text-sm text-muted-foreground">
              Los datos están bloqueados. Crea una nueva versión para modificarlos.
            </p>
          </div>
        </div>
        <Button type="button" onClick={onStartNewVersion}>
          <GitBranch />
          Crear nueva versión
        </Button>
      </div>
    )
  }

  if (!isEditing) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3",
        className,
      )}
    >
      <GitBranch className="mt-0.5 size-4 text-primary" />
      <p className="text-sm text-muted-foreground">
        Estás editando una nueva versión. Al guardar se registrará como la versión{" "}
        <span className="font-medium text-foreground">v{nextVersion}</span> y las
        etapas posteriores deberán revisarse de nuevo.
      </p>
    </div>
  )
}

/** Disables every control inside while the stage is locked. */
export function StageLockFieldset({
  isLocked,
  className,
  children,
}: {
  isLocked: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <fieldset
      disabled={isLocked}
      aria-label={isLocked ? "Etapa bloqueada" : undefined}
      className={cn(
        "min-w-0 border-0 p-0",
        isLocked && "opacity-70 **:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </fieldset>
  )
}
