import type { Opencode } from "@opencode-ai/sdk"

export interface SelectedModel {
  providerID: string
  modelID: string
}

// Custom structure for UI compatibility
export type MessageWithParts = {
  info: Opencode.Message
  parts: Opencode.Part[]
}

export type AssistantMessageWithParts = {
  info: Opencode.AssistantMessage
  parts: Opencode.Part[]
}

export type MessagePartWithCompletedTool = Opencode.Part & {
  type: "tool"
  state: Opencode.ToolStateCompleted
  tool: string
}

export type ToolPartWithCompletedTool = Opencode.Part & {
  type: "tool"
  state: Opencode.ToolStateCompleted
  tool: string
}

// export type UserMessageWithParts = {
//   info: Opencode.UserMessage
//   parts: Opencode.ToolStateCompleted[]
// }
