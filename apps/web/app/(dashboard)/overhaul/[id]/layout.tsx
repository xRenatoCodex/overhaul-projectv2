import { notFound } from "next/navigation"

import { OverhaulStageNav } from "@/components/overhaul-stage-nav"
import { NotFoundError } from "@workspace/backend"

import { getStageAccess, type StageAccess } from "./stage-access"

export default async function OverhaulDetailLayout({
  params,
  children,
}: Readonly<{ params: Promise<{ id: string }>; children: React.ReactNode }>) {
  const { id } = await params

  let stageAccess: StageAccess

  try {
    stageAccess = await getStageAccess(id)
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound()
    }
    throw error
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-8 overflow-hidden">
      <OverhaulStageNav stageAccess={stageAccess} />
      <div className="flex min-h-0 flex-1 w-full flex-col gap-8 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
