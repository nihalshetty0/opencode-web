import type { Opencode } from "@opencode-ai/sdk"
import { useQuery } from "@tanstack/react-query"

import { opencodeClient } from "@/lib/opencode-client"

export const useGetAppInfo = () =>
  useQuery<Opencode.App & { projectName: string }>({
    queryKey: ["appInfo"],
    queryFn: () =>
      opencodeClient.app.get().then((data) => {
        // Cross-platform: get last segment of path.root
        const root = data.path.root
        let projectName = ""
        if (typeof root === "string") {
          const normalized = root.replace(/[\\/]+$/, "")
          const parts = normalized.split(/[/\\]+/)
          projectName = parts[parts.length - 1] || ""
        }

        return { ...data, projectName }
      }),
  })
