import type { Opencode } from "@opencode-ai/sdk"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOpencodeClient } from "@/hooks/use-opencode-client"

export const useGetMessages = ({
  sessionId,
}: {
  sessionId: string | undefined
}) => {
  const opencodeClient = useOpencodeClient()

  return useQuery<Opencode.SessionMessagesResponse>({
    queryKey: ["messages", sessionId],
    enabled: !!sessionId && !!opencodeClient,
    queryFn: () => opencodeClient!.session.messages(sessionId!),
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  const opencodeClient = useOpencodeClient()

  return useMutation<
    Opencode.AssistantMessage,
    Error,
    {
      sessionId: string
      payload: Opencode.SessionChatParams
    }
  >({
    mutationFn: ({ sessionId, payload }) => {
      if (!opencodeClient) throw new Error("Opencode client not available")
      return opencodeClient.session.chat(sessionId, payload)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.sessionId],
      })
    },
  })
}
