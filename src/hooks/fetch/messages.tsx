import { url } from "@/app"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { operations } from "@/types/openapi-types"

export type TGetSessionByIdMessageResponse =
  operations["getSessionByIdMessage"]["responses"]["200"]["content"]["application/json"]

export const useGetMessages = ({
  sessionId,
}: {
  sessionId: string | undefined
}) =>
  useQuery<TGetSessionByIdMessageResponse>({
    queryKey: ["messages", sessionId],
    queryFn: async () => {
      const res = await fetch(`${url}/api/session/${sessionId}/message`)
      if (!res.ok) throw new Error("Failed to fetch messages")
      return res.json()
    },
    enabled: !!sessionId,
  })

export type TPostSessionByIdMessageRequest = NonNullable<
  operations["postSessionByIdMessage"]["requestBody"]
>["content"]["application/json"]

type TPostSessionByIdMessageResponse =
  operations["postSessionByIdMessage"]["responses"]["200"]["content"]["application/json"]

export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation<
    TPostSessionByIdMessageResponse,
    Error,
    {
      sessionId: string
      payload: TPostSessionByIdMessageRequest
    }
  >({
    mutationFn: async ({ sessionId, payload }) => {
      const res = await fetch(`${url}/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to send message")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.sessionId],
      })
    },
  })
}
