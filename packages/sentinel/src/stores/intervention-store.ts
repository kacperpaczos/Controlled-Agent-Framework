import { create } from "zustand"
import type { PausePoint } from "@liberos/caf-shared"

interface InterventionStore {
  pausePoint: PausePoint | null
  setPausePoint: (point: PausePoint | null) => void
}

export const useInterventionStore = create<InterventionStore>((set) => ({
  pausePoint: null,
  setPausePoint: (point) => set({ pausePoint: point }),
}))
