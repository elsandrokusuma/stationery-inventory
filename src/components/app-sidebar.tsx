
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  BrainCircuit,
  Warehouse,
  UserCircle,
  Settings,
  ClipboardCheck,
} from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpen } = useSidebar()
  const isActive = (path: string) => pathname === path

  const handleLinkClick = () => {
    // Collapse the sidebar on desktop when a link is clicked
    setOpen(false)
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/" aria-label="Home">
              <Warehouse className="size-5" />
            </Link>
          </Button>
          <span className="font-semibold text-lg">Stationery Inventory</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/")}
              tooltip={{ children: "Dashboard" }}
              onClick={handleLinkClick}
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/inventory")}
              tooltip={{ children: "Inventory" }}
              onClick={handleLinkClick}
            >
              <Link href="/inventory">
                <Boxes />
                <span>Inventory</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/pre-orders")}
              tooltip={{ children: "Pre-Orders" }}
              onClick={handleLinkClick}
            >
              <Link href="/pre-orders">
                <ShoppingCart />
                <span>Pre-Orders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/approval")}
              tooltip={{ children: "Approval" }}
              onClick={handleLinkClick}
            >
              <Link href="/approval">
                <ClipboardCheck />
                <span>Approval</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: "Account" }}>
              <UserCircle />
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: "Settings" }}>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
