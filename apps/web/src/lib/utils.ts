import type {
  AssistantMessageWithParts,
  MessageWithParts,
  ToolPartWithCompletedTool,
} from "@/types"
import type Opencode from "@opencode-ai/sdk"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAssistantMessage(
  message: MessageWithParts
): message is AssistantMessageWithParts {
  return message.info.role === "assistant"
}

export function isCompletedToolPart(
  part: Opencode.Part
): part is ToolPartWithCompletedTool {
  return part.type === "tool" && part.state?.status === "completed"
}

/**
 * Check if a session is busy based on its messages
 */
export function isSessionBusy(messages: MessageWithParts[]): boolean {
  if (messages.length === 0) return false
  const lastMessage = messages[messages.length - 1]

  if (isAssistantMessage(lastMessage)) {
    return (
      !lastMessage.info.time?.completed || lastMessage.info.time.completed === 0
    )
  }
  return false
}

/**
 * Extract session ID from different event types
 */
export function getSessionIdFromEvent(eventData: any): string | null {
  switch (eventData.type) {
    case "message.updated":
      return eventData.properties.info.sessionID
    case "message.part.updated":
      return eventData.properties.part.sessionID
    case "message.removed":
      return eventData.properties.sessionID
    case "session.updated":
      return eventData.properties.info.id
    case "session.deleted":
      return eventData.properties.info.id
    case "session.idle":
      return eventData.properties.sessionID
    case "session.error":
      return eventData.properties.sessionID
    case "permission.updated":
      return eventData.properties.sessionID
    default:
      return null
  }
}
