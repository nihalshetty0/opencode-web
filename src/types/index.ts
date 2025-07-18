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
