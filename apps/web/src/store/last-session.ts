import { create } from "zustand"

interface LastSessionState {
  map: Record<string, string | undefined>
  setLastSession: (cwd: string, sessionId: string) => void
  getLastSession: (cwd: string) => string | undefined
  removeLastSession: (cwd: string) => void
  clearAll: () => void
}

export const useLastSessionStore = create<LastSessionState>((set, get) => ({
  map: {},
  setLastSession: (cwd, sessionId) =>
    set((state) => {
      const newMap = { ...state.map, [cwd]: sessionId }
      console.log("[lastSession] set", cwd, sessionId, newMap)
      return { map: newMap }
    }),
  getLastSession: (cwd) => get().map[cwd],
  removeLastSession: (cwd) =>
    set((state) => {
      const newMap = { ...state.map }
      delete newMap[cwd]
      console.log("[lastSession] remove", cwd, newMap)
      return { map: newMap }
    }),
  clearAll: () => {
    console.log("[lastSession] clearAll")
    set({ map: {} })
  },
}))
