import { useMemo } from "react"
import { useRecentProjectsStore } from "@/store/recent-projects"
import { Clock, Copy, Folder, Play } from "lucide-react"

import { useGetInstances } from "@/hooks/fetch/broker"
import { useStartInstance } from "@/hooks/fetch/instances"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MergedProject {
  path: string
  name: string
  lastUsed: string
  isOffline: boolean
  source: "offline" | "recent"
}

export function InstanceLists() {
  const startInstanceMutation = useStartInstance()
  const { data: brokerData } = useGetInstances()
  const { projects, getProjectName } = useRecentProjectsStore()

  const instances = brokerData?.instances || []
  const brokerStatus = brokerData?.brokerStatus || "offline"
  const isBrokerOffline = brokerStatus === "offline"

  const offlineInstances = instances.filter((i) => i.status === "offline")

  // Merge offline instances and recent projects, removing duplicates
  const mergedProjects = useMemo(() => {
    const projectMap = new Map<string, MergedProject>()

    // Add offline instances first
    offlineInstances.forEach((instance) => {
      projectMap.set(instance.cwd, {
        path: instance.cwd,
        name: getProjectName(instance.cwd),
        lastUsed: new Date(instance.lastSeen || Date.now()).toISOString(),
        isOffline: true,
        source: "offline",
      })
    })

    // Add recent projects, but don't override offline instances
    projects.forEach((project) => {
      if (!projectMap.has(project.path)) {
        projectMap.set(project.path, {
          path: project.path,
          name: project.name,
          lastUsed: project.lastUsed,
          isOffline: false,
          source: "recent",
        })
      }
    })

    // Convert to array and sort by lastUsed (newest first)
    return Array.from(projectMap.values()).sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    )
  }, [offlineInstances, projects, getProjectName])

  if (mergedProjects.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          <CardTitle>Available Projects</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mergedProjects.map((project) => (
            <div
              key={project.path}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex items-center gap-3">
                {project.isOffline ? (
                  <Clock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.path}
                    {project.isOffline && " • Offline"}
                  </p>
                </div>
              </div>
              {isBrokerOffline ? (
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    opencode-web {project.path}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `opencode-web ${project.path}`
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startInstanceMutation.mutate(project.path)}
                  disabled={startInstanceMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
