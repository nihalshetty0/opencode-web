import { useOpencodeClientStore } from "@/store/opencode-client"

import { useUrlParams } from "@/hooks/use-url-params"

/**
 * Simple hook to get the current Opencode client based on URL cwd parameter
 * Returns the client instance or null if no client exists for current cwd
 */
export function useOpencodeClient() {
  const { cwd } = useUrlParams()
  const getClient = useOpencodeClientStore((state) => state.getClient)

  return cwd ? getClient(cwd) : null
}
