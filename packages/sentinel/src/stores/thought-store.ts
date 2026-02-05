import { create } from "zustand"
import type { ThoughtStep } from "@liberos/caf-shared"

interface ThoughtStore {
  thoughts: ThoughtStep[]
  setThoughts: (thoughts: ThoughtStep[]) => void
}

export const useThoughtStore = create<ThoughtStore>((set) => ({
  thoughts: [],
  setThoughts: (thoughts) => set({ thoughts }),
}))
