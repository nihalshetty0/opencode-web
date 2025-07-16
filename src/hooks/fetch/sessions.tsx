import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import type { operations } from "@/types/openapi-types"

export type TGetSessionsResponse =
  operations["getSession"]["responses"]["200"]["content"]["application/json"]

export const useGetSessions = () =>
  useQuery<TGetSessionsResponse>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const res = await fetch("/api/session")
      if (!res.ok) throw new Error("Failed to fetch sessions")
      const data: TGetSessionsResponse = await res.json()
      data.sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))
      return data
    },
  })

export const useGetActiveSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const states = useGetSessions()

  const activeSession = useMemo(() => {
    if (!states.data || !sessionId) return null
    return states.data.find((s) => s.id === sessionId)
  }, [states.data, sessionId])

  return { ...states, data: activeSession }
}

/**
 * Create a new session.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */

export type TPostSessionResponse =
  operations["postSession"]["responses"]["200"]["content"]["application/json"]

export const useCreateSession = () => {
  const queryClient = useQueryClient()

  return useMutation<TPostSessionResponse>({
    mutationFn: async () => {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to create session")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

/**
 * Delete a session by ID.
 * Returns a mutation object. On success, invalidates the "sessions" query.
 */

export type TDeleteSessionResponse =
  operations["deleteSessionById"]["responses"]["200"]["content"]["application/json"]

export const useDeleteSession = () => {
  const queryClient = useQueryClient()

  return useMutation<TDeleteSessionResponse, Error, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/session/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete session")
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}
