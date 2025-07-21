import { useQuery } from "@tanstack/react-query"

// TODO: These constants should stay in sync with the CLI
const BROKER_PORT_RANGE = [13943, 14839, 18503, 19304, 20197] as const
const BROKER_HOST = "127.0.0.1"

export interface Instance {
  cwd: string
  port: number
  host: string
  status: "online" | "offline"
  lastSeen?: number
  startedAt: number
}

export interface InstancesResponse {
  version: string
  info: { name: string }
  instances: Instance[]
}

export interface BrokerResponse {
  brokerStatus: "online" | "offline"
  instances: Instance[]
}

async function fetchInstances(): Promise<BrokerResponse> {
  const requests = BROKER_PORT_RANGE.map(async (port) => {
    try {
      const res = await fetch(`http://${BROKER_HOST}:${port}/instances`, {
        // Ensure we don\'t keep aborted connections around
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Request failed")
      const data = (await res.json()) as InstancesResponse
      // Basic validation
      if (Array.isArray(data.instances)) {
        return data.instances
      }
      throw new Error("Invalid response format")
    } catch {
      // Throw error to be caught by Promise.any
      throw new Error("Request failed")
    }
  })

  try {
    const instances = await Promise.any(requests)
    return {
      brokerStatus: "online",
      instances,
    }
  } catch {
    // Broker not found on any port
    return {
      brokerStatus: "offline",
      instances: [],
    }
  }
}

export const useGetInstances = () =>
  useQuery<BrokerResponse>({
    queryKey: ["instances"],
    queryFn: fetchInstances,
  })
