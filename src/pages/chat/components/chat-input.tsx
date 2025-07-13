import { useState } from "react"
import { ProviderSelect } from "@/pages/chat/components/provider-select"
import { useSelectedModelStore } from "@/store"
import type { TMessage } from "@/types"
import { useQueryClient } from "@tanstack/react-query"

import { useSendMessage } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

import { ChatInputSubmit, ChatInputTextarea } from "@/components/chat-input"

export function ChatInput() {
  const { data: activeSession } = useGetActiveSession()

  const [input, setInput] = useState("")

  const sendMessageMutation = useSendMessage()
  const selectedModel = useSelectedModelStore((s) => s.selectedModel)

  const queryClient = useQueryClient()

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || !activeSession?.id || !selectedModel) return

    //  add a temp user message to the messages array
    const newMessage: TMessage = {
      id: crypto.randomUUID(), // temp assign a random id
      role: "user",
      parts: [
        {
          type: "text",
          text: input,
        },
      ],
      time: {
        created: Date.now(),
      },
    }
    const enteredInput = input
    setInput("")

    queryClient.setQueryData(
      ["messages", activeSession?.id],
      (old: TMessage[]) => [...old, newMessage]
    )

    sendMessageMutation.mutate(
      {
        sessionId: activeSession?.id,
        providerID: selectedModel?.providerID ?? "",
        modelID: selectedModel?.modelID ?? "",
        mode: "build",
        text: input,
      },
      {
        onError: () => {
          setInput(enteredInput)
          queryClient.setQueryData(
            ["messages", activeSession?.id],
            (old: TMessage[]) => old.filter((m) => m.id !== newMessage.id)
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
