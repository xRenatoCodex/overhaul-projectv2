import type React from "react"

type SectionContentProps = {
  title: string
  description: string
  children?: React.ReactNode
}

export function SectionContent({ title, description, children }: SectionContentProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children ? (
        children
      ) : null}
    </section>
  )
}
