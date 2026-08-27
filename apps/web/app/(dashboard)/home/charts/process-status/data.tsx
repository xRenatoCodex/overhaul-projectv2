import { ensureBackendSeeded, metricsService } from "@workspace/backend"

import Chart from "./chart"

export default async function ProcessStatusData() {
  await ensureBackendSeeded()
  const data = await metricsService.getOverhaulsByStatus()

  return <Chart data={data} />
}
