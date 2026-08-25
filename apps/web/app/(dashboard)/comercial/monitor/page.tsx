import type { MonitorItem } from "@workspace/backend/types/overhaul"

import { SectionContent } from "@/components/section-content"
import { MonitorTable } from "@/components/monitor-table"

async function getMonitorItems(): Promise<MonitorItem[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`

  try {
    const res = await fetch(`${baseUrl}/api/comercial/monitor`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function ComercialMonitorPage() {
  const items = await getMonitorItems()

  return (
    <SectionContent
      title="Monitor Comercial"
      description="Seguimiento de solicitudes y oportunidades comerciales. Haz click en una fila para ir al alcance del overhaul."
    >
      <MonitorTable
        items={items}
        hrefTemplate="/overhaul/{id}/alcance"
      />
    </SectionContent>
  )
}