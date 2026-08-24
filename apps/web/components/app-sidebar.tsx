"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Briefcase,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Hammer,
  Plus,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Comercial",
    items: [
      { label: "Tareas", href: "/comercial/tareas", icon: ClipboardList },
      { label: "Monitor", href: "/comercial/monitor", icon: ChartNoAxesCombined },
      { label: "Crear", href: "/overhaul/crear", icon: Plus },
    ],
  },
  {
    title: "Tarifas",
    items: [
      { label: "Tareas", href: "/tarifas/tareas", icon: CircleDollarSign },
      { label: "Monitor", href: "/tarifas/monitor", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "Planificación",
    items: [
      { label: "Tareas", href: "/planificacion/tareas", icon: Hammer },
      { label: "Monitor", href: "/planificacion/monitor", icon: ChartNoAxesCombined },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-slate-800">
      <SidebarHeader className="border-b border-slate-800">
        <Link
          href="/home"
          className="flex h-8 items-center gap-2 overflow-hidden rounded-md px-2 text-lg font-semibold text-slate-100 transition-colors hover:bg-slate-800"
        >
          <Briefcase className="size-4 shrink-0" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            Overhaul
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-slate-400">
              {group.title}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-200 hover:bg-slate-800 hover:text-slate-50"
                      }
                    >
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
