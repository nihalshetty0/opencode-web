import type { Opencode } from "@opencode-ai/sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { opencodeClient } from "@/lib/opencode-client"

export const useGetMessages = ({
  sessionId,
}: {
  sessionId: string | undefined
}) =>
  useQuery<Opencode.SessionMessagesResponse>({
    queryKey: ["messages", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("Session ID is required")
      return opencodeClient.session.messages(sessionId)
    },
    enabled: !!sessionId,
  })

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation<
    Opencode.AssistantMessage,
    Error,
    {
      sessionId: string
      payload: Opencode.SessionChatParams
    }
  >({
    mutationFn: ({ sessionId, payload }) =>
      opencodeClient.session.chat(sessionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.sessionId],
      })
    },
  })
}
