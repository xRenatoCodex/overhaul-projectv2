import { formatDate } from "@/lib/format-date"

type StageHeaderInfoProps = {
  version: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export function StageHeaderInfo({
  version,
  createdBy,
  createdAt,
  updatedAt,
}: StageHeaderInfoProps) {
  return (
    <div className="absolute top-0 right-0 text-sm text-muted-foreground space-y-1">
      <div>
        <span className="font-medium">v{version}</span>
      </div>
      {createdBy && (
        <div>
          <span>Creado por: {createdBy}</span>
        </div>
      )}
      <div>
        <span>Creado: {formatDate(createdAt)}</span>
      </div>
      <div>
        <span>Modificado: {formatDate(updatedAt)}</span>
      </div>
    </div>
  )
}
