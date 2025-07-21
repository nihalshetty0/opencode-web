import type { SelectedModel } from "@/types"
import { create } from "zustand"
import { persist } from "zustand/middleware"

type SelectedModelState = {
  selectedModel: SelectedModel | null
  recent: SelectedModel[]
  setSelectedModel: (selection: SelectedModel | null) => void
}

export const useSelectedModelStore = create<SelectedModelState>()(
  persist(
    (set, get) => ({
      selectedModel: null,
      recent: [],
      setSelectedModel: (selection) => {
        if (!selection) return set({ selectedModel: null })
        // update recent list: move to front, keep unique, limit 5
        const recent = get().recent.filter(
          (m) =>
            m.modelID !== selection.modelID ||
            m.providerID !== selection.providerID
        )
        recent.unshift(selection)
        set({ selectedModel: selection, recent: recent.slice(0, 5) })
      },
    }),
    {
      name: "opencode:selectedModel", // localStorage key
    }
  )
)
