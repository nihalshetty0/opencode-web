import { useEffect, useRef } from "react"
import { queryClient } from "@/app"
import type { MessageWithParts } from "@/types"
import type { Opencode } from "@opencode-ai/sdk"
import { Stream } from "@opencode-ai/sdk/core/streaming"
import { useQueryClient } from "@tanstack/react-query"

import { useGetActiveSession } from "@/hooks/fetch/sessions"
import { useOpencodeClient } from "@/hooks/use-opencode-client"

const handleMessageUpdated = (eventData: Opencode.EventListResponse) => {
  if (eventData.type !== "message.updated") return

  const sessionId = eventData.properties.info.sessionID

  const currentMessages =
    queryClient.getQueryData<MessageWithParts[]>(["messages", sessionId]) || []

  const matchIndex = currentMessages.findIndex(
    (msg: MessageWithParts) => msg.info.id === eventData.properties.info.id
  )

  if (matchIndex > -1) {
    // update the existing message
    const updatedMessages = [...currentMessages]
    updatedMessages[matchIndex] = {
      info: eventData.properties.info,
      parts: currentMessages[matchIndex].parts || [],
    }
    queryClient.setQueryData(["messages", sessionId], updatedMessages)
  } else if (matchIndex === -1) {
    // create new message
    const newMessage: MessageWithParts = {
      info: eventData.properties.info,
      parts: [],
    }
    queryClient.setQueryData(
      ["messages", sessionId],
      [...currentMessages, newMessage]
    )
  }
}

const handleMessagePartUpdated = (eventData: Opencode.EventListResponse) => {
  if (eventData.type !== "message.part.updated") return

  const sessionId = eventData.properties.part.sessionID
  const messageId = eventData.properties.part.messageID
  const partId = eventData.properties.part.id
  const updatedPart = eventData.properties.part

  // Get the current messages array
  const currentMessages =
    queryClient.getQueryData<MessageWithParts[]>(["messages", sessionId]) || []

  const messageIndex = currentMessages.findIndex((m) => m.info.id === messageId)
  if (messageIndex === -1) return
  const message = { ...currentMessages[messageIndex] }

  const partIndex = message.parts.findIndex(
    (p: Opencode.Part) => p.id === partId
  )
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
  queryClient.setQueryData<MessageWithParts[]>(
    ["messages", sessionId],
    newMessages
  )
}

export function useHandleSessionMessageEvents() {
  const queryClient = useQueryClient()
  const { data: activeSession } = useGetActiveSession()
  const opencodeClient = useOpencodeClient()
  const streamRef = useRef<Stream<Opencode.EventListResponse> | null>(null)

  // Streaming: Listen to /event for message updates
  const activeSessionId = activeSession?.id

  useEffect(() => {
    if (!activeSessionId || !opencodeClient) return // TODO: handle null client gracefully

    let isActive = true

    const startStreaming = async () => {
      try {
        // Use the SDK's streaming capabilities
        const stream = await opencodeClient.event.list({
          query: { sessionID: activeSessionId },
        })

        streamRef.current = stream

        // Process each event from the stream
        for await (const eventData of stream) {
          if (!isActive) break

          if (eventData.type === "message.updated") {
            handleMessageUpdated(eventData)
          } else if (eventData.type === "message.part.updated") {
            handleMessagePartUpdated(eventData)
          }
        }
      } catch (error) {
        console.error("Error in event stream:", error)
      }
    }

    startStreaming()

    return () => {
      isActive = false
      // Abort the stream if it's still active
      if (streamRef.current) {
        streamRef.current.controller.abort()
        streamRef.current = null
      }
    }
  }, [activeSessionId, opencodeClient, queryClient])
}
