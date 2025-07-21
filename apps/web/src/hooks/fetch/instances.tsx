import { useRecentProjectsStore } from "@/store/recent-projects"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

import { useGetInstances } from "./broker"

// TODO: These constants should stay in sync with the CLI
const BROKER_PORT_RANGE = [13943, 14839, 18503, 19304, 20197] as const
const BROKER_HOST = "127.0.0.1"

async function startInstance(
  projectPath: string
): Promise<{ message: string; port: number }> {
  for (const port of BROKER_PORT_RANGE) {
    try {
      const res = await fetch(`http://${BROKER_HOST}:${port}/instance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cwd: projectPath }),
      })

      if (res.status === 409) {
        throw new Error("Instance already running for this project")
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to start instance: ${errorText}`)
      }

      return await res.json()
    } catch (error) {
      if (error instanceof Error && error.message.includes("already running")) {
        throw error
      }
      // Continue to next port
    }
  }
  throw new Error("Broker not found on any known port")
}

async function stopInstance(projectPath: string): Promise<{ message: string }> {
  for (const port of BROKER_PORT_RANGE) {
    try {
      const res = await fetch(`http://${BROKER_HOST}:${port}/instance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cwd: projectPath }),
      })

      if (res.status === 404) {
        throw new Error("Instance not found")
      }

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to stop instance: ${errorText}`)
      }

      return await res.json()
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error
      }
      // Continue to next port
    }
  }
  throw new Error("Broker not found on any known port")
}

export function useStartInstance() {
  const queryClient = useQueryClient()
  const { addProject } = useRecentProjectsStore()
  const [, setSearchParams] = useSearchParams()

  return useMutation({
    mutationFn: startInstance,
    onSuccess: (_, projectPath) => {
      // Add to recent projects
      addProject({
        path: projectPath,
        name: projectPath.split(/[/\\]/).pop() || projectPath,
      })

      // Invalidate instances query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["instances"] })

      // Update URL param to make the newly started instance active using React Router
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set("cwd", projectPath)
          return next
        },
        { replace: true }
      )
    },
  })
}

export function useStopInstance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopInstance,
    onSuccess: () => {
      // Invalidate instances query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["instances"] })
    },
  })
}
