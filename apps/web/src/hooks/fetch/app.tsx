import type { Opencode } from "@opencode-ai/sdk"
import { useQuery } from "@tanstack/react-query"

import { useOpencodeClient } from "@/hooks/use-opencode-client"
import { useUrlParams } from "@/hooks/use-url-params"

export const useGetAppInfo = () => {
  const opencodeClient = useOpencodeClient()
  const { cwd } = useUrlParams()

  return useQuery<Opencode.App & { projectName: string }>({
    queryKey: ["appInfo", { cwd }],
    enabled: !!opencodeClient && !!cwd,
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
