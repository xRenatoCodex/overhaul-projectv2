import { OverhaulStageNav } from "@/components/overhaul-stage-nav"

export default function OverhaulDetailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <OverhaulStageNav />
      {children}
    </div>
  )
}
