import type { TProvidersResponse } from "@/types"
import { useQuery } from "@tanstack/react-query"

export const useGetProviders = () =>
  useQuery<TProvidersResponse>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch("/api/config/providers")
      if (!res.ok) throw new Error("Failed to fetch providers")
      return res.json()
    },
  })
