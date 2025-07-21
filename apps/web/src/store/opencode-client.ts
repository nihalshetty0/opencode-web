import Opencode from "@opencode-ai/sdk"
import { create } from "zustand"

interface OpencodeClientData {
  cwd: string
  port: number
  client: Opencode
}

interface OpencodeClientStore {
  // Map of cwd -> client data
  clients: Record<string, OpencodeClientData>

  // Actions
  createClient: (cwd: string, port: number) => void
  removeClient: (cwd: string) => void
  getClient: (cwd: string) => Opencode | null
  clearAllClients: () => void
}

export const useOpencodeClientStore = create<OpencodeClientStore>(
  (set, get) => ({
    clients: {},

    createClient: (cwd: string, port: number) => {
      const { clients } = get()

      // Don't recreate if client already exists for this cwd and port
      if (clients[cwd]?.port === port && clients[cwd]?.client) {
        return
      }

      // Create new client
      const client = new Opencode({
        baseURL: `http://localhost:${port}/api`,
        maxRetries: 2,
      })

      set({
        clients: {
          ...clients,
          [cwd]: { cwd, port, client },
        },
      })
    },

    removeClient: (cwd: string) => {
      const { clients } = get()
      const newClients = { ...clients }

      if (newClients[cwd]) {
        delete newClients[cwd]
      }

      set({ clients: newClients })
    },

    getClient: (cwd: string) => {
      const { clients } = get()
      return clients[cwd]?.client || null
    },

    clearAllClients: () => {
      set({ clients: {} })
    },
  })
)
