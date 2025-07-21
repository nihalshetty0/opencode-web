import type { SelectedModel } from "@/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type SelectedModelState = {
  selectedModel: SelectedModel | null
  setSelectedModel: (selection: SelectedModel | null) => void
}

export const useSelectedModelStore = create<SelectedModelState>()(
  persist(
    (set) => ({
      selectedModel: null,
      setSelectedModel: (selection) => set({ selectedModel: selection }),
    }),
    {
      name: "opencode:selectedModel", // localStorage key
    }
  )
)
