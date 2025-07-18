import type { SelectedModel } from "@/types"
import { create } from "zustand"

type SelectedModelState = {
  selectedModel: SelectedModel | null
  setSelectedModel: (selection: SelectedModel | null) => void
}

export const useSelectedModelStore = create<SelectedModelState>((set) => ({
  selectedModel: null,
  setSelectedModel: (selection) => set({ selectedModel: selection }),
}))
