"use client"

import { useMemo, useState } from "react"
import { useLastSessionStore } from "@/store/last-session"
import { useRecentProjectsStore } from "@/store/recent-projects"
import { ChevronsUpDown, GalleryVerticalEnd, Plus, Square } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useGetInstances } from "@/hooks/fetch/broker"
import { useStartInstance, useStopInstance } from "@/hooks/fetch/instances"
import { useOpencodeClient } from "@/hooks/use-opencode-client"
import { useUrlParams } from "@/hooks/use-url-params"

import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TerminalCommand } from "@/components/terminal-command"

export function InstanceSwitcher() {
  // Move ALL hooks to the top before any conditional logic
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: brokerData, isLoading } = useGetInstances()
  const stopInstanceMutation = useStopInstance()
  const startInstanceMutation = useStartInstance()

  // NEW: Use our opencode client hook
  const { cwd: currentCwd } = useUrlParams()
  const [, setSearchParams] = useSearchParams()
  const getLastSession = useLastSessionStore((s) => s.getLastSession)
  const removeLastSession = useLastSessionStore((s) => s.removeLastSession)
  const opencodeClient = useOpencodeClient()
  // Access recent projects (stored locally)
  const { projects } = useRecentProjectsStore()

  // Debug logging
  console.log("🔍 InstanceSwitcher debug:", {
    currentCwd,
    hasClient: !!opencodeClient,
  })

  const instances = useMemo(() => {
    // Combine broker-reported instances with locally stored recent projects.
    const brokerInstances = brokerData?.instances ?? []

    // Map <path, instance> to de-duplicate when the same path appears twice.
    const map = new Map<string, any>()

    // 1) Add all broker instances first (both online & offline)
    brokerInstances.forEach((inst) => {
      map.set(inst.cwd, inst)
    })

    // 2) Add recent projects not already present (mark as offline)
    projects.forEach((proj) => {
      if (!map.has(proj.path)) {
        map.set(proj.path, {
          cwd: proj.path,
          host: "",
          port: 0,
          status: "offline",
          lastSeen: new Date(proj.lastUsed).getTime(),
          // Use 0 so they naturally sort after any running instances
          startedAt: 0,
        })
      }
    })

    const list = Array.from(map.values())

    // Helper: sort by startedAt (oldest first; 0/undefined treated as large)
    const byStartedAsc = (
      a: (typeof list)[number],
      b: (typeof list)[number]
    ) => {
      const aTime = a.startedAt ?? Number.MAX_SAFE_INTEGER
      const bTime = b.startedAt ?? Number.MAX_SAFE_INTEGER
      return aTime - bTime
    }

    const online = list.filter((i) => i.status === "online").sort(byStartedAsc)
    const offline = list.filter((i) => i.status !== "online").sort(byStartedAsc)

    return [...online, ...offline]
  }, [brokerData, projects])

  // Determine selected instance by currentCwd (fallback to first) - BEFORE any returns
  const selectedInstance = useMemo(() => {
    return instances.find((i) => i.cwd === currentCwd) || instances[0]
  }, [instances, currentCwd])

  // Derive a human-friendly label (project folder name) - BEFORE any returns
  const label = useMemo(() => {
    if (!selectedInstance) return ""
    const parts = selectedInstance.cwd.split(/[/\\]/)
    return parts[parts.length - 1] || selectedInstance.cwd
  }, [selectedInstance])

  // Helper to change URL cwd param
  const selectInstance = (cwd: string, restore: boolean = true) => {
    const last = restore ? getLastSession(cwd) : undefined
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("cwd", cwd)
        if (last) {
          next.set("session", last)
        } else {
          next.delete("session")
        }
        return next
      },
      { replace: true }
    )
  }

  // NOW we can do conditional returns after all hooks are called
  if (isLoading) return null

  if (!instances.length) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            No codebase added
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <TooltipProvider>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton size="lg">
            <GalleryVerticalEnd className="mr-2 h-4 w-4" />
            <span className="truncate">{label}</span>
            <ChevronsUpDown className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <SidebarMenuButton size="sm" className="h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Add codebase
                  </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Codebase</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Running the opencode-web CLI connects to the codebase in
                        the current directory.
                      </p>
                      <TerminalCommand command="opencode-web" />
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Or you can connect to a codebase in a specific
                        directory.
                      </p>
                      <TerminalCommand command="opencode-web /path/to/project" />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </SidebarMenuItem>

            {instances.map((instance) => {
              const instanceLabel = (() => {
                const parts = instance.cwd.split(/[/\\]/)
                return parts[parts.length - 1] || instance.cwd
              })()

              const isSelected = instance.cwd === currentCwd

              return (
                <SidebarMenuItem key={instance.cwd}>
                  <div className="group/instance relative w-full">
                    <SidebarMenuButton
                      size="sm"
                      onClick={() => {
                        if (instance.status === "online") {
                          selectInstance(instance.cwd)
                        } else {
                          startInstanceMutation.mutate(instance.cwd, {
                            onSuccess: () =>
                              selectInstance(instance.cwd, false),
                          })
                        }
                      }}
                      className={cn(
                        "w-full h-14 px-4 transition-colors",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center w-full gap-2">
                        {/* status dot */}
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            instance.status === "online"
                              ? "bg-green-500"
                              : "bg-muted-foreground"
                          )}
                        />

                        <div className="flex-1 text-left">
                          <div className="font-medium truncate">
                            {instanceLabel}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {instance.cwd}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Hover stop button */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/instance:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {instance.status === "online" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                stopInstanceMutation.mutate(instance.cwd, {
                                  onSuccess: () => {
                                    console.log("[stop] success", instance.cwd)
                                    removeLastSession(instance.cwd)
                                  },
                                })
                              }}
                              disabled={stopInstanceMutation.isPending}
                              className="h-8 w-8 p-0 bg-background border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                startInstanceMutation.mutate(instance.cwd, {
                                  onSuccess: () => selectInstance(instance.cwd),
                                })
                              }}
                              disabled={startInstanceMutation.isPending}
                              className="h-8 w-8 p-0 bg-background border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            >
                              {/* Play icon using lucide */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path d="M5 3.868v16.264A1 1 0 0 0 6.555 21l12.888-8.132a1 1 0 0 0 0-1.736L6.555 3A1 1 0 0 0 5 3.868Z" />
                              </svg>
                            </Button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {instance.status === "online"
                              ? "Exit codebase"
                              : "Start codebase"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  )
}
