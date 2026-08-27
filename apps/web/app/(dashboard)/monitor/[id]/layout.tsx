import { MonitorStageNav } from "@/components/monitor-stage-nav"

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full overflow-hidden">
      <MonitorStageNav />
      <div className="w-full h-full overflow-auto">
        {children}
      </div>
    </div>
  )
}