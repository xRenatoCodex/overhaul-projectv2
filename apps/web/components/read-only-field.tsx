export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="block text-sm font-medium text-muted-foreground">{label}</span>
      <span className="block text-sm">{value}</span>
    </div>
  )
}
