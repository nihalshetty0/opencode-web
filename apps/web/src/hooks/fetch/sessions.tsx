import { useMemo } from "react"
import type { Opencode } from "@opencode-ai/sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOpencodeClient } from "@/hooks/use-opencode-client"
import { useUrlParams } from "@/hooks/use-url-params"

export const useGetSessions = () => {
  const opencodeClient = useOpencodeClient()
  const { cwd } = useUrlParams()

  return useQuery<Opencode.SessionListResponse>({
    queryKey: ["sessions", { cwd }],
    enabled: !!opencodeClient && !!cwd,
    queryFn: () =>
      opencodeClient!.session.list().then((data) => {
        // Sort by creation time (newest first)
        data.sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))
        return data
      }),
  })
}

export const useGetActiveSession = () => {
  const { sessionId } = useUrlParams()
  const states = useGetSessions()

  const activeSession = useMemo(() => {
    if (!states.data || !sessionId) return null
    return states.data.find((s: Opencode.Session) => s.id === sessionId)
  }, [states.data, sessionId])

  return { ...states, data: activeSession }
}

/**
 * Create a new session.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient()
  const opencodeClient = useOpencodeClient()
  const { cwd } = useUrlParams()

  return useMutation<Opencode.Session>({
    mutationFn: () => {
      if (!opencodeClient) throw new Error("Opencode client not available")
      return opencodeClient.session.create()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", { cwd }] })
    },
  })
}

/**
 * Delete a session by ID.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  const opencodeClient = useOpencodeClient()
  const { cwd } = useUrlParams()

  return useMutation<Opencode.SessionDeleteResponse, Error, string>({
    mutationFn: (id: string) => {
      if (!opencodeClient) throw new Error("Opencode client not available")
      return opencodeClient.session.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", { cwd }] })
    },
  })
}
