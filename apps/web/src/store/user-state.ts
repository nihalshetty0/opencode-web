import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserState {
  isFirstTimeUser: boolean
  markAsReturningUser: () => void
}

export const useUserStateStore = create<UserState>()(
  persist(
    (set) => ({
      isFirstTimeUser: true,
      markAsReturningUser: () => set({ isFirstTimeUser: false }),
    }),
    {
      name: "opencode-user-state",
    }
  )
)
