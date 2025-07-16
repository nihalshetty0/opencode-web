import { url } from "@/app"
import { useQuery } from "@tanstack/react-query"

import type { operations } from "@/types/openapi-types"

export type TGetProvidersResponse =
  operations["getConfigProviders"]["responses"]["200"]["content"]["application/json"]

export const useGetProviders = () =>
  useQuery<TGetProvidersResponse>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch(`${url}/api/config/providers`)
      if (!res.ok) throw new Error("Failed to fetch providers")
      return res.json()
    },
  })
