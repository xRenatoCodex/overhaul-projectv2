import StatusTotalOverhauls from "./charts/status-total-overhauls"
import StatusAvgPropuestaClosure from "./charts/status-avg-propuesta-closure"
import StatusAvgTarifaAmount from "./charts/status-avg-tarifa-amount"
import OverhaulCreatedByMonth from "./charts/overhauls-created-by-month"
import ProcessStatus from "./charts/process-status"
import ProcessTimeByArea from "./charts/process-time-by-area"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-auto p-2">
      <div className="w-full h-auto grid grid-cols-6 grid-flow-row-dense gap-4">
        <div className="col-span-3 lg:col-span-2 h-full overflow-auto p-1">
          <StatusTotalOverhauls />
        </div>
        <div className="col-span-3 lg:col-span-2 h-full overflow-auto p-1">
          <StatusAvgPropuestaClosure />
        </div>
        <div className="col-span-6 lg:col-span-2 h-full overflow-auto p-1">
          <StatusAvgTarifaAmount />
        </div>
        <div className="col-span-6 lg:col-span-6 h-full overflow-auto p-1">
          <OverhaulCreatedByMonth />
        </div>
        <div className="col-span-6 lg:col-span-3 h-full overflow-auto p-1">
          <ProcessStatus />
        </div>
        <div className="col-span-6 lg:col-span-3 h-full overflow-auto p-1 ">
          <ProcessTimeByArea />
        </div>
      </div>
    </div>
  )
}
