import type { Opencode } from "@opencode-ai/sdk"
import { useQuery } from "@tanstack/react-query"

export const useGetProviders = () =>
  useQuery<Opencode.AppProvidersResponse>({
    queryKey: ["providers"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:15096/api/config/providers"
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
  })
