import type { TSelectedModel } from "@/types"
import { create } from "zustand"

type TSelectedModelState = {
  selectedModel: TSelectedModel | null
  setSelectedModel: (selection: TSelectedModel | null) => void
}

export const useSelectedModelStore = create<TSelectedModelState>((set) => ({
  selectedModel: null,
  setSelectedModel: (selection) => set({ selectedModel: selection }),
}))
