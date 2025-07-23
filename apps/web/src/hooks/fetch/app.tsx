import { useOpencodeClient } from "@/store/opencode-client"
import type { Opencode } from "@opencode-ai/sdk"
import { useQuery } from "@tanstack/react-query"

import { useUrlParams } from "@/hooks/use-url-params"

export const useGetAppInfo = () => {
  const { port } = useUrlParams()
  const opencodeClient = useOpencodeClient()

  return useQuery<Opencode.App & { projectName: string }>({
    queryKey: ["appInfo", { port }],
    enabled: !!port && !!opencodeClient,
    queryFn: () =>
      opencodeClient!.app.get().then((data) => {
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
}
