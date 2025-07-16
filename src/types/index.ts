import type { components } from "./openapi-types"

export interface TSelectedModel {
  providerID: string
  modelID: string
}

export type TSession = components["schemas"]["Session"]

export type TMessage = components["schemas"]["Message"]
export type TMessagePart = components["schemas"]["Part"]

export type TMessageWithParts = {
  info: TMessage
  parts: TMessagePart[]
}

export type TEvent = components["schemas"]["Event"]
