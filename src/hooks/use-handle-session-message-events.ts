import { useEffect } from "react"
import { queryClient } from "@/app"
import type { TEvent, TMessageWithParts } from "@/types"
import { useQueryClient } from "@tanstack/react-query"

import type { TGetSessionByIdMessageResponse } from "@/hooks/fetch/messages"
import { useGetActiveSession } from "@/hooks/fetch/sessions"

const handleMessageUpdated = (eventData: TEvent) => {
  if (eventData.type !== "message.updated") return

  const sessionId = eventData.properties.info.sessionID

  const currentMessages =
    queryClient.getQueryData<TGetSessionByIdMessageResponse>([
      "messages",
      sessionId,
    ]) || []

  const matchIndex = currentMessages.findIndex(
    (msg) => msg.info.id === eventData.properties.info.id
  )

  if (matchIndex > -1) {
    // update the existing message

    const updatedMessages = [...currentMessages]
    updatedMessages[matchIndex] = {
      info: eventData.properties.info,
      parts: currentMessages[matchIndex].parts || [],
    }
  } else if (matchIndex === -1) {
    // create new message
    const newMessage: TMessageWithParts = {
      info: eventData.properties.info,
      parts: [],
    }
    queryClient.setQueryData(
      ["messages", sessionId],
      [...currentMessages, newMessage]
    )
  }
}

const handleMessagePartUpdated = (eventData: TEvent) => {
  if (eventData.type !== "message.part.updated") return

  const sessionId = eventData.properties.part.sessionID
  const messageId = eventData.properties.part.messageID
  const partId = eventData.properties.part.id
  const updatedPart = eventData.properties.part

  // Get the current messages array
  const currentMessages =
    queryClient.getQueryData<TMessageWithParts[]>(["messages", sessionId]) || []

  const messageIndex = currentMessages.findIndex((m) => m.info.id === messageId)
  if (messageIndex === -1) return
  const message = { ...currentMessages[messageIndex] }

  const partIndex = message.parts.findIndex((p) => p.id === partId)
  if (partIndex > -1) {
    // Update existing part
    message.parts = [
      ...message.parts.slice(0, partIndex),
      updatedPart,
      ...message.parts.slice(partIndex + 1),
    ]
  } else {
    // Append new part
    message.parts = [...message.parts, updatedPart]
  }
  const newMessages = [...currentMessages]
  newMessages[messageIndex] = message
  // Set the updated messages array back into the cache
  queryClient.setQueryData<TMessageWithParts[]>(
    ["messages", sessionId],
    newMessages
  )
}

export function useHandleSessionMessageEvents() {
  const queryClient = useQueryClient()
  const { data: activeSession } = useGetActiveSession()

  // Streaming: Listen to /event for message updates
  const activeSessionId = activeSession?.id

  useEffect(() => {
    if (!activeSessionId) return

    const eventSource = new EventSource(
      `/api/event?sessionID=${activeSessionId}`
    )
    eventSource.onmessage = (event) => {
      const eventData: TEvent = JSON.parse(event.data)
      if (eventData.type === "message.updated") {
        handleMessageUpdated(eventData)
      } else if (eventData.type === "message.part.updated") {
        handleMessagePartUpdated(eventData)
      }
    }
    return () => {
      eventSource.close()
    }
  }, [activeSessionId, queryClient])
}
