type SectionContentProps = {
  title: string
  description: string
}

export function SectionContent({ title, description }: SectionContentProps) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="bg-card text-card-foreground rounded-lg border p-6">
        <p>{description}</p>
      </div>
    </section>
  )
}
