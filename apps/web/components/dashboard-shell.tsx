"use client"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { AppSidebar } from "@/components/app-sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-full overflow-hidden w-full">
      <AppSidebar />

      <SidebarInset className="overflow-hidden h-full w-full flex flex-col">
        <header className="flex h-16 shrink-0 gap-2 border-b px-4 flex-row items-center">
          <SidebarTrigger />
          <Separator
            orientation="vertical" className="my-6"
          />
          <h1 className="text-lg font-medium">Panel de gestion</h1>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden p-6 scrollbar-gutter-stable">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
