import { ensureBackendSeeded, metricsService } from "@workspace/backend"
import Chart from "./chart"

export default async function ProcessTimeByAreaData() {
  await ensureBackendSeeded()
  const data = await metricsService.getAverageClosureTimeByArea()
  return <Chart data={data} />
}
