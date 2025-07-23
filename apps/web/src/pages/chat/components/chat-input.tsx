import { useState } from "react"
import { ProviderSelect } from "@/pages/chat/components/provider-select"
import { useSelectedModelStore } from "@/store"
import type { MessageWithParts } from "@/types"
import type { Opencode } from "@opencode-ai/sdk"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"

import { generateNewID, ID } from "@/lib/generateId"
import { useGetMessages, useSendMessage } from "@/hooks/fetch/messages"
import { useCreateSession, useGetActiveSession } from "@/hooks/fetch/sessions"
import { useUrlParams } from "@/hooks/use-url-params"

import { ChatInputSubmit, ChatInputTextarea } from "@/components/chat-input"

export function ChatInput() {
  const { data: activeSession } = useGetActiveSession()
  const createSessionMutation = useCreateSession()
  const [, setSearchParams] = useSearchParams()
  const { port } = useUrlParams()

  const { data: messages } = useGetMessages({ sessionId: activeSession?.id })

  const [input, setInput] = useState("")

  const sendMessageMutation = useSendMessage()
  const selectedModel = useSelectedModelStore((s) => s.selectedModel)

  const queryClient = useQueryClient()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !selectedModel) return

    // Helper to actually send the message once we have a session ID
    const doSend = (sessionId: string) => {
      const messageID = generateNewID(ID.MESSAGE)

      // add a temp user message to the messages array
      const newMessagePart: Opencode.TextPart = {
        id: generateNewID(ID.PART),
        sessionID: sessionId,
        messageID,
        type: "text",
        text: input,
      }

      const payload: Opencode.SessionChatParams = {
        messageID,
        providerID: selectedModel.providerID,
        modelID: selectedModel.modelID,
        mode: "build",
        parts: [newMessagePart],
      }

      const enteredInput = input
      setInput("")

      const optimisticNewMessageWithParts: MessageWithParts = {
        info: {
          role: "user",
          sessionID: sessionId,
          time: {
            created: Date.now(),
          },
          id: messageID,
        },
        parts: [newMessagePart],
      }

      queryClient.setQueryData(
        ["messages", sessionId],
        (old: MessageWithParts[] = []) => [
          ...old,
          optimisticNewMessageWithParts,
        ]
      )

      const isFirstMessage = !messages || messages.length === 0

      sendMessageMutation.mutate(
        {
          sessionId,
          payload,
        },
        {
          onSuccess: () => {
            if (isFirstMessage) {
              queryClient.invalidateQueries({
                queryKey: ["sessions", { port }],
              })
            }
          },
          onError: () => {
            // revert the optimistic update
            setInput(enteredInput)
            queryClient.setQueryData(
              ["messages", sessionId],
              (old: MessageWithParts[] = []) =>
                old.filter(
                  (m) => m.info.id !== optimisticNewMessageWithParts.info.id
                )
            )
          },
        }
      )
    }

    if (activeSession?.id) {
      doSend(activeSession.id)
    } else {
      // Create session first
      const draft = input
      createSessionMutation.mutate(undefined, {
        onSuccess: (newSession) => {
          // Update URL to include the new session
          setSearchParams((prev: URLSearchParams) => {
            const next = new URLSearchParams(prev)
            next.set("session", newSession.id)
            return next
          })
          // Proceed to send draft message
          setInput(draft) // restore draft into state for doSend
          doSend(newSession.id)
        },
      })
    }
  }

  return (
    <form
      className="w-full divide-y overflow-hidden border border-b-0 sticky bottom-0 z-10 bg-background"
      onSubmit={onSubmit}
    >
      <ChatInputTextarea
        onChange={(e) => setInput(e.target.value)}
        value={input}
      />
      <div className="flex items-center justify-between p-1 px-2">
        <div className="flex items-center gap-1 ">
          <ProviderSelect />
        </div>
        <ChatInputSubmit
          disabled={
            sendMessageMutation.isPending ||
            createSessionMutation.isPending ||
            !input.trim()
          }
          status={sendMessageMutation.isPending ? "submitted" : "ready"}
        />
      </div>
    </form>
  )
}
