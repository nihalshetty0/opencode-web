import { useQuery } from "@tanstack/react-query"

// These constants should stay in sync with the CLI
const BROKER_PORT_RANGE = [13943, 14839, 18503, 19304, 20197] as const
const BROKER_HOST = "127.0.0.1"

export interface Instance {
  cwd: string
  port: number
  host: string
  status: "online" | "offline"
  lastSeen?: number
}

export interface InstancesResponse {
  version: string
  info: { name: string }
  instances: Instance[]
}

async function fetchInstances(): Promise<InstancesResponse> {
  for (const port of BROKER_PORT_RANGE) {
    try {
      const res = await fetch(`http://${BROKER_HOST}:${port}/instances`, {
        // Ensure we don\'t keep aborted connections around
        cache: "no-store",
      })
      if (!res.ok) continue
      const data = (await res.json()) as InstancesResponse
      // Basic validation
      if (Array.isArray(data.instances)) {
        return data
      }
    } catch {
      // Ignore and try next port
    }
  }
  throw new Error("Broker not found on any known port")
}

export const useGetInstances = () =>
  useQuery<InstancesResponse>({
    queryKey: ["instances"],
    queryFn: fetchInstances,
    // Poll every 10 seconds to keep status fresh
    refetchInterval: 10000,
    // If the broker isn\'t found yet, keep retrying
    retry: true,
  })
