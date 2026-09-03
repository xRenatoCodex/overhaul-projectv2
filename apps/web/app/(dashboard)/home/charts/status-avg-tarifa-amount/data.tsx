import { ensureBackendSeeded, metricsService } from "@workspace/backend"
import Chart from "./chart"

export default async function StatusAvgTarifaAmountData() {
  await ensureBackendSeeded()
  const data = await metricsService.getOverhaulsSummary()
  return <Chart data={data} />
}
