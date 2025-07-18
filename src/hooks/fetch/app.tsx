import { url } from "@/app"
import { useQuery } from "@tanstack/react-query"

import type { operations } from "@/types/openapi-types"

type TGetAppResponse =
  operations["getApp"]["responses"]["200"]["content"]["application/json"]

export const useGetAppInfo = () =>
  useQuery<TGetAppResponse & { projectName: string }>({
    queryKey: ["appInfo"],
    queryFn: async () => {
      const res = await fetch(`${url}/api/app`)
      if (!res.ok) throw new Error("Failed to fetch app info")
      const data = await res.json()

      // Cross-platform: get last segment of path.root
      const root = data.path.root
      let projectName = ""
      if (typeof root === "string") {
        const normalized = root.replace(/[\\/]+$/, "")
        const parts = normalized.split(/[/\\]+/)
        projectName = parts[parts.length - 1] || ""
      }

      return { ...data, projectName }
    },
  })
