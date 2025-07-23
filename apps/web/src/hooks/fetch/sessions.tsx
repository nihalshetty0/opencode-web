import { useMemo } from "react"
import { useOpencodeClient } from "@/store/opencode-client"
import type { Opencode } from "@opencode-ai/sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useUrlParams } from "@/hooks/use-url-params"

export const useGetSessions = () => {
  const { port } = useUrlParams()
  const opencodeClient = useOpencodeClient()

  return useQuery<Opencode.SessionListResponse>({
    queryKey: ["sessions", { port }],
    enabled: !!port && !!opencodeClient,
    queryFn: () => {
      console.log("[useGetSessions] Fetching sessions for port:", port)

      return opencodeClient!.session.list().then((data) => {
        console.log("[useGetSessions] Got sessions:", data.length)

        // Sort by creation time (newest first)
        data.sort((a, b) => (b.time?.created ?? 0) - (a.time?.created ?? 0))

        return data
      })
    },
  })
}

export const useGetActiveSession = () => {
  const { sessionId } = useUrlParams()
  const states = useGetSessions()

  const activeSession = useMemo(() => {
    if (!states.data || !sessionId) {
      return null
    }

    const session = states.data.find(
      (s: Opencode.Session) => s.id === sessionId
    )
    if (session) {
      console.log("[useGetActiveSession] Active session found:", session.id)
    }

    return session
  }, [states.data, sessionId])

  return { ...states, data: activeSession }
}

export const useCreateSession = () => {
  const queryClient = useQueryClient()
  const { port } = useUrlParams()
  const opencodeClient = useOpencodeClient()

  return useMutation<Opencode.Session>({
    mutationFn: () => {
      console.log("[useCreateSession] Creating new session...")
      return opencodeClient!.session.create()
    },
    onSuccess: (session) => {
      console.log("[useCreateSession] Session created:", session.id)
      queryClient.invalidateQueries({ queryKey: ["sessions", { port }] })
    },
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()
  const { port } = useUrlParams()
  const opencodeClient = useOpencodeClient()

  return useMutation<Opencode.SessionDeleteResponse, Error, string>({
    mutationFn: (id: string) => {
      return opencodeClient!.session.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", { port }] })
    },
  })
}
