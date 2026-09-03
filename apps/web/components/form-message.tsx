import { cn } from "@workspace/ui/lib/utils"

export function FormMessage({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  if (!message) {
    return null
  }

  return (
    <p role="alert" className={cn("text-sm text-destructive", className)}>
      {message}
    </p>
  )
}
