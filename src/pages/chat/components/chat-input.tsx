import { useState } from "react"
import { ProviderSelect } from "@/pages/chat/components/provider-select"
import { useSelectedModelStore } from "@/store"
import type { TMessagePart, TMessageWithParts } from "@/types"
import { useQueryClient } from "@tanstack/react-query"

import { generateNewID, ID } from "@/lib/generateId"
import {
  useSendMessage,
  type TPostSessionByIdMessageRequest,
} from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"
import { useGetMessages } from "@/hooks/fetch/messages"

import { ChatInputSubmit, ChatInputTextarea } from "@/components/chat-input"

export function ChatInput() {
  const { data: activeSession } = useGetActiveSession()

  const { data: messages } = useGetMessages({ sessionId: activeSession?.id })

  const [input, setInput] = useState("")

  const sendMessageMutation = useSendMessage()
  const selectedModel = useSelectedModelStore((s) => s.selectedModel)

  const queryClient = useQueryClient()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !activeSession?.id || !selectedModel) return

    const messageID = generateNewID(ID.MESSAGE)
    //  add a temp user message to the messages array
    const newMessagePart: TMessagePart = {
      id: generateNewID(ID.PART),
      sessionID: activeSession.id,
      messageID,
      type: "text",
      text: input,
    }

    const payload: TPostSessionByIdMessageRequest = {
      messageID,
      providerID: selectedModel.providerID,
      modelID: selectedModel.modelID,
      mode: "build",
      parts: [newMessagePart],
    }

    const enteredInput = input
    setInput("")

    const optimisticNewMessageWithParts: TMessageWithParts = {
      info: {
        role: "user",
        sessionID: activeSession.id,
        time: {
          created: Date.now(),
        },
        id: messageID,
      },
      parts: [newMessagePart],
    }

    queryClient.setQueryData(
      ["messages", activeSession?.id],
      (old: TMessageWithParts[] = []) => [...old, optimisticNewMessageWithParts]
    )

    const isFirstMessage = !messages || messages.length === 0;

    sendMessageMutation.mutate(
      {
        sessionId: activeSession?.id,
        payload,
      },
      {
        onSuccess: () => {
          if (isFirstMessage) {
            queryClient.invalidateQueries({ queryKey: ["sessions"] });
          }
        },
        onError: () => {
          // revert the optimistic update
          setInput(enteredInput)
          queryClient.setQueryData(
            ["messages", activeSession?.id],
            (old: TMessageWithParts[] = []) =>
              old.filter(
                (m) => m.info.id !== optimisticNewMessageWithParts.info.id
              )
          )
        },
      }
    )
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
          disabled={sendMessageMutation.isPending || !input.trim()}
          status={sendMessageMutation.isPending ? "submitted" : "ready"}
        />
      </div>
    </form>
  )
}
