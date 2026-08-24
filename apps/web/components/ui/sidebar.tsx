"use client"

import * as React from "react"
import { Menu, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SidebarContextValue = {
  desktopOpen: boolean
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("Sidebar components must be used inside SidebarProvider")
  }
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [desktopOpen, setDesktopOpen] = React.useState(true)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggle = React.useCallback(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setDesktopOpen((value) => !value)
      return
    }
    setMobileOpen((value) => !value)
  }, [])

  return (
    <SidebarContext.Provider
      value={{ desktopOpen, mobileOpen, setMobileOpen, toggle }}
    >
      <div className="flex min-h-svh">{children}</div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { desktopOpen, mobileOpen, setMobileOpen } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          "hidden border-r transition-all duration-200 md:flex md:flex-col",
          desktopOpen ? "md:w-72" : "md:w-0 md:overflow-hidden",
          className,
        )}
      >
        {children}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menu"
          />
          <aside className={cn("w-72 border-r", className)}>
            <div className="flex h-16 items-center justify-end px-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-100 hover:bg-slate-800 hover:text-slate-100"
              >
                <X />
              </Button>
            </div>
            {children}
          </aside>
        </div>
      ) : null}
    </>
  )
}

export function SidebarTrigger() {
  const { toggle } = useSidebar()

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggle}>
      <Menu />
    </Button>
  )
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col">{children}</div>
}
