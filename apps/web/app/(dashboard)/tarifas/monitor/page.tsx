import type { MonitorItem } from "@workspace/backend/types/overhaul"

import { SectionContent } from "@/components/section-content"
import { MonitorTable } from "@/components/monitor-table"

async function getMonitorItems(): Promise<MonitorItem[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://localhost:${process.env.PORT ?? 3000}`

  try {
    const res = await fetch(`${baseUrl}/api/tarifas/monitor`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function TarifasMonitorPage() {
  const items = await getMonitorItems()

  return (
    <SectionContent
      title="Monitor de Tarifas"
      description="Seguimiento del estado de tarifas por overhaul. Haz click en una fila para ir directamente a la etapa de tarifas."
    >
      <MonitorTable
        items={items}
        hrefTemplate="/overhaul/{id}/tarifas"
      />
    </SectionContent>
  )
}