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
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="overflow-x-hidden">
        <header className="bg-background flex h-16 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-medium">Panel de gestion</h1>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-6 [scrollbar-gutter:stable]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
