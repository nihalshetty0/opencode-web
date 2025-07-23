"use client"

import { useState } from "react"
import { Folder, Plus } from "lucide-react"

import { useGetAppInfo } from "@/hooks/fetch/app"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { AddCodebaseDialog } from "./add-codebase-dialog"

export function InstanceSwitcher() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { data: appInfo, isLoading } = useGetAppInfo()

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Folder className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {isLoading
                      ? "Loading..."
                      : appInfo?.projectName || "No project"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {appInfo?.path.root || "Not connected"}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Folder className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {appInfo?.projectName || "No project"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {appInfo?.path.root || "Not connected"}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onSelect={() => setShowAddDialog(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add codebase
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AddCodebaseDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  )
}
