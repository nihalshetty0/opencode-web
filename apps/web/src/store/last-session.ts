import { create } from "zustand"

interface LastSessionState {
  map: Record<string, string | undefined>
  setLastSession: (cwd: string, sessionId: string) => void
  getLastSession: (cwd: string) => string | undefined
  clearAll: () => void
}

export const useLastSessionStore = create<LastSessionState>((set, get) => ({
  map: {},
  setLastSession: (cwd, sessionId) =>
    set((state) => ({ map: { ...state.map, [cwd]: sessionId } })),
  getLastSession: (cwd) => get().map[cwd],
  clearAll: () => set({ map: {} }),
}))
