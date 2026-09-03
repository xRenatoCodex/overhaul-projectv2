import { notFound } from "next/navigation"

import { OverhaulGlobalHeader } from "@/components/overhaul-global-header"
import { OverhaulStageNav } from "@/components/overhaul-stage-nav"
import { NotFoundError, overhaulService } from "@workspace/backend"
import type { OverhaulSummary } from "@workspace/backend/types/overhaul"

import { getStageAccess, type StageAccess } from "./stage-access"

export default async function OverhaulDetailLayout({
  params,
  children,
}: Readonly<{ params: Promise<{ id: string }>; children: React.ReactNode }>) {
  const { id } = await params

  let stageAccess: StageAccess
  let summary: OverhaulSummary

  try {
    ;[stageAccess, summary] = await Promise.all([
      getStageAccess(id),
      overhaulService.getSummary(id),
    ])
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <OverhaulGlobalHeader summary={summary} />
      <div className="flex min-h-0 flex-1 w-full flex-col gap-8 overflow-x-hidden overflow-y-auto pt-6">
        <OverhaulStageNav stageAccess={stageAccess} />
        {children}
      </div>
    </div>
  )
}
