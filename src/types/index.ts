import type { components } from "./openapi-types"

export interface TSelectedModel {
  providerID: string
  modelID: string
}

export type TSession = components["schemas"]["Session"]

export type TMessage = components["schemas"]["Message"]
export type TAssistantMessage = components["schemas"]["AssistantMessage"]
export type TMessagePart = components["schemas"]["Part"]

export type TToolPart = components["schemas"]["ToolPart"]
export type TToolPartCompleted = Omit<TToolPart, "state"> & {
  state: components["schemas"]["ToolStateCompleted"]
}

export type TMessageWithParts = {
  info: TMessage
  parts: TMessagePart[]
}
export type TAssistantMessageWithParts = {
  info: TAssistantMessage
  parts: TMessagePart[]
}

export type TEvent = components["schemas"]["Event"]
