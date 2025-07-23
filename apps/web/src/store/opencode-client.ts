import Opencode from "@opencode-ai/sdk"
import { create } from "zustand"

interface OpencodeClientState {
  client: Opencode | null
  setPort: (port: number) => void
}

export const useOpencodeClientStore = create<OpencodeClientState>((set) => ({
  client: null,
  setPort: (port: number) =>
    set({
      client: new Opencode({
        baseURL: `http://localhost:${port}/api`,
        maxRetries: 2,
      }),
    }),
}))

export const useOpencodeClient = () => {
  const opencodeClient = useOpencodeClientStore((state) => state.client)
  return opencodeClient
}
