import { ensureBackendSeeded, metricsService } from "@workspace/backend"
import Chart from "./chart"

export default async function OverhaulsCreatedByMonthData() {
  await ensureBackendSeeded()
  const data = await metricsService.getOverhaulsCreatedByMonth()
  return <Chart data={data} />
}
