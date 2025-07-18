import { useMemo } from "react"
import type { Opencode } from "@opencode-ai/sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import { opencodeClient } from "@/lib/opencode-client"

export const useGetSessions = () =>
  useQuery<Opencode.SessionListResponse>({
    queryKey: ["sessions"],
    queryFn: () =>
      opencodeClient.session.list().then((data) => {
        // Sort by creation time (newest first)
        data.sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))
        return data
      }),
  })

export const useGetActiveSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
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

  return useMutation<Opencode.Session>({
    mutationFn: () => opencodeClient.session.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

/**
 * Delete a session by ID.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */
export const useDeleteSession = () => {
  const queryClient = useQueryClient()

  return useMutation<Opencode.SessionDeleteResponse, Error, string>({
    mutationFn: (id: string) => opencodeClient.session.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}
